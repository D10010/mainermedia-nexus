import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function MetricCard({ 
  label, 
  value, 
  trend, 
  trendLabel,
  icon: Icon,
  accent = false 
}) {
  const isPositive = trend > 0;
  
  return (
    <div className={`
      bg-white dark:bg-[#12161D] border border-gray-200 dark:border-white/[0.08] rounded-sm p-5 relative overflow-hidden
      ${accent ? 'border-l-[3px] border-l-emerald-500' : ''}
    `}>
      {/* Subtle grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(rgba(100,116,139,0.3) 1px, transparent 1px),
                           linear-gradient(90deg, rgba(100,116,139,0.3) 1px, transparent 1px)`,
          backgroundSize: '20px 20px'
        }}
      />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-gray-600 dark:text-gray-500">
            {label}
          </span>
          {Icon && (
            <Icon className="w-4 h-4 text-gray-600 dark:text-gray-600" />
          )}
        </div>
        
        <div className="flex items-end justify-between">
          <span className="text-3xl font-light text-gray-900 dark:text-white tracking-tight">
            {value}
          </span>
          
          {trend !== undefined && (
            <div className={`flex items-center gap-1 text-xs font-mono ${
              isPositive ? 'text-emerald-600 dark:text-emerald-500' : 'text-red-600 dark:text-red-500'
            }`}>
              {isPositive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              <span>{isPositive ? '+' : ''}{trend}%</span>
            </div>
          )}
        </div>
        
        {trendLabel && (
          <span className="text-[10px] font-mono text-gray-600 dark:text-gray-500 mt-1 block">
            {trendLabel}
          </span>
        )}
      </div>
    </div>
  );
}