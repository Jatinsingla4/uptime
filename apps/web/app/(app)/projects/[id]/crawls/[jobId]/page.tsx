'use client';

import { use } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { PageHeader } from '@/components/layout/PageHeader';
import { RealTimeCrawlPanel } from '@/components/crawl/RealTimeCrawlPanel';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Skeleton } from '@sitepulse/ui';
import { formatMs, statusCodeBadgeVariant } from '@/lib/formatters';

export default function CrawlDetailPage({
  params,
}: {
  params: Promise<{ id: string; jobId: string }>;
}) {
  const { id, jobId } = use(params);
  const { data: job, isLoading: jobLoading } = trpc.crawls.get.useQuery({ jobId });
  const { data: brokenLinks, isLoading: linksLoading } = trpc.crawls.brokenLinks.useQuery(
    { jobId },
    { enabled: !!jobId }
  );
  const cancelCrawl = trpc.crawls.cancel.useMutation();

  // Token from cookie — in production use auth context
  const token = typeof window !== 'undefined'
    ? document.cookie.match(/sp_token=([^;]+)/)?.[1] ?? ''
    : '';

  return (
    <>
      <div className="mb-4">
        <Link
          href={`/projects/${id}`}
          className="flex items-center gap-1 text-[13px] text-[#64748B] hover:text-[#0F172A] transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Back to project
        </Link>
      </div>

      <PageHeader
        title={`Crawl #${jobId.slice(-8)}`}
        description="Real-time crawl progress and results"
      />

      <div className="grid grid-cols-[1fr_360px] gap-6">
        {/* Left: results */}
        <div className="space-y-6">
          {/* Broken links table */}
          <Card>
            <CardHeader>
              <CardTitle>
                Broken Links
                {brokenLinks && brokenLinks.length > 0 && (
                  <span className="ml-2 text-[#EF4444]">({brokenLinks.length})</span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linksLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : brokenLinks?.length === 0 ? (
                <p className="text-[13px] text-[#10B981] font-medium">
                  No broken links found.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="bg-[#F8FAFC]">
                        {['URL', 'Status', 'Response Time', 'Found On'].map((h) => (
                          <th key={h} className="px-3 py-2 text-left text-[11px] font-semibold text-[#64748B] uppercase tracking-wider border-b border-[#E6E5EC]">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {brokenLinks?.map((r) => (
                        <tr key={r.id} className="border-b border-[#F1F5F9] hover:bg-[#F8FAFC]">
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-[12px] text-[#EF4444] truncate max-w-xs block">
                              {r.url}
                            </span>
                          </td>
                          <td className="px-3 py-2.5">
                            <Badge variant={statusCodeBadgeVariant(r.statusCode)}>
                              {r.statusCode ?? r.errorReason ?? 'Error'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-[#64748B]">
                            {formatMs(r.responseTimeMs)}
                          </td>
                          <td className="px-3 py-2.5">
                            <span className="font-mono text-[12px] text-[#94A3B8] truncate max-w-[200px] block">
                              {r.parentUrl ?? '—'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: live panel */}
        <div>
          <RealTimeCrawlPanel
            jobId={jobId}
            token={token}
            onCancel={
              job?.status === 'running'
                ? () => cancelCrawl.mutate({ jobId })
                : undefined
            }
          />
        </div>
      </div>
    </>
  );
}
