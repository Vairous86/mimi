'use client';

import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

export default function CircularProgress({
  percentage,
  size = 60,
  strokeWidth = 6
}: CircularProgressProps) {
  // Clamp value between 0 and 100
  const cleanPercentage = Math.min(100, Math.max(0, percentage));
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (cleanPercentage / 100) * circumference;

  // Determine color theme based on score
  let strokeColor = 'text-emerald-500'; // >= 85%
  let bgColor = 'bg-emerald-50 dark:bg-emerald-950/20';
  if (cleanPercentage < 50) {
    strokeColor = 'text-rose-500'; // < 50%
    bgColor = 'bg-rose-50 dark:bg-rose-950/20';
  } else if (cleanPercentage < 75) {
    strokeColor = 'text-amber-500'; // 50% - 74%
    bgColor = 'bg-amber-50 dark:bg-amber-950/20';
  } else if (cleanPercentage < 85) {
    strokeColor = 'text-blue-500'; // 75% - 84%
    bgColor = 'bg-blue-50 dark:bg-blue-950/20';
  }

  return (
    <div className={`relative flex items-center justify-center rounded-2xl p-1.5 shrink-0 ${bgColor}`} style={{ width: size + 6, height: size + 6 }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        {/* Background Circle */}
        <circle
          className="text-zinc-200 dark:text-zinc-800"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Progress Circle */}
        <circle
          className={`${strokeColor} transition-all duration-500 ease-out`}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Center Label */}
      <span className="absolute text-[11px] font-black text-zinc-850 dark:text-zinc-200">
        {Math.round(cleanPercentage)}%
      </span>
    </div>
  );
}
