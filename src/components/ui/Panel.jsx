import React from 'react';

export default function Panel({ 
  title, 
  subtitle,
  children, 
  className = "",
  headerAction,
  accent = false,
  noPadding = false,
  statusIndicator
}) {
  return (
    <div className={`
      bg-[#12161D] border border-white/[0.08] rounded-sm overflow-hidden
      ${accent ? 'border-l-[3px] border-l-emerald-500' : ''}
      ${className}
    `}>
      {(title || headerAction) && (
        <div className="px-5 py-4 border-b border-white/[0.08] bg-[#0E1116] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="text-[11px] font-mono uppercase tracking-[0.2em] text-gray-400">
              {title}
            </h3>
            {subtitle && (
              <span className="text-[10px] text-gray-600">{subtitle}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {statusIndicator && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[10px] font-mono text-emerald-500 uppercase tracking-wider">
                  {statusIndicator}
                </span>
              </div>
            )}
            {headerAction}
          </div>
        </div>
      )}
      <div className={noPadding ? '' : 'p-5'}>
        {children}
      </div>
    </div>
  );
}