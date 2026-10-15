'use client';

import React from 'react';

interface GitGrillLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function GitGrillLogoMark({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const dim = size === 'sm' ? 22 : size === 'md' ? 28 : 36;

  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="ggFlame" x1="12" y1="56" x2="52" y2="8" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="45%" stopColor="#ea580c" />
          <stop offset="85%" stopColor="#f97316" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Outer Squircle Container */}
      <rect width="64" height="64" rx="16" fill="#0c0b0e" />
      <rect width="62" height="62" x="1" y="1" rx="15" stroke="currentColor" strokeWidth="1.5" className="text-black/15 dark:text-[#3a3545]" />

      {/* Flame Outline */}
      <path
        d="M32 11C32 11 36.5 19 33.5 24.5C38.5 21 43 23.5 44.5 28.5C47 34 45 40.5 41 45C36.5 49.5 27.5 49.5 23 45C19 40.5 17 34 19.5 28.5C21 23.5 25.5 21 30.5 24.5C27.5 19 32 11 32 11Z"
        stroke="url(#ggFlame)"
        strokeWidth="2.75"
        strokeLinejoin="round"
      />

      {/* Git Branch Lines */}
      <line x1="32" y1="23" x2="32" y2="44" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
      <path d="M32 37L39 30" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />

      {/* Git Nodes */}
      <circle cx="39" cy="30" r="3.5" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
      <circle cx="32" cy="23" r="3.5" fill="#ea580c" stroke="#ffffff" strokeWidth="2" />
      <circle cx="32" cy="44" r="4.5" fill="#c2410c" stroke="#ffffff" strokeWidth="2.5" />
    </svg>
  );
}

export function GitGrillLogo({ size = 'md', showText = true, className = '' }: GitGrillLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <GitGrillLogoMark size={size} />
      {showText && (
        <span className="font-mono text-sm font-bold tracking-[0.2em] text-content">
          GIT<span className="text-signal">GRILL</span>
        </span>
      )}
    </div>
  );
}
