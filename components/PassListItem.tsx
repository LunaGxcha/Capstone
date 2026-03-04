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

interface PassListItemProps {
  pass: Pass;
}

export default function PassListItem({ pass }: PassListItemProps) {
  const statusColor = 
    pass.status === 'completed' ? 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600' :
    pass.status === 'overtime' ? 'bg-red-50 dark:bg-red-900 border-red-300 dark:border-red-600' :
    'bg-emerald-50 dark:bg-emerald-900 border-emerald-300 dark:border-emerald-600';

  const statusBadgeColor =
    pass.status === 'completed' ? 'bg-gray-400 dark:bg-gray-500' :
    pass.status === 'overtime' ? 'bg-red-500 dark:bg-red-600' :
    'bg-emerald-500 dark:bg-emerald-600';

  const statusText = 
    pass.status === 'completed' ? 'Completed' :
    pass.status === 'overtime' ? 'Overtime' :
    'Active';

  return (
    <div className={`p-4 rounded-lg border-2 ${statusColor}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-purple-900 dark:text-purple-100">
            {pass.destination}
            {pass.location && ` - ${pass.location}`}
          </div>
          <div className="text-sm text-purple-600 dark:text-purple-300">{pass.time}</div>
        </div>
        <div className={`px-3 py-1 rounded-full text-sm font-medium text-white ${statusBadgeColor}`}>
          {statusText === 'Completed' && '✓ '}
          {statusText === 'Overtime' && '✕ '}
          {statusText}
        </div>
      </div>
    </div>
  );
}
