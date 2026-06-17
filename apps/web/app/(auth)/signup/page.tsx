'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Zap } from 'lucide-react';
import { Button, Input, Card, CardContent } from '@sitepulse/ui';
import { trpc } from '@/lib/trpc';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const register = trpc.auth.register.useMutation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    register.mutate({ email, name: name || undefined });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="flex items-center justify-center w-9 h-9 rounded-lg gradient-brand">
            <Zap className="h-5 w-5 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-heading font-bold text-[20px] text-[#0F172A]">SitePulse</span>
        </div>

        <Card>
          <CardContent className="pt-6 pb-6">
            <h1 className="font-heading font-bold text-[18px] text-[#0F172A] mb-1">
              Create account
            </h1>
            <p className="text-[13px] text-[#64748B] mb-5">
              Start monitoring your websites today.
            </p>

            <form onSubmit={handleSubmit} className="space-y-3">
              <Input
                label="Name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Input
                label="Email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {register.error && (
                <p className="text-xs text-[#EF4444]">{register.error.message}</p>
              )}
              {register.isSuccess && (
                <p className="text-xs text-[#10B981]">Account created! Check your email.</p>
              )}
              <Button
                type="submit"
                className="w-full"
                loading={register.isPending}
              >
                Create Account
              </Button>
            </form>

            <p className="mt-4 text-center text-[12px] text-[#94A3B8]">
              Already have an account?{' '}
              <Link href="/login" className="text-[#3353FE] hover:underline">
                Sign in
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
