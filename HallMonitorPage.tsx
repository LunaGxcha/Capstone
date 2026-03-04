import { useState, useEffect } from 'react';
import { User, Clock } from 'lucide-react';
import { Button } from './ui/button';

interface Pass {
  id: string;
  destination: string;
  location?: string;
  time: string;
  startTimestamp: number;
  expiresTimestamp: number;
  status: 'active' | 'completed' | 'overtime';
  studentName: string;
  currentClass: string;
  currentRoom: string;
  createdByTeacher?: string; // Track which teacher created this pass
}

// Hallway assignments for different destinations
const hallwayMap: { [key: string]: string } = {
  'Bathroom': 'Main Hallway',
  'Nurse': 'Administrative Wing',
  'Classroom': 'Academic Wing',
  'Administration': 'Administrative Wing',
  'Counselor': 'Administrative Wing',
  'Library': 'Main Hallway',
};

export default function HallMonitorPage() {
  const [allPasses, setAllPasses] = useState<Pass[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Load passes and sync with updates
  useEffect(() => {
    const loadPasses = () => {
      const storedPasses = localStorage.getItem('flowtrack-all-passes');
      if (storedPasses) {
        try {
          const passes = JSON.parse(storedPasses);
          setAllPasses(passes);
        } catch (e) {
          console.error('Failed to load passes', e);
        }
      } else {
        // If no passes in localStorage, ensure we set an empty array
        setAllPasses([]);
      }
      setIsInitialLoad(false);
    };

    loadPasses();
    const interval = setInterval(loadPasses, 1000); // Poll for updates
    return () => clearInterval(interval);
  }, []);

  // Force a refresh when the component becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        const storedPasses = localStorage.getItem('flowtrack-all-passes');
        if (storedPasses) {
          try {
            const passes = JSON.parse(storedPasses);
            setAllPasses(passes);
          } catch (e) {
            console.error('Failed to load passes', e);
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Update current time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleEndPass = (passId: string) => {
    const updatedPasses = allPasses.map(p => 
      p.id === passId ? { ...p, status: 'completed' as const } : p
    );
    setAllPasses(updatedPasses);
    localStorage.setItem('flowtrack-all-passes', JSON.stringify(updatedPasses));
  };

  const formatTimeRemaining = (expiresTimestamp: number): { text: string; isOvertime: boolean } => {
    const remaining = expiresTimestamp - currentTime;
    const isOvertime = remaining <= 0;
    const absRemaining = Math.abs(remaining);
    
    const totalSeconds = Math.floor(absRemaining / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    return {
      text: `${minutes}:${seconds.toString().padStart(2, '0')}`,
      isOvertime
    };
  };

  const activePasses = allPasses.filter(p => p.status === 'active' || p.status === 'overtime');
  
  // Group passes by hallway
  const passesByHallway: { [key: string]: Pass[] } = {};
  activePasses.forEach(pass => {
    const hallway = hallwayMap[pass.destination] || 'Other';
    if (!passesByHallway[hallway]) {
      passesByHallway[hallway] = [];
    }
    passesByHallway[hallway].push(pass);
  });

  const hallways = ['Main Hallway', 'Academic Wing', 'Administrative Wing', 'Other'].filter(
    hallway => passesByHallway[hallway] && passesByHallway[hallway].length > 0
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
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
              <p className="text-lg text-purple-800 dark:text-purple-200">Hall Monitor - Real-time pass tracking</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{activePasses.length}</div>
              <div className="text-sm">Active Passes</div>
            </div>
          </div>
        </div>

        {/* Active Passes by Hallway */}
        {activePasses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-12 text-center border-2 border-purple-200 dark:border-purple-700">
            <p className="text-purple-600 dark:text-purple-300 text-xl">No active passes at the moment</p>
          </div>
        ) : (
          <div className="space-y-6">
            {hallways.map((hallway) => (
              <div key={hallway} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border-2 border-purple-200 dark:border-purple-700">
                <h2 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-4 flex items-center gap-2">
                  <span className="w-3 h-3 bg-purple-500 dark:bg-purple-400 rounded-full"></span>
                  {hallway}
                  <span className="text-sm font-normal text-purple-600 dark:text-purple-300 ml-2">
                    ({passesByHallway[hallway].length} {passesByHallway[hallway].length === 1 ? 'pass' : 'passes'})
                  </span>
                </h2>
                <div className="grid gap-4">
                  {passesByHallway[hallway].map((pass) => {
                    const { text: timeText, isOvertime } = formatTimeRemaining(pass.expiresTimestamp);
                    
                    return (
                      <div
                        key={pass.id}
                        className={`p-4 rounded-xl border-2 ${
                          isOvertime || pass.status === 'overtime'
                            ? 'bg-red-50 border-red-400'
                            : 'bg-emerald-50 border-emerald-300'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          {/* Student Avatar */}
                          <div className={`w-16 h-16 rounded-full flex items-center justify-center border-4 border-white shadow-md flex-shrink-0 ${
                            isOvertime || pass.status === 'overtime'
                              ? 'bg-gradient-to-br from-red-300 to-red-400'
                              : 'bg-gradient-to-br from-purple-300 to-pink-300'
                          }`}>
                            <User className={`w-8 h-8 ${
                              isOvertime || pass.status === 'overtime' ? 'text-red-800' : 'text-purple-800'
                            }`} />
                          </div>

                          {/* Pass Info */}
                          <div className="flex-1">
                            <div className="font-bold text-lg text-purple-900">{pass.studentName}</div>
                            <div className="text-purple-700 font-medium">
                              Going to: {pass.destination} {pass.location && `- ${pass.location}`}
                            </div>
                            <div className="text-sm text-purple-600">
                              {pass.createdByTeacher ? (
                                <>Created by: {pass.createdByTeacher} • From: {pass.currentRoom} • Left at: {pass.time}</>
                              ) : (
                                <>From: {pass.currentRoom} • Left at: {pass.time}</>
                              )}
                            </div>
                          </div>

                          {/* Timer */}
                          <div className={`text-center px-6 py-3 rounded-xl border-2 ${
                            isOvertime || pass.status === 'overtime'
                              ? 'bg-red-100 border-red-400'
                              : 'bg-emerald-100 border-emerald-400'
                          }`}>
                            <div className="flex items-center gap-2 mb-1">
                              <Clock className={`w-4 h-4 ${
                                isOvertime || pass.status === 'overtime' ? 'text-red-700' : 'text-emerald-700'
                              }`} />
                              <div className={`text-xs font-medium ${
                                isOvertime || pass.status === 'overtime' ? 'text-red-700' : 'text-emerald-700'
                              }`}>
                                {isOvertime || pass.status === 'overtime' ? 'OVERTIME' : 'Time Left'}
                              </div>
                            </div>
                            <div className={`text-3xl font-bold ${
                              isOvertime || pass.status === 'overtime' ? 'text-red-600' : 'text-emerald-600'
                            }`}>
                              {timeText}
                            </div>
                          </div>

                          {/* End Button */}
                          <Button
                            onClick={() => handleEndPass(pass.id)}
                            className={`${
                              isOvertime || pass.status === 'overtime'
                                ? 'bg-red-500 hover:bg-red-600'
                                : 'bg-emerald-500 hover:bg-emerald-600'
                            } text-white shadow-md`}
                          >
                            End Pass
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}