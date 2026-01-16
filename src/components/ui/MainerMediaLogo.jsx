import React from 'react';

export default function MainerMediaLogo({ className = "", size = "default" }) {
  const sizes = {
    small: "text-lg",
    default: "text-2xl",
    large: "text-4xl"
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-sm flex items-center justify-center">
          <span className="text-white font-bold text-sm">M</span>
        </div>
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
      </div>
      <span className={`font-light tracking-tight text-white ${sizes[size]}`}>
        MAINER<span className="font-medium">MEDIA</span>
      </span>
    </div>
  );
}