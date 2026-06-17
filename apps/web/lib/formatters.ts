/**
 * Display formatting utilities — all timestamps stored as UTC milliseconds.
 */

export function formatMs(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

export function formatDateTime(ms: number): string {
  return new Date(ms).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatRelative(ms: number): string {
  const diff = Date.now() - ms;
  const s = Math.floor(diff / 1000);
  if (s < 60)   return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60)   return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24)   return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function formatUptimePercent(pct: number): string {
  return `${pct.toFixed(2)}%`;
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-US').format(n);
}

export function statusCodeColor(code: number | null): string {
  if (code === null)             return 'text-[#94A3B8]';
  if (code >= 200 && code < 300) return 'text-[#10B981]';
  if (code >= 300 && code < 400) return 'text-[#F59E0B]';
  if (code >= 400 && code < 500) return 'text-[#EF4444]';
  if (code >= 500)               return 'text-[#EF4444]';
  return 'text-[#94A3B8]';
}

export function statusCodeBadgeVariant(
  code: number | null
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (code === null)             return 'neutral';
  if (code >= 200 && code < 300) return 'success';
  if (code >= 300 && code < 400) return 'warning';
  return 'danger';
}

export function jobStatusVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'neutral' | 'info' {
  switch (status) {
    case 'completed': return 'success';
    case 'running':   return 'info';
    case 'queued':    return 'warning';
    case 'failed':    return 'danger';
    case 'cancelled': return 'neutral';
    default:          return 'neutral';
  }
}
