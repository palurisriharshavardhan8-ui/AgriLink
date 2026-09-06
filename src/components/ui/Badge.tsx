import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'evergreen' | 'sprout' | 'harvest' | 'sand' | 'earth' | 'outline';
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'sprout',
  children,
  className,
  ...props
}) => {
  const variants = {
    evergreen: 'bg-agri-evergreen text-white',
    sprout: 'bg-agri-sprout-soft text-agri-evergreen border border-agri-sprout-bright/30',
    harvest: 'bg-agri-harvest-soft text-agri-earth-900 border border-agri-harvest-sand/40',
    sand: 'bg-amber-100 text-amber-900 border border-amber-200',
    earth: 'bg-agri-earth-100 text-agri-earth-800 border border-agri-earth-200',
    outline: 'border border-agri-earth-300 text-agri-earth-800 bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
