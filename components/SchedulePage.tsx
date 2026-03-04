import { useState, useEffect } from 'react';
import { CalendarIcon, ChevronLeft, ChevronRight, Check, Search } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Input } from './ui/input';
import { getLetterDayForDate, getCalendarDayInfo, getHolidays, getPDDays, getSnowDays, getMidtermDays, getClassForDate } from '../utils/calendarUtils';

interface Assignment {
  id: string;
  type: 'test' | 'homework' | 'project';
  title: string;
  completed: boolean;
  className: string;
  periodIndex: number;
}

interface DaySchedule {
  day: string;
  date: string;
  fullDate: Date;
  letterDay: string;
  periods: Period[];
  assignments: Assignment[];
  isHoliday?: boolean;
  isPDDay?: boolean;
  isSnowDay?: boolean;
  isMidterm?: boolean;
  holidayName?: string;
}

interface Period {
  time: string;
  label: string;
  className?: string;
  hasFlexSignup?: boolean;
  isLunch?: boolean;
  isBaseCamp?: boolean;
}

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

export default function SchedulePage() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0);
  const [flexSignups, setFlexSignups] = useState<{ [key: string]: string }>({});
  const [flexSignupsByDate, setFlexSignupsByDate] = useState<{ [dateKey: string]: { [flexId: string]: number } }>({});
  const [weekSchedule, setWeekSchedule] = useState<DaySchedule[]>(getWeekSchedule(0));
  const [flexDialogOpen, setFlexDialogOpen] = useState(false);
  const [currentFlexDay, setCurrentFlexDay] = useState<string>('');
  const [currentFlexDate, setCurrentFlexDate] = useState<string>(''); // Add this to track the actual date
  const [currentFlexDateKey, setCurrentFlexDateKey] = useState<string>(''); // Store the full date-based key
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [flexOptions, setFlexOptions] = useState<FlexOption[]>([]);

  // Load completed assignments from localStorage
  const [completedAssignments, setCompletedAssignments] = useState<Set<string>>(new Set());

  useEffect(() => {
    const saved = localStorage.getItem('flowtrack-completed-assignments');
    if (saved) {
      try {
        setCompletedAssignments(new Set(JSON.parse(saved)));
      } catch (e) {
        console.error('Failed to load completed assignments', e);
      }
    }
  }, []);

  // Save completed assignments to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('flowtrack-completed-assignments', JSON.stringify(Array.from(completedAssignments)));
  }, [completedAssignments]);

  // Load flex blocks from localStorage (shared with teacher)
  useEffect(() => {
    const savedFlexOptions = localStorage.getItem('flowtrack-flex-options');
    if (savedFlexOptions) {
      try {
        const parsed = JSON.parse(savedFlexOptions);
        // Convert teacher flex format to student flex format
        const studentFlexOptions = parsed.map((flex: any) => ({
          id: flex.id,
          teacher: flex.teacher,
          room: flex.room,
          activity: flex.activity,
          tags: flex.tags,
          repeatDays: flex.repeatDays,
          repeatUntil: flex.repeatUntil,
          maxStudents: flex.maxStudents,
          currentStudents: flex.currentStudents
        }));
        setFlexOptions(studentFlexOptions);
      } catch (e) {
        console.error('Failed to load flex options', e);
        // Fall back to default flex options
        setFlexOptions([
          { id: '1', teacher: 'Joker', room: '204', activity: 'Movie - Classic Films', tags: 'movie, arts', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 20, currentStudents: 15 },
          { id: '2', teacher: 'Morgana', room: '105', activity: 'Quiet Study', tags: 'quiet study', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
          { id: '3', teacher: 'Ryuji', room: '302', activity: 'Puzzles - Logic Games', tags: 'puzzles', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 8 },
          { id: '4', teacher: 'Ann', room: '210', activity: 'Math Tutoring', tags: 'tutoring, math', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 12 },
          { id: '5', teacher: 'Yusuke', room: '115', activity: 'Art Studio', tags: 'art, creative', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 5 },
          { id: '6', teacher: 'Makoto', room: '308', activity: 'Board Games', tags: 'games, social', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
          { id: '7', teacher: 'Futaba', room: '221', activity: 'Puzzles - Jigsaw', tags: 'puzzles', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 7 },
          { id: '8', teacher: 'Haru', room: '412', activity: 'Movie - Documentary', tags: 'movie, arts', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
          { id: '9', teacher: 'Akechi', room: '118', activity: 'Creative Writing', tags: 'creative, quiet study', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 6 },
          { id: '10', teacher: 'Kasumi', room: '305', activity: 'Science Tutoring', tags: 'tutoring', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
          { id: '11', teacher: 'Sophia', room: '203', activity: 'Card Games', tags: 'games, social', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 5 },
          { id: '12', teacher: 'Zenkichi', room: '109', activity: 'Drawing & Sketching', tags: 'art, creative', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
          { id: '13', teacher: 'Igor', room: '415', activity: 'Coding Club', tags: 'tutoring, creative', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 8 },
          { id: '14', teacher: 'Lavenza', room: '228', activity: 'Sudoku & Logic Puzzles', tags: 'puzzles', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
          { id: '15', teacher: 'Sojiro', room: '112', activity: 'Music Appreciation', tags: 'arts, quiet study', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 5 },
        ]);
      }
    } else {
      // Default flex options if none in localStorage
      setFlexOptions([
        { id: '1', teacher: 'Joker', room: '204', activity: 'Movie - Classic Films', tags: 'movie, arts', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 20, currentStudents: 15 },
        { id: '2', teacher: 'Morgana', room: '105', activity: 'Quiet Study', tags: 'quiet study', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
        { id: '3', teacher: 'Ryuji', room: '302', activity: 'Puzzles - Logic Games', tags: 'puzzles', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 8 },
        { id: '4', teacher: 'Ann', room: '210', activity: 'Math Tutoring', tags: 'tutoring, math', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 12 },
        { id: '5', teacher: 'Yusuke', room: '115', activity: 'Art Studio', tags: 'art, creative', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 5 },
        { id: '6', teacher: 'Makoto', room: '308', activity: 'Board Games', tags: 'games, social', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
        { id: '7', teacher: 'Futaba', room: '221', activity: 'Puzzles - Jigsaw', tags: 'puzzles', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 7 },
        { id: '8', teacher: 'Haru', room: '412', activity: 'Movie - Documentary', tags: 'movie, arts', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
        { id: '9', teacher: 'Akechi', room: '118', activity: 'Creative Writing', tags: 'creative, quiet study', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 6 },
        { id: '10', teacher: 'Kasumi', room: '305', activity: 'Science Tutoring', tags: 'tutoring', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
        { id: '11', teacher: 'Sophia', room: '203', activity: 'Card Games', tags: 'games, social', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 5 },
        { id: '12', teacher: 'Zenkichi', room: '109', activity: 'Drawing & Sketching', tags: 'art, creative', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
        { id: '13', teacher: 'Igor', room: '415', activity: 'Coding Club', tags: 'tutoring, creative', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 8 },
        { id: '14', teacher: 'Lavenza', room: '228', activity: 'Sudoku & Logic Puzzles', tags: 'puzzles', repeatDays: ['Tue', 'Thu'], repeatUntil: '2026-06-30', maxStudents: 15, currentStudents: 10 },
        { id: '15', teacher: 'Sojiro', room: '112', activity: 'Music Appreciation', tags: 'arts, quiet study', repeatDays: ['Mon', 'Wed', 'Fri'], repeatUntil: '2026-06-30', maxStudents: 10, currentStudents: 5 },
      ]);
    }

    // Load saved flex signups from localStorage
    const savedFlexSignups = localStorage.getItem('flowtrack-student-flex-signups');
    if (savedFlexSignups) {
      try {
        setFlexSignups(JSON.parse(savedFlexSignups));
      } catch (e) {
        console.error('Failed to load flex signups', e);
      }
    }

    // Load saved flex signups by date from localStorage
    const savedFlexSignupsByDate = localStorage.getItem('flowtrack-student-flex-signups-by-date');
    if (savedFlexSignupsByDate) {
      try {
        setFlexSignupsByDate(JSON.parse(savedFlexSignupsByDate));
      } catch (e) {
        console.error('Failed to load flex signups by date', e);
      }
    }
  }, []);

  // Extract unique tags from flex options
  const allTags = Array.from(new Set(
    flexOptions.flatMap(option => 
      option.tags.split(',').map(tag => tag.trim().charAt(0).toUpperCase() + tag.trim().slice(1))
    )
  )).sort();

  const filteredFlexOptions = flexOptions.filter(option => {
    const matchesSearch = searchQuery === '' ||
      option.teacher.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.room.includes(searchQuery) ||
      option.activity.toLowerCase().includes(searchQuery.toLowerCase()) ||
      option.tags.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTag = selectedTag === '' ||
      option.tags.toLowerCase().includes(selectedTag.toLowerCase());
    
    // Check if current date is within the repeat range
    const isWithinDateRange = !option.repeatUntil || !currentFlexDate || currentFlexDate <= option.repeatUntil;
    
    // Check if this flex occurs on the current day of the week
    const matchesDay = !currentFlexDay || option.repeatDays.some(day => 
      day.toLowerCase().startsWith(currentFlexDay.toLowerCase().substring(0, 3))
    );
    
    return matchesSearch && matchesTag && isWithinDateRange && matchesDay;
  });

  function getWeekSchedule(weekOffset: number): DaySchedule[] {
    // Seeded random function for consistent assignment generation
    const seededRandom = (seed: number) => {
      const x = Math.sin(seed) * 10000;
      return x - Math.floor(x);
    };

    // Get calendar data from shared utilities
    const holidays = getHolidays();
    const pdDays = getPDDays();
    const snowDays = getSnowDays();
    const midtermDays = getMidtermDays();

    // Get student email to determine which schedule to use
    const userEmail = localStorage.getItem('flowtrack-user-email');
    
    // Diluc's schedule (stardewvalley@gmail.com)
    const dilucSchedule: { [key: string]: string[] } = {
      'A': [
        'AP Statistics-EEP',
        'AP Computer Science A',
        'Design & Development for IT-H',
        'Calculus-H',
        'English12-CP2'
      ],
      'B': [
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP',
        'AP Statistics-EEP',
        'AP Computer Science A',
        'Design & Development for IT-H'
      ],
      'C': [
        'Calculus-H',
        'English12-CP2',
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP',
        'AP Statistics-EEP'
      ],
      'D': [
        'AP Computer Science A',
        'Design & Development for IT-H',
        'Calculus-H',
        'English12-CP2',
        'West Civ: Ancient Civ-CP'
      ],
      'E': [
        'Holocaust Studies-CP',
        'AP Statistics-EEP',
        'AP Computer Science A',
        'Design & Development for IT-H',
        'Calculus-H'
      ],
      'F': [
        'English12-CP2',
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP',
        'AP Statistics-EEP',
        'AP Computer Science A'
      ],
      'G': [
        'Design & Development for IT-H',
        'Calculus-H',
        'English12-CP2',
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP'
      ],
    };

    // Diona's schedule (dionagenshinstudent@gmail.com) - Different classes
    const dionaSchedule: { [key: string]: string[] } = {
      'A': [
        'AP Biology',
        'French 3-H',
        'US History-H',
        'Algebra 2-H',
        'English11-H'
      ],
      'B': [
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP',
        'AP Biology',
        'French 3-H',
        'US History-H'
      ],
      'C': [
        'Algebra 2-H',
        'English11-H',
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP',
        'AP Biology'
      ],
      'D': [
        'French 3-H',
        'US History-H',
        'Algebra 2-H',
        'English11-H',
        'West Civ: Ancient Civ-CP'
      ],
      'E': [
        'Holocaust Studies-CP',
        'AP Biology',
        'French 3-H',
        'US History-H',
        'Algebra 2-H'
      ],
      'F': [
        'English11-H',
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP',
        'AP Biology',
        'French 3-H'
      ],
      'G': [
        'US History-H',
        'Algebra 2-H',
        'English11-H',
        'West Civ: Ancient Civ-CP',
        'Holocaust Studies-CP'
      ],
    };

    // Select the appropriate schedule based on user email
    const classSchedule = userEmail === 'stardewvalley@gmail.com' ? dilucSchedule : dionaSchedule;
    
    // Regular schedule times
    const regularPeriods = (letterDay: string, date: Date): Period[] => [
      { time: '7:15 - 8:15', label: '1st Period', className: getClassForDate(classSchedule[letterDay][0], date) },
      { time: '8:20 - 9:20', label: '2nd Period', className: getClassForDate(classSchedule[letterDay][1], date) },
      { time: '9:25 - 9:55', label: 'Flex', hasFlexSignup: true },
      { time: '10:00 - 11:00', label: '3rd Period', className: getClassForDate(classSchedule[letterDay][2], date) },
      { time: '11:05 - 12:40', label: '4th Period', className: getClassForDate(classSchedule[letterDay][3], date), isLunch: true },
      { time: '12:50 - 1:45', label: '5th Period', className: getClassForDate(classSchedule[letterDay][4], date) },
    ];

    // Wednesday schedule (shorter)
    const wednesdayPeriods = (letterDay: string, date: Date): Period[] => [
      { time: '7:15 - 8:05', label: '1st Period', className: getClassForDate(classSchedule[letterDay][0], date) },
      { time: '8:10 - 9:00', label: '2nd Period', className: getClassForDate(classSchedule[letterDay][1], date) },
      { time: '9:05 - 9:20', label: 'BASE CAMP - FLEX Block', isBaseCamp: true },
      { time: '9:25 - 10:15', label: '3rd Period', className: getClassForDate(classSchedule[letterDay][2], date) },
      { time: '10:20 - 11:55', label: '4th Period', className: getClassForDate(classSchedule[letterDay][3], date), isLunch: true },
      { time: '12:00 - 12:45', label: '5th Period', className: getClassForDate(classSchedule[letterDay][4], date) },
    ];

    // Empty periods for holidays
    const holidayPeriods = (): Period[] => [
      { time: '', label: '' },
      { time: '', label: '' },
      { time: '', label: '' },
      { time: '', label: '' },
      { time: '', label: '' },
      { time: '', label: '' },
    ];

    const baseDate = new Date();
    baseDate.setDate(baseDate.getDate() + (weekOffset * 7));
    
    // Find the Monday of the week
    const dayOfWeek = baseDate.getDay();
    const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(baseDate.setDate(diff));

    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return days.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const dayNum = date.getDate();
      const dateKey = `${year}-${month}-${dayNum}`;
      const dateStr = `${month}/${dayNum}`;
      
      const isHoliday = !!holidays[dateKey];
      const isPDDay = !!pdDays[dateKey];
      const isSnowDay = !!snowDays[dateKey];
      const isMidterm = !!midtermDays[dateKey];
      const holidayName = holidays[dateKey] || pdDays[dateKey] || snowDays[dateKey] || midtermDays[dateKey];
      
      // Use the shared utility function to get letter day
      const letterDay = getLetterDayForDate(date);
      
      // Generate periods
      const periods = isHoliday || isPDDay || isSnowDay || isMidterm
        ? holidayPeriods()
        : day === 'Wednesday' 
        ? wednesdayPeriods(letterDay, date) 
        : regularPeriods(letterDay, date);
      
      // Generate assignments only if it's a school day
      const assignments: Assignment[] = [];
      
      // Load completed assignments from localStorage (within function scope)
      const savedCompletedAssignments = localStorage.getItem('flowtrack-completed-assignments');
      const completedAssignmentsSet = savedCompletedAssignments 
        ? new Set(JSON.parse(savedCompletedAssignments)) 
        : new Set<string>();
      
      // Load teacher-created assignments from localStorage
      const teacherAssignments = localStorage.getItem('flowtrack-assignments');
      const assignmentDateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
      
      if (!isHoliday && !isPDDay && !isSnowDay && !isMidterm) {
        // Add teacher-created assignments for this date
        if (teacherAssignments) {
          try {
            const allTeacherAssignments = JSON.parse(teacherAssignments);
            allTeacherAssignments.forEach((assignment: any) => {
              if (assignment.date === assignmentDateStr) {
                // Find which period this class is in
                periods.forEach((period, pIndex) => {
                  // Match the assignment's className to the period's className
                  // Handle both exact matches and base class names (e.g., "AP Biology" matches "AP Biology")
                  const baseClassName = period.className?.split('-')[0].trim();
                  const assignmentBaseName = assignment.className?.split('-')[0].trim();
                  
                  if (period.className === assignment.className || baseClassName === assignmentBaseName) {
                    assignments.push({
                      id: assignment.id,
                      type: assignment.type,
                      title: assignment.title,
                      completed: completedAssignmentsSet.has(assignment.id),
                      className: assignment.className,
                      periodIndex: pIndex
                    });
                  }
                });
              }
            });
          } catch (e) {
            console.error('Failed to load teacher assignments', e);
          }
        }
        
        periods.forEach((period, pIndex) => {
          if (period.className) {
            // Random chance to add assignment for each class
            const random = seededRandom(year * 10000 + month * 1000 + dayNum * 100 + pIndex);
            if (random > 0.6) {
              if (period.className === 'AP Statistics-EEP') {
                assignments.push({ 
                  id: `${day}-${pIndex}-stats`, 
                  type: random > 0.8 ? 'test' : 'homework', 
                  title: 'Chapter 7 Problems', 
                  completed: false,
                  className: 'AP Statistics-EEP',
                  periodIndex: pIndex
                });
              } else if (period.className === 'Calculus-H') {
                assignments.push({ 
                  id: `${day}-${pIndex}-calc`, 
                  type: random > 0.85 ? 'test' : 'homework', 
                  title: 'Unit 3 Test', 
                  completed: false,
                  className: 'Calculus-H',
                  periodIndex: pIndex
                });
              } else if (period.className === 'English12-CP2') {
                assignments.push({ 
                  id: `${day}-${pIndex}-eng`, 
                  type: random > 0.7 ? 'project' : 'homework', 
                  title: 'Essay Draft Due', 
                  completed: false,
                  className: 'English12-CP2',
                  periodIndex: pIndex
                });
              } else if (period.className === 'AP Computer Science A') {
                assignments.push({ 
                  id: `${day}-${pIndex}-cs`, 
                  type: random > 0.75 ? 'project' : 'homework', 
                  title: 'Java Project', 
                  completed: false,
                  className: 'AP Computer Science A',
                  periodIndex: pIndex
                });
              } else if (period.className === 'Holocaust Studies-CP') {
                assignments.push({ 
                  id: `${day}-${pIndex}-holo`, 
                  type: 'homework', 
                  title: 'Reading Ch. 4', 
                  completed: false,
                  className: 'Holocaust Studies-CP',
                  periodIndex: pIndex
                });
              } else if (period.className === 'West Civ: Ancient Civ-CP') {
                assignments.push({ 
                  id: `${day}-${pIndex}-westciv`, 
                  type: random > 0.8 ? 'test' : 'homework', 
                  title: 'Ancient Greece Quiz', 
                  completed: false,
                  className: 'West Civ: Ancient Civ-CP',
                  periodIndex: pIndex
                });
              } else if (period.className === 'Design & Development for IT-H') {
                assignments.push({ 
                  id: `${day}-${pIndex}-design`, 
                  type: 'project', 
                  title: 'Website Design Project', 
                  completed: false,
                  className: 'Design & Development for IT-H',
                  periodIndex: pIndex
                });
              } else if (period.className === 'CAD') {
                assignments.push({ 
                  id: `${day}-${pIndex}-cad`, 
                  type: random > 0.75 ? 'project' : 'homework', 
                  title: 'Technical Drawing Assignment', 
                  completed: false,
                  className: 'CAD',
                  periodIndex: pIndex
                });
              } else if (period.className === 'Physical Education') {
                assignments.push({ 
                  id: `${day}-${pIndex}-pe`, 
                  type: 'homework', 
                  title: 'Fitness Log', 
                  completed: false,
                  className: 'Physical Education',
                  periodIndex: pIndex
                });
              } else if (period.className === 'AP Biology') {
                assignments.push({ 
                  id: `${day}-${pIndex}-bio`, 
                  type: random > 0.8 ? 'test' : 'homework', 
                  title: 'Cell Biology Lab Report', 
                  completed: false,
                  className: 'AP Biology',
                  periodIndex: pIndex
                });
              } else if (period.className === 'French 3-H') {
                assignments.push({ 
                  id: `${day}-${pIndex}-french`, 
                  type: random > 0.75 ? 'test' : 'homework', 
                  title: 'Conjugation Practice', 
                  completed: false,
                  className: 'French 3-H',
                  periodIndex: pIndex
                });
              } else if (period.className === 'US History-H') {
                assignments.push({ 
                  id: `${day}-${pIndex}-ushistory`, 
                  type: random > 0.8 ? 'project' : 'homework', 
                  title: 'Revolutionary War Essay', 
                  completed: false,
                  className: 'US History-H',
                  periodIndex: pIndex
                });
              } else if (period.className === 'Algebra 2-H') {
                assignments.push({ 
                  id: `${day}-${pIndex}-algebra`, 
                  type: random > 0.85 ? 'test' : 'homework', 
                  title: 'Quadratic Equations Worksheet', 
                  completed: false,
                  className: 'Algebra 2-H',
                  periodIndex: pIndex
                });
              } else if (period.className === 'English11-H') {
                assignments.push({ 
                  id: `${day}-${pIndex}-eng11`, 
                  type: random > 0.7 ? 'project' : 'homework', 
                  title: 'The Great Gatsby Analysis', 
                  completed: false,
                  className: 'English11-H',
                  periodIndex: pIndex
                });
              }
            }
          }
        });
      }
      
      return {
        day,
        date: dateStr,
        fullDate: new Date(date),
        letterDay,
        periods,
        assignments,
        isHoliday,
        isPDDay,
        isSnowDay,
        isMidterm,
        holidayName,
      };
    });
  }

  const toggleAssignmentComplete = (dayIndex: number, assignmentId: string) => {
    setCompletedAssignments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assignmentId)) {
        newSet.delete(assignmentId);
      } else {
        newSet.add(assignmentId);
      }
      return newSet;
    });
    
    // Also update the weekSchedule for immediate visual feedback
    setWeekSchedule(prev => {
      const newSchedule = [...prev];
      const assignments = newSchedule[dayIndex].assignments;
      const assignmentIndex = assignments.findIndex(a => a.id === assignmentId);
      if (assignmentIndex !== -1) {
        assignments[assignmentIndex] = {
          ...assignments[assignmentIndex],
          completed: !assignments[assignmentIndex].completed,
        };
      }
      return newSchedule;
    });
  };

  const handleFlexSignup = (dayKey: string) => {
    // Store the full date key for use in selectFlexOption
    setCurrentFlexDateKey(dayKey);
    
    // Extract date from dayKey (format: "2026-1-9-period-2")
    const parts = dayKey.split('-');
    if (parts.length >= 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      const isoDate = `${year}-${month}-${day}`;
      setCurrentFlexDate(isoDate);
      
      // Also find the day name
      const selectedDay = weekSchedule.find(d => 
        d.fullDate.getFullYear() === parseInt(year) &&
        d.fullDate.getMonth() + 1 === parseInt(parts[1]) &&
        d.fullDate.getDate() === parseInt(parts[2])
      );
      if (selectedDay) {
        setCurrentFlexDay(selectedDay.day);
      }
    }
    setFlexDialogOpen(true);
  };

  const selectFlexOption = (option: FlexOption) => {
    // Extract date from currentFlexDateKey
    const dateKey = currentFlexDateKey.split('-').slice(0, 3).join('-'); // e.g., "2026-1-9"
    const currentDateFlexSignups = flexSignupsByDate[dateKey] || {};
    
    // Check if flex is full for this specific date
    const currentStudentsForDate = currentDateFlexSignups[option.id] || 0;
    if (currentStudentsForDate >= option.maxStudents) {
      return; // Prevent signup if full
    }

    // Check if student is already signed up for this flex
    const currentSignup = flexSignups[currentFlexDateKey];
    const thisFlexString = `${option.teacher} – ${option.room} – ${option.activity}`;
    const isAlreadySignedUp = currentSignup === thisFlexString;
    
    if (isAlreadySignedUp) {
      // Student is already signed up for this flex, do nothing
      return;
    }

    // Update date-specific counters
    const updatedFlexSignupsByDate = { ...flexSignupsByDate };
    
    // If student is switching from a different flex, decrement the old flex's counter
    if (currentSignup) {
      // Find which flex option the student was signed up for
      const oldFlexOption = flexOptions.find(flex => {
        const flexString = `${flex.teacher} – ${flex.room} – ${flex.activity}`;
        return flexString === currentSignup;
      });
      
      if (oldFlexOption) {
        // Decrement old flex for this date
        if (!updatedFlexSignupsByDate[dateKey]) {
          updatedFlexSignupsByDate[dateKey] = {};
        }
        updatedFlexSignupsByDate[dateKey][oldFlexOption.id] = Math.max(
          0, 
          (updatedFlexSignupsByDate[dateKey][oldFlexOption.id] || 0) - 1
        );
      }
    }
    
    // Increment new flex for this date
    if (!updatedFlexSignupsByDate[dateKey]) {
      updatedFlexSignupsByDate[dateKey] = {};
    }
    updatedFlexSignupsByDate[dateKey][option.id] = 
      (updatedFlexSignupsByDate[dateKey][option.id] || 0) + 1;
    
    setFlexSignupsByDate(updatedFlexSignupsByDate);
    
    // Save to localStorage
    localStorage.setItem('flowtrack-student-flex-signups-by-date', JSON.stringify(updatedFlexSignupsByDate));

    // Update flex signups with date-based key
    const updatedSignups = { 
      ...flexSignups, 
      [currentFlexDateKey]: thisFlexString
    };
    
    setFlexSignups(updatedSignups);
    
    // Save to localStorage
    localStorage.setItem('flowtrack-student-flex-signups', JSON.stringify(updatedSignups));

    setFlexDialogOpen(false);
    setSearchQuery('');
    setSelectedTag('');
  };

  const changeWeek = (direction: number) => {
    const newOffset = currentWeekOffset + direction;
    setCurrentWeekOffset(newOffset);
    setWeekSchedule(getWeekSchedule(newOffset));
  };

  // Check if it's before 8:15 AM on the current day to allow flex signup
  const canSignupForFlex = (dayDate: string): { canSignup: boolean; daysUntilSignup: number; reason: string } => {
    const now = new Date();
    const [month, day] = dayDate.split('/').map(Number);
    const year = now.getFullYear();
    const targetDate = new Date(year, month - 1, day);
    targetDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if the target date is in the past
    if (targetDate < today) {
      return { canSignup: false, daysUntilSignup: 0, reason: 'past' };
    }
    
    // Check if it's the same day
    if (targetDate.getTime() === today.getTime()) {
      // Check if it's before 8:15 AM
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const beforeDeadline = currentHour < 8 || (currentHour === 8 && currentMinute < 15);
      return { 
        canSignup: beforeDeadline, 
        daysUntilSignup: 0, 
        reason: beforeDeadline ? 'today' : 'deadline-passed' 
      };
    }
    
    // For future dates, check if it's within 2 weeks (14 days)
    const maxAdvanceDays = 14; // 2 weeks
    const daysDifference = Math.floor((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDifference <= maxAdvanceDays) {
      return { canSignup: true, daysUntilSignup: 0, reason: 'available' };
    }
    
    // Too far in advance - calculate days until signup opens
    const daysUntilSignupOpens = daysDifference - maxAdvanceDays;
    return { 
      canSignup: false, 
      daysUntilSignup: daysUntilSignupOpens, 
      reason: 'too-far-advance' 
    };
  };

  // Get current month and year from first day of week
  const firstDay = weekSchedule[0];
  const monthYear = firstDay.fullDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 dark:from-slate-900 dark:via-indigo-950 dark:to-slate-900 p-2 sm:p-4 md:p-8 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-300 to-pink-300 dark:from-indigo-800/80 dark:to-purple-800/80 dark:backdrop-blur-sm text-purple-900 dark:text-purple-100 p-3 sm:p-4 md:p-6 rounded-t-lg flex flex-col sm:flex-row items-center justify-between shadow-md dark:shadow-purple-900/50 gap-3">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap justify-center sm:justify-start">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-purple-500 to-pink-500 dark:from-purple-500 dark:to-pink-500 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-lg sm:text-xl">F</span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold">FlowTrack</h1>
            <CalendarIcon className="w-8 h-8 sm:w-10 sm:h-10 text-purple-900 dark:text-purple-200" />
            <span className="text-base sm:text-xl md:text-2xl text-center sm:text-left">Calendar - {monthYear}</span>
          </div>
          <div className="flex items-center gap-2">
            {currentWeekOffset !== 0 && (
              <Button
                onClick={() => {
                  setCurrentWeekOffset(0);
                  setWeekSchedule(getWeekSchedule(0));
                }}
                className="bg-purple-500 hover:bg-purple-600 dark:bg-purple-600 dark:hover:bg-purple-500 text-white border-2 border-purple-600 dark:border-purple-500 shadow-sm text-sm sm:text-base"
                size="sm"
              >
                Today
              </Button>
            )}
            <Button
              onClick={() => changeWeek(-1)}
              variant="ghost"
              size="icon"
              className="text-purple-900 dark:text-purple-200 hover:bg-purple-200/50 dark:hover:bg-purple-700/30 rounded-full h-8 w-8 sm:h-10 sm:w-10"
            >
              <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <Button
              onClick={() => changeWeek(1)}
              variant="ghost"
              size="icon"
              className="text-purple-900 dark:text-purple-200 hover:bg-purple-200/50 dark:hover:bg-purple-700/30 rounded-full h-8 w-8 sm:h-10 sm:w-10"
            >
              <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid - Horizontal scroll on mobile */}
        <div className="bg-white dark:bg-slate-800/50 dark:backdrop-blur-sm rounded-b-lg shadow-lg dark:shadow-purple-900/30 overflow-x-auto border-2 border-purple-200 dark:border-indigo-700/50">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-6 border-b border-purple-200 dark:border-indigo-700/50">
              <div className="p-2 sm:p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-indigo-900/60 dark:to-purple-900/60 border-r border-purple-200 dark:border-indigo-700/50">
                <div className="font-semibold text-purple-900 dark:text-purple-200 text-xs sm:text-base">Periods</div>
              </div>
              {weekSchedule.map((dayData, index) => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const isToday = dayData.fullDate.getTime() === today.getTime();
                
                const headerBg = dayData.isHoliday 
                  ? 'bg-red-100 dark:bg-red-900/30' 
                  : dayData.isPDDay 
                  ? 'bg-orange-100 dark:bg-orange-900/30'
                  : dayData.isSnowDay
                  ? 'bg-blue-100 dark:bg-blue-900/30'
                  : dayData.isMidterm
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : isToday
                  ? 'bg-gradient-to-br from-yellow-300 to-yellow-200 dark:from-yellow-500/40 dark:to-amber-500/40 border-2 border-yellow-500 dark:border-yellow-500/70 dark:shadow-lg dark:shadow-yellow-500/20'
                  : 'bg-gradient-to-br from-purple-100 to-pink-100 dark:from-indigo-900/60 dark:to-purple-900/60';
                
                return (
                  <div key={index} className={`p-2 sm:p-4 ${headerBg} border-r last:border-r-0 border-purple-200 dark:border-indigo-700/50`}>
                    <div className="font-semibold text-purple-900 dark:text-purple-200 text-xs sm:text-base">{dayData.day}</div>
                    <div className="text-xs sm:text-sm text-purple-700 dark:text-purple-300">{dayData.date}</div>
                    {dayData.isHoliday || dayData.isPDDay || dayData.isSnowDay || dayData.isMidterm ? (
                      <div className={`text-xs mt-1 ${dayData.isMidterm ? 'text-amber-700 dark:text-amber-300' : 'text-red-600 dark:text-red-300'}`}>
                        {dayData.isMidterm ? '(MIDTERMS)' : '(NO SCHOOL)'}
                      </div>
                    ) : (
                      <div className="text-xs text-purple-600 dark:text-purple-300 mt-1">Day {dayData.letterDay}</div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Period Rows */}
            {[0, 1, 2, 3, 4, 5].map((periodIndex) => {
              // Always use Monday's schedule for the left column labels
              const mondaySchedule = weekSchedule[0];
              // Use regular periods for reference (not affected by holidays)
              const regularTimesForLabel = periodIndex === 2 
                ? '9:25 - 9:55'
                : periodIndex === 0 
                ? '7:15 - 8:15'
                : periodIndex === 1
                ? '8:20 - 9:20'
                : periodIndex === 3
                ? '10:00 - 11:00'
                : periodIndex === 4
                ? '11:05 - 12:40'
                : '12:50 - 1:45';
              
              const regularLabelForPeriod = periodIndex === 2
                ? 'Flex'
                : periodIndex === 0
                ? '1st Period'
                : periodIndex === 1
                ? '2nd Period'
                : periodIndex === 3
                ? '3rd Period'
                : periodIndex === 4
                ? '4th Period'
                : '5th Period';
              
              const wednesdayTimesForLabel = periodIndex === 2
                ? '9:05 - 9:20'
                : periodIndex === 0
                ? '7:15 - 8:05'
                : periodIndex === 1
                ? '8:10 - 9:00'
                : periodIndex === 3
                ? '9:25 - 10:15'
                : periodIndex === 4
                ? '10:20 - 11:55'
                : '12:00 - 12:45';
              
              return (
                <div key={periodIndex} className="grid grid-cols-6 border-b last:border-b-0">
                  {/* Left column - Period label */}
                  <div className="p-4 border-r bg-gray-50 dark:bg-slate-800/70 dark:border-indigo-700/50">
                    <div className="text-sm text-gray-600 dark:text-slate-300">
                      {regularTimesForLabel}
                    </div>
                    <div className="font-bold mt-1 dark:text-slate-200">
                      {regularLabelForPeriod}
                    </div>
                    {/* Wednesday times in grey */}
                    <div className="text-xs text-gray-400 dark:text-slate-400 mt-2">
                      Wednesday {wednesdayTimesForLabel}
                    </div>
                  </div>

                  {/* Day columns */}
                  {weekSchedule.map((dayData, dayIndex) => {
                    const period = dayData.periods[periodIndex];
                    // Use DATE instead of day name for the key
                    const year = dayData.fullDate.getFullYear();
                    const month = dayData.fullDate.getMonth() + 1;
                    const day = dayData.fullDate.getDate();
                    const dateBasedKey = `${year}-${month}-${day}-period-${periodIndex}`;
                    const flexSelection = flexSignups[dateBasedKey];
                    const canSignup = canSignupForFlex(dayData.date);
                    
                    // Get assignments for this specific period
                    const periodAssignments = dayData.assignments.filter(
                      assignment => assignment.periodIndex === periodIndex
                    );

                    // Check if this is today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const isToday = dayData.fullDate.getTime() === today.getTime();

                    // Cell background color
                    const cellBg = dayData.isHoliday
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : dayData.isPDDay
                      ? 'bg-orange-50 dark:bg-orange-950/20'
                      : dayData.isSnowDay
                      ? 'bg-blue-50 dark:bg-blue-950/20'
                      : dayData.isMidterm
                      ? 'bg-amber-50 dark:bg-amber-950/20'
                      : isToday
                      ? 'bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-500/20 dark:to-amber-500/20 border-l-4 border-l-yellow-400 dark:border-l-yellow-500/80'
                      : 'bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-800/30 dark:to-indigo-900/20';

                    return (
                      <div key={dayIndex} className={`p-4 border-r last:border-r-0 border-purple-200 dark:border-indigo-700/50 min-h-[120px] ${cellBg}`}>
                        {/* Show holiday/PD day/snow day/midterm name if applicable */}
                        {(dayData.isHoliday || dayData.isPDDay || dayData.isSnowDay || dayData.isMidterm) && periodIndex === 0 && (
                          <div className={`text-sm font-medium text-center italic ${
                            dayData.isSnowDay ? 'text-blue-700 dark:text-blue-400' 
                            : dayData.isMidterm ? 'text-amber-700 dark:text-amber-400'
                            : 'text-red-700 dark:text-red-400'
                          }`}>
                            {dayData.holidayName}
                          </div>
                        )}
                        
                        {period.className && (
                          <div className="font-medium mb-2 text-purple-900 dark:text-purple-200">{period.className}</div>
                        )}
                        
                        {period.hasFlexSignup && (
                          <div className="flex flex-col gap-2">
                            {flexSelection && (
                              <div className="text-sm text-emerald-700 dark:text-emerald-900 font-medium bg-emerald-100 dark:bg-emerald-400 p-2 rounded border-2 border-emerald-400 dark:border-emerald-500">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className="text-emerald-800 dark:text-emerald-950 font-bold text-xs">✓ YOU'RE SIGNED UP</span>
                                </div>
                                <div>{flexSelection}</div>
                              </div>
                            )}
                            {canSignup.canSignup ? (
                              <Button
                                onClick={() => handleFlexSignup(dateBasedKey)}
                                size="sm"
                                className="bg-emerald-200 hover:bg-emerald-300 dark:bg-emerald-500 dark:hover:bg-emerald-400 text-emerald-900 dark:text-black border-2 border-emerald-400 dark:border-emerald-600 shadow-sm"
                              >
                                {flexSelection ? 'Switch' : 'Sign Up'}
                              </Button>
                            ) : canSignup.reason === 'too-far-advance' ? (
                              <div className="text-xs text-orange-700 dark:text-orange-900 bg-orange-100 dark:bg-orange-400 p-2 rounded border-2 border-orange-300 dark:border-orange-500">
                                <div className="font-bold">Signup opens in {canSignup.daysUntilSignup} day{canSignup.daysUntilSignup !== 1 ? 's' : ''}</div>
                                <div>(14-day advance limit)</div>
                              </div>
                            ) : null}
                          </div>
                        )}

                        {period.isBaseCamp && (
                          <div className="font-medium text-purple-700 dark:text-purple-300">BASE CAMP - FLEX Block</div>
                        )}

                        {period.isLunch && (
                          <div className="text-xs text-purple-500 dark:text-purple-400 mt-2">
                            (Lunch Period)
                          </div>
                        )}

                        {/* Assignments for this period */}
                        {periodAssignments.length > 0 && (
                          <div className="mt-2 space-y-2">
                            {periodAssignments.map(assignment => {
                              // Check if assignment is completed from localStorage
                              const isCompleted = completedAssignments.has(assignment.id);
                              return (
                              <div
                                key={assignment.id}
                                className={`p-3 rounded-lg relative shadow-sm ${
                                  isCompleted
                                    ? 'bg-emerald-100 dark:bg-emerald-400 border-2 border-emerald-300 dark:border-emerald-500'
                                    : (assignment.type === 'test' || assignment.type === 'project')
                                    ? 'bg-yellow-100 dark:bg-yellow-400 border-2 border-yellow-300 dark:border-yellow-500'
                                    : 'bg-blue-100 dark:bg-blue-400 border-2 border-blue-300 dark:border-blue-500'
                                }`}
                              >
                                <div className="text-sm pr-8 font-medium text-gray-900 dark:text-black">{assignment.title}</div>
                                <button
                                  onClick={() => toggleAssignmentComplete(dayIndex, assignment.id)}
                                  className={`absolute bottom-2 right-2 w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                    isCompleted
                                      ? 'bg-emerald-500 dark:bg-emerald-700 text-white shadow-sm'
                                      : 'bg-white dark:bg-slate-200 border-2 border-purple-300 dark:border-purple-500 hover:border-purple-500 dark:hover:border-purple-400 hover:scale-110'
                                  }`}
                                >
                                  {isCompleted && <Check className="w-4 h-4" />}
                                </button>
                              </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        {/* Lunch Information Section */}
        <div className="mt-6 bg-gradient-to-br from-pink-50 to-purple-50 dark:from-slate-800/50 dark:to-indigo-900/50 dark:backdrop-blur-sm rounded-lg shadow-lg dark:shadow-purple-900/30 p-6 border-2 border-purple-200 dark:border-indigo-700/50">
          <h2 className="text-xl font-bold mb-4 text-purple-900 dark:text-purple-200">4th Period Lunch Schedule</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white/70 dark:bg-slate-700/40 dark:backdrop-blur-sm p-4 rounded-lg border border-purple-100 dark:border-indigo-700/30">
              <h3 className="font-semibold mb-2 text-purple-800 dark:text-purple-300">Regular Schedule (Mon, Tue, Thu, Fri):</h3>
              <div className="space-y-1 text-sm dark:text-slate-200">
                <div><span className="font-medium text-purple-700 dark:text-purple-300">1st Lunch:</span> 11:05 - 11:25</div>
                <div><span className="font-medium text-purple-700 dark:text-purple-300">2nd Lunch:</span> 11:30 - 11:50</div>
                <div><span className="font-medium text-purple-700 dark:text-purple-300">3rd Lunch:</span> 11:55 - 12:15</div>
                <div><span className="font-medium text-purple-700 dark:text-purple-300">4th Lunch:</span> 12:20 - 12:40</div>
              </div>
            </div>

            <div className="bg-white/70 dark:bg-slate-700/40 dark:backdrop-blur-sm p-4 rounded-lg border border-purple-100 dark:border-indigo-700/30">
              <h3 className="font-semibold mb-2 text-purple-800 dark:text-purple-300">Wednesday Schedule:</h3>
              <div className="space-y-1 text-sm dark:text-slate-200">
                <div><span className="font-medium text-purple-700 dark:text-purple-300">1st Lunch:</span> 10:20 - 10:40</div>
                <div><span className="font-medium text-purple-700 dark:text-purple-300">2nd Lunch:</span> 10:45 - 11:05</div>
                <div><span className="font-medium text-purple-700 dark:text-purple-300">3rd Lunch:</span> 11:10 - 11:30</div>
                <div><span className="font-medium text-purple-700 dark:text-purple-300">4th Lunch:</span> 11:35 - 11:55</div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-2 text-sm bg-white/70 dark:bg-slate-700/40 dark:backdrop-blur-sm p-4 rounded-lg border border-purple-100 dark:border-indigo-700/30 dark:text-slate-200">
            <div><span className="font-medium text-purple-700 dark:text-purple-300">1st Lunch:</span> Science, Tech, LITE & TRADE</div>
            <div><span className="font-medium text-purple-700 dark:text-purple-300">2nd Lunch:</span> English & World Language</div>
            <div><span className="font-medium text-purple-700 dark:text-purple-300">3rd Lunch:</span> Business, Social Studies & Sp. Ed</div>
            <div><span className="font-medium text-purple-700 dark:text-purple-300">4th Lunch:</span> Fine Arts, Math & PE</div>
          </div>
        </div>

        {/* Completed Assignments Section */}
        {completedAssignments.size > 0 && (
          <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 dark:backdrop-blur-sm rounded-lg shadow-lg dark:shadow-emerald-900/20 p-6 border-2 border-emerald-200 dark:border-emerald-700/50">
            <h2 className="text-xl font-bold mb-4 text-emerald-900 dark:text-emerald-300 flex items-center gap-2">
              <Check className="w-6 h-6" />
              Completed Assignments
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Array.from(completedAssignments).map(assignmentId => {
                // Find the assignment in the weekSchedule
                let foundAssignment: Assignment | null = null;
                let foundDay: string | null = null;
                
                for (const dayData of weekSchedule) {
                  const assignment = dayData.assignments.find(a => a.id === assignmentId);
                  if (assignment) {
                    foundAssignment = assignment;
                    foundDay = `${dayData.day}, ${dayData.date}`;
                    break;
                  }
                }
                
                if (!foundAssignment) return null;
                
                return (
                  <div
                    key={assignmentId}
                    className="bg-white/70 dark:bg-slate-700/40 dark:backdrop-blur-sm p-3 rounded-lg border-2 border-emerald-300 dark:border-emerald-600/50 shadow-sm"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-sm font-bold text-emerald-900 dark:text-emerald-300">{foundAssignment.title}</div>
                        <div className="text-xs text-emerald-700 dark:text-emerald-400 mt-1">{foundAssignment.className}</div>
                        <div className="text-xs text-emerald-600 dark:text-emerald-500 mt-1">{foundDay}</div>
                      </div>
                      <div className="w-5 h-5 rounded-full bg-emerald-500 dark:bg-emerald-600 flex items-center justify-center flex-shrink-0 ml-2">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Flex Block Signup Dialog */}
        <Dialog open={flexDialogOpen} onOpenChange={setFlexDialogOpen}>
          <DialogContent className="max-w-3xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-slate-800/95 dark:to-indigo-900/95 dark:backdrop-blur-md border-2 border-purple-300 dark:border-indigo-600/50">
            <DialogHeader>
              <DialogTitle className="text-2xl text-purple-900 dark:text-purple-200">
                {(() => {
                  // Extract date from currentFlexDateKey (format: "2026-1-9-period-2")
                  const parts = currentFlexDateKey.split('-');
                  if (parts.length >= 3) {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]);
                    const day = parseInt(parts[2]);
                    const selectedDay = weekSchedule.find(d => 
                      d.fullDate.getFullYear() === year &&
                      d.fullDate.getMonth() + 1 === month &&
                      d.fullDate.getDate() === day
                    );
                    if (selectedDay) {
                      return `${selectedDay.day}, ${selectedDay.date} – 9:25 to 9:55 AM`;
                    }
                  }
                  return '';
                })()}
              </DialogTitle>
              <DialogDescription className="text-red-500 font-medium">
                {(() => {
                  // Extract date from currentFlexDateKey (format: "2026-1-9-period-2")
                  const parts = currentFlexDateKey.split('-');
                  if (parts.length >= 3) {
                    const year = parseInt(parts[0]);
                    const month = parseInt(parts[1]);
                    const day = parseInt(parts[2]);
                    const selectedDay = weekSchedule.find(d => 
                      d.fullDate.getFullYear() === year &&
                      d.fullDate.getMonth() + 1 === month &&
                      d.fullDate.getDate() === day
                    );
                    if (selectedDay) {
                      return `Sign up by ${selectedDay.day}, ${selectedDay.date} – 8:15 AM`;
                    }
                  }
                  return '';
                })()}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-purple-400" />
              <Input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-purple-300 focus:border-purple-500"
              />
            </div>
            
            {/* Tag Filter Buttons */}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={selectedTag === '' ? 'default' : 'outline'}
                onClick={() => setSelectedTag('')}
                className={selectedTag === '' ? 'bg-purple-300 hover:bg-purple-400 text-purple-900 border-purple-400 dark:bg-purple-600 dark:hover:bg-purple-500 dark:text-purple-100 dark:border-purple-500' : 'border-purple-300 dark:border-indigo-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-800/50'}
              >
                All
              </Button>
              {allTags.map(tag => (
                <Button
                  key={tag}
                  size="sm"
                  variant={selectedTag === tag ? 'default' : 'outline'}
                  onClick={() => setSelectedTag(tag)}
                  className={selectedTag === tag ? 'bg-purple-300 hover:bg-purple-400 text-purple-900 border-purple-400 dark:bg-purple-600 dark:hover:bg-purple-500 dark:text-purple-100 dark:border-purple-500' : 'border-purple-300 dark:border-indigo-600 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-indigo-800/50'}
                >
                  {tag}
                </Button>
              ))}
            </div>
            
            <div className="mt-4 max-h-96 overflow-y-auto space-y-3">
              {filteredFlexOptions.map(option => {
                // Capitalize tags for display
                const capitalizedTags = option.tags.split(',').map(tag => 
                  tag.trim().charAt(0).toUpperCase() + tag.trim().slice(1)
                ).join(', ');
                
                // Extract date from currentFlexDateKey to get date-specific signup count
                const dateKey = currentFlexDateKey.split('-').slice(0, 3).join('-');
                const currentDateFlexSignups = flexSignupsByDate[dateKey] || {};
                const currentStudentsForDate = currentDateFlexSignups[option.id] || 0;
                const isFull = currentStudentsForDate >= option.maxStudents;
                
                // Check if student is already signed up for this flex
                const currentSignup = flexSignups[currentFlexDateKey];
                const thisFlexString = `${option.teacher} – ${option.room} – ${option.activity}`;
                const isAlreadySignedUp = currentSignup === thisFlexString;
                
                return (
                  <div
                    key={option.id}
                    className={`p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                      isAlreadySignedUp
                        ? 'bg-emerald-100 dark:bg-emerald-900/30 dark:backdrop-blur-sm border-emerald-500 dark:border-emerald-600/60' 
                        : isFull 
                        ? 'bg-gray-100 dark:bg-slate-700/40 border-gray-300 dark:border-slate-600/50 opacity-60' 
                        : 'bg-white/80 dark:bg-slate-700/40 dark:backdrop-blur-sm border-purple-200 dark:border-indigo-600/50 hover:bg-white/50 dark:hover:bg-slate-600/50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className={`font-semibold ${
                        isAlreadySignedUp 
                          ? 'text-emerald-900 dark:text-emerald-100' 
                          : isFull ? 'text-gray-600 dark:text-gray-400' : 'text-purple-900 dark:text-purple-100'
                      }`}>
                        {option.teacher} – {option.room} – {option.activity}
                      </div>
                      <div className={`text-sm mt-1 ${
                        isAlreadySignedUp 
                          ? 'text-emerald-700 dark:text-emerald-300' 
                          : isFull ? 'text-gray-500 dark:text-gray-400' : 'text-purple-600 dark:text-purple-300'
                      }`}>
                        {capitalizedTags}
                      </div>
                      <div className={`text-xs mt-2 font-medium ${
                        isAlreadySignedUp
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : isFull ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}>
                        {isAlreadySignedUp ? (
                          <span className="text-emerald-800 dark:text-emerald-200 font-bold">✓ YOU'RE SIGNED UP</span>
                        ) : (
                          <>
                            {currentStudentsForDate} / {option.maxStudents} students signed up
                            {isFull && ' - FULL'}
                          </>
                        )}
                      </div>
                    </div>
                    <Button
                      onClick={() => selectFlexOption(option)}
                      disabled={isFull || isAlreadySignedUp}
                      className={`ml-4 ${
                        isAlreadySignedUp
                          ? 'bg-emerald-500 dark:bg-emerald-600 text-white cursor-not-allowed border-2 border-emerald-600 dark:border-emerald-700'
                          : isFull 
                          ? 'bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-300 cursor-not-allowed' 
                          : 'bg-emerald-200 dark:bg-emerald-700 hover:bg-emerald-300 dark:hover:bg-emerald-600 text-emerald-900 dark:text-emerald-100 border-2 border-emerald-400 dark:border-emerald-600 shadow-sm'
                      }`}
                    >
                      {isAlreadySignedUp ? 'Signed Up' : isFull ? 'FULL' : 'Sign Up'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
