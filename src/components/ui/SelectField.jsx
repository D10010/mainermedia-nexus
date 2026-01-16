import React from 'react';
import { ChevronDown } from 'lucide-react';

export default function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select...',
  error,
  disabled = false,
  required = false,
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
        <select
          id={id}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className={`
            w-full bg-[#0E1116] border border-white/[0.08] rounded-sm
            px-4 py-3 text-sm text-white appearance-none
            focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20
            disabled:opacity-50 disabled:cursor-not-allowed
            transition-all duration-200
            ${!value ? 'text-gray-600' : ''}
            ${error ? 'border-red-500/50' : ''}
          `}
        >
          <option value="" className="bg-[#0E1116]">{placeholder}</option>
          {options.map((opt) => (
            <option 
              key={opt.value} 
              value={opt.value}
              className="bg-[#0E1116]"
            >
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      </div>
      {error && (
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      )}
    </div>
  );
}