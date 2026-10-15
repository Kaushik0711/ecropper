import React from 'react';

export interface ProgressProps {
  value: number; // 0 to 100
  label?: string;
  sublabel?: string;
  className?: string;
  color?: 'primary' | 'success';
}

export function Progress({
  value,
  label,
  sublabel,
  className = '',
  color = 'primary',
}: ProgressProps) {
  const clampedValue = Math.min(100, Math.max(0, value));

  const barColor = color === 'primary' ? 'bg-blue-600' : 'bg-emerald-600';

  return (
    <div className={`w-full space-y-2 ${className}`}>
      {(label || sublabel) && (
        <div className="flex justify-between items-center text-xs text-slate-600 font-medium">
          <span>{label}</span>
          <span>{sublabel ?? `${Math.round(clampedValue)}%`}</span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200"
      >
        <div
          className={`h-full ${barColor} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
