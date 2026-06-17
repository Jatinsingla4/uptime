import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn';
import { Loader2 } from 'lucide-react';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-1.5 font-medium',
    'text-[13px] leading-5 rounded-md',
    'transition-all duration-[120ms]',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1',
    'disabled:pointer-events-none disabled:opacity-50',
    'active:scale-[0.98]',
  ],
  {
    variants: {
      variant: {
        primary: [
          'text-white',
          'bg-[linear-gradient(90deg,#1F4CEE_0%,#41A7FE_50%,#32B7EE_100%)]',
          'hover:brightness-105',
          'focus-visible:ring-[#3353FE]',
          'shadow-sm',
        ],
        secondary: [
          'bg-white text-[#0F172A]',
          'border border-[#E6E5EC]',
          'hover:bg-[#F8FAFC] hover:border-[#CBD5E1]',
          'focus-visible:ring-[#3353FE]',
          'shadow-xs',
        ],
        ghost: [
          'bg-transparent text-[#64748B]',
          'hover:bg-[#F1F5F9] hover:text-[#0F172A]',
          'focus-visible:ring-[#3353FE]',
        ],
        danger: [
          'bg-[#EF4444] text-white',
          'hover:bg-[#DC2626]',
          'focus-visible:ring-[#EF4444]',
          'shadow-sm',
        ],
      },
      size: {
        sm:  'h-7 px-3 text-xs',
        md:  'h-8 px-3.5',
        lg:  'h-9 px-4 text-[14px]',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : leftIcon ? (
          <span className="h-3.5 w-3.5 flex items-center">{leftIcon}</span>
        ) : null}
        {children}
        {rightIcon && !loading ? (
          <span className="h-3.5 w-3.5 flex items-center">{rightIcon}</span>
        ) : null}
      </button>
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
