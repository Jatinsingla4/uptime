import * as React from 'react';
import { cn } from '../lib/cn';

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

function Spinner({ size = 'md', className, ...props }: SpinnerProps) {
  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block animate-spin rounded-full border-2 border-current border-t-transparent text-[#3353FE]',
        size === 'sm' && 'h-3.5 w-3.5',
        size === 'md' && 'h-5 w-5',
        size === 'lg' && 'h-7 w-7',
        className
      )}
      {...props}
    />
  );
}

export { Spinner };
