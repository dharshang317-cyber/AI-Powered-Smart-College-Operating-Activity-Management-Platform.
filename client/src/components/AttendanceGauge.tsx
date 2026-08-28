import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Badge } from './Badge';

interface AttendanceGaugeProps {
  percentage: number;
  goodThreshold?: number;
  warningThreshold?: number;
  totalSessions?: number;
  attendedSessions?: number;
  compact?: boolean;
}

export const AttendanceGauge: React.FC<AttendanceGaugeProps> = ({
  percentage,
  goodThreshold = 75.0,
  warningThreshold = 70.0,
  totalSessions,
  attendedSessions,
  compact = false,
}) => {
  const isGood = percentage >= goodThreshold;
  const isWarning = percentage >= warningThreshold && percentage < goodThreshold;
  const isCritical = percentage < warningThreshold;

  const colorClass = isGood
    ? 'text-emerald-600 stroke-emerald-500'
    : isWarning
    ? 'text-amber-500 stroke-amber-500'
    : 'text-rose-600 stroke-rose-500';

  const barColor = isGood ? 'bg-emerald-500' : isWarning ? 'bg-amber-500' : 'bg-rose-500';
  const badgeVariant = isGood ? 'success' : isWarning ? 'warning' : 'danger';
  const label = isGood ? 'Good Standing (≥75%)' : isWarning ? 'Attendance Warning (70-74%)' : 'Critical Attendance (<70%)';

  if (compact) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-16 bg-slate-100 h-2 rounded-full overflow-hidden">
          <div className={`h-full ${barColor}`} style={{ width: `${Math.min(percentage, 100)}%` }} />
        </div>
        <span className={`text-xs font-bold ${colorClass.split(' ')[0]}`}>{percentage}%</span>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Attendance Health</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <h4 className="text-3xl font-extrabold text-slate-900 tracking-tight">{percentage}%</h4>
            {totalSessions !== undefined && attendedSessions !== undefined && (
              <span className="text-xs font-medium text-slate-500">
                ({attendedSessions}/{totalSessions} sessions attended)
              </span>
            )}
          </div>
        </div>

        <Badge variant={badgeVariant} dot size="md">
          {isGood ? 'Good' : isWarning ? 'Warning' : 'Critical'}
        </Badge>
      </div>

      {/* Progress Track */}
      <div className="mt-4">
        <div className="relative w-full bg-slate-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[10px] text-slate-400 font-semibold mt-1.5 px-0.5">
          <span>0%</span>
          <span className="text-amber-600">Threshold: {warningThreshold}%</span>
          <span className="text-emerald-600">Recommended: {goodThreshold}%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Threshold Status Banner */}
      <div className={`mt-4 p-3 rounded-xl flex items-start space-x-2.5 text-xs ${
        isGood ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/60' :
        isWarning ? 'bg-amber-50 text-amber-900 border border-amber-200/60' :
        'bg-rose-50 text-rose-900 border border-rose-200/60'
      }`}>
        {isGood ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        ) : isWarning ? (
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        )}
        <div className="flex-1 leading-relaxed">
          <p className="font-semibold">{label}</p>
          <p className="text-[11px] mt-0.5 opacity-90">
            {isGood
              ? 'Your attendance comfortably meets semester requirements.'
              : isWarning
              ? 'Your attendance has dipped near the threshold. Please attend upcoming lectures to maintain eligibility.'
              : 'Potentially Not Eligible based on College Attendance Policy. Please consult your department coordinator.'}
          </p>
        </div>
      </div>
    </div>
  );
};
