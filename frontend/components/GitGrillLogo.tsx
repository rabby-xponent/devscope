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
      className={`shrink-0 transition-transform duration-200 hover:scale-105 ${className}`}
    >
      <defs>
        {/* Radar Sweep Wedge Gradient */}
        <radialGradient
          id="radarSweepGrad"
          cx="16"
          cy="16"
          r="14"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#ea580c" stopOpacity="0.45" />
          <stop offset="70%" stopColor="#f97316" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#ea580c" stopOpacity="0.05" />
        </radialGradient>

        {/* Audit Signal Accent Gradient */}
        <linearGradient id="gitOrangeGrad" x1="16" y1="24" x2="23" y2="10" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c2410c" />
          <stop offset="60%" stopColor="#ea580c" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
      </defs>

      {/* Outer Radar Reticle Ring */}
      <circle
        cx="16"
        cy="16"
        r="13.5"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-slate-400/50 dark:text-slate-600/60"
      />

      {/* Middle Concentric Radar Ring */}
      <circle
        cx="16"
        cy="16"
        r="8.5"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeDasharray="2 2"
        className="text-slate-400/40 dark:text-slate-600/50"
      />

      {/* Inner Core Radar Ring */}
      <circle
        cx="16"
        cy="16"
        r="3.5"
        stroke="currentColor"
        strokeWidth="1"
        className="text-slate-400/30 dark:text-slate-700/60"
      />

      {/* Reticle Axis Lines */}
      <line
        x1="16"
        y1="2.5"
        x2="16"
        y2="29.5"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-slate-400/40 dark:text-slate-600/50"
      />
      <line
        x1="2.5"
        y1="16"
        x2="29.5"
        y2="16"
        stroke="currentColor"
        strokeWidth="1.2"
        className="text-slate-400/40 dark:text-slate-600/50"
      />

      {/* Active Radar Scanner Sweep (Quadrant) */}
      <path
        d="M16 16 L16 2.5 A13.5 13.5 0 0 1 29.5 16 Z"
        fill="url(#radarSweepGrad)"
      />
      {/* Leading Radar Scan Edge */}
      <line
        x1="16"
        y1="16"
        x2="25.5"
        y2="6.5"
        stroke="#ea580c"
        strokeWidth="1.5"
        strokeLinecap="round"
        className="opacity-90"
      />

      {/* Intersecting Git Commit Branch Architecture */}
      {/* Git Trunk Line */}
      <line
        x1="16"
        y1="9.5"
        x2="16"
        y2="23.5"
        stroke="url(#gitOrangeGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Git Branch Curve */}
      <path
        d="M16 17.5 C16 15 19 13.5 22.5 11"
        stroke="url(#gitOrangeGrad)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />

      {/* Git Commit Nodes with Crisp Contrast Rings */}
      {/* Bottom Trunk Node */}
      <circle cx="16" cy="23.5" r="2.2" fill="#c2410c" stroke="#ffffff" strokeWidth="1.2" />

      {/* Center Reticle Anchor Node */}
      <circle cx="16" cy="16" r="1.8" fill="#ea580c" />

      {/* Top Trunk Node */}
      <circle cx="16" cy="9.5" r="2.2" fill="#ea580c" stroke="#ffffff" strokeWidth="1.2" />

      {/* Branched Scanned Target Node (Active Audit Detection) */}
      <circle cx="22.5" cy="11" r="2.6" fill="#f59e0b" stroke="#ea580c" strokeWidth="1.5" />
    </svg>
  );
}

export function GitGrillLogo({ size = 'md', showText = true, className = '' }: GitGrillLogoProps) {
  const textSize = size === 'sm' ? 'text-[15px]' : size === 'md' ? 'text-[18px]' : 'text-[22px]';

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <GitGrillLogoMark size={size} />
      {showText && (
        <span className={`inline-flex items-center font-sans ${textSize} leading-none select-none`}>
          <span className="font-bold tracking-[0.04em] text-content">
            Git
          </span>
          <span className="font-bold tracking-[0.04em] text-[#ea580c] dark:text-[#f0a04b] ml-1">
            Grill
          </span>
        </span>
      )}
    </div>
  );
}
