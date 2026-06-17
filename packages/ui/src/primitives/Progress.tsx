import * as React from 'react';
import { cn } from '../lib/cn';

interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;  // 0-100
  size?: 'sm' | 'md' | 'lg';
  gradient?: boolean;
}

function Progress({ value, size = 'md', gradient = true, className, ...props }: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        'relative w-full overflow-hidden rounded-full bg-[#F1F5F9]',
        size === 'sm' && 'h-1',
        size === 'md' && 'h-1.5',
        size === 'lg' && 'h-2.5',
        className
      )}
      {...props}
    >
      <div
        className={cn(
          'h-full rounded-full transition-all duration-300 ease-in-out',
          gradient
            ? 'bg-[linear-gradient(90deg,#1F4CEE_0%,#41A7FE_50%,#32B7EE_100%)]'
            : 'bg-[#3353FE]'
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

export { Progress };
