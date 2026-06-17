'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import {
  LayoutDashboard, Globe, ScanSearch, Activity, BarChart2,
  Plug, Settings, ChevronLeft, ChevronRight, Zap,
} from 'lucide-react';
import { cn } from '@sitepulse/ui';

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard },
  { label: 'Projects',   href: '/projects',   icon: Globe },
  { label: 'Crawls',     href: '/crawls',     icon: ScanSearch },
  { label: 'Uptime',     href: '/uptime',     icon: Activity },
  { label: 'Reports',    href: '/reports',    icon: BarChart2 },
  { label: 'Integrations', href: '/integrations', icon: Plug },
] as const;

const BOTTOM_ITEMS = [
  { label: 'Settings',   href: '/settings',   icon: Settings },
] as const;

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        'relative flex flex-col h-full bg-white border-r border-[#E6E5EC]',
        'transition-[width] duration-200 ease-in-out',
        collapsed ? 'w-16' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className={cn(
        'flex items-center gap-2.5 px-4 h-14 border-b border-[#E6E5EC] shrink-0',
        collapsed && 'justify-center px-0'
      )}>
        <div className="flex items-center justify-center w-7 h-7 rounded-md gradient-brand shrink-0">
          <Zap className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
        </div>
        {!collapsed && (
          <span className="font-heading font-bold text-[15px] text-[#0F172A] tracking-tight">
            SitePulse
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/');
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-2.5 h-8 rounded-md text-[13px] font-medium',
                    'transition-colors duration-[120ms]',
                    collapsed ? 'justify-center px-0 w-10 mx-auto' : 'px-3',
                    active
                      ? 'bg-[#EEF2FF] text-[#3353FE]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  )}
                >
                  <Icon
                    className={cn(
                      'shrink-0',
                      collapsed ? 'h-4 w-4' : 'h-3.5 w-3.5',
                      active ? 'text-[#3353FE]' : 'text-current'
                    )}
                    strokeWidth={active ? 2.2 : 1.8}
                  />
                  {!collapsed && label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="py-3 border-t border-[#E6E5EC]">
        <ul className="space-y-0.5 px-2">
          {BOTTOM_ITEMS.map(({ label, href, icon: Icon }) => {
            const active = pathname === href;
            return (
              <li key={href}>
                <Link
                  href={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    'flex items-center gap-2.5 h-8 rounded-md text-[13px] font-medium',
                    'transition-colors duration-[120ms]',
                    collapsed ? 'justify-center px-0 w-10 mx-auto' : 'px-3',
                    active
                      ? 'bg-[#EEF2FF] text-[#3353FE]'
                      : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
                  {!collapsed && label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className={cn(
          'absolute -right-3 top-[72px]',
          'flex items-center justify-center w-6 h-6 rounded-full',
          'bg-white border border-[#E6E5EC] shadow-xs',
          'text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1]',
          'transition-colors duration-[120ms] z-10',
        )}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight className="h-3 w-3" />
          : <ChevronLeft className="h-3 w-3" />
        }
      </button>
    </aside>
  );
}
