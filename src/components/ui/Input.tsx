import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, error, helperText, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]+/g, '-') : undefined);
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1.5"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          type={type}
          ref={ref}
          className={cn(
            'w-full px-4 py-2.5 rounded-xl border border-agri-earth-300 bg-white text-agri-earth-900 placeholder:text-agri-earth-300 text-sm transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-agri-sprout focus:border-transparent disabled:bg-agri-earth-100 disabled:cursor-not-allowed',
            error && 'border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-xs text-agri-earth-700">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
