'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@sitepulse/ui';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Magic link / JWT auth flow
    setTimeout(() => setLoading(false), 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-brand">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-[20px] text-[#0F172A]">SitePulse</span>
        </div>

        <Card>
          <CardContent className="pt-6 pb-6">
            <h1 className="font-heading font-bold text-[18px] text-[#0F172A] mb-1">
              Sign in
            </h1>
            <p className="text-[13px] text-[#64748B] mb-5">
              Enter your email to receive a login link.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button type="submit" className="w-full" loading={loading}>
                Continue with Email
              </Button>
            </form>

            <p className="mt-4 text-center text-[12px] text-[#94A3B8]">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="text-[#3353FE] hover:underline">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
