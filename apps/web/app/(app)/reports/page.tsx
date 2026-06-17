'use client';

import { Download } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@sitepulse/ui';

export default function ReportsPage() {
  return (
    <>
      <PageHeader title="Reports" description="Export crawl results and uptime analytics" />
      <Card>
        <CardHeader>
          <CardTitle>Export Reports</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[13px] text-[#64748B] mb-4">
            Download detailed reports of your crawl results and uptime history.
          </p>
          <Button variant="secondary" leftIcon={<Download />}>
            Export as CSV
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
