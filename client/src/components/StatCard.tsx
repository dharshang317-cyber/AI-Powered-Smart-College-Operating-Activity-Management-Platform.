import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-indigo-600',
  iconBg = 'bg-indigo-50',
  trend,
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`glass-card p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-indigo-300 hover:shadow-md' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h3 className="text-2xl lg:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">
            {value}
          </h3>
        </div>
        <div className={`p-3 rounded-xl ${iconBg} ${iconColor} shadow-sm`}>
          <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
        </div>
      </div>

      {(subtitle || trend) && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          {subtitle && <span className="text-slate-500">{subtitle}</span>}
          {trend && (
            <span
              className={`font-semibold flex items-center space-x-1 ${
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              <span>{trend.isPositive ? '↑' : '↓'}</span>
              <span>{trend.value}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};
