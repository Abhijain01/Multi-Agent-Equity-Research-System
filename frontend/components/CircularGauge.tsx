"use client";

import { useEffect, useState } from "react";

interface Props {
  /** 0-100 */
  value: number;
  label: string;
  colorClass?: string;
}

const RADIUS = 58;
const CIRCUMFERENCE = Math.round(2 * Math.PI * RADIUS);

export default function CircularGauge({ value, label, colorClass = "text-primary" }: Props) {
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    // Triggers smooth entry transitions
    const timer = setTimeout(() => {
      setAnimatedValue(Math.max(0, Math.min(100, value)));
    }, 100);
    return () => clearTimeout(timer);
  }, [value]);

  const dashOffset = CIRCUMFERENCE - (animatedValue / 100) * CIRCUMFERENCE;

  return (
    <div className="flex flex-col items-center select-none">
      <div className="relative w-32 h-32 mb-2 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
          <circle
            className="text-surface-container-highest"
            cx="64"
            cy="64"
            fill="transparent"
            r={RADIUS}
            stroke="currentColor"
            strokeWidth="6"
          />
          <circle
            className={`${colorClass} gauge-circle`}
            cx="64"
            cy="64"
            fill="transparent"
            r={RADIUS}
            stroke="currentColor"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={dashOffset}
            strokeWidth="6"
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-data-md text-on-surface font-mono text-[14px]">
          {Math.round(animatedValue)}%
        </div>
      </div>
      <span className="font-label-caps text-label-caps text-on-surface-variant uppercase tracking-wider text-[11px]">
        {label}
      </span>
    </div>
  );
}