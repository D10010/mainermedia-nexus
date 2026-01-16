import React from 'react';

export default function PrimaryButton({ 
  children, 
  onClick, 
  disabled = false,
  loading = false,
  size = 'default',
  variant = 'primary',
  className = '',
  type = 'button',
  icon: Icon
}) {
  const sizes = {
    small: 'px-3 py-1.5 text-xs',
    default: 'px-5 py-2.5 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const variants = {
    primary: `
      bg-emerald-500 text-white hover:bg-emerald-600
      shadow-[0_0_0_rgba(16,185,129,0)]
      hover:shadow-[0_0_25px_rgba(16,185,129,0.3)]
      disabled:bg-emerald-500/50 disabled:shadow-none
    `,
    secondary: `
      bg-transparent border border-gray-700 text-gray-300
      hover:border-gray-600 hover:text-white
      disabled:border-gray-800 disabled:text-gray-600
    `,
    ghost: `
      bg-transparent text-gray-400 hover:text-white hover:bg-white/[0.05]
      disabled:text-gray-600
    `,
    danger: `
      bg-red-500/20 text-red-400 border border-red-500/30
      hover:bg-red-500/30
      disabled:opacity-50
    `
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center gap-2 font-medium rounded-sm
        transition-all duration-200 ease-out
        disabled:cursor-not-allowed
        ${sizes[size]}
        ${variants[variant]}
        ${className}
      `}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" cy="12" r="10" 
            stroke="currentColor" 
            strokeWidth="4" 
            fill="none" 
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
          />
        </svg>
      ) : Icon && (
        <Icon className="w-4 h-4" />
      )}
      {children}
    </button>
  );
}