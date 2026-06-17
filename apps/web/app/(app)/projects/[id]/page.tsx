'use client';

import { use } from 'react';
import { notFound } from 'next/navigation';
import { Activity, ScanSearch, Link as LinkIcon, Settings } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@sitepulse/ui';
import { UptimeGraph } from '@/components/uptime/UptimeGraph';
import { StatusBadge } from '@/components/uptime/StatusBadge';
import { formatMs, formatUptimePercent } from '@/lib/formatters';
import Link from 'next/link';

const TABS = [
  { id: 'overview', label: 'Overview',   icon: Activity },
  { id: 'crawls',   label: 'Crawls',     icon: ScanSearch },
  { id: 'uptime',   label: 'Uptime',     icon: Activity },
  { id: 'links',    label: 'Links',      icon: LinkIcon },
  { id: 'settings', label: 'Settings',  icon: Settings },
] as const;

export default function ProjectDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: project, isLoading: projectLoading } = trpc.projects.get.useQuery({ id });
  const { data: uptimeStats, isLoading: uptimeLoading } = trpc.uptime.stats.useQuery(
    { projectId: id, range: '24h' },
    { enabled: !!id }
  );
  const { data: crawls, isLoading: crawlsLoading } = trpc.crawls.list.useQuery(
    { projectId: id },
    { enabled: !!id }
  );

  if (!projectLoading && !project) notFound();

  return (
    <>
      <PageHeader
        title={project?.name ?? 'Loading...'}
        description={project?.baseUrl}
        actions={
          <div className="flex items-center gap-2">
            <StatusBadge isUp={true} />
            <Button variant="secondary">Configure</Button>
          </div>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase text-[#64748B] tracking-wider mb-1">Uptime (24h)</p>
            <p className="text-[24px] font-heading font-bold text-[#10B981]">
              {formatUptimePercent(uptimeStats?.uptimePercent ?? 100)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase text-[#64748B] tracking-wider mb-1">Avg Response</p>
            <p className="text-[24px] font-heading font-bold text-[#0F172A]">
              {formatMs(uptimeStats?.avgResponseMs)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-[11px] uppercase text-[#64748B] tracking-wider mb-1">Total Checks</p>
            <p className="text-[24px] font-heading font-bold text-[#0F172A]">
              {uptimeStats?.totalChecks ?? 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Uptime graph */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Response Time (24h)</CardTitle>
        </CardHeader>
        <CardContent>
          <UptimeGraph
            series={uptimeStats?.series ?? []}
            incidents={uptimeStats?.incidents ?? []}
            loading={uptimeLoading}
          />
        </CardContent>
      </Card>

      {/* Recent crawls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Crawls</CardTitle>
            <Button variant="secondary" size="sm">
              Start Crawl
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {crawlsLoading ? (
            <p className="text-[13px] text-[#94A3B8]">Loading...</p>
          ) : crawls?.items.length === 0 ? (
            <p className="text-[13px] text-[#94A3B8]">No crawls yet.</p>
          ) : (
            <div className="space-y-2">
              {crawls?.items.map((job) => (
                <Link
                  key={job.id}
                  href={`/projects/${id}/crawls/${job.id}`}
                  className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] -mx-5 px-5 transition-colors"
                >
                  <div>
                    <span className="text-[13px] font-medium text-[#0F172A]">#{job.id.slice(-8)}</span>
                    <span className="ml-2 text-[12px] text-[#94A3B8]">
                      {job.stats ? `${job.stats.scanned} pages · ${job.stats.broken} broken` : '—'}
                    </span>
                  </div>
                  <span className={`text-[12px] font-medium ${
                    job.status === 'completed' ? 'text-[#10B981]' :
                    job.status === 'running'   ? 'text-[#3353FE]' :
                    job.status === 'failed'    ? 'text-[#EF4444]' : 'text-[#94A3B8]'
                  }`}>
                    {job.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
