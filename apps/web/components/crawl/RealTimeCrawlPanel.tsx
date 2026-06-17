'use client';

import { useRef, useEffect, useState } from 'react';
import { CheckCircle, XCircle, ArrowRightLeft, Loader2, X } from 'lucide-react';
import { Badge, Button, Progress, Card, CardHeader, CardTitle, CardContent } from '@sitepulse/ui';
import { cn } from '@sitepulse/ui';
import { formatMs, formatNumber } from '@/lib/formatters';
import { useCrawlWebSocket, type LiveFeedItem } from '@/hooks/useCrawlWebSocket';

interface RealTimeCrawlPanelProps {
  jobId: string;
  token: string;
  onCancel?: () => void;
}

export function RealTimeCrawlPanel({ jobId, token, onCancel }: RealTimeCrawlPanelProps) {
  const { status, jobStatus, stats, liveFeed } = useCrawlWebSocket(jobId, token);
  const feedRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && !paused && feedRef.current) {
      feedRef.current.scrollTop = feedRef.current.scrollHeight;
    }
  }, [liveFeed, autoScroll, paused]);

  const progress = stats
    ? stats.totalPages > 0
      ? Math.round((stats.scanned / stats.totalPages) * 100)
      : 0
    : 0;

  const isActive = jobStatus === 'running' || jobStatus === 'queued';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CardTitle>Crawl #{jobId.slice(-8)}</CardTitle>
            <Badge
              variant={
                jobStatus === 'running'   ? 'info' :
                jobStatus === 'completed' ? 'success' :
                jobStatus === 'failed'    ? 'danger' :
                jobStatus === 'cancelled' ? 'neutral' : 'warning'
              }
              dot={isActive}
              pulse={isActive}
            >
              {jobStatus ?? 'queued'}
            </Badge>
            {status === 'connecting' && (
              <span className="text-xs text-[#94A3B8] flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" /> Connecting...
              </span>
            )}
          </div>
          {isActive && onCancel && (
            <Button variant="secondary" size="sm" leftIcon={<X />} onClick={onCancel}>
              Cancel
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] text-[#64748B]">
              {stats ? `${formatNumber(stats.scanned)} / ${formatNumber(stats.totalPages || stats.scanned)} pages` : 'Waiting...'}
            </span>
            <span className="text-[12px] font-medium text-[#0F172A]">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Scanned',   value: stats?.scanned ?? 0,         color: 'text-[#0F172A]' },
            { label: 'Broken',    value: stats?.broken ?? 0,          color: stats?.broken ? 'text-[#EF4444]' : 'text-[#10B981]' },
            { label: 'Redirects', value: stats?.redirects ?? 0,       color: 'text-[#F59E0B]' },
            { label: 'Avg Latency', value: formatMs(stats?.avgResponseMs), color: 'text-[#64748B]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#F8FAFC] rounded-md p-3 text-center">
              <div className={cn('text-[18px] font-heading font-bold', color)}>
                {typeof value === 'number' ? formatNumber(value) : value}
              </div>
              <div className="text-[11px] text-[#94A3B8] uppercase tracking-wide mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Live feed */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[12px] font-medium text-[#64748B] uppercase tracking-wider">
              Live Feed
            </span>
            <button
              onClick={() => setPaused((p) => !p)}
              className="text-xs text-[#94A3B8] hover:text-[#64748B] transition-colors"
            >
              {paused ? 'Resume' : 'Pause'}
            </button>
          </div>

          <div
            ref={feedRef}
            onMouseEnter={() => setAutoScroll(false)}
            onMouseLeave={() => setAutoScroll(true)}
            className="h-48 overflow-y-auto rounded-md bg-[#0F172A] p-3 font-mono text-[11px] space-y-0.5"
          >
            {liveFeed.length === 0 ? (
              <span className="text-[#475569]">Waiting for crawl to begin...</span>
            ) : (
              liveFeed.map((item) => (
                <FeedRow key={item.id} item={item} />
              ))
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function FeedRow({ item }: { item: LiveFeedItem }) {
  return (
    <div className="flex items-center gap-2 leading-5">
      {item.type === 'ok' && (
        <CheckCircle className="h-3 w-3 text-[#10B981] shrink-0" />
      )}
      {item.type === 'broken' && (
        <XCircle className="h-3 w-3 text-[#EF4444] shrink-0" />
      )}
      {item.type === 'redirect' && (
        <ArrowRightLeft className="h-3 w-3 text-[#F59E0B] shrink-0" />
      )}

      <span className={cn(
        'min-w-[36px]',
        item.type === 'ok'       && 'text-[#10B981]',
        item.type === 'broken'   && 'text-[#EF4444]',
        item.type === 'redirect' && 'text-[#F59E0B]',
      )}>
        {item.statusCode ?? '---'}
      </span>

      <span className="text-[#94A3B8] truncate flex-1">{item.url}</span>

      {item.responseTimeMs !== null && (
        <span className="text-[#475569] shrink-0 text-right w-14">
          {formatMs(item.responseTimeMs)}
        </span>
      )}
    </div>
  );
}
