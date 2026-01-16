import React from 'react';

const statusConfig = {
  // General
  active: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  inactive: { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500' },
  pending: { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  
  // Project statuses
  'planning': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  'in progress': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'on hold': { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  'completed': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'cancelled': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  
  // Lead statuses
  'submitted': { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500' },
  'contacted': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  'qualified': { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  'proposal sent': { bg: 'bg-orange-500/20', text: 'text-orange-400', dot: 'bg-orange-500' },
  'won': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'lost': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  
  // Invoice statuses
  'draft': { bg: 'bg-gray-500/20', text: 'text-gray-400', dot: 'bg-gray-500' },
  'sent': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  'paid': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'overdue': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  
  // Partner statuses
  'approved': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'rejected': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  'suspended': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
  
  // Payout statuses
  'requested': { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  'processing': { bg: 'bg-blue-500/20', text: 'text-blue-400', dot: 'bg-blue-500' },
  
  // Client statuses
  'paused': { bg: 'bg-amber-500/20', text: 'text-amber-400', dot: 'bg-amber-500' },
  'churned': { bg: 'bg-red-500/20', text: 'text-red-400', dot: 'bg-red-500' },
};

export default function StatusBadge({ status, showDot = true, pulse = false, size = 'default' }) {
  const normalizedStatus = status?.toLowerCase() || 'pending';
  const config = statusConfig[normalizedStatus] || statusConfig.pending;
  
  const sizes = {
    small: 'text-[9px] px-2 py-0.5',
    default: 'text-[10px] px-2.5 py-1',
    large: 'text-xs px-3 py-1.5'
  };
  
  return (
    <span className={`
      inline-flex items-center gap-1.5 font-mono uppercase tracking-wider rounded-sm
      ${config.bg} ${config.text} ${sizes[size]}
    `}>
      {showDot && (
        <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${pulse ? 'animate-pulse' : ''}`} />
      )}
      {status}
    </span>
  );
}