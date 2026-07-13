import React from 'react';

export default function Logo({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 500 500" 
      className={className}
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        d="M250 50 C 350 70, 420 120, 420 220 C 420 340, 320 410, 250 450 C 180 410, 80 340, 80 220 C 80 120, 150 70, 250 50 Z" 
        fill="#080e1a" 
        opacity="0.5"
      />
      <path 
        d="M250 40 C 360 60, 430 110, 430 210 C 430 330, 330 400, 250 440 C 170 400, 70 330, 70 210 C 70 110, 140 60, 250 40 Z" 
        fill="url(#greenShieldGrad)" 
        stroke="#ffffff" 
        strokeWidth="10"
        strokeLinejoin="round"
      />
      <path 
        d="M250 70 C 330 85, 390 125, 390 210 C 390 300, 310 360, 250 395 C 190 360, 110 300, 110 210 C 110 125, 170 85, 250 70 Z" 
        fill="#052e16" 
        stroke="#009e60"
        strokeWidth="6"
        opacity="0.8"
      />
      <path 
        d="M 140 280 L 190 220 L 250 310 L 310 160 L 370 200" 
        stroke="#ea580c" 
        strokeWidth="18" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        opacity="0.3"
      />
      <path 
        d="M 130 270 L 190 205 L 245 285 L 320 120 L 380 170 L 395 125 L 345 115 L 360 140 L 310 100 Z" 
        fill="url(#orangeArrowGrad)" 
        stroke="#ffffff"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="greenShieldGrad" x1="70" y1="40" x2="430" y2="440" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#15803d" />
          <stop offset="50%" stopColor="#009e60" />
          <stop offset="100%" stopColor="#052e16" />
        </linearGradient>
        <linearGradient id="orangeArrowGrad" x1="130" y1="100" x2="380" y2="285" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ffb03a" />
          <stop offset="50%" stopColor="#ff8200" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>
      </defs>
    </svg>
  );
}
