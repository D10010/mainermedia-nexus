import React from 'react';

export default function MainerMediaLogo({ className = "", size = "default" }) {
  const sizes = {
    small: { img: "w-6 h-6", text: "text-lg" },
    default: { img: "w-8 h-8", text: "text-2xl" },
    large: { img: "w-12 h-12", text: "text-4xl" }
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <img 
        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/696ab8205c791ffe801a6fbd/92546f429_MAINERMEDIA_LOGO.png"
        alt="MAINERMEDIA"
        className={`${sizes[size].img} object-contain`}
      />
      <span className={`font-light tracking-tight text-white ${sizes[size].text}`}>
        MAINER<span className="font-medium">MEDIA</span>
      </span>
    </div>
  );
}