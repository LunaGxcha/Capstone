import { useState, useEffect } from 'react';
import { Upload, Users, Calendar, AlertCircle, CheckCircle, Download, Snowflake, FileText, Bell, X, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { addSnowDay, removeSnowDay, getSnowDays, updateCalendarFromText, addMidtermDay, removeMidtermDay, getMidtermDays, saveMidtermResumptionLetterDay, getMidtermResumptionLetterDay } from '../utils/calendarUtils';
import { toast } from 'sonner@2.0.3';

interface FlexOption {
  id: string;
  teacher: string;
  room: string;
  activity: string;
  tags: string;
  repeatDays: string[];
  repeatUntil: string;
  maxStudents: number;
  currentStudents: number;
}

interface Student {
  name: string;
  studentId: string;
  grade: string;
}

interface Assignment {
  studentName: string;
  studentId: string;
  flexBlock: string;
  teacher: string;
  room: string;
  date: string;
  status: 'success' | 'failed' | 'already_assigned';
  reason?: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'flex' | 'snow' | 'midterms' | 'calendar' | 'notifications'>('flex');
  const [flexOptions, setFlexOptions] = useState<FlexOption[]>([]);
  const [uploadedStudents, setUploadedStudents] = useState<Student[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [todayFlexOptions, setTodayFlexOptions] = useState<FlexOption[]>([]);
  
  // Snow day management
  const [snowDayDate, setSnowDayDate] = useState('');
  const [snowDayName, setSnowDayName] = useState('Snow Day');
  const [snowDays, setSnowDays] = useState<{ [key: string]: string }>({});
  
  // Midterm management
  const [midtermDate, setMidtermDate] = useState('');
  const [midtermName, setMidtermName] = useState('Midterm Exams');
  const [midtermDays, setMidtermDays] = useState<{ [key: string]: string }>({});
  const [resumptionDate, setResumptionDate] = useState('');
  const [resumptionLetterDay, setResumptionLetterDay] = useState('');
  
  // Notification management
  const [notificationMessage, setNotificationMessage] = useState('');
  const [notificationDialogOpen, setNotificationDialogOpen] = useState(false);

  // Load flex blocks from localStorage
  useEffect(() => {
    const savedFlexOptions = localStorage.getItem('flowtrack-flex-options');
    if (savedFlexOptions) {
      try {
        const allFlexOptions = JSON.parse(savedFlexOptions);
        setFlexOptions(allFlexOptions);
        
        // Filter flex blocks for TODAY only
        const today = new Date();
        const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayDayName = daysOfWeek[today.getDay()];
        const todayStr = today.toISOString().split('T')[0];
        
        const todayOptions = allFlexOptions.filter((flex: FlexOption) => {
          // Check if flex block occurs on today's day of week
          const occursToday = flex.repeatDays.includes(todayDayName);
          
          // Check if today is within the repeat range
          const isWithinRange = !flex.repeatUntil || todayStr <= flex.repeatUntil;
          
          return occursToday && isWithinRange;
        });
        
        setTodayFlexOptions(todayOptions);
      } catch (e) {
        console.error('Failed to load flex options', e);
      }
    }
  }, []);

  // Load snow days
  useEffect(() => {
    setSnowDays(getSnowDays());
  }, []);

  // Load midterm days
  useEffect(() => {
    setMidtermDays(getMidtermDays());
    // Don't load resumption letter day into state - it's stored as an object
    // We only need it when saving, not displaying
  }, []);

  // Handle flex CSV file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  // Handle calendar .txt file upload
  const handleCalendarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = updateCalendarFromText(text);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    };
    reader.readAsText(file);
  };

  // Parse CSV data
  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(line => line.trim());
    const students: Student[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Split by comma, handling quoted fields
      const fields = line.split(',').map(field => field.trim().replace(/^"(.*)"$/, '$1'));
      
      if (fields.length >= 3) {
        students.push({
          name: fields[0],
          studentId: fields[1],
          grade: fields[2]
        });
      }
    }

    setUploadedStudents(students);
    toast.success(`Loaded ${students.length} students from CSV`);
  };

  // Auto-assign students to flex blocks
  const handleAutoAssign = () => {
    if (uploadedStudents.length === 0) {
      toast.error('Please upload a student CSV file first');
      return;
    }

    if (todayFlexOptions.length === 0) {
      toast.error('No flex blocks available for today');
      return;
    }

    setIsProcessing(true);

    const today = new Date();
    const todayDisplayStr = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

    // Load existing signups
    const existingSignups = JSON.parse(localStorage.getItem('flowtrack-student-flex-signups') || '[]');

    // Filter students who are already assigned for today
    const studentsAlreadyAssignedToday = existingSignups
      .filter((signup: any) => signup.date === todayDisplayStr)
      .map((signup: any) => signup.studentId);

    const newAssignments: Assignment[] = [];
    const updatedFlexOptions = [...flexOptions];

    uploadedStudents.forEach(student => {
      // Check if student is already assigned for today
      if (studentsAlreadyAssignedToday.includes(student.studentId)) {
        newAssignments.push({
          studentName: student.name,
          studentId: student.studentId,
          flexBlock: 'N/A',
          teacher: 'N/A',
          room: 'N/A',
          date: todayDisplayStr,
          status: 'already_assigned',
          reason: 'Student already has a flex block assignment for today'
        });
        return;
      }

      // Find an available flex block for today
      const availableBlock = todayFlexOptions.find(flex => 
        flex.currentStudents < flex.maxStudents
      );

      if (!availableBlock) {
        newAssignments.push({
          studentName: student.name,
          studentId: student.studentId,
          flexBlock: 'N/A',
          teacher: 'N/A',
          room: 'N/A',
          date: todayDisplayStr,
          status: 'failed',
          reason: 'No available flex blocks with capacity'
        });
        return;
      }

      // Assign student to flex block
      const flexIndex = updatedFlexOptions.findIndex(f => f.id === availableBlock.id);
      if (flexIndex !== -1) {
        updatedFlexOptions[flexIndex].currentStudents += 1;
      }

      // Update today flex options for next iteration
      const todayFlexIndex = todayFlexOptions.findIndex(f => f.id === availableBlock.id);
      if (todayFlexIndex !== -1) {
        todayFlexOptions[todayFlexIndex].currentStudents += 1;
      }

      // Add signup to existing signups
      existingSignups.push({
        studentId: student.studentId,
        studentName: student.name,
        flexOptionId: availableBlock.id,
        activity: availableBlock.activity,
        teacher: availableBlock.teacher,
        room: availableBlock.room,
        date: todayDisplayStr
      });

      newAssignments.push({
        studentName: student.name,
        studentId: student.studentId,
        flexBlock: availableBlock.activity,
        teacher: availableBlock.teacher,
        room: availableBlock.room,
        date: todayDisplayStr,
        status: 'success'
      });
    });

    // Save updated data to localStorage
    localStorage.setItem('flowtrack-flex-options', JSON.stringify(updatedFlexOptions));
    localStorage.setItem('flowtrack-student-flex-signups', JSON.stringify(existingSignups));
    
    setFlexOptions(updatedFlexOptions);
    setAssignments(newAssignments);
    setIsProcessing(false);
    setShowResults(true);
  };

  // Download assignment results as CSV
  const downloadResults = () => {
    const headers = ['Student Name', 'Student ID', 'Flex Block', 'Teacher', 'Room', 'Date', 'Status', 'Notes'];
    const rows = assignments.map(a => [
      a.studentName,
      a.studentId,
      a.flexBlock,
      a.teacher,
      a.room,
      a.date,
      a.status === 'success' ? 'Assigned' : a.status === 'already_assigned' ? 'Already Assigned' : 'Failed',
      a.reason || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flex_assignments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Add snow day
  const handleAddSnowDay = () => {
    if (!snowDayDate) {
      toast.error('Please select a date');
      return;
    }

    // Parse the date string properly to avoid timezone issues
    // Input format is YYYY-MM-DD, we need to create a date in local time
    const [year, month, day] = snowDayDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    addSnowDay(date, snowDayName);
    setSnowDays(getSnowDays());
    setSnowDayDate('');
    setSnowDayName('Snow Day');
    toast.success(`Snow day added for ${date.toLocaleDateString()}`);
  };

  // Remove snow day
  const handleRemoveSnowDay = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    removeSnowDay(date);
    setSnowDays(getSnowDays());
    toast.success('Snow day removed');
  };

  // Add midterm day
  const handleAddMidtermDay = () => {
    if (!midtermDate) {
      toast.error('Please select a date');
      return;
    }

    // Parse the date string properly to avoid timezone issues
    // Input format is YYYY-MM-DD, we need to create a date in local time
    const [year, month, day] = midtermDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    addMidtermDay(date, midtermName);
    setMidtermDays(getMidtermDays());
    setMidtermDate('');
    setMidtermName('Midterm Exams');
    toast.success(`Midterm day added for ${date.toLocaleDateString()}`);
  };

  // Remove midterm day
  const handleRemoveMidtermDay = (dateKey: string) => {
    const [year, month, day] = dateKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    removeMidtermDay(date);
    setMidtermDays(getMidtermDays());
    toast.success('Midterm day removed');
  };

  // Save resumption letter day
  const handleSaveResumptionLetterDay = () => {
    if (!resumptionDate) {
      toast.error('Please select a date');
      return;
    }
    
    if (!resumptionLetterDay || !resumptionLetterDay.trim()) {
      toast.error('Please enter a letter day');
      return;
    }

    // Normalize letter day to uppercase
    const normalizedLetterDay = resumptionLetterDay.trim().toUpperCase();
    
    // Validate letter day
    if (!['A', 'B', 'C', 'D', 'E', 'F', 'G'].includes(normalizedLetterDay)) {
      toast.error('Letter day must be A-G');
      return;
    }

    // Parse the date string properly to avoid timezone issues
    // Input format is YYYY-MM-DD, we need to create a date in local time
    const [year, month, day] = resumptionDate.split('-').map(Number);
    const date = new Date(year, month - 1, day); // month is 0-indexed
    
    // Create the dateKey in the same format as other calendar functions
    const dateKey = `${year}-${month}-${day}`;
    
    saveMidtermResumptionLetterDay(dateKey, normalizedLetterDay);
    toast.success(`Resumption set to Day ${normalizedLetterDay} on ${date.toLocaleDateString()}`);
    setResumptionDate('');
  };

  // Send notification to teachers
  const handleSendNotification = () => {
    if (!notificationMessage.trim()) {
      toast.error('Please enter a notification message');
      return;
    }

    // Store notification in localStorage for teachers to see
    const notifications = JSON.parse(localStorage.getItem('flowtrack-admin-notifications') || '[]');
    notifications.push({
      id: Date.now().toString(),
      message: notificationMessage,
      timestamp: new Date().toISOString(),
      read: false
    });
    localStorage.setItem('flowtrack-admin-notifications', JSON.stringify(notifications));

    toast.success('Notification sent to all teachers');
    setNotificationMessage('');
    setNotificationDialogOpen(false);
  };

  // Quick notification templates
  const quickNotifications = [
    'Quarter 1 is ending soon. Please finalize grades.',
    'Quarter 2 is ending soon. Please finalize grades.',
    'Quarter 3 is ending soon. Please finalize grades.',
    'Quarter 4 is ending soon. Please finalize grades.',
    'Semester 2 begins January 28, 2026. Please update semester classes.',
    'School year ends June 18, 2026. Please prepare final exams.',
  ];

  const successCount = assignments.filter(a => a.status === 'success').length;
  const failedCount = assignments.filter(a => a.status === 'failed').length;
  const alreadyAssignedCount = assignments.filter(a => a.status === 'already_assigned').length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-4 md:p-8 pt-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-300 to-pink-300 dark:from-indigo-900 dark:to-purple-900 text-purple-900 dark:text-purple-100 p-6 rounded-t-lg shadow-md dark:shadow-purple-900/30">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">Manage students, calendar, and notifications</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-sm border-b-2 border-purple-200 dark:border-indigo-700/50 flex gap-2 p-2">
          <Button
            onClick={() => setActiveTab('flex')}
            className={activeTab === 'flex' 
              ? 'bg-purple-500 dark:bg-indigo-600 text-white' 
              : 'bg-transparent text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50'}
          >
            <Users className="w-4 h-4 mr-2" />
            Flex Assignments
          </Button>
          <Button
            onClick={() => setActiveTab('snow')}
            className={activeTab === 'snow' 
              ? 'bg-purple-500 dark:bg-indigo-600 text-white' 
              : 'bg-transparent text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50'}
          >
            <Snowflake className="w-4 h-4 mr-2" />
            Snow Days
          </Button>
          <Button
            onClick={() => setActiveTab('midterms')}
            className={activeTab === 'midterms' 
              ? 'bg-purple-500 dark:bg-indigo-600 text-white' 
              : 'bg-transparent text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50'}
          >
            <BookOpen className="w-4 h-4 mr-2" />
            Exams
          </Button>
          <Button
            onClick={() => setActiveTab('calendar')}
            className={activeTab === 'calendar' 
              ? 'bg-purple-500 dark:bg-indigo-600 text-white' 
              : 'bg-transparent text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50'}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendar Upload
          </Button>
          <Button
            onClick={() => setActiveTab('notifications')}
            className={activeTab === 'notifications' 
              ? 'bg-purple-500 dark:bg-indigo-600 text-white' 
              : 'bg-transparent text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50'}
          >
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </Button>
        </div>

        <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-sm rounded-b-lg shadow-lg dark:shadow-purple-900/30 p-6 border-2 border-t-0 border-purple-200 dark:border-indigo-700/50">
          {/* Flex Assignment Tab */}
          {activeTab === 'flex' && (
            <>
              <div className="bg-blue-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-blue-200 dark:border-indigo-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-2">How to use:</p>
                    <ol className="list-decimal list-inside space-y-1">
                      <li>Upload a CSV file with absent student information (Name, Student ID, Grade)</li>
                      <li>Students will be auto-assigned to <strong>TODAY'S</strong> available flex blocks only</li>
                      <li>Students already assigned to a flex block for today will be skipped</li>
                      <li>Download the results to see assignment details</li>
                    </ol>
                    <p className="mt-3 font-medium">CSV Format: Name, Student ID, Grade</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Example: Diluc, 12345, 11</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2"><strong>Note:</strong> Assignments are date-specific and won't affect future days</p>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Upload Student CSV
                </label>
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-purple-900 dark:text-purple-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 dark:file:bg-indigo-600 file:text-white hover:file:bg-purple-600 dark:hover:file:bg-indigo-500 file:cursor-pointer border-2 border-purple-300 dark:border-indigo-600 rounded-lg cursor-pointer dark:bg-slate-700/40"
                />
              </div>

              {/* Student List */}
              {uploadedStudents.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3">
                    Uploaded Students ({uploadedStudents.length})
                  </h3>
                  <div className="bg-purple-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-4 max-h-60 overflow-y-auto">
                    {uploadedStudents.map((student, index) => (
                      <div key={index} className="flex justify-between py-2 border-b border-purple-200 dark:border-indigo-700/30 last:border-b-0">
                        <span className="text-purple-900 dark:text-purple-200">{student.name}</span>
                        <span className="text-purple-600 dark:text-purple-400">ID: {student.studentId} | Grade: {student.grade}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Today's Flex Blocks */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-3">
                  Available Flex Blocks Today ({todayFlexOptions.length})
                </h3>
                {todayFlexOptions.length > 0 ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {todayFlexOptions.map(flex => (
                      <div key={flex.id} className="bg-emerald-50 dark:bg-emerald-900/20 dark:backdrop-blur-sm border-2 border-emerald-200 dark:border-emerald-700/50 rounded-lg p-4">
                        <div className="font-semibold text-emerald-900 dark:text-emerald-200">{flex.activity}</div>
                        <div className="text-sm text-emerald-700 dark:text-emerald-400">Teacher: {flex.teacher} | Room: {flex.room}</div>
                        <div className="text-sm text-emerald-600 dark:text-emerald-500 mt-1">
                          Capacity: {flex.currentStudents}/{flex.maxStudents}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-purple-600 dark:text-purple-400">No flex blocks scheduled for today</p>
                )}
              </div>

              {/* Auto-Assign Button */}
              <Button
                onClick={handleAutoAssign}
                disabled={isProcessing || uploadedStudents.length === 0 || todayFlexOptions.length === 0}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white py-3 text-lg font-semibold disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Auto-Assign Students to Flex Blocks'}
              </Button>

              {/* Results Dialog */}
              <Dialog open={showResults} onOpenChange={setShowResults}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-indigo-900 border-2 border-purple-300 dark:border-indigo-700/50">
                  <DialogHeader>
                    <DialogTitle className="text-2xl text-purple-900 dark:text-purple-200">Assignment Results</DialogTitle>
                    <DialogDescription className="text-purple-700 dark:text-purple-300">
                      Review the flex block assignments for uploaded students
                    </DialogDescription>
                  </DialogHeader>

                  {/* Summary */}
                  <div className="grid grid-cols-3 gap-4 my-4">
                    <div className="bg-green-100 dark:bg-green-900/30 border-2 border-green-300 dark:border-green-700/50 rounded-lg p-4 text-center">
                      <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-green-900 dark:text-green-200">{successCount}</div>
                      <div className="text-sm text-green-700 dark:text-green-400">Assigned</div>
                    </div>
                    <div className="bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-300 dark:border-yellow-700/50 rounded-lg p-4 text-center">
                      <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-yellow-900 dark:text-yellow-200">{alreadyAssignedCount}</div>
                      <div className="text-sm text-yellow-700 dark:text-yellow-400">Already Assigned</div>
                    </div>
                    <div className="bg-red-100 dark:bg-red-900/30 border-2 border-red-300 dark:border-red-700/50 rounded-lg p-4 text-center">
                      <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400 mx-auto mb-2" />
                      <div className="text-2xl font-bold text-red-900 dark:text-red-200">{failedCount}</div>
                      <div className="text-sm text-red-700 dark:text-red-400">Failed</div>
                    </div>
                  </div>

                  {/* Detailed Results */}
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {assignments.map((assignment, index) => (
                      <div
                        key={index}
                        className={`p-3 rounded-lg border-2 ${
                          assignment.status === 'success'
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700/50'
                            : assignment.status === 'already_assigned'
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700/50'
                            : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700/50'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-semibold text-purple-900 dark:text-purple-100">{assignment.studentName}</div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">ID: {assignment.studentId}</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-purple-900 dark:text-purple-100">{assignment.flexBlock}</div>
                            <div className="text-sm text-purple-700 dark:text-purple-300">{assignment.teacher} | {assignment.room}</div>
                          </div>
                        </div>
                        {assignment.reason && (
                          <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">{assignment.reason}</div>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={downloadResults}
                    className="w-full bg-purple-500 dark:bg-indigo-600 hover:bg-purple-600 dark:hover:bg-indigo-500 text-white mt-4"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Results as CSV
                  </Button>
                </DialogContent>
              </Dialog>
            </>
          )}

          {/* Snow Days Tab */}
          {activeTab === 'snow' && (
            <>
              <div className="bg-blue-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-blue-200 dark:border-indigo-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Snowflake className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-2">Manage Snow Days</p>
                    <p>Schedule snow days to automatically adjust the letter day rotation. When you add a snow day, the calendar will skip that day and the rotation continues from the next school day.</p>
                  </div>
                </div>
              </div>

              {/* Add Snow Day Form */}
              <div className="bg-purple-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Add Snow Day</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={snowDayDate}
                      onChange={(e) => setSnowDayDate(e.target.value)}
                      className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={snowDayName}
                      onChange={(e) => setSnowDayName(e.target.value)}
                      placeholder="e.g., Snow Day"
                      className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddSnowDay}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white"
                >
                  <Snowflake className="w-4 h-4 mr-2" />
                  Add Snow Day
                </Button>
              </div>

              {/* Scheduled Snow Days */}
              <div>
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Scheduled Snow Days</h3>
                {Object.keys(snowDays).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(snowDays).map(([dateKey, name]) => {
                      const [year, month, day] = dateKey.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      return (
                        <div key={dateKey} className="bg-white dark:bg-slate-700/40 border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-purple-900 dark:text-purple-200">{name}</div>
                            <div className="text-sm text-purple-600 dark:text-purple-400">
                              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRemoveSnowDay(dateKey)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-purple-600 dark:text-purple-400">No snow days scheduled</p>
                )}
              </div>
            </>
          )}

          {/* Midterms Tab */}
          {activeTab === 'midterms' && (
            <>
              <div className="bg-blue-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-blue-200 dark:border-indigo-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-2">Manage Exam Periods (Midterms & Finals)</p>
                    <p>Schedule exam days to automatically adjust the letter day rotation. When you add an exam day, the calendar will pause the rotation and display the exam period. This works for both midterm exams and final exams.</p>
                  </div>
                </div>
              </div>

              {/* Add Exam Day Form */}
              <div className="bg-purple-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Add Exam Day</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={midtermDate}
                      onChange={(e) => setMidtermDate(e.target.value)}
                      className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                      Name
                    </label>
                    <Input
                      type="text"
                      value={midtermName}
                      onChange={(e) => setMidtermName(e.target.value)}
                      placeholder="e.g., Midterm Exams or Final Exams"
                      className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddMidtermDay}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Add Exam Day
                </Button>
              </div>

              {/* Scheduled Exam Days */}
              <div>
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Scheduled Exam Days</h3>
                {Object.keys(midtermDays).length > 0 ? (
                  <div className="space-y-2">
                    {Object.entries(midtermDays).map(([dateKey, name]) => {
                      const [year, month, day] = dateKey.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                      return (
                        <div key={dateKey} className="bg-white dark:bg-slate-700/40 border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-4 flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-purple-900 dark:text-purple-200">{name}</div>
                            <div className="text-sm text-purple-600 dark:text-purple-400">
                              {date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRemoveMidtermDay(dateKey)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-purple-600 dark:text-purple-400">No exam days scheduled</p>
                )}
              </div>

              {/* Resumption Letter Day */}
              <div className="bg-purple-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-6 mt-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Set Resumption Letter Day</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={resumptionDate}
                      onChange={(e) => setResumptionDate(e.target.value)}
                      className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                      Letter Day
                    </label>
                    <Input
                      type="text"
                      value={resumptionLetterDay}
                      onChange={(e) => setResumptionLetterDay(e.target.value)}
                      placeholder="e.g., C"
                      className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleSaveResumptionLetterDay}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Set Resumption Letter Day
                </Button>
              </div>
            </>
          )}

          {/* Calendar Upload Tab */}
          {activeTab === 'calendar' && (
            <>
              <div className="bg-blue-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-blue-200 dark:border-indigo-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-2">Calendar Event Upload</p>
                    <p className="mb-2">Upload a .txt file with calendar events for the entire year. This will update everyone's calendars with professional development days, breaks, and other important dates.</p>
                    <p className="font-medium mt-3">File Format (one event per line):</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">YYYY-MM-DD,EventType,EventName</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Example: 2026-12-25,holiday,Christmas Break</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300">Example: 2026-01-20,pd,Professional Development Day</p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">Event Types: holiday, break, pd, professional development</p>
                  </div>
                </div>
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Upload Calendar .txt File
                </label>
                <input
                  type="file"
                  accept=".txt"
                  onChange={handleCalendarUpload}
                  className="block w-full text-sm text-purple-900 dark:text-purple-100 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-purple-500 dark:file:bg-indigo-600 file:text-white hover:file:bg-purple-600 dark:hover:file:bg-indigo-500 file:cursor-pointer border-2 border-purple-300 dark:border-indigo-600 rounded-lg cursor-pointer dark:bg-slate-700/40"
                />
              </div>

              {/* Sample File */}
              <div className="bg-purple-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-200 mb-2">Sample File Content:</h3>
                <pre className="text-xs text-purple-700 dark:text-purple-300 bg-white dark:bg-slate-800 p-3 rounded border border-purple-200 dark:border-indigo-700/50 overflow-x-auto">
{`# School Year 2026-2027 Calendar Events
2026-09-07,holiday,Labor Day
2026-10-12,pd,Professional Development Day
2026-11-25,holiday,Thanksgiving Break
2026-11-26,holiday,Thanksgiving Break
2026-12-24,holiday,Winter Break
2026-12-25,holiday,Winter Break
2026-12-31,holiday,Winter Break
2027-01-01,holiday,Winter Break`}
                </pre>
              </div>
            </>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <>
              <div className="bg-blue-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-blue-200 dark:border-indigo-700/50 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <Bell className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900 dark:text-blue-200">
                    <p className="font-semibold mb-2">Send Notifications to Teachers</p>
                    <p>Notify teachers about quarter endings, semester changes, and other important information. Teachers will see these notifications when they log in.</p>
                  </div>
                </div>
              </div>

              {/* Quick Notification Templates */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Quick Notification Templates</h3>
                <div className="grid gap-3 md:grid-cols-2">
                  {quickNotifications.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setNotificationMessage(template);
                        setNotificationDialogOpen(true);
                      }}
                      className="bg-purple-50 dark:bg-indigo-900/30 border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-4 text-left hover:bg-purple-100 dark:hover:bg-indigo-800/50 transition-colors"
                    >
                      <p className="text-sm text-purple-900 dark:text-purple-200">{template}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Notification */}
              <div className="bg-purple-50 dark:bg-indigo-900/30 dark:backdrop-blur-sm border-2 border-purple-200 dark:border-indigo-700/50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-200 mb-4">Send Custom Notification</h3>
                <textarea
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  placeholder="Enter your message to teachers..."
                  rows={4}
                  className="w-full p-3 border-2 border-purple-300 dark:border-indigo-600 rounded-lg focus:ring-purple-500 dark:focus:ring-indigo-500 focus:border-purple-500 dark:bg-slate-700 dark:text-purple-100"
                />
                <Button
                  onClick={handleSendNotification}
                  className="w-full mt-4 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Send Notification
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}