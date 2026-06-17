'use client';

import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, Button, Input } from '@sitepulse/ui';

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your account and preferences" />
      <div className="max-w-[640px] space-y-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input label="Name" placeholder="Your name" />
              <Input label="Email" type="email" placeholder="you@example.com" />
              <Button>Save Changes</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>API Keys</CardTitle></CardHeader>
          <CardContent>
            <p className="text-[13px] text-[#64748B] mb-4">
              Use API keys to authenticate programmatic access to SitePulse.
            </p>
            <Button variant="secondary">Generate New Key</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent>
            <p className="text-[13px] text-[#64748B]">
              Configure email, Slack, or webhook notifications for downtime alerts.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
