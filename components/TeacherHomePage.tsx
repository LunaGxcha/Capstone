import { useState, useEffect } from 'react';
import { User, Bell, X } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import PassListItem from './PassListItem';

interface Pass {
  id: string;
  destination: string;
  location?: string;
  time: string;
  startTimestamp: number;
  expiresTimestamp: number;
  status: 'active' | 'completed' | 'overtime';
  studentName: string;
  studentEmail: string; // Track which student this pass belongs to
  currentClass: string;
  currentRoom: string;
  createdByTeacher?: string; // Track which teacher created this pass
}

interface Destination {
  name: string;
  icon: string;
  needsLocation?: boolean;
  locations?: BathroomLocation[];
}

interface BathroomLocation {
  id: string;
  name: string;
  floor: string;
  available: boolean;
  capacity: number;
  current: number;
}

interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
}

// Bathroom locations with capacity tracking
const bathroomLocations: BathroomLocation[] = [
  { id: 'b1', name: 'Main Hall - 1st Floor', floor: '1st Floor', available: true, capacity: 3, current: 0 },
  { id: 'b2', name: 'Main Hall - 2nd Floor', floor: '2nd Floor', available: true, capacity: 3, current: 0 },
  { id: 'b3', name: 'Science Wing - 2nd Floor', floor: '2nd Floor', available: true, capacity: 2, current: 0 },
  { id: 'b4', name: 'Arts Wing - 1st Floor', floor: '1st Floor', available: true, capacity: 3, current: 0 },
  { id: 'b5', name: 'Gym Area - 1st Floor', floor: '1st Floor', available: true, capacity: 2, current: 0 },
  { id: 'b6', name: 'Library Area - 2nd Floor', floor: '2nd Floor', available: true, capacity: 2, current: 0 },
];

const destinations: Destination[] = [
  { name: 'Bathroom', icon: '🚻', needsLocation: true, locations: bathroomLocations },
  { name: 'Nurse', icon: '🏥' },
  { name: 'Classroom', icon: '📚', needsLocation: true },
  { name: 'Administration', icon: '🏛️' },
  { name: 'Counselor', icon: '💬' },
  { name: 'Library', icon: '📖' },
];

const students = [
  'Diluc', 'Diona', 'Kaeya', 'Amber', 'Lisa', 'Jean', 'Barbara', 'Klee', 
  'Venti', 'Fischl', 'Bennett', 'Noelle', 'Sucrose', 'Mona'
];

const classrooms = [
  'Joker - Room 101', 'Morgana - Room 102', 'Ryuji - Room 103', 
  'Ann - Room 104', 'Yusuke - Room 105', 'Makoto - Room 106',
  'Futaba - Room 107', 'Haru - Room 108'
];

// All available rooms in the school
const availableRooms = [
  'Room 101', 'Room 102', 'Room 103', 'Room 104', 'Room 105', 
  'Room 106', 'Room 107', 'Room 108', 'Room 201', 'Room 202',
  'Room 203', 'Room 204', 'Room 205', 'Gymnasium', 'Library',
  'Art Room', 'Music Room', 'Science Lab', 'Computer Lab', 'Cafeteria'
];

export default function TeacherHomePage() {
  const [activeTab, setActiveTab] = useState<'passes' | 'notifications'>('passes');
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(''); // For tracking which room student is from
  const [showStudentDropdown, setShowStudentDropdown] = useState(false);
  const [allPasses, setAllPasses] = useState<Pass[]>([]);
  const [passTimers, setPassTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load passes from localStorage
  useEffect(() => {
    const storedPasses = localStorage.getItem('flowtrack-all-passes');
    const storedDate = localStorage.getItem('flowtrack-passes-date');
    const today = new Date().toDateString();

    if (storedDate === today && storedPasses) {
      try {
        const passes = JSON.parse(storedPasses);
        // Remove any duplicate passes by ID before setting state
        const uniquePasses = passes.filter((pass: Pass, index: number, self: Pass[]) => 
          index === self.findIndex((p) => p.id === pass.id)
        );
        
        // Immediately write cleaned data back to localStorage
        if (uniquePasses.length !== passes.length) {
          localStorage.setItem('flowtrack-all-passes', JSON.stringify(uniquePasses));
        }
        
        setAllPasses(uniquePasses);
        
        // Restore timers for active passes
        uniquePasses.forEach((pass: Pass) => {
          if (pass.status === 'active') {
            const remaining = pass.expiresTimestamp - Date.now();
            if (remaining > 0) {
              const timer = setTimeout(() => {
                setAllPasses(prev => 
                  prev.map(p => p.id === pass.id && p.status === 'active' ? { ...p, status: 'overtime' } : p)
                );
              }, remaining);
              setPassTimers(prev => ({ ...prev, [pass.id]: timer }));
            } else {
              setAllPasses(prev =>
                prev.map(p => p.id === pass.id ? { ...p, status: 'overtime' } : p)
              );
            }
          }
        });
      } catch (e) {
        console.error('Failed to load passes', e);
      }
    } else {
      localStorage.removeItem('flowtrack-all-passes');
      localStorage.setItem('flowtrack-passes-date', today);
    }
  }, []);

  // Save passes to localStorage
  useEffect(() => {
    if (allPasses.length > 0) {
      // Remove any duplicate passes by ID before saving
      const uniquePasses = allPasses.filter((pass, index, self) => 
        index === self.findIndex((p) => p.id === pass.id)
      );
      localStorage.setItem('flowtrack-all-passes', JSON.stringify(uniquePasses));
    }
  }, [allPasses]);

  // Load notifications from localStorage
  useEffect(() => {
    const storedNotifications = localStorage.getItem('flowtrack-admin-notifications');
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        setNotifications(parsed);
      } catch (e) {
        console.error('Failed to load notifications', e);
      }
    }
  }, [activeTab]); // Reload when switching to notifications tab

  const handleDeleteNotification = (id: string) => {
    const updatedNotifications = notifications.filter(n => n.id !== id);
    setNotifications(updatedNotifications);
    localStorage.setItem('flowtrack-admin-notifications', JSON.stringify(updatedNotifications));
  };

  const handleMarkAsRead = (id: string) => {
    const updatedNotifications = notifications.map(n => 
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updatedNotifications);
    localStorage.setItem('flowtrack-admin-notifications', JSON.stringify(updatedNotifications));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleDestinationClick = (destination: Destination) => {
    setSelectedDestination(destination);
    setPassDialogOpen(true);
    
    // Set default room based on teacher
    const teacherEmail = localStorage.getItem('flowtrack-user-email');
    if (teacherEmail === 'jokerteacher@gmail.com') {
      setSelectedRoom('Room 101');
    } else if (teacherEmail === 'annteacher@gmail.com') {
      setSelectedRoom('Gymnasium');
    } else {
      setSelectedRoom('Room 102');
    }
  };

  const handleCreatePass = () => {
    if (!selectedStudent || !selectedDestination) return;
    if (selectedDestination.needsLocation && !selectedClassroom) return;

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes

    // Map student names to their emails
    const studentEmailMap: { [key: string]: string } = {
      'Diluc': 'stardewvalley@gmail.com',
      'Diona': 'dionagenshinstudent@gmail.com',
      // Default pattern for other students
    };
    
    const studentEmail = studentEmailMap[selectedStudent] || `${selectedStudent.toLowerCase().replace(/\s+/g, '.')}.example@example.com`;

    // Get the logged-in teacher's name from email
    const teacherEmail = localStorage.getItem('flowtrack-user-email');
    const teacherName = teacherEmail === 'jokerteacher@gmail.com' ? 'Joker' : teacherEmail === 'annteacher@gmail.com' ? 'Ann' : 'Teacher';

    // Determine the student's current class
    let currentClass = 'Current Class';

    // Check if we can determine their current schedule period
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    // School schedule time ranges (in minutes from midnight)
    // 1st Period: 7:15 - 8:15 (435 - 495)
    // 2nd Period: 8:20 - 9:20 (500 - 560)
    // Flex: 9:25 - 9:55 (565 - 595)
    // 3rd Period: 10:00 - 11:00 (600 - 660)
    // 4th Period (Lunch): 11:05 - 12:40 (665 - 760)
    // 5th Period: 12:50 - 1:45 (770 - 825)

    if (currentTimeInMinutes >= 435 && currentTimeInMinutes < 495) {
      currentClass = '1st Period';
    } else if (currentTimeInMinutes >= 500 && currentTimeInMinutes < 560) {
      currentClass = '2nd Period';
    } else if (currentTimeInMinutes >= 565 && currentTimeInMinutes < 595) {
      currentClass = 'Flex Block';
    } else if (currentTimeInMinutes >= 600 && currentTimeInMinutes < 660) {
      currentClass = '3rd Period';
    } else if (currentTimeInMinutes >= 665 && currentTimeInMinutes < 760) {
      currentClass = '4th Period';
    } else if (currentTimeInMinutes >= 770 && currentTimeInMinutes < 825) {
      currentClass = '5th Period';
    }

    const newPass: Pass = {
      id: `teacher-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      destination: selectedDestination.name,
      location: selectedDestination.needsLocation ? selectedClassroom : undefined,
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      startTimestamp: now.getTime(),
      expiresTimestamp: expiresAt.getTime(),
      status: 'active',
      studentName: selectedStudent,
      studentEmail: studentEmail,
      currentClass: currentClass,
      currentRoom: selectedRoom, // Use the selected room
      createdByTeacher: teacherName // Add the teacher's name here
    };

    setAllPasses(prev => [newPass, ...prev]);

    // Set timer for pass expiration
    const timer = setTimeout(() => {
      setAllPasses(prev =>
        prev.map(p => p.id === newPass.id && p.status === 'active' ? { ...p, status: 'overtime' } : p)
      );
    }, 5 * 60 * 1000);

    setPassTimers(prev => ({ ...prev, [newPass.id]: timer }));

    // Reset form
    setPassDialogOpen(false);
    setSelectedDestination(null);
    setSelectedStudent('');
    setSelectedClassroom('');
    setShowStudentDropdown(false);
  };

  const endedPasses = allPasses.filter(p => p.status === 'completed');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-800 dark:to-pink-900 text-purple-900 dark:text-purple-100 p-8 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-xl">F</span>
            </div>
            <h1 className="text-5xl font-bold">FlowTrack</h1>
          </div>
          <p className="text-lg text-purple-800 dark:text-purple-200">Teacher Dashboard - Create and manage student passes</p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-sm rounded-t-2xl shadow-lg border-2 border-b-0 border-purple-200 dark:border-indigo-700/50 mb-0">
          <div className="flex gap-2 p-2">
            <Button
              onClick={() => setActiveTab('passes')}
              className={activeTab === 'passes' 
                ? 'bg-purple-500 dark:bg-indigo-600 text-white' 
                : 'bg-transparent text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50'}
            >
              Hall Passes
            </Button>
            <Button
              onClick={() => setActiveTab('notifications')}
              className={`${activeTab === 'notifications' 
                ? 'bg-purple-500 dark:bg-indigo-600 text-white' 
                : 'bg-transparent text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-900/50'} relative`}
            >
              <Bell className="w-4 h-4 mr-2" />
              Notifications
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </Button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="bg-white dark:bg-slate-900/50 dark:backdrop-blur-sm rounded-b-2xl shadow-lg border-2 border-purple-200 dark:border-indigo-700/50 p-8">
          {activeTab === 'passes' && (
            <>
              {/* Pass Request Options */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-6">Create Student Pass</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {destinations.map((dest) => (
                    <button
                      key={dest.name}
                      onClick={() => handleDestinationClick(dest)}
                      className="bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900 dark:to-pink-900 hover:from-purple-200 hover:to-pink-200 dark:hover:from-purple-800 dark:hover:to-pink-800 border-2 border-purple-300 dark:border-purple-600 rounded-xl p-6 flex flex-col items-center gap-3 transition-all hover:scale-105 hover:shadow-lg"
                    >
                      <span className="text-4xl">{dest.icon}</span>
                      <span className="font-semibold text-purple-900 dark:text-purple-100">{dest.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Ended Passes */}
              <div>
                <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-6">Ended Passes</h2>
                {endedPasses.length === 0 ? (
                  <p className="text-purple-600 dark:text-purple-300 text-center py-8">No ended passes yet today</p>
                ) : (
                  <div className="space-y-4">
                    {endedPasses.map((pass) => (
                      <div key={pass.id} className="flex items-center gap-4 p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-xl border-2 border-purple-200 dark:border-purple-700">
                        <div className="w-12 h-12 bg-gradient-to-br from-purple-300 to-pink-300 dark:from-purple-600 dark:to-pink-600 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-700 shadow-md flex-shrink-0">
                          <User className="w-6 h-6 text-purple-800 dark:text-purple-200" />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-purple-900 dark:text-purple-100">{pass.studentName}</div>
                          <div className="text-sm text-purple-600 dark:text-purple-300">
                            {pass.destination} {pass.location && `- ${pass.location}`}
                          </div>
                          {pass.createdByTeacher && (
                            <div className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                              📝 Created by: {pass.createdByTeacher}
                            </div>
                          )}
                        </div>
                        <div className="text-sm text-purple-700 dark:text-purple-300 font-medium">
                          {pass.time}
                        </div>
                        <div className="px-3 py-1 rounded-full text-sm font-medium text-white bg-gray-400">
                          ✓ Completed
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {activeTab === 'notifications' && (
            <div>
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-200 mb-6">Admin Notifications</h2>
              {notifications.length === 0 ? (
                <div className="text-center py-12">
                  <Bell className="w-16 h-16 mx-auto text-purple-300 dark:text-purple-700 mb-4" />
                  <p className="text-purple-600 dark:text-purple-400">No notifications from admin</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-6 rounded-lg border-2 ${
                        notification.read
                          ? 'bg-white dark:bg-slate-800 border-purple-200 dark:border-indigo-700/50'
                          : 'bg-blue-50 dark:bg-blue-900/20 border-blue-300 dark:border-blue-700'
                      } relative`}
                    >
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="absolute top-3 right-3 w-6 h-6 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-500 transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="pr-8">
                        {!notification.read && (
                          <div className="inline-block px-2 py-1 bg-blue-500 text-white text-xs rounded-full mb-2">
                            New
                          </div>
                        )}
                        <p className="text-purple-900 dark:text-purple-100 mb-2 whitespace-pre-wrap">
                          {notification.message}
                        </p>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-purple-600 dark:text-purple-400">
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                          {!notification.read && (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              size="sm"
                              variant="outline"
                              className="border-purple-300 dark:border-indigo-600 text-purple-700 dark:text-purple-300 text-xs"
                            >
                              Mark as Read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Create Pass Dialog */}
      <Dialog open={passDialogOpen} onOpenChange={setPassDialogOpen}>
        <DialogContent className="bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-300">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-purple-900">
              Create Pass - {selectedDestination?.icon} {selectedDestination?.name}
            </DialogTitle>
            <DialogDescription className="text-sm text-purple-600">
              Select a student and optionally a classroom to create a pass.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            {/* Student Selection */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Select Student
              </label>
              
              {/* Custom dropdown with profile pictures */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowStudentDropdown(!showStudentDropdown)}
                  className="w-full p-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-purple-900 text-left flex items-center justify-between"
                >
                  {selectedStudent ? (
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{selectedStudent.charAt(0)}</span>
                      </div>
                      <span>{selectedStudent}</span>
                    </div>
                  ) : (
                    <span className="text-purple-400">Choose a student...</span>
                  )}
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showStudentDropdown && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-purple-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                    {students.map((student) => (
                      <button
                        key={student}
                        type="button"
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDropdown(false);
                        }}
                        className="w-full p-3 hover:bg-purple-50 text-left flex items-center gap-3 transition-colors border-b border-purple-100 last:border-b-0"
                      >
                        <div className="w-8 h-8 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-bold text-sm">{student.charAt(0)}</span>
                        </div>
                        <span className="text-purple-900 font-medium">{student}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display selected student with profile icon */}
              {selectedStudent && (
                <div className="mt-3 p-3 bg-purple-50 border-2 border-purple-200 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-purple-300 to-pink-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-bold text-lg">{selectedStudent.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="font-semibold text-purple-900">{selectedStudent}</div>
                    <div className="text-xs text-purple-600">Selected Student</div>
                  </div>
                </div>
              )}
            </div>

            {/* Room Selection - Student is coming FROM this room */}
            <div>
              <label className="block text-sm font-medium text-purple-900 mb-2">
                Student Coming From <span className="text-purple-500">(Your current or covering room)</span>
              </label>
              <select
                value={selectedRoom}
                onChange={(e) => setSelectedRoom(e.target.value)}
                className="w-full p-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-purple-900"
              >
                {availableRooms.map((room) => (
                  <option key={room} value={room}>
                    {room}
                  </option>
                ))}
              </select>
              <p className="text-xs text-purple-600 mt-1">
                💡 Default is your home room. Change this if you're covering another class.
              </p>
            </div>

            {/* Location Selection (if needed) */}
            {selectedDestination?.needsLocation && selectedDestination.name === 'Bathroom' && (
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Select Bathroom
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {selectedDestination.locations?.map((bathroom) => {
                    const isAvailable = bathroom.current < bathroom.capacity;
                    return (
                      <button
                        key={bathroom.id}
                        onClick={() => setSelectedClassroom(bathroom.name)}
                        disabled={!isAvailable}
                        className={`w-full p-3 border-2 rounded-xl text-left transition-all ${
                          selectedClassroom === bathroom.name
                            ? 'border-purple-500 bg-purple-100'
                            : isAvailable
                            ? 'border-purple-300 bg-white hover:bg-purple-50'
                            : 'border-gray-300 bg-gray-100 cursor-not-allowed opacity-50'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-purple-900">{bathroom.name}</div>
                            <div className="text-sm text-purple-600">{bathroom.floor}</div>
                          </div>
                          <div className={`text-sm font-medium ${isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                            {bathroom.current}/{bathroom.capacity}
                            {isAvailable ? ' ✓' : ' Full'}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Classroom Selection (if needed and not bathroom) */}
            {selectedDestination?.needsLocation && selectedDestination.name === 'Classroom' && (
              <div>
                <label className="block text-sm font-medium text-purple-900 mb-2">
                  Select Classroom
                </label>
                <select
                  value={selectedClassroom}
                  onChange={(e) => setSelectedClassroom(e.target.value)}
                  className="w-full p-3 border-2 border-purple-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-purple-900"
                >
                  <option value="">Choose a classroom...</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom} value={classroom}>
                      {classroom}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-2 pt-4">
              <Button
                onClick={handleCreatePass}
                disabled={!selectedStudent || (selectedDestination?.needsLocation && !selectedClassroom)}
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white disabled:opacity-50"
              >
                Create Pass
              </Button>
              <Button
                onClick={() => {
                  setPassDialogOpen(false);
                  setSelectedDestination(null);
                  setSelectedStudent('');
                  setSelectedClassroom('');
                }}
                variant="outline"
                className="border-2 border-purple-300"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
