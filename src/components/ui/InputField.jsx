import React from 'react';

export default function InputField({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  icon: Icon,
  className = '',
  id
}) {
  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label 
          htmlFor={id}
          className="block text-[11px] font-mono uppercase tracking-[0.15em] text-gray-400"
        >
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        )}
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full bg-[#0E1116] border border-white/[0.08] rounded-sm
            px-4 py-3 text-sm text-white placeholder:text-gray-600
            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${Icon ? 'pl-10' : ''}
            ${error ? 'border-red-500/50' : ''}
          `}
        />
      </div>
      {error && (
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  );
}