import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium leading-4 whitespace-nowrap',
  {
    variants: {
      variant: {
        neutral: 'bg-[#F1F5F9] text-[#64748B]',
        success: 'bg-[#ECFDF5] text-[#065F46]',
        warning: 'bg-[#FFFBEB] text-[#92400E]',
        danger:  'bg-[#FEF2F2] text-[#991B1B]',
        info:    'bg-[#E0F2FE] text-[#0369A1]',
        brand:   'bg-[#EEF2FF] text-[#3353FE]',
      },
    },
    defaultVariants: {
      variant: 'neutral',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
  pulse?: boolean;
}

function Badge({ className, variant, dot, pulse, children, ...props }: BadgeProps) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && (
        <span className="relative flex h-1.5 w-1.5">
          {pulse && (
            <span
              className={cn(
                'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
                variant === 'success' && 'bg-[#10B981]',
                variant === 'danger'  && 'bg-[#EF4444]',
                variant === 'warning' && 'bg-[#F59E0B]',
                variant === 'info'    && 'bg-[#32B7EE]',
                (!variant || variant === 'neutral') && 'bg-[#94A3B8]'
              )}
            />
          )}
          <span
            className={cn(
              'relative inline-flex h-1.5 w-1.5 rounded-full',
              variant === 'success' && 'bg-[#10B981]',
              variant === 'danger'  && 'bg-[#EF4444]',
              variant === 'warning' && 'bg-[#F59E0B]',
              variant === 'info'    && 'bg-[#32B7EE]',
              (!variant || variant === 'neutral') && 'bg-[#94A3B8]'
            )}
          />
        </span>
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
