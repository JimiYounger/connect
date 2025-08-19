'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Users, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ContactsNavigation() {
  const pathname = usePathname();

  const navigationItems = [
    {
      href: '/contacts',
      label: 'Directory',
      icon: Users,
      description: 'Browse team contacts'
    },
    {
      href: '/contacts/faq',
      label: 'Contact FAQ',
      icon: HelpCircle,
      description: 'Get help with who to contact'
    }
  ];

  return (
    <nav className="grid grid-cols-2 gap-1 bg-slate-100 p-1 rounded-lg">
      {navigationItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;
        
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors min-h-[44px]',
              isActive
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}