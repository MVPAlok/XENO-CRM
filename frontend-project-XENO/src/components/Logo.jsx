import React from 'react';

export default function Logo({ className = "w-8 h-8" }) {
  return (
    <svg className={className} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="xenoGradient" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366F1" /> {/* indigo-500 */}
          <stop offset="1" stopColor="#D946EF" /> {/* fuchsia-500 */}
        </linearGradient>
        <linearGradient id="xenoGradientSoft" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818CF8" />
          <stop offset="1" stopColor="#E879F9" />
        </linearGradient>
        <filter id="xenoGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Background shape */}
      <rect width="40" height="40" rx="10" fill="url(#xenoGradient)" fillOpacity="0.15" />
      <rect x="1" y="1" width="38" height="38" rx="9" stroke="url(#xenoGradient)" strokeOpacity="0.3" strokeWidth="1" />
      
      {/* Abstract X and Neural Nodes */}
      <path d="M12 12L28 28" stroke="url(#xenoGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M28 12L12 28" stroke="url(#xenoGradientSoft)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      
      {/* Outer nodes */}
      <circle cx="12" cy="12" r="3.5" fill="white" stroke="url(#xenoGradient)" strokeWidth="1.5" />
      <circle cx="28" cy="28" r="3.5" fill="white" stroke="url(#xenoGradient)" strokeWidth="1.5" />
      <circle cx="28" cy="12" r="3.5" fill="white" stroke="url(#xenoGradientSoft)" strokeWidth="1.5" />
      <circle cx="12" cy="28" r="3.5" fill="white" stroke="url(#xenoGradientSoft)" strokeWidth="1.5" />
      
      {/* Center glowing core */}
      <circle cx="20" cy="20" r="4.5" fill="url(#xenoGradient)" />
      <circle cx="20" cy="20" r="2.5" fill="white" filter="url(#xenoGlow)" />
      <circle cx="20" cy="20" r="1.5" fill="white" />
    </svg>
  );
}
