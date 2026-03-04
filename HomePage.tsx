import { useState, useEffect } from 'react';
import { Calendar, MapPin, Clock, User, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import PassCard from './PassCard';
import PassListItem from './PassListItem';
import { getLetterDayForDate, getCalendarDayInfo, getClassForDate } from '../utils/calendarUtils';

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

interface Location {
  id: string;
  name: string;
  floor: string;
  available: boolean;
  capacity: number;
  current: number;
}

interface Destination {
  id: string;
  name: string;
  icon: string;
  requiresLocation?: boolean;
  locations?: Location[];
}

export default function HomePage({ onNavigateToSchedule }: { onNavigateToSchedule: () => void }) {
  const [passDialogOpen, setPassDialogOpen] = useState(false);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [activePasses, setActivePasses] = useState<Pass[]>([]);
  const [passTimers, setPassTimers] = useState<{ [key: string]: NodeJS.Timeout }>({});
  const [viewPassDialogOpen, setViewPassDialogOpen] = useState(false);
  const [selectedPass, setSelectedPass] = useState<Pass | null>(null);
  const [currentPeriodInfo, setCurrentPeriodInfo] = useState<{ period: string; time: string; className: string; room: string }>({
    period: 'Not in class',
    time: '',
    className: 'No class',
    room: 'N/A'
  });

  // Load passes from localStorage on mount
  useEffect(() => {
    const storedPasses = localStorage.getItem('flowtrack-all-passes');
    const storedDate = localStorage.getItem('flowtrack-passes-date');
    const today = new Date().toDateString();
    const userEmail = localStorage.getItem('flowtrack-user-email');

    if (storedDate === today && storedPasses) {
      try {
        const allPasses = JSON.parse(storedPasses);
        // Remove duplicates first, then filter for current student
        const uniquePasses = allPasses.filter((pass: Pass, index: number, self: Pass[]) => 
          index === self.findIndex((p) => p.id === pass.id)
        );
        
        // Immediately write cleaned data back to localStorage
        if (uniquePasses.length !== allPasses.length) {
          localStorage.setItem('flowtrack-all-passes', JSON.stringify(uniquePasses));
        }
        
        const myPasses = uniquePasses.filter((pass: Pass) => pass.studentEmail === userEmail);
        setActivePasses(myPasses);
        
        // Restore timers for active passes
        myPasses.forEach((pass: Pass) => {
          if (pass.status === 'active') {
            const remaining = pass.expiresTimestamp - Date.now();
            if (remaining > 0) {
              const timer = setTimeout(() => {
                setActivePasses(prev => 
                  prev.map(p => p.id === pass.id && p.status === 'active' ? { ...p, status: 'overtime' } : p)
                );
              }, remaining);
              setPassTimers(prev => ({ ...prev, [pass.id]: timer }));
            } else {
              // Already expired
              setActivePasses(prev =>
                prev.map(p => p.id === pass.id ? { ...p, status: 'overtime' } : p)
              );
            }
          }
        });
      } catch (e) {
        console.error('Failed to load passes from localStorage', e);
      }
    } else {
      // Clear old passes if it's a new day
      localStorage.removeItem('flowtrack-all-passes');
      localStorage.setItem('flowtrack-passes-date', today);
    }
  }, []);

  // Save passes to localStorage whenever they change
  useEffect(() => {
    const userEmail = localStorage.getItem('flowtrack-user-email');
    const storedPasses = localStorage.getItem('flowtrack-all-passes');
    
    if (activePasses.length > 0 || storedPasses) {
      // Get all passes from localStorage
      const allPasses = storedPasses ? JSON.parse(storedPasses) : [];
      
      // Remove old passes for this student and add updated ones
      const otherStudentsPasses = allPasses.filter((pass: Pass) => pass.studentEmail !== userEmail);
      const updatedAllPasses = [...otherStudentsPasses, ...activePasses];
      
      localStorage.setItem('flowtrack-all-passes', JSON.stringify(updatedAllPasses));
    }
  }, [activePasses]);

  // Detect current period based on time
  useEffect(() => {
    const detectCurrentPeriod = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute; // Convert to minutes since midnight

      // Use calendar utilities to get today's info
      const dayInfo = getCalendarDayInfo(now);
      
      // Check if today is a non-school day
      if (dayInfo.isWeekend || dayInfo.isHoliday || dayInfo.isSnowDay || dayInfo.isPDDay) {
        setCurrentPeriodInfo({
          period: 'No School',
          time: '',
          className: dayInfo.holidayName || 'Weekend',
          room: 'N/A'
        });
        return;
      }

      const todayLetterDay = dayInfo.letterDay;

      // Get student email to determine which schedule to use
      const userEmail = localStorage.getItem('flowtrack-user-email');

      // Diluc's schedule (stardewvalley@gmail.com)
      const dilucSchedule: { [key: string]: string[] } = {
        'A': ['AP Statistics-EEP', 'AP Computer Science A', 'Design & Development for IT-H', 'Calculus-H', 'English12-CP2'],
        'B': ['West Civ: Ancient Civ-CP', 'Holocaust Studies-CP', 'AP Statistics-EEP', 'AP Computer Science A', 'Design & Development for IT-H'],
        'C': ['Calculus-H', 'English12-CP2', 'West Civ: Ancient Civ-CP', 'Holocaust Studies-CP', 'AP Statistics-EEP'],
        'D': ['AP Computer Science A', 'Design & Development for IT-H', 'Calculus-H', 'English12-CP2', 'West Civ: Ancient Civ-CP'],
        'E': ['Holocaust Studies-CP', 'AP Statistics-EEP', 'AP Computer Science A', 'Design & Development for IT-H', 'Calculus-H'],
        'F': ['English12-CP2', 'West Civ: Ancient Civ-CP', 'Holocaust Studies-CP', 'AP Statistics-EEP', 'AP Computer Science A'],
        'G': ['Design & Development for IT-H', 'Calculus-H', 'English12-CP2', 'West Civ: Ancient Civ-CP', 'Holocaust Studies-CP'],
      };

      // Diona's schedule (dionagenshinstudent@gmail.com)
      const dionaSchedule: { [key: string]: string[] } = {
        'A': ['AP Biology', 'French 3-H', 'US History-H', 'Algebra 2-H', 'English11-H'],
        'B': ['West Civ: Ancient Civ-CP', 'Holocaust Studies-CP', 'AP Biology', 'French 3-H', 'US History-H'],
        'C': ['Algebra 2-H', 'English11-H', 'West Civ: Ancient Civ-CP', 'Holocaust Studies-CP', 'AP Biology'],
        'D': ['French 3-H', 'US History-H', 'Algebra 2-H', 'English11-H', 'West Civ: Ancient Civ-CP'],
        'E': ['Holocaust Studies-CP', 'AP Biology', 'French 3-H', 'US History-H', 'Algebra 2-H'],
        'F': ['English11-H', 'West Civ: Ancient Civ-CP', 'Holocaust Studies-CP', 'AP Biology', 'French 3-H'],
        'G': ['US History-H', 'Algebra 2-H', 'English11-H', 'West Civ: Ancient Civ-CP', 'Holocaust Studies-CP'],
      };

      // Select the appropriate schedule based on user email
      const classSchedule = userEmail === 'stardewvalley@gmail.com' ? dilucSchedule : dionaSchedule;

      // Room assignments (simplified - could be more specific)
      const roomAssignments: { [key: string]: string } = {
        'AP Statistics-EEP': 'Room 301',
        'AP Computer Science A': 'Room 415',
        'Design & Development for IT-H': 'Room 420',
        'Calculus-H': 'Room 305',
        'English12-CP2': 'Room 210',
        'West Civ: Ancient Civ-CP': 'Room 308',
        'Holocaust Studies-CP': 'Room 310',
        'CAD': 'Room 320',
        'Physical Education': 'Gymnasium',
        'AP Biology': 'Room 215',
        'French 3-H': 'Room 201',
        'US History-H': 'Room 312',
        'Algebra 2-H': 'Room 304',
        'English11-H': 'Room 208',
      };

      // Period times (in minutes since midnight)
      const periods = [
        { start: 7 * 60 + 15, end: 8 * 60 + 15, label: '1st Period', time: '7:15 - 8:15 AM', classIndex: 0 },
        { start: 8 * 60 + 20, end: 9 * 60 + 20, label: '2nd Period', time: '8:20 - 9:20 AM', classIndex: 1 },
        { start: 9 * 60 + 25, end: 9 * 60 + 55, label: 'Flex', time: '9:25 - 9:55 AM', classIndex: -1 },
        { start: 10 * 60, end: 11 * 60, label: '4th Period', time: '10:00 - 11:00 AM', classIndex: 2 },
        { start: 11 * 60 + 5, end: 12 * 60 + 40, label: '5th Period (Lunch)', time: '11:05 AM - 12:40 PM', classIndex: 3 },
        { start: 12 * 60 + 45, end: 13 * 60 + 45, label: '6th Period', time: '12:45 - 1:45 PM', classIndex: 4 },
      ];

      for (const period of periods) {
        if (currentTime >= period.start && currentTime < period.end) {
          if (period.classIndex === -1) {
            // Flex period
            setCurrentPeriodInfo({
              period: period.label,
              time: period.time,
              className: 'Flex Block',
              room: 'Various'
            });
          } else {
            const baseClassName = classSchedule[todayLetterDay][period.classIndex];
            const className = getClassForDate(baseClassName, new Date());
            const room = roomAssignments[baseClassName] || roomAssignments[className] || 'Room TBD';
            setCurrentPeriodInfo({
              period: period.label,
              time: period.time,
              className: className,
              room: room
            });
          }
          return;
        }
      }

      // Not in any period
      setCurrentPeriodInfo({
        period: 'Not in class',
        time: '',
        className: 'No class',
        room: 'N/A'
      });
    };

    detectCurrentPeriod();
    const interval = setInterval(detectCurrentPeriod, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Sample bathroom locations with capacity
  const bathroomLocations: Location[] = [
    { id: 'b1', name: 'Main Hall - 1st Floor', floor: '1st Floor', available: true, capacity: 3, current: 1 },
    { id: 'b2', name: 'Main Hall - 2nd Floor', floor: '2nd Floor', available: true, capacity: 3, current: 0 },
    { id: 'b3', name: 'Science Wing - 2nd Floor', floor: '2nd Floor', available: false, capacity: 2, current: 2 },
    { id: 'b4', name: 'Arts Wing - 1st Floor', floor: '1st Floor', available: true, capacity: 3, current: 1 },
    { id: 'b5', name: 'Gym Area - 1st Floor', floor: '1st Floor', available: true, capacity: 2, current: 0 },
    { id: 'b6', name: 'Library Area - 2nd Floor', floor: '2nd Floor', available: true, capacity: 2, current: 1 },
  ];

  const classroomLocations: Location[] = [
    { id: 'c1', name: 'Joker - Room 101', floor: '1st Floor', available: true, capacity: 1, current: 0 },
    { id: 'c2', name: 'Morgana - Room 102', floor: '1st Floor', available: true, capacity: 1, current: 0 },
    { id: 'c3', name: 'Ryuji - Room 204', floor: '2nd Floor', available: true, capacity: 1, current: 0 },
    { id: 'c4', name: 'Ann - Room 205', floor: '2nd Floor', available: true, capacity: 1, current: 0 },
    { id: 'c5', name: 'Yusuke - Room 206', floor: '2nd Floor', available: true, capacity: 1, current: 0 },
    { id: 'c6', name: 'Makoto - Room 301', floor: '3rd Floor', available: true, capacity: 1, current: 0 },
    { id: 'c7', name: 'Futaba - Room 302', floor: '3rd Floor', available: false, capacity: 1, current: 1 },
    { id: 'c8', name: 'Haru - Room 303', floor: '3rd Floor', available: true, capacity: 1, current: 0 },
    { id: 'c9', name: 'Akechi - Room 415', floor: '4th Floor', available: true, capacity: 1, current: 0 },
    { id: 'c10', name: 'Kasumi - Room 416', floor: '4th Floor', available: true, capacity: 1, current: 0 },
  ];

  const destinations: Destination[] = [
    { id: 'bathroom', name: 'Bathroom', icon: '🚻', requiresLocation: true, locations: bathroomLocations },
    { id: 'nurse', name: 'Nurse', icon: '🏥', requiresLocation: false },
    { id: 'classroom', name: 'Another Classroom', icon: '📚', requiresLocation: true, locations: classroomLocations },
    { id: 'admin', name: 'Administration', icon: '🏢', requiresLocation: false },
    { id: 'counselor', name: 'Counselor', icon: '💬', requiresLocation: false },
    { id: 'library', name: 'Library', icon: '📖', requiresLocation: false },
  ];

  const handleDestinationClick = (destination: Destination) => {
    setSelectedDestination(destination);
    setPassDialogOpen(true);
  };

  const createPass = (location?: string) => {
    const now = new Date();
    const timeString = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    
    // Get student name based on email
    const userEmail = localStorage.getItem('flowtrack-user-email');
    const studentName = userEmail === 'stardewvalley@gmail.com' ? 'Diluc' : userEmail === 'dionagenshinstudent@gmail.com' ? 'Diona' : 'Student';
    
    const newPass: Pass = {
      id: `student-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // More unique ID
      destination: selectedDestination!.name,
      location: location,
      time: timeString,
      startTimestamp: now.getTime(),
      expiresTimestamp: now.getTime() + 300000, // 5 minutes = 300,000 milliseconds
      status: 'active',
      studentName: studentName,
      studentEmail: userEmail || 'unknown', // Track which student this pass belongs to
      currentClass: currentPeriodInfo.className,
      currentRoom: currentPeriodInfo.room
    };

    setActivePasses(prev => [...prev, newPass]);
    setPassDialogOpen(false);
    setSelectedDestination(null);

    // Set pass to overtime after 5 minutes
    const timer = setTimeout(() => {
      setActivePasses(prev => 
        prev.map(p => p.id === newPass.id && p.status === 'active' ? { ...p, status: 'overtime' } : p)
      );
    }, 300000); // 5 minutes = 300,000 milliseconds
    
    setPassTimers(prev => ({ ...prev, [newPass.id]: timer }));
  };

  const handleEndPass = (passId: string) => {
    // Clear the timer when manually ending the pass
    if (passTimers[passId]) {
      clearTimeout(passTimers[passId]);
      setPassTimers(prev => {
        const { [passId]: _, ...rest } = prev;
        return rest;
      });
    }
    
    setActivePasses(prev => 
      prev.map(p => p.id === passId ? { ...p, status: 'completed' } : p)
    );
  };

  const currentActivePass = activePasses.find(p => p.status === 'active');
  const currentOvertimePass = activePasses.find(p => p.status === 'overtime');

  // Get student name based on email
  const userEmail = localStorage.getItem('flowtrack-user-email');
  const studentName = userEmail === 'stardewvalley@gmail.com' ? 'Diluc' : userEmail === 'dionagenshinstudent@gmail.com' ? 'Diona' : 'Student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-8">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-300 to-pink-300 dark:from-purple-800 dark:to-pink-900 text-purple-900 dark:text-purple-100 p-8 rounded-2xl shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-600 dark:to-pink-600 rounded-lg flex items-center justify-center shadow-md">
                  <span className="text-white font-bold text-xl">F</span>
                </div>
                <h1 className="text-5xl font-bold">FlowTrack</h1>
              </div>
              <p className="text-lg text-purple-800 dark:text-purple-200">Request a pass to leave your classroom</p>
            </div>
            <Button
              onClick={onNavigateToSchedule}
              className="bg-white/80 hover:bg-white dark:bg-purple-900/80 dark:hover:bg-purple-900 text-purple-900 dark:text-purple-100 border-2 border-purple-400 dark:border-purple-600 shadow-md"
              size="lg"
            >
              <Calendar className="w-5 h-5 mr-2" />
              View Schedule
            </Button>
          </div>
        </div>

        {/* Current Student Info */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-8 border-2 border-purple-200 dark:border-purple-700">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-700 dark:to-pink-700 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-purple-700 dark:text-purple-100" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100">{studentName}</h2>
              <p className="text-purple-600 dark:text-purple-200">Currently in: <span className="font-semibold">{currentPeriodInfo.className} - {currentPeriodInfo.room}</span></p>
              <p className="text-sm text-purple-500 dark:text-purple-300">{currentPeriodInfo.period}{currentPeriodInfo.time && ` • ${currentPeriodInfo.time}`}</p>
            </div>
          </div>
        </div>

        {/* Active Pass Display */}
        {currentActivePass && (
          <div className="mb-8 flex justify-center">
            <PassCard pass={currentActivePass} onEndPass={handleEndPass} showEndButton />
          </div>
        )}

        {/* Overtime Pass Warning */}
        {currentOvertimePass && (
          <div className="mb-8 flex justify-center">
            <PassCard pass={currentOvertimePass} onEndPass={handleEndPass} showEndButton />
          </div>
        )}

        {/* Destination Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-8 border-2 border-purple-200 dark:border-purple-700">
          <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-6">Where do you need to go?</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {destinations.map(destination => (
              <button
                key={destination.id}
                onClick={() => handleDestinationClick(destination)}
                disabled={!!currentActivePass || !!currentOvertimePass}
                className={`p-6 rounded-xl border-2 transition-all ${
                  currentActivePass || currentOvertimePass
                    ? 'bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-50'
                    : 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 border-purple-300 dark:border-purple-600 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-lg hover:scale-105'
                }`}
              >
                <div className="text-4xl mb-3">{destination.icon}</div>
                <div className="font-semibold text-purple-900 dark:text-purple-100">{destination.name}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Pass History */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mt-8 border-2 border-purple-200 dark:border-purple-700">
          <h3 className="text-xl font-bold text-purple-900 dark:text-purple-100 mb-4">Recent Passes</h3>
          {activePasses.length === 0 ? (
            <p className="text-purple-600 dark:text-purple-300 text-center py-4">No recent passes</p>
          ) : (
            <div className="space-y-3">
              {activePasses.slice().reverse().map(pass => (
                <PassListItem key={pass.id} pass={pass} />
              ))}
            </div>
          )}
        </div>

        {/* Pass Creation Dialog */}
        <Dialog open={passDialogOpen} onOpenChange={setPassDialogOpen}>
          <DialogContent className="max-w-2xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-800 dark:to-gray-900 border-2 border-purple-300 dark:border-purple-700">
            <DialogHeader>
              <DialogTitle className="text-2xl text-purple-900 dark:text-purple-100">
                {selectedDestination?.icon} {selectedDestination?.name}
              </DialogTitle>
              <DialogDescription className="text-purple-600 dark:text-purple-300">
                {selectedDestination?.requiresLocation
                  ? 'Select a location for your pass'
                  : 'Create your hall pass'}
              </DialogDescription>
            </DialogHeader>

            {selectedDestination?.requiresLocation && selectedDestination.locations ? (
              <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
                {selectedDestination.locations.map(location => (
                  <button
                    key={location.id}
                    onClick={() => createPass(location.name)}
                    disabled={!location.available}
                    className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                      location.available
                        ? 'bg-white dark:bg-gray-700 border-purple-300 dark:border-purple-600 hover:border-purple-500 dark:hover:border-purple-400 hover:shadow-md'
                        : 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 cursor-not-allowed opacity-60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-purple-900 dark:text-purple-100">{location.name}</div>
                        <div className="text-sm text-purple-600 dark:text-purple-300">{location.floor}</div>
                      </div>
                      <div className="text-right">
                        {location.available ? (
                          <div className="text-emerald-600 dark:text-emerald-400 font-medium">
                            Available
                            <div className="text-xs text-purple-500 dark:text-purple-400">
                              {location.current}/{location.capacity} occupied
                            </div>
                          </div>
                        ) : (
                          <div className="text-red-600 dark:text-red-400 font-medium">
                            Full
                            <div className="text-xs text-purple-500 dark:text-purple-400">
                              {location.current}/{location.capacity} occupied
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="bg-white/70 dark:bg-gray-700/70 p-4 rounded-lg border-2 border-purple-200 dark:border-purple-600">
                  <p className="text-purple-700 dark:text-purple-200">
                    Click below to create a hall pass to {selectedDestination?.name}.
                  </p>
                </div>
                <Button
                  onClick={() => createPass()}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white border-2 border-purple-600 shadow-sm py-6 text-lg"
                >
                  Create Pass
                </Button>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}