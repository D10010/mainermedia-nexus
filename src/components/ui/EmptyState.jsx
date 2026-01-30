import React from 'react';
import PrimaryButton from './PrimaryButton';

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className = ''
}) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-4 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-sm bg-gray-800/50 flex items-center justify-center mb-4">
          <Icon className="w-8 h-8 text-gray-600" />
        </div>
      )}
      <h3 className="text-lg font-light text-white mb-2">{title}</h3>
      {description && (
        <p className="text-sm text-gray-500 max-w-sm mb-6">{description}</p>
      )}
      {actionLabel && onAction && (
        <PrimaryButton onClick={onAction}>
          {actionLabel}
        </PrimaryButton>
      )}
    </div>
  );
}