import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, CalendarIcon, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { getLetterDayForDate as getLetterDay, getHolidays, getPDDays, getSnowDays, getMidtermDays } from '../utils/calendarUtils';

interface Assignment {
  id: string;
  type: 'test' | 'homework' | 'project';
  title: string;
  className: string;
  date: string;
  teacherEmail?: string; // Track which teacher created this assignment
}

interface FlexOption {
  id: string;
  teacher: string;
  room: string;
  activity: string;
  tags: string;
  repeatDays: string[];
  repeatUntil: string; // ISO date string
  maxStudents: number;
  currentStudents: number;
}

interface TeacherSchedulePageProps {
  userRole?: 'teacher' | 'admin';
}

export default function TeacherSchedulePage({ userRole = 'teacher' }: TeacherSchedulePageProps = {}) {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [flexOptions, setFlexOptions] = useState<FlexOption[]>([]);
  const [calendarPickerOpen, setCalendarPickerOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());

  // Load assignments and flex options from localStorage on mount
  useEffect(() => {
    const savedAssignments = localStorage.getItem('flowtrack-assignments');
    const savedFlexOptions = localStorage.getItem('flowtrack-flex-options');
    
    if (savedAssignments) {
      setAssignments(JSON.parse(savedAssignments));
    }
    
    // Only load default flex options if none exist in localStorage
    if (savedFlexOptions) {
      setFlexOptions(JSON.parse(savedFlexOptions));
    } else {
      const defaultFlexOptions: FlexOption[] = [
        { id: '1', teacher: 'Joker', room: '204', activity: 'Movie - Classic Films', tags: 'movie, arts', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-12-31', maxStudents: 30, currentStudents: 0 },
        { id: '2', teacher: 'Morgana', room: '105', activity: 'Quiet Study', tags: 'quiet study', repeatDays: ['Monday', 'Tuesday', 'Thursday', 'Friday'], repeatUntil: '2026-12-31', maxStudents: 20, currentStudents: 0 },
        { id: '3', teacher: 'Ryuji', room: '302', activity: 'Basketball Practice', tags: 'sports, active', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-02-28', maxStudents: 15, currentStudents: 0 },
        { id: '4', teacher: 'Ann', room: '210', activity: 'Math Tutoring', tags: 'tutoring, math', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-03-15', maxStudents: 12, currentStudents: 0 },
        { id: '5', teacher: 'Yusuke', room: '115', activity: 'Art Studio', tags: 'art, creative', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-05-30', maxStudents: 18, currentStudents: 0 },
        { id: '6', teacher: 'Makoto', room: '308', activity: 'Board Games', tags: 'games, social', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-04-20', maxStudents: 20, currentStudents: 0 },
        { id: '7', teacher: 'Futaba', room: '221', activity: 'Coding Club', tags: 'tech, creative', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 0 },
        { id: '8', teacher: 'Haru', room: '412', activity: 'Gardening Club', tags: 'nature, creative', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-01-31', maxStudents: 12, currentStudents: 0 },
        { id: '9', teacher: 'Akechi', room: '118', activity: 'Debate Team', tags: 'academic, social', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-02-15', maxStudents: 16, currentStudents: 0 },
        { id: '10', teacher: 'Kasumi', room: '305', activity: 'Dance Workshop', tags: 'arts, active', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-03-30', maxStudents: 20, currentStudents: 0 },
        { id: '11', teacher: 'Sophia', room: '203', activity: 'Chess Club', tags: 'games, academic', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-12-31', maxStudents: 14, currentStudents: 0 },
        { id: '12', teacher: 'Zenkichi', room: '109', activity: 'Cooking Class', tags: 'creative, social', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-05-15', maxStudents: 10, currentStudents: 0 },
        { id: '13', teacher: 'Igor', room: '415', activity: 'Science Lab', tags: 'academic, tech', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-04-30', maxStudents: 16, currentStudents: 0 },
        { id: '14', teacher: 'Lavenza', room: '228', activity: 'Poetry Reading', tags: 'arts, quiet study', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-02-28', maxStudents: 15, currentStudents: 0 },
        { id: '15', teacher: 'Sojiro', room: '112', activity: 'Coffee & Conversation', tags: 'social, quiet study', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-06-30', maxStudents: 12, currentStudents: 0 },
        { id: '16', teacher: 'Caroline', room: '320', activity: 'Yoga & Meditation', tags: 'wellness, quiet study', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-03-31', maxStudents: 18, currentStudents: 0 },
        { id: '17', teacher: 'Justine', room: '225', activity: 'Photography Club', tags: 'art, creative', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-05-31', maxStudents: 14, currentStudents: 0 },
        { id: '18', teacher: 'Takemi', room: '107', activity: 'First Aid Training', tags: 'academic, wellness', repeatDays: ['Tuesday', 'Thursday'], repeatUntil: '2026-01-25', maxStudents: 10, currentStudents: 0 },
        { id: '19', teacher: 'Kawakami', room: '214', activity: 'Study Hall', tags: 'quiet study, academic', repeatDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], repeatUntil: '2026-12-31', maxStudents: 25, currentStudents: 0 },
        { id: '20', teacher: 'Ohya', room: '401', activity: 'Creative Writing', tags: 'creative, quiet study', repeatDays: ['Monday', 'Wednesday', 'Friday'], repeatUntil: '2026-04-15', maxStudents: 16, currentStudents: 0 },
      ];
      setFlexOptions(defaultFlexOptions);
      localStorage.setItem('flowtrack-flex-options', JSON.stringify(defaultFlexOptions));
    }
  }, []);

  // Save assignments to localStorage whenever they change
  useEffect(() => {
    if (assignments.length > 0 || localStorage.getItem('flowtrack-assignments')) {
      localStorage.setItem('flowtrack-assignments', JSON.stringify(assignments));
    }
  }, [assignments]);

  // Save flex options to localStorage whenever they change
  useEffect(() => {
    if (flexOptions.length > 0) {
      localStorage.setItem('flowtrack-flex-options', JSON.stringify(flexOptions));
    }
  }, [flexOptions]);
  
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [flexDialogOpen, setFlexDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [newAssignment, setNewAssignment] = useState({
    type: 'homework' as 'test' | 'homework' | 'project',
    title: '',
    className: ''
  });
  const [newFlex, setNewFlex] = useState({
    teacher: '',
    room: '',
    activity: '',
    tags: '',
    repeatDays: [] as string[],
    repeatUntil: '', // ISO date string
    maxStudents: 30
  });

  // Get current teacher name from localStorage
  const teacherEmail = localStorage.getItem('flowtrack-user-email');
  const currentTeacher = teacherEmail === 'jokerteacher@gmail.com' ? 'Joker' : teacherEmail === 'annteacher@gmail.com' ? 'Ann' : 'Teacher';

  // Different classes for different teachers to test assignment display on student calendars
  const classes = currentTeacher === 'Joker' 
    ? ['AP Statistics', 'AP Computer Science', 'Calculus'] // Joker teaches Diluc's classes
    : ['AP Biology', 'French 3', 'US History']; // Ann teaches Diona's classes

  // Get classes available for a specific date based on letter day
  const getClassesForDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const letterDay = getLetterDay(date);
    
    if (!letterDay) return []; // No classes on holidays/weekends
    
    // Joker teaches Diluc's classes: AP Statistics (A,B,E,F), AP Computer Science (A,B,F), Calculus (A,C,E,G)
    // Ann teaches Diona's classes: AP Biology (A,B,C,E,F), French 3 (A,B,D,F,G), US History (A,C,D,E)
    
    if (currentTeacher === 'Joker') {
      // Joker's schedule based on Diluc's letter days
      const jokerSchedule: { [key: string]: string[] } = {
        'A': ['AP Statistics', 'AP Computer Science', 'Calculus'],
        'B': ['AP Statistics', 'AP Computer Science'],
        'C': ['Calculus'],
        'D': [],
        'E': ['AP Statistics', 'Calculus'],
        'F': ['AP Statistics', 'AP Computer Science'],
        'G': ['Calculus']
      };
      return jokerSchedule[letterDay] || [];
    } else {
      // Ann's schedule based on Diona's letter days
      const annSchedule: { [key: string]: string[] } = {
        'A': ['AP Biology', 'French 3'],
        'B': ['AP Biology', 'French 3'],
        'C': ['AP Biology'],
        'D': ['French 3', 'US History'],
        'E': ['AP Biology', 'US History'],
        'F': ['AP Biology', 'French 3'],
        'G': ['French 3']
      };
      return annSchedule[letterDay] || [];
    }
  };

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const changeWeek = (direction: number) => {
    setCurrentWeekOffset(prev => prev + direction);
  };

  const getWeekDates = () => {
    const today = new Date();
    const dayOffset = (currentWeekOffset * 7);
    const monday = new Date(today);
    monday.setDate(today.getDate() - today.getDay() + 1 + dayOffset);

    return Array.from({ length: 5 }, (_, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return {
        date,
        dayName: daysOfWeek[i],
        dateStr: date.toISOString().split('T')[0],
        displayDate: `${date.getMonth() + 1}/${date.getDate()}`
      };
    });
  };

  const handleAssignmentClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setAssignmentDialogOpen(true);
  };

  const handleAddAssignment = () => {
    if (!newAssignment.title || !newAssignment.className) return;

    const teacherEmail = localStorage.getItem('flowtrack-user-email') || '';
    const assignment: Assignment = {
      id: Date.now().toString(),
      type: newAssignment.type,
      title: newAssignment.title,
      className: newAssignment.className,
      date: selectedDate,
      teacherEmail: teacherEmail
    };

    setAssignments(prev => [...prev, assignment]);
    setAssignmentDialogOpen(false);
    setNewAssignment({ type: 'homework', title: '', className: '' });
  };

  const handleCreateFlex = () => {
    if (!newFlex.teacher || !newFlex.room || !newFlex.activity || newFlex.repeatDays.length === 0) return;

    const flex: FlexOption = {
      id: Date.now().toString(),
      teacher: newFlex.teacher,
      room: newFlex.room,
      activity: newFlex.activity,
      tags: newFlex.tags,
      repeatDays: newFlex.repeatDays,
      repeatUntil: newFlex.repeatUntil,
      maxStudents: newFlex.maxStudents,
      currentStudents: 0
    };

    setFlexOptions(prev => [...prev, flex]);
    setFlexDialogOpen(false);
    setNewFlex({ teacher: '', room: '', activity: '', tags: '', repeatDays: [], repeatUntil: '', maxStudents: 30 });
  };

  const toggleRepeatDay = (day: string) => {
    setNewFlex(prev => ({
      ...prev,
      repeatDays: prev.repeatDays.includes(day)
        ? prev.repeatDays.filter(d => d !== day)
        : [...prev.repeatDays, day]
    }));
  };

  const deleteAssignment = (id: string) => {
    setAssignments(prev => prev.filter(a => a.id !== id));
  };

  const deleteFlex = (id: string) => {
    setFlexOptions(prev => prev.filter(f => f.id !== id));
  };

  const getFlexForDate = (dateStr: string, dayName: string) => {
    const teacherEmail = localStorage.getItem('flowtrack-user-email');
    const currentTeacher = teacherEmail === 'jokerteacher@gmail.com' ? 'Joker' : teacherEmail === 'annteacher@gmail.com' ? 'Ann' : 'Teacher';
    
    return flexOptions.filter(flex => {
      // Check if this flex option belongs to the current teacher
      const isOwnFlex = flex.teacher === currentTeacher;
      
      // Check if this flex option occurs on this day of the week
      const isOnThisDay = flex.repeatDays.includes(dayName);
      
      // Check if the date is within the repeat range
      const isWithinRange = !flex.repeatUntil || dateStr <= flex.repeatUntil;
      
      // Only show teacher's own flex blocks in the calendar
      return isOwnFlex && isOnThisDay && isWithinRange;
    });
  };

  const typeColors = {
    test: 'bg-yellow-200 dark:bg-yellow-400 border-yellow-400 dark:border-yellow-500 dark:text-black',
    homework: 'bg-blue-200 dark:bg-blue-400 border-blue-400 dark:border-blue-500 dark:text-black',
    project: 'bg-yellow-200 dark:bg-yellow-400 border-yellow-400 dark:border-yellow-500 dark:text-black',
  };

  const weekDates = getWeekDates();

  // Generate calendar days for the picker
  const generateCalendarDays = () => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push(date);
    }

    return days;
  };

  const handleDateSelect = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const formattedDate = `${year}-${month}-${day}`;
    setNewFlex(prev => ({ ...prev, repeatUntil: formattedDate }));
    setCalendarPickerOpen(false);
  };

  const formatDisplayDate = (isoDate: string) => {
    if (!isoDate) return '';
    const [year, month, day] = isoDate.split('-');
    return `${month}/${day}/${year}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-300 to-pink-300 dark:from-indigo-900 dark:to-purple-900 text-purple-900 dark:text-purple-100 p-6 rounded-t-lg flex items-center justify-between shadow-md dark:shadow-purple-900/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-4xl font-bold">FlowTrack</h1>
            <CalendarIcon className="w-10 h-10 text-purple-900 dark:text-purple-100" />
            <span className="text-2xl">{userRole === 'admin' ? 'Admin Calendar' : 'Teacher Calendar'}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentWeekOffset !== 0 && (
              <Button
                onClick={() => setCurrentWeekOffset(0)}
                className="bg-purple-500 hover:bg-purple-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white border-2 border-purple-600 dark:border-indigo-700 shadow-sm"
                size="sm"
              >
                Today
              </Button>
            )}
            <Button
              onClick={() => changeWeek(-1)}
              variant="ghost"
              size="icon"
              className="text-purple-900 dark:text-purple-100 hover:bg-purple-200/50 dark:hover:bg-indigo-800/50 rounded-full"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <Button
              onClick={() => changeWeek(1)}
              variant="ghost"
              size="icon"
              className="text-purple-900 dark:text-purple-100 hover:bg-purple-200/50 dark:hover:bg-indigo-800/50 rounded-full"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Simplified Calendar Grid */}
        <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-sm rounded-b-lg shadow-lg dark:shadow-purple-900/30 overflow-hidden border-2 border-purple-200 dark:border-indigo-700/50">
          <div className="grid grid-cols-5 gap-4 p-6">
            {weekDates.map((dayData, dayIndex) => {
              const holidays = getHolidays();
              const pdDays = getPDDays();
              const snowDays = getSnowDays();
              const midtermDays = getMidtermDays();
              
              const dateKey = `${dayData.date.getFullYear()}-${dayData.date.getMonth() + 1}-${dayData.date.getDate()}`;
              const isHoliday = !!holidays[dateKey];
              const isPDDay = !!pdDays[dateKey];
              const isSnowDay = !!snowDays[dateKey];
              const isMidterm = !!midtermDays[dateKey];
              const holidayName = holidays[dateKey] || pdDays[dateKey] || snowDays[dateKey] || midtermDays[dateKey];
              
              return (
              <div key={dayIndex} className="space-y-3">
                {/* Day header */}
                <div className={`p-3 rounded-lg border ${
                  isHoliday 
                    ? 'bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-700/50'
                    : isPDDay
                    ? 'bg-orange-100 dark:bg-orange-900/30 border-orange-200 dark:border-orange-700/50'
                    : isSnowDay
                    ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-700/50'
                    : isMidterm
                    ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-700/50'
                    : 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-indigo-900/50 dark:to-purple-900/50 dark:backdrop-blur-sm border-purple-200 dark:border-indigo-700/50'
                }`}>
                  <div className="font-semibold text-purple-900 dark:text-purple-200">{dayData.dayName}</div>
                  <div className="text-sm text-purple-700 dark:text-purple-300">{dayData.displayDate}</div>
                  {(isHoliday || isPDDay || isSnowDay || isMidterm) && (
                    <div className={`text-xs mt-1 font-medium ${
                      isMidterm 
                        ? 'text-amber-700 dark:text-amber-300'
                        : isSnowDay
                        ? 'text-blue-700 dark:text-blue-300'
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {isMidterm ? '(MIDTERMS)' : '(NO SCHOOL)'}
                    </div>
                  )}
                  {holidayName && (
                    <div className={`text-xs italic mt-1 ${
                      isMidterm 
                        ? 'text-amber-600 dark:text-amber-400'
                        : isSnowDay
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {holidayName}
                    </div>
                  )}
                </div>

                {/* Assignments */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Assignments</div>
                  {assignments.filter(a => {
                    const currentTeacherEmail = localStorage.getItem('flowtrack-user-email') || '';
                    return a.date === dayData.dateStr && a.teacherEmail === currentTeacherEmail;
                  }).map(assignment => (
                    <div
                      key={assignment.id}
                      className={`p-2 rounded border-2 text-sm relative ${typeColors[assignment.type]}`}
                    >
                      <button
                        onClick={() => deleteAssignment(assignment.id)}
                        className="absolute top-1 right-1 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="font-medium pr-6">{assignment.title}</div>
                      <div className="text-xs">{assignment.className}</div>
                    </div>
                  ))}
                  <Button
                    onClick={() => handleAssignmentClick(dayData.dateStr)}
                    size="sm"
                    variant="outline"
                    className="w-full border-purple-300 dark:border-indigo-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Assignment
                  </Button>
                </div>

                {/* Flex Blocks */}
                <div className="space-y-2">
                  <div className="text-xs font-medium text-emerald-700 dark:text-emerald-400 mb-2">Flex Blocks</div>
                  {getFlexForDate(dayData.dateStr, dayData.dayName).map(flex => (
                    <div key={flex.id} className="p-2 bg-emerald-100 dark:bg-emerald-400 border-2 border-emerald-300 dark:border-emerald-500 rounded text-sm">
                      <div className="font-medium text-emerald-900 dark:text-black">{flex.activity}</div>
                      <div className="text-xs text-emerald-700 dark:text-emerald-900">Room {flex.room}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
            })}
          </div>
        </div>

        {/* Flex Block Options Section */}
        <div className="mt-8 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800/50 dark:to-indigo-900/50 dark:backdrop-blur-sm rounded-lg shadow-lg dark:shadow-purple-900/30 p-6 border-2 border-purple-200 dark:border-indigo-700/50">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-200">Flex Block Options</h2>
            <Button
              onClick={() => setFlexDialogOpen(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Flex Block
            </Button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {flexOptions
              .sort((a, b) => {
                // Sort so current teacher's flex blocks appear first
                if (a.teacher === currentTeacher && b.teacher !== currentTeacher) {
                  return -1;
                }
                if (a.teacher !== currentTeacher && b.teacher === currentTeacher) {
                  return 1;
                }
                // If both are from current teacher or both are from other teachers, maintain original order
                return 0;
              })
              .map(flex => (
              <div key={flex.id} className="bg-white dark:bg-slate-700/40 dark:backdrop-blur-sm p-4 rounded-lg border-2 border-purple-200 dark:border-indigo-700/50 relative">
                {/* Only show delete button for Joker's own flex blocks */}
                {flex.teacher === currentTeacher && (
                  <button
                    onClick={() => deleteFlex(flex.id)}
                    className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                <div className="font-bold text-purple-900 dark:text-purple-200 pr-8">{flex.teacher} - Room {flex.room}</div>
                <div className="text-purple-700 dark:text-purple-300 mt-1">{flex.activity}</div>
                <div className="text-sm text-purple-600 dark:text-purple-400 mt-2">
                  {flex.repeatDays.join(', ')}
                </div>
                {flex.repeatUntil && (
                  <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                    Until: {formatDisplayDate(flex.repeatUntil)}
                  </div>
                )}
                <div className="text-sm text-emerald-600 dark:text-emerald-400 mt-2 font-medium">
                  Max: {flex.maxStudents} students
                </div>
                <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                  Tags: {flex.tags || 'None'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Assignment Dialog */}
        <Dialog open={assignmentDialogOpen} onOpenChange={setAssignmentDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-indigo-900 border-2 border-purple-300 dark:border-indigo-700/50">
            <DialogHeader>
              <DialogTitle className="text-2xl text-purple-900 dark:text-purple-200">Add Assignment</DialogTitle>
              <DialogDescription className="text-purple-700 dark:text-purple-300">
                Create a new assignment for your class on {selectedDate ? new Date(selectedDate).toLocaleDateString() : ''}.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Assignment Type
                </label>
                <select
                  value={newAssignment.type}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full p-2 border-2 border-purple-300 dark:border-indigo-600 rounded focus:ring-purple-500 dark:focus:ring-indigo-500 focus:border-purple-500 dark:bg-slate-700 dark:text-purple-100"
                >
                  <option value="homework">Homework</option>
                  <option value="test">Test</option>
                  <option value="project">Project</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Title
                </label>
                <Input
                  type="text"
                  value={newAssignment.title}
                  onChange={(e) => setNewAssignment(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g., Chapter 5 Quiz"
                  className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Class
                </label>
                {getClassesForDate(selectedDate).length > 0 ? (
                  <select
                    value={newAssignment.className}
                    onChange={(e) => setNewAssignment(prev => ({ ...prev, className: e.target.value }))}
                    className="w-full p-2 border-2 border-purple-300 dark:border-indigo-600 rounded focus:ring-purple-500 dark:focus:ring-indigo-500 focus:border-purple-500 dark:bg-slate-700 dark:text-purple-100"
                  >
                    <option value="">Select a class</option>
                    {getClassesForDate(selectedDate).map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 rounded text-sm text-amber-800 dark:text-amber-200">
                    You don't have any classes on this day (Day {getLetterDay(new Date(selectedDate)) || 'N/A'}).
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddAssignment}
                  disabled={!newAssignment.title || !newAssignment.className || getClassesForDate(selectedDate).length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white disabled:opacity-50"
                >
                  Add Assignment
                </Button>
                <Button
                  onClick={() => {
                    setAssignmentDialogOpen(false);
                    setNewAssignment({ type: 'homework', title: '', className: '' });
                  }}
                  variant="outline"
                  className="flex-1 border-purple-300 dark:border-indigo-600 text-purple-700 dark:text-purple-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Flex Block Dialog */}
        <Dialog open={flexDialogOpen} onOpenChange={setFlexDialogOpen}>
          <DialogContent className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800 dark:to-indigo-900 border-2 border-purple-300 dark:border-indigo-700/50 max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl text-purple-900 dark:text-purple-200">Create Flex Block</DialogTitle>
              <DialogDescription className="text-purple-700 dark:text-purple-300">
                Set up a new flex block activity for students to join.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Teacher Name
                </label>
                <Input
                  type="text"
                  value={newFlex.teacher}
                  onChange={(e) => setNewFlex(prev => ({ ...prev, teacher: e.target.value }))}
                  placeholder="e.g., Mr. Smith"
                  className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Room Number
                </label>
                <Input
                  type="text"
                  value={newFlex.room}
                  onChange={(e) => setNewFlex(prev => ({ ...prev, room: e.target.value }))}
                  placeholder="e.g., 204"
                  className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Activity
                </label>
                <Input
                  type="text"
                  value={newFlex.activity}
                  onChange={(e) => setNewFlex(prev => ({ ...prev, activity: e.target.value }))}
                  placeholder="e.g., Math Tutoring"
                  className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Tags (comma separated)
                </label>
                <Input
                  type="text"
                  value={newFlex.tags}
                  onChange={(e) => setNewFlex(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="e.g., tutoring, math"
                  className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Repeat on Days
                </label>
                <div className="flex flex-wrap gap-2">
                  {daysOfWeek.map(day => (
                    <button
                      key={day}
                      onClick={() => toggleRepeatDay(day)}
                      className={`px-4 py-2 rounded-lg border-2 transition-all ${
                        newFlex.repeatDays.includes(day)
                          ? 'bg-purple-500 dark:bg-indigo-600 text-white border-purple-600 dark:border-indigo-700'
                          : 'bg-white dark:bg-slate-700 text-purple-700 dark:text-purple-200 border-purple-300 dark:border-indigo-600 hover:bg-purple-100 dark:hover:bg-indigo-900/50'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Repeat Until
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    value={formatDisplayDate(newFlex.repeatUntil)}
                    readOnly
                    onClick={() => setCalendarPickerOpen(!calendarPickerOpen)}
                    placeholder="Select end date (mm/dd/yyyy)"
                    className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 cursor-pointer dark:bg-slate-700 dark:text-purple-100"
                  />
                  <Button
                    type="button"
                    onClick={() => setCalendarPickerOpen(!calendarPickerOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-purple-500 dark:bg-indigo-600 hover:bg-purple-600 dark:hover:bg-indigo-500 text-white h-8 px-3"
                  >
                    <CalendarIcon className="w-4 h-4" />
                  </Button>
                </div>

                {/* Calendar Picker Popup */}
                {calendarPickerOpen && (
                  <div className="mt-2 p-4 bg-white dark:bg-slate-700 rounded-lg border-2 border-purple-300 dark:border-indigo-600 shadow-lg">
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <Button
                        type="button"
                        onClick={() => {
                          const newMonth = new Date(calendarMonth);
                          newMonth.setMonth(newMonth.getMonth() - 1);
                          setCalendarMonth(newMonth);
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-indigo-900/50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                      <div className="font-bold text-purple-900 dark:text-purple-200">
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </div>
                      <Button
                        type="button"
                        onClick={() => {
                          const newMonth = new Date(calendarMonth);
                          newMonth.setMonth(newMonth.getMonth() + 1);
                          setCalendarMonth(newMonth);
                        }}
                        size="sm"
                        variant="ghost"
                        className="text-purple-700 dark:text-purple-200 hover:bg-purple-100 dark:hover:bg-indigo-900/50"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </Button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="text-center text-xs font-medium text-purple-700 dark:text-purple-300 p-2">
                          {day}
                        </div>
                      ))}
                      {generateCalendarDays().map((date, index) => {
                        if (!date) {
                          return <div key={`empty-${index}`} className="p-2"></div>;
                        }

                        const letterDay = getLetterDay(date);
                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                        const isToday = date.toDateString() === new Date().toDateString();

                        return (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleDateSelect(date)}
                            className={`p-2 rounded-lg text-sm transition-all relative ${
                              isWeekend || !letterDay
                                ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 cursor-not-allowed'
                                : 'hover:bg-purple-200 dark:hover:bg-indigo-700 bg-purple-50 dark:bg-indigo-900/50 text-purple-900 dark:text-purple-100'
                            } ${
                              isToday ? 'border-2 border-yellow-400' : ''
                            }`}
                            disabled={isWeekend || !letterDay}
                          >
                            <div className="font-medium">{date.getDate()}</div>
                            {letterDay && (
                              <div className="text-xs text-purple-600 dark:text-purple-300 font-bold mt-1">
                                Day {letterDay}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex justify-end">
                      <Button
                        type="button"
                        onClick={() => setCalendarPickerOpen(false)}
                        size="sm"
                        variant="outline"
                        className="border-purple-300 dark:border-indigo-600 text-purple-700 dark:text-purple-200"
                      >
                        Close
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-purple-900 dark:text-purple-200 mb-2">
                  Maximum Students
                </label>
                <Input
                  type="number"
                  min="1"
                  max="100"
                  value={newFlex.maxStudents}
                  onChange={(e) => setNewFlex(prev => ({ ...prev, maxStudents: parseInt(e.target.value) || 30 }))}
                  placeholder="e.g., 30"
                  className="border-2 border-purple-300 dark:border-indigo-600 focus:ring-purple-500 dark:focus:ring-indigo-500 dark:bg-slate-700 dark:text-purple-100"
                />
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">How many students can join this flex block?</p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleCreateFlex}
                  disabled={!newFlex.teacher || !newFlex.room || !newFlex.activity || newFlex.repeatDays.length === 0}
                  className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 dark:from-indigo-600 dark:to-purple-600 hover:from-purple-600 hover:to-pink-600 dark:hover:from-indigo-500 dark:hover:to-purple-500 text-white disabled:opacity-50"
                >
                  Create Flex Option
                </Button>
                <Button
                  onClick={() => {
                    setFlexDialogOpen(false);
                    setNewFlex({ teacher: '', room: '', activity: '', tags: '', repeatDays: [], repeatUntil: '', maxStudents: 30 });
                  }}
                  variant="outline"
                  className="flex-1 border-purple-300 dark:border-indigo-600 text-purple-700 dark:text-purple-200"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
