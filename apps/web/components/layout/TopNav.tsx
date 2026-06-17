'use client';

import { Search, Bell, ChevronDown } from 'lucide-react';
import { cn } from '@sitepulse/ui';

interface TopNavProps {
  breadcrumb?: Array<{ label: string; href?: string }>;
}

export function TopNav({ breadcrumb }: TopNavProps) {
  return (
    <header className="flex items-center justify-between h-14 px-6 bg-white border-b border-[#E6E5EC] shrink-0">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-[13px]">
          {breadcrumb?.map((item, i) => (
            <li key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-[#CBD5E1]">/</span>}
              {item.href ? (
                <a href={item.href} className="text-[#64748B] hover:text-[#0F172A] transition-colors">
                  {item.label}
                </a>
              ) : (
                <span className="text-[#0F172A] font-medium">{item.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Search */}
        <button className={cn(
          'flex items-center gap-2 h-8 px-3 rounded-md',
          'border border-[#E6E5EC] bg-white',
          'text-[#94A3B8] text-[13px]',
          'hover:border-[#CBD5E1] hover:text-[#64748B]',
          'transition-colors duration-[120ms]',
        )}>
          <Search className="h-3.5 w-3.5" />
          <span>Search...</span>
          <kbd className="ml-1 text-xs text-[#CBD5E1] font-mono">⌘K</kbd>
        </button>

        {/* Notifications */}
        <button
          className={cn(
            'relative flex items-center justify-center w-8 h-8 rounded-md',
            'border border-[#E6E5EC] bg-white text-[#64748B]',
            'hover:bg-[#F8FAFC] hover:text-[#0F172A]',
            'transition-colors duration-[120ms]',
          )}
          aria-label="Notifications"
        >
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#3353FE]" />
        </button>

        {/* User avatar */}
        <button className={cn(
          'flex items-center gap-2 h-8 px-2.5 rounded-md',
          'border border-[#E6E5EC] bg-white',
          'hover:bg-[#F8FAFC]',
          'transition-colors duration-[120ms]',
        )}>
          <div className="w-5 h-5 rounded-full gradient-brand flex items-center justify-center">
            <span className="text-white text-xs font-bold">U</span>
          </div>
          <ChevronDown className="h-3 w-3 text-[#94A3B8]" />
        </button>
      </div>
    </header>
  );
}
