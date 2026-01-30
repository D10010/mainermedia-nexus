import React from 'react';

export default function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  rows = 4,
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
      <textarea
        id={id}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={`
          w-full bg-[#0E1116] border border-white/[0.08] rounded-sm
          px-4 py-3 text-sm text-white placeholder:text-gray-600
          focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-all duration-200 resize-none
          ${error ? 'border-red-500/50' : ''}
        `}
      />
      {error && (
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  );
}