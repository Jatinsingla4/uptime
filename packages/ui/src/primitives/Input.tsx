import * as React from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
  error?: string;
  label?: string;
  hint?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leftElement, rightElement, error, label, hint, id, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label htmlFor={inputId} className="text-[13px] font-medium text-[#0F172A]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftElement && (
            <span className="absolute left-3 text-[#94A3B8] flex items-center pointer-events-none">
              {leftElement}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'flex h-8 w-full rounded-md border bg-white text-[13px] text-[#0F172A]',
              'placeholder:text-[#94A3B8]',
              'transition-colors duration-[120ms]',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3353FE] focus-visible:ring-offset-0',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#F8FAFC]',
              error
                ? 'border-[#EF4444] focus-visible:ring-[#EF4444]'
                : 'border-[#E6E5EC] focus-visible:border-[#3353FE]',
              leftElement  ? 'pl-9'  : 'px-3',
              rightElement ? 'pr-9'  : 'px-3',
              className
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 text-[#94A3B8] flex items-center">
              {rightElement}
            </span>
          )}
        </div>
        {hint && !error && <p className="text-xs text-[#64748B]">{hint}</p>}
        {error && <p className="text-xs text-[#EF4444]">{error}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
