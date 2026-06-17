import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@sitepulse/ui';
import { Skeleton } from '@sitepulse/ui';

interface StatsCardProps {
  label: string;
  value: string | number;
  delta?: number;
  deltaLabel?: string;
  icon?: React.ReactNode;
  loading?: boolean;
  className?: string;
}

export function StatsCard({
  label, value, delta, deltaLabel, icon, loading, className,
}: StatsCardProps) {
  if (loading) {
    return (
      <div className={cn('bg-white rounded-lg border border-[#E6E5EC] p-5 shadow-sm', className)}>
        <Skeleton className="h-3 w-20 mb-3" />
        <Skeleton className="h-7 w-28 mb-2" />
        <Skeleton className="h-3 w-24" />
      </div>
    );
  }

  const trend = delta === undefined ? 'flat' : delta > 0 ? 'up' : delta < 0 ? 'down' : 'flat';

  return (
    <div className={cn(
      'bg-white rounded-lg border border-[#E6E5EC] p-5 shadow-sm',
      'hover:border-[#CBD5E1] transition-colors duration-[120ms]',
      className
    )}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-[11px] font-medium text-[#64748B] uppercase tracking-wider">
          {label}
        </span>
        {icon && (
          <span className="text-[#94A3B8]">{icon}</span>
        )}
      </div>

      <div className="text-[28px] font-heading font-bold text-[#0F172A] leading-none mb-2">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>

      {delta !== undefined && (
        <div className={cn(
          'flex items-center gap-1 text-xs font-medium',
          trend === 'up'   && 'text-[#10B981]',
          trend === 'down' && 'text-[#EF4444]',
          trend === 'flat' && 'text-[#94A3B8]',
        )}>
          {trend === 'up'   && <TrendingUp className="h-3 w-3" />}
          {trend === 'down' && <TrendingDown className="h-3 w-3" />}
          {trend === 'flat' && <Minus className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}% {deltaLabel ?? 'vs last 7d'}
        </div>
      )}
    </div>
  );
}
