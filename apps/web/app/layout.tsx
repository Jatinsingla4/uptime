import type { Metadata } from 'next';
import '@/styles/globals.css';
import { TRPCProvider } from '@/lib/trpc-provider';

export const metadata: Metadata = {
  title: { default: 'SitePulse', template: '%s — SitePulse' },
  description: 'Enterprise website monitoring: broken links, uptime, and crawl analytics.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>{children}</TRPCProvider>
      </body>
    </html>
  );
}
