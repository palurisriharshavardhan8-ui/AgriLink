import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'harvest' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';

    const variants = {
      primary:
        'bg-agri-evergreen text-white hover:bg-agri-evergreen-light focus:ring-agri-evergreen',
      secondary:
        'bg-agri-sprout text-white hover:bg-agri-sprout-light focus:ring-agri-sprout',
      outline:
        'border border-agri-earth-300 bg-white text-agri-earth-800 hover:bg-agri-earth-100 hover:border-agri-earth-300 focus:ring-agri-evergreen',
      harvest:
        'bg-agri-harvest text-agri-earth-900 font-semibold hover:bg-agri-harvest-sand focus:ring-agri-harvest',
      ghost:
        'text-agri-earth-800 hover:bg-agri-earth-100 focus:ring-agri-earth-300',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 min-h-[32px]',
      md: 'text-sm px-4 py-2.5 min-h-[42px]',
      lg: 'text-base px-6 py-3.5 min-h-[50px]',
    };

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
