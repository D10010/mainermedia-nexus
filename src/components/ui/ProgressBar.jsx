import React from 'react';

export default function ProgressBar({ 
  value = 0, 
  max = 100, 
  showLabel = true,
  size = 'default',
  className = ''
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));
  
  const sizes = {
    small: 'h-1',
    default: 'h-2',
    large: 'h-3'
  };

  return (
    <div className={`${className}`}>
      <div className={`
        w-full bg-gray-800 rounded-full overflow-hidden ${sizes[size]}
      `}>
        <div 
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400 transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1.5">
          <span className="text-[10px] font-mono text-gray-500">Progress</span>
          <span className="text-[10px] font-mono text-emerald-500">{Math.round(percentage)}%</span>
        </div>
      )}
    </div>
  );
}