import { Suspense } from 'react';
import { Globe, AlertTriangle, Activity, ScanSearch } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { Skeleton } from '@sitepulse/ui';

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Overview of your website monitoring"
      />

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatsCard
          label="Total Projects"
          value={8}
          delta={12.5}
          icon={<Globe className="h-4 w-4" />}
        />
        <StatsCard
          label="Broken Links"
          value={37}
          delta={-8.2}
          deltaLabel="vs last crawl"
          icon={<AlertTriangle className="h-4 w-4" />}
        />
        <StatsCard
          label="Avg Uptime"
          value="99.87%"
          delta={0.04}
          icon={<Activity className="h-4 w-4" />}
        />
        <StatsCard
          label="Crawls (7d)"
          value={24}
          delta={33.3}
          icon={<ScanSearch className="h-4 w-4" />}
        />
      </div>

      {/* Recent activity placeholder */}
      <div className="bg-white rounded-lg border border-[#E6E5EC] shadow-sm p-6">
        <h2 className="font-heading font-semibold text-[15px] text-[#0F172A] mb-4">
          Recent Crawls
        </h2>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <div className="space-y-2">
            {['example.com', 'acme.io', 'startup.app'].map((site) => (
              <div
                key={site}
                className="flex items-center justify-between py-2.5 border-b border-[#F1F5F9] last:border-0"
              >
                <div>
                  <span className="text-[13px] font-medium text-[#0F172A]">{site}</span>
                  <span className="ml-2 text-[12px] text-[#94A3B8]">2h ago</span>
                </div>
                <span className="text-[12px] text-[#10B981] font-medium">Completed</span>
              </div>
            ))}
          </div>
        </Suspense>
      </div>
    </>
  );
}
