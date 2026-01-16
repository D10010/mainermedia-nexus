import React from 'react';
import { format } from 'date-fns';

export default function ActivityItem({ 
  icon: Icon, 
  title, 
  description, 
  timestamp, 
  iconColor = 'text-emerald-500',
  iconBg = 'bg-emerald-500/20'
}) {
  return (
    <div className="flex gap-4 py-3">
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-sm flex items-center justify-center
        ${iconBg}
      `}>
        <Icon className={`w-4 h-4 ${iconColor}`} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white">{title}</p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
        )}
      </div>
      {timestamp && (
        <span className="text-[10px] font-mono text-gray-600 whitespace-nowrap">
          {format(new Date(timestamp), 'MMM d, HH:mm')}
        </span>
      )}
    </div>
  );
}