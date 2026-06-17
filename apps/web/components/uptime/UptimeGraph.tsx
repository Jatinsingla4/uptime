'use client';

import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  CartesianGrid, Tooltip, ReferenceLine,
} from 'recharts';
import type { UptimeStatsSeries, UptimeIncident } from '@sitepulse/shared/types';
import { formatMs } from '@/lib/formatters';
import { Skeleton } from '@sitepulse/ui';

interface UptimeGraphProps {
  series: UptimeStatsSeries[];
  incidents: UptimeIncident[];
  loading?: boolean;
}

export function UptimeGraph({ series, incidents, loading }: UptimeGraphProps) {
  if (loading) {
    return <Skeleton className="h-[200px] w-full rounded-lg" />;
  }

  if (series.length === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[#94A3B8] text-sm">
        No data yet
      </div>
    );
  }

  const data = series.map((s) => ({
    t: s.t,
    ms: s.ms ?? 0,
    up: s.up ? 1 : 0,
  }));

  return (
    <div className="h-[200px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="uptimeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="#3353FE" stopOpacity={0.15} />
              <stop offset="95%" stopColor="#3353FE" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
          <XAxis
            dataKey="t"
            tickFormatter={(t) => new Date(t).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v) => formatMs(v)}
            tick={{ fontSize: 11, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            contentStyle={{
              background: '#FFFFFF',
              border: '1px solid #E6E5EC',
              borderRadius: '6px',
              fontSize: '12px',
              padding: '8px 12px',
            }}
            formatter={(value: number) => [formatMs(value), 'Response time']}
            labelFormatter={(t) => new Date(t).toLocaleString()}
          />
          {incidents.map((inc) => (
            <ReferenceLine
              key={inc.id}
              x={inc.startedAt}
              stroke="#EF4444"
              strokeDasharray="4 4"
              strokeWidth={1}
              label={{ value: 'Incident', fill: '#EF4444', fontSize: 10 }}
            />
          ))}
          <Area
            type="monotone"
            dataKey="ms"
            stroke="#3353FE"
            strokeWidth={1.5}
            fill="url(#uptimeGradient)"
            dot={false}
            activeDot={{ r: 4, fill: '#3353FE', stroke: '#FFFFFF', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
