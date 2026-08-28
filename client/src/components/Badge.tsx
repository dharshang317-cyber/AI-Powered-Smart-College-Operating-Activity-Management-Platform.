import React from 'react';

interface BadgeProps {
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'primary' | 'purple';
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  variant = 'neutral',
  children,
  size = 'md',
  dot = false,
}) => {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const variantClasses = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200/80',
    warning: 'bg-amber-50 text-amber-700 border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border-rose-200/80',
    info: 'bg-sky-50 text-sky-700 border-sky-200/80',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
    purple: 'bg-purple-50 text-purple-700 border-purple-200/80',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotColors = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    primary: 'bg-indigo-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full border tracking-wide transition-all ${sizeClasses[size]} ${variantClasses[variant]}`}
    >
      {dot && (
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotColors[variant]}`} />
      )}
      {children}
    </span>
  );
};
