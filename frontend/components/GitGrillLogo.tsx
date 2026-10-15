'use client';

import React from 'react';

interface GitGrillLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function GitGrillLogoMark({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dim = size === 'sm' ? 24 : size === 'md' ? 30 : 38;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-110 ${className}`}
    >
      <defs>
        {/* Outer Radiant Flame Gradient */}
        <linearGradient id="ggFlameGrad" x1="6" y1="29" x2="26" y2="2" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="40%" stopColor="#ea580c" />
          <stop offset="80%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#fbbf24" />
        </linearGradient>

        {/* Deep Ember Core */}
        <linearGradient id="ggCoreGrad" x1="10" y1="27" x2="22" y2="11" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#991b1b" />
          <stop offset="70%" stopColor="#c2410c" />
          <stop offset="100%" stopColor="#ea580c" />
        </linearGradient>

        {/* Ember Ambient Glow */}
        <filter id="ggFlameGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#ea580c" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Main Free-standing Flame Silhouette with Glow */}
      <path
        d="M16 2.5C16 2.5 20.8 7.8 19.8 12.2C22.2 10.6 24.8 12.6 25.8 16C27.2 21 23.6 27.8 16 28.5C8.4 27.8 4.8 21 6.2 16C7.2 12.6 9.8 10.6 12.2 12.2C11.2 7.8 16 2.5 16 2.5Z"
        fill="url(#ggFlameGrad)"
        filter="url(#ggFlameGlow)"
      />

      {/* Inner Deeper Ember Core for Dimensional Heat */}
      <path
        d="M16 11.5C16 11.5 18.6 14.8 18.2 17.2C19.6 16.2 21.2 17.4 21.8 19.4C22.6 22.8 20.2 26.6 16 27C11.8 26.6 9.4 22.8 10.2 19.4C10.8 17.4 12.4 16.2 13.8 17.2C13.4 14.8 16 11.5 16 11.5Z"
        fill="url(#ggCoreGrad)"
        opacity="0.9"
      />

      {/* Git Commit Tree Core (Crisp White Nodes & Branches) */}
      <line x1="13.5" y1="14.5" x2="13.5" y2="24" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />
      <path d="M13.5 19.8L18.5 15.5" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" />

      {/* Branch Node */}
      <circle cx="18.5" cy="15.5" r="2.2" fill="#ffffff" />
      {/* Top Trunk Node */}
      <circle cx="13.5" cy="14.5" r="2.2" fill="#ffffff" />
      {/* Bottom Trunk Base Node */}
      <circle cx="13.5" cy="24" r="2.6" fill="#ffffff" />
    </svg>
  );
}

export function GitGrillLogo({ size = 'md', showText = true, className = '' }: GitGrillLogoProps) {
  const textSize = size === 'sm' ? 'text-[16px]' : size === 'md' ? 'text-[19px]' : 'text-[24px]';

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <GitGrillLogoMark size={size} />
      {showText && (
        <span className={`font-sans font-extrabold tracking-tight ${textSize} text-content leading-none select-none`}>
          Git<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ea580c] via-[#f97316] to-[#f59e0b] dark:from-[#f0a04b] dark:to-[#fbbf24]">Grill</span>
        </span>
      )}
    </div>
  );
}
