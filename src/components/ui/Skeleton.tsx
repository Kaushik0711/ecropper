import React from 'react';

export function Skeleton({
  className = '',
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

export interface CheckboxProps {
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: React.ReactNode;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function Checkbox({
  id,
  checked,
  onChange,
  label,
  description,
  disabled = false,
  className = '',
}: CheckboxProps) {
  const checkboxId = id || (typeof label === 'string' ? `chk-${label.toLowerCase().replace(/\s+/g, '-')}` : undefined);

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <input
        type="checkbox"
        id={checkboxId}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 cursor-pointer"
      />
      {(label || description) && (
        <label
          htmlFor={checkboxId}
          className={`select-none text-sm ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          {label && <span className="font-medium text-slate-800 block">{label}</span>}
          {description && <span className="text-xs text-slate-500 mt-0.5 block leading-normal">{description}</span>}
        </label>
      )}
    </div>
  );
}
