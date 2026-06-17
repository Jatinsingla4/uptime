'use client';

import Link from 'next/link';
import { ExternalLink, Play, MoreHorizontal } from 'lucide-react';
import { Badge, Button, Skeleton } from '@sitepulse/ui';
import { StatusBadge } from '@/components/uptime/StatusBadge';
import { formatRelative, formatMs, formatUptimePercent } from '@/lib/formatters';
import type { Project } from '@sitepulse/shared/types';
import { cn } from '@sitepulse/ui';

interface ProjectWithStats extends Project {
  latestCrawlJobId?: string;
  latestCrawlStatus?: string;
  latestCrawlAt?: number;
  brokenLinksCount?: number;
  uptimePercent?: number;
  avgResponseMs?: number;
  isUp?: boolean | null;
}

interface WebsiteMonitoringTableProps {
  projects: ProjectWithStats[];
  loading?: boolean;
  onStartCrawl: (projectId: string) => void;
}

const COL_CLASS = 'px-4 py-3 text-[13px]';

export function WebsiteMonitoringTable({
  projects, loading, onStartCrawl,
}: WebsiteMonitoringTableProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-[#E6E5EC] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <TableHeader />
          </thead>
          <tbody>
            {Array.from({ length: 4 }).map((_, i) => (
              <tr key={i} className="border-t border-[#F1F5F9]">
                {Array.from({ length: 7 }).map((_, j) => (
                  <td key={j} className={COL_CLASS}>
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-[#E6E5EC] shadow-sm overflow-hidden">
        <table className="w-full">
          <thead><TableHeader /></thead>
        </table>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-10 h-10 rounded-full bg-[#F8FAFC] flex items-center justify-center mb-3">
            <ExternalLink className="h-5 w-5 text-[#94A3B8]" />
          </div>
          <p className="text-[14px] font-medium text-[#0F172A] mb-1">No websites monitored yet</p>
          <p className="text-[13px] text-[#64748B]">Add a website to start monitoring uptime and broken links.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-[#E6E5EC] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead><TableHeader /></thead>
          <tbody>
            {projects.map((p) => (
              <tr
                key={p.id}
                className="border-t border-[#F1F5F9] hover:bg-[#F8FAFC] transition-colors duration-[120ms] cursor-pointer"
              >
                {/* Name + URL */}
                <td className={COL_CLASS}>
                  <Link href={`/projects/${p.id}`} className="group">
                    <div className="font-medium text-[#0F172A] group-hover:text-[#3353FE] transition-colors">
                      {p.name}
                    </div>
                    <div className="text-[12px] text-[#94A3B8] flex items-center gap-1 mt-0.5">
                      {p.baseUrl}
                      <ExternalLink className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </Link>
                </td>

                {/* Status */}
                <td className={COL_CLASS}>
                  <StatusBadge isUp={p.isUp ?? null} paused={!p.monitoringEnabled} />
                </td>

                {/* Uptime 7d */}
                <td className={COL_CLASS}>
                  <span className={cn(
                    'font-medium text-[13px]',
                    (p.uptimePercent ?? 100) >= 99.9 ? 'text-[#10B981]' :
                    (p.uptimePercent ?? 100) >= 99   ? 'text-[#F59E0B]' : 'text-[#EF4444]'
                  )}>
                    {p.uptimePercent !== undefined
                      ? formatUptimePercent(p.uptimePercent)
                      : '—'}
                  </span>
                </td>

                {/* Avg latency */}
                <td className={COL_CLASS}>
                  <span className="text-[#64748B]">{formatMs(p.avgResponseMs)}</span>
                </td>

                {/* Last crawl */}
                <td className={COL_CLASS}>
                  {p.latestCrawlAt ? (
                    <div>
                      <span className="text-[#64748B]">{formatRelative(p.latestCrawlAt)}</span>
                      {p.latestCrawlStatus && (
                        <Badge
                          variant={
                            p.latestCrawlStatus === 'completed' ? 'success' :
                            p.latestCrawlStatus === 'running'   ? 'info' :
                            p.latestCrawlStatus === 'failed'    ? 'danger' : 'neutral'
                          }
                          className="ml-2"
                        >
                          {p.latestCrawlStatus}
                        </Badge>
                      )}
                    </div>
                  ) : (
                    <span className="text-[#94A3B8]">Never</span>
                  )}
                </td>

                {/* Broken links */}
                <td className={COL_CLASS}>
                  {p.brokenLinksCount !== undefined ? (
                    <span className={cn(
                      'font-medium',
                      p.brokenLinksCount > 0 ? 'text-[#EF4444]' : 'text-[#10B981]'
                    )}>
                      {p.brokenLinksCount}
                    </span>
                  ) : (
                    <span className="text-[#94A3B8]">—</span>
                  )}
                </td>

                {/* Actions */}
                <td className={cn(COL_CLASS, 'text-right')}>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      leftIcon={<Play />}
                      onClick={(e) => { e.preventDefault(); onStartCrawl(p.id); }}
                    >
                      Crawl
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="More options">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TableHeader() {
  const headers = [
    'Website', 'Status', 'Uptime (7d)', 'Avg Latency', 'Last Crawl', 'Broken Links', 'Actions',
  ];
  return (
    <tr className="bg-[#F8FAFC]">
      {headers.map((h) => (
        <th
          key={h}
          className="px-4 py-2.5 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E6E5EC]"
        >
          {h}
        </th>
      ))}
    </tr>
  );
}
