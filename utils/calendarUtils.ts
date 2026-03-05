// Shared calendar utility functions for FlowTrack

export interface CalendarDay {
  date: Date;
  letterDay: string;
  isWeekend: boolean;
  isHoliday: boolean;
  isSnowDay: boolean;
  isPDDay: boolean;
  isMidterm: boolean;
  holidayName?: string;
}

// Get holidays from localStorage or use defaults
export const getHolidays = (): { [key: string]: string } => {
  const saved = localStorage.getItem('flowtrack-holidays');
  if (saved) {
    return JSON.parse(saved);
  }
  
  const defaultHolidays: { [key: string]: string } = {
    '2024-10-14': 'Columbus Day',
    '2024-11-11': 'Veterans Day',
    '2024-11-27': 'Thanksgiving',
    '2024-11-28': 'Thanksgiving',
    '2024-12-24': 'Holiday Recess',
    '2024-12-25': 'Holiday Recess',
    '2024-12-26': 'Holiday Recess',
    '2024-12-27': 'Holiday Recess',
    '2024-12-30': 'Holiday Recess',
    '2024-12-31': 'Holiday Recess',
    '2025-1-1': 'Holiday Recess',
    '2025-1-2': 'Holiday Recess',
    '2025-1-19': 'MLK Day',
    '2025-2-16': 'Winter Recess',
    '2025-2-17': 'Winter Recess',
    '2025-2-18': 'Winter Recess',
    '2025-2-19': 'Winter Recess',
    '2025-2-20': 'Winter Recess',
    '2025-4-3': 'Good Friday',
    '2025-4-20': 'Spring Recess',
    '2025-4-21': 'Spring Recess',
    '2025-4-22': 'Spring Recess',
    '2025-4-23': 'Spring Recess',
    '2025-4-24': 'Spring Recess',
    '2025-5-25': 'Memorial Day',
    '2025-6-19': 'Juneteenth',
    '2025-10-13': 'Columbus Day',
    '2025-11-11': 'Veterans Day',
    '2025-11-27': 'Thanksgiving',
    '2025-11-28': 'Thanksgiving',
    '2025-12-24': 'Holiday Recess',
    '2025-12-25': 'Holiday Recess',
    '2025-12-26': 'Holiday Recess',
    '2025-12-29': 'Holiday Recess',
    '2025-12-30': 'Holiday Recess',
    '2025-12-31': 'Holiday Recess',
    '2026-1-1': 'Holiday Recess',
    '2026-1-2': 'Holiday Recess',
    '2026-1-19': 'MLK Day',
    '2026-2-16': 'Winter Recess',
    '2026-2-17': 'Winter Recess',
    '2026-2-18': 'Winter Recess',
    '2026-2-19': 'Winter Recess',
    '2026-2-20': 'Winter Recess',
    '2026-4-3': 'Good Friday',
    '2026-4-20': 'Spring Recess',
    '2026-4-21': 'Spring Recess',
    '2026-4-22': 'Spring Recess',
    '2026-4-23': 'Spring Recess',
    '2026-4-24': 'Spring Recess',
    '2026-5-25': 'Memorial Day',
    '2026-6-18': 'Last Day of School',
    '2026-6-19': 'Juneteenth',
  };
  
  return defaultHolidays;
};

// Get PD days from localStorage or use defaults
export const getPDDays = (): { [key: string]: string } => {
  const saved = localStorage.getItem('flowtrack-pd-days');
  if (saved) {
    return JSON.parse(saved);
  }
  
  const defaultPDDays: { [key: string]: string } = {
    '2024-11-10': 'PD Day',
    '2024-11-19': 'Conferences',
    '2025-1-20': 'PD Day',
    '2025-11-10': 'PD Day',
    '2025-11-19': 'Conferences',
    '2026-1-20': 'PD Day',
  };
  
  return defaultPDDays;
};

// Get snow days from localStorage
export const getSnowDays = (): { [key: string]: string } => {
  const saved = localStorage.getItem('flowtrack-snow-days');
  if (saved) {
    return JSON.parse(saved);
  }
  return {};
};

// Save snow days to localStorage
export const saveSnowDays = (snowDays: { [key: string]: string }) => {
  localStorage.setItem('flowtrack-snow-days', JSON.stringify(snowDays));
};

// Add a snow day
export const addSnowDay = (date: Date, name: string = 'Snow Day') => {
  const snowDays = getSnowDays();
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  snowDays[dateKey] = name;
  saveSnowDays(snowDays);
};

// Remove a snow day
export const removeSnowDay = (date: Date) => {
  const snowDays = getSnowDays();
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  delete snowDays[dateKey];
  saveSnowDays(snowDays);
};

// Get midterm days from localStorage
export const getMidtermDays = (): { [key: string]: string } => {
  const saved = localStorage.getItem('flowtrack-midterm-days');
  if (saved) {
    return JSON.parse(saved);
  }
  // Default midterm days for January 2026
  return {
    '2026-1-22': 'Midterm Exams Day 1',
    '2026-1-23': 'Midterm Exams Day 2',
    '2026-1-28': 'Midterm Exams Day 3',
    '2026-1-29': 'Midterm Exams Day 4',
  };
};

// Save midterm days to localStorage
export const saveMidtermDays = (midtermDays: { [key: string]: string }) => {
  localStorage.setItem('flowtrack-midterm-days', JSON.stringify(midtermDays));
};

// Add a midterm day
export const addMidtermDay = (date: Date, name: string = 'Midterm Exams') => {
  const midtermDays = getMidtermDays();
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  midtermDays[dateKey] = name;
  saveMidtermDays(midtermDays);
};

// Remove a midterm day
export const removeMidtermDay = (date: Date) => {
  const midtermDays = getMidtermDays();
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  delete midtermDays[dateKey];
  saveMidtermDays(midtermDays);
};

// Get the letter day that resumes after midterms
export const getMidtermResumptionLetterDay = (): { [key: string]: string } => {
  const saved = localStorage.getItem('flowtrack-midterm-resumption');
  if (saved) {
    return JSON.parse(saved);
  }
  // Default: after January 2026 midterms, resume with Day C on 1/30/2026
  return {
    '2026-1-30': 'C'
  };
};

// Save midterm resumption letter day
export const saveMidtermResumptionLetterDay = (dateKey: string, letterDay: string) => {
  const resumption = getMidtermResumptionLetterDay();
  resumption[dateKey] = letterDay;
  localStorage.setItem('flowtrack-midterm-resumption', JSON.stringify(resumption));
};

// Calculate letter day for any given date
export const getLetterDayForDate = (date: Date): string => {
  const holidays = getHolidays();
  const pdDays = getPDDays();
  const snowDays = getSnowDays();
  const midtermDays = getMidtermDays();
  const midtermResumption = getMidtermResumptionLetterDay();

  const letterDays = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  
  const currentDate = new Date(date);
  currentDate.setHours(0, 0, 0, 0);
  
  const todayKey = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;
  
  // Check if today is exactly a resumption date - if so, return that letter day immediately
  if (midtermResumption[todayKey]) {
    const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
    const isHoliday = holidays[todayKey] || pdDays[todayKey] || snowDays[todayKey] || midtermDays[todayKey];
    
    if (isWeekend || isHoliday) {
      return '';
    }
    
    return midtermResumption[todayKey];
  }

  // Check if we have a resumption date that applies (most recent one before today)
  let mostRecentResumptionDate: Date | null = null;
  let mostRecentResumptionLetterDay: string | null = null;

  Object.entries(midtermResumption).forEach(([dateKey, letterDay]) => {
    const [year, month, day] = dateKey.split('-').map(Number);
    const resumptionDate = new Date(year, month - 1, day);
    resumptionDate.setHours(0, 0, 0, 0);

    if (resumptionDate < currentDate) {
      if (!mostRecentResumptionDate || resumptionDate > mostRecentResumptionDate) {
        mostRecentResumptionDate = resumptionDate;
        mostRecentResumptionLetterDay = letterDay;
      }
    }
  });

  // Determine our starting reference point
  let referenceDate: Date;
  let currentLetterIndex: number;

  if (mostRecentResumptionDate && mostRecentResumptionLetterDay) {
    // Start from the resumption date
    referenceDate = mostRecentResumptionDate;
    currentLetterIndex = letterDays.indexOf(mostRecentResumptionLetterDay);
  } else {
    // Use the default reference date
    referenceDate = new Date(2026, 0, 12); // Monday, January 12, 2026 (Day C)
    referenceDate.setHours(0, 0, 0, 0);
    currentLetterIndex = 2; // Starting at C
  }

  if (currentDate >= referenceDate) {
    let tempDate = new Date(referenceDate);
    while (tempDate < currentDate) {
      const dateKey = `${tempDate.getFullYear()}-${tempDate.getMonth() + 1}-${tempDate.getDate()}`;
      const isWeekday = tempDate.getDay() >= 1 && tempDate.getDay() <= 5;
      const isHoliday = holidays[dateKey] || pdDays[dateKey] || snowDays[dateKey] || midtermDays[dateKey];

      if (isWeekday && !isHoliday) {
        currentLetterIndex = (currentLetterIndex + 1) % 7;
      }

      tempDate.setDate(tempDate.getDate() + 1);
    }
  } else {
    let tempDate = new Date(referenceDate);
    tempDate.setDate(tempDate.getDate() - 1);
    while (tempDate >= currentDate) {
      const dateKey = `${tempDate.getFullYear()}-${tempDate.getMonth() + 1}-${tempDate.getDate()}`;
      const isWeekday = tempDate.getDay() >= 1 && tempDate.getDay() <= 5;
      const isHoliday = holidays[dateKey] || pdDays[dateKey] || snowDays[dateKey] || midtermDays[dateKey];

      if (isWeekday && !isHoliday) {
        currentLetterIndex = (currentLetterIndex - 1 + 7) % 7;
      }

      tempDate.setDate(tempDate.getDate() - 1);
    }
  }

  const isWeekend = currentDate.getDay() === 0 || currentDate.getDay() === 6;
  const isHoliday = holidays[todayKey] || pdDays[todayKey] || snowDays[todayKey] || midtermDays[todayKey];

  if (isWeekend || isHoliday) {
    return '';
  }

  return letterDays[currentLetterIndex];
};

// Get calendar info for a date
export const getCalendarDayInfo = (date: Date): CalendarDay => {
  const holidays = getHolidays();
  const pdDays = getPDDays();
  const snowDays = getSnowDays();
  const midtermDays = getMidtermDays();
  
  const dateKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  const isWeekend = date.getDay() === 0 || date.getDay() === 6;
  const isHoliday = !!holidays[dateKey];
  const isPDDay = !!pdDays[dateKey];
  const isSnowDay = !!snowDays[dateKey];
  const isMidterm = !!midtermDays[dateKey];
  
  return {
    date,
    letterDay: getLetterDayForDate(date),
    isWeekend,
    isHoliday,
    isSnowDay,
    isPDDay,
    isMidterm,
    holidayName: holidays[dateKey] || pdDays[dateKey] || snowDays[dateKey] || midtermDays[dateKey]
  };
};

// Update calendar events from .txt file
export const updateCalendarFromText = (content: string): { success: boolean; message: string } => {
  try {
    const lines = content.split('\n');
    const holidays: { [key: string]: string } = {};
    const pdDays: { [key: string]: string } = {};
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue; // Skip empty lines and comments
      
      // Expected format: YYYY-MM-DD,EventType,EventName
      // Example: 2026-12-25,holiday,Christmas
      // Example: 2026-01-20,pd,Professional Development Day
      
      const parts = trimmed.split(',').map(p => p.trim());
      if (parts.length < 3) continue;
      
      const [date, type, ...nameParts] = parts;
      const name = nameParts.join(',').trim();
      
      // Validate date format
      const dateMatch = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (!dateMatch) continue;
      
      const year = dateMatch[1];
      const month = dateMatch[2];
      const day = dateMatch[3];
      const dateKey = `${year}-${month}-${day}`;
      
      if (type.toLowerCase() === 'holiday' || type.toLowerCase() === 'break') {
        holidays[dateKey] = name;
      } else if (type.toLowerCase() === 'pd' || type.toLowerCase() === 'professional development') {
        pdDays[dateKey] = name;
      }
    }
    
    // Save to localStorage
    if (Object.keys(holidays).length > 0) {
      localStorage.setItem('flowtrack-holidays', JSON.stringify({...getHolidays(), ...holidays}));
    }
    if (Object.keys(pdDays).length > 0) {
      localStorage.setItem('flowtrack-pd-days', JSON.stringify({...getPDDays(), ...pdDays}));
    }
    
    const totalEvents = Object.keys(holidays).length + Object.keys(pdDays).length;
    return {
      success: true,
      message: `Successfully imported ${totalEvents} calendar events (${Object.keys(holidays).length} holidays, ${Object.keys(pdDays).length} PD days)`
    };
  } catch (error) {
    return {
      success: false,
      message: `Error parsing file: ${error instanceof Error ? error.message : 'Unknown error'}`
    };
  }
};

// Semester class switches
export interface SemesterSwitch {
  oldClass: string;
  newClass: string;
  startDate: string; // Format: YYYY-M-D
}

// Get semester switches from localStorage
export const getSemesterSwitches = (): SemesterSwitch[] => {
  const saved = localStorage.getItem('flowtrack-semester-switches');
  if (saved) {
    return JSON.parse(saved);
  }
  
  // Default semester 2 switches
  return [
    {
      oldClass: 'West Civ: Ancient Civ-CP',
      newClass: 'CAD',
      startDate: '2026-1-28'
    },
    {
      oldClass: 'Holocaust Studies-CP',
      newClass: 'Physical Education',
      startDate: '2026-1-28'
    }
  ];
};

// Save semester switches to localStorage
export const saveSemesterSwitches = (switches: SemesterSwitch[]) => {
  localStorage.setItem('flowtrack-semester-switches', JSON.stringify(switches));
};

// Add a semester switch
export const addSemesterSwitch = (oldClass: string, newClass: string, startDate: string) => {
  const switches = getSemesterSwitches();
  switches.push({ oldClass, newClass, startDate });
  saveSemesterSwitches(switches);
};

// Remove a semester switch
export const removeSemesterSwitch = (index: number) => {
  const switches = getSemesterSwitches();
  switches.splice(index, 1);
  saveSemesterSwitches(switches);
};

// Get the appropriate class name for a given date
export const getClassForDate = (className: string, date: Date): string => {
  const switches = getSemesterSwitches();
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  
  // Check each switch to see if it applies
  for (const switchItem of switches) {
    if (switchItem.oldClass === className) {
      const [switchYear, switchMonth, switchDay] = switchItem.startDate.split('-').map(Number);
      const switchDate = new Date(switchYear, switchMonth - 1, switchDay);
      switchDate.setHours(0, 0, 0, 0);
      
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      // If the date is on or after the switch date, use the new class
      if (checkDate >= switchDate) {
        return switchItem.newClass;
      }
    }
  }
  
  // No switch applies, return original class name
  return className;
};