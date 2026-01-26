import React from 'react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function SocialMetricCard({ 
  label, 
  value, 
  change, 
  changeLabel = "vs last period",
  icon: Icon,
  accent = false 
}) {
  const getTrendIcon = () => {
    if (!change || change === 0) return <Minus className="w-3 h-3" />;
    return change > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />;
  };

  const getTrendColor = () => {
    if (!change || change === 0) return 'text-gray-600 dark:text-gray-500';
    return change > 0 ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500';
  };

  return (
    <div className={`
      bg-white dark:bg-[#12161D] border border-gray-200 dark:border-white/[0.08] rounded-sm p-4
      ${accent ? 'border-l-[3px] border-l-emerald-500' : ''}
    `}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="text-[10px] font-mono uppercase tracking-wider text-gray-600 dark:text-gray-500 mb-1">
            {label}
          </p>
          <p className="text-2xl font-light text-gray-900 dark:text-white">{value}</p>
        </div>
        {Icon && (
          <div className="w-8 h-8 rounded-sm bg-emerald-500/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-500" />
          </div>
        )}
      </div>
      
      {change !== undefined && change !== null && (
        <div className={`flex items-center gap-1 text-xs ${getTrendColor()}`}>
          {getTrendIcon()}
          <span className="font-mono">
            {change > 0 ? '+' : ''}{change}%
          </span>
          <span className="text-gray-600 dark:text-gray-600 ml-1">{changeLabel}</span>
        </div>
      )}
    </div>
  );
}