import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
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
}

interface PassCardProps {
  pass: Pass;
  onEndPass?: (passId: string) => void;
  showEndButton?: boolean;
}

export default function PassCard({ pass, onEndPass, showEndButton }: PassCardProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isOvertime, setIsOvertime] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = Date.now();
      const remaining = pass.expiresTimestamp - now;
      
      if (remaining <= 0) {
        setIsOvertime(true);
        setTimeRemaining(Math.abs(remaining));
      } else {
        setIsOvertime(false);
        setTimeRemaining(remaining);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [pass.expiresTimestamp]);

  const formatTime = (ms: number): string => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const expiresTime = new Date(pass.expiresTimestamp).toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });

  const statusColor = 
    pass.status === 'completed' ? 'bg-blue-500' :
    pass.status === 'overtime' || isOvertime ? 'bg-red-500' :
    'bg-emerald-500';

  const statusText = 
    pass.status === 'completed' ? 'Completed' :
    pass.status === 'overtime' || isOvertime ? 'Overtime' :
    'Active';

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900 dark:to-pink-900 rounded-2xl shadow-lg p-8 border-2 border-purple-300 dark:border-purple-700 max-w-2xl w-full">
      {/* FlowTrack Header */}
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-lg">F</span>
        </div>
        <h2 className="text-xl font-bold text-purple-900 dark:text-purple-100">FlowTrack</h2>
      </div>

      {/* Student Avatar */}
      <div className="flex justify-center mb-6">
        <div className="w-24 h-24 bg-gradient-to-br from-purple-300 to-pink-300 dark:from-purple-600 dark:to-pink-600 rounded-full flex items-center justify-center border-4 border-white dark:border-gray-700 shadow-md">
          <User className="w-12 h-12 text-purple-800 dark:text-purple-200" />
        </div>
      </div>

      {/* Pass Title */}
      <h3 className="text-2xl font-bold text-center text-purple-900 dark:text-purple-100 mb-6">
        {pass.destination} Pass
      </h3>

      {/* Pass Details */}
      <div className="space-y-3 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-purple-700 dark:text-purple-300 font-medium">Destination:</span>
          <span className="text-purple-900 dark:text-purple-100 font-semibold">
            {pass.location || pass.destination}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-purple-700 dark:text-purple-300 font-medium">Student:</span>
          <span className="text-purple-900 dark:text-purple-100 font-semibold">{pass.studentName}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-purple-700 dark:text-purple-300 font-medium">From:</span>
          <span className="text-purple-900 dark:text-purple-100 font-semibold">{pass.currentRoom}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-purple-700 dark:text-purple-300 font-medium">Time Out:</span>
          <span className="text-purple-900 dark:text-purple-100 font-semibold">{pass.time}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-purple-700 dark:text-purple-300 font-medium">Expires:</span>
          <span className="text-purple-900 dark:text-purple-100 font-semibold">{expiresTime}</span>
        </div>
      </div>

      {/* Timer Display */}
      {pass.status !== 'completed' && (
        <div className={`rounded-xl p-4 mb-6 text-center ${
          isOvertime ? 'bg-red-100 dark:bg-red-900 border-2 border-red-400 dark:border-red-600' : 'bg-emerald-100 dark:bg-emerald-900 border-2 border-emerald-400 dark:border-emerald-600'
        }`}>
          <div className="text-sm font-medium mb-1" style={{ color: isOvertime ? '#991b1b' : '#065f46' }}>
            {isOvertime ? 'Overtime:' : 'Time Remaining:'}
          </div>
          <div className={`text-4xl font-bold ${isOvertime ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
            {formatTime(timeRemaining)}
          </div>
        </div>
      )}

      {/* Status Badge */}
      <div className="flex justify-center">
        <div className={`${statusColor} text-white px-6 py-2 rounded-full font-semibold shadow-md`}>
          {statusText === 'Completed' && '✓ '}
          {statusText === 'Overtime' && '✕ '}
          {statusText}
        </div>
      </div>

      {/* End Pass Button */}
      {showEndButton && (
        <div className="flex justify-center mt-4">
          <Button
            variant="destructive"
            onClick={() => onEndPass && onEndPass(pass.id)}
          >
            End Pass
          </Button>
        </div>
      )}
    </div>
  );
}
