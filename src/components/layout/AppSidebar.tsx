'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Store,
  Sprout,
  ShoppingBag,
  Building2,
  Truck,
  ShieldCheck,
  Package,
  User,
  ChevronRight,
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const pathname = usePathname();

  const navItems = [
    {
      label: 'Marketplace',
      href: '/marketplace',
      icon: Store,
      badge: 'Core',
    },
    {
      label: 'Farmer / FPO',
      href: '/farmer',
      icon: Sprout,
      badge: 'Producer',
    },
    {
      label: 'Consumer Hub',
      href: '/consumer',
      icon: ShoppingBag,
      badge: 'Retail',
    },
    {
      label: 'Bulk Buyer',
      href: '/bulk-buyer',
      icon: Building2,
      badge: 'B2B',
    },
    {
      label: 'Delivery & Route',
      href: '/delivery',
      icon: Truck,
      badge: 'Logistics',
    },
    {
      label: 'Platform Admin',
      href: '/admin',
      icon: ShieldCheck,
      badge: 'Ops',
    },
    {
      label: 'Orders & Tracking',
      href: '/orders',
      icon: Package,
    },
    {
      label: 'Profile & Roles',
      href: '/profile',
      icon: User,
    },
  ];

  return (
    <>
      {/* Desktop Sidebar Navigation */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-agri-earth-200 bg-white min-h-[calc(100vh-4rem)] p-4 shrink-0 justify-between">
        <div className="space-y-6">
          {/* Section Header */}
          <div className="px-3 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-agri-earth-700">
              Application Modules
            </span>
          </div>

          {/* Navigation Links List */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all group',
                    isActive
                      ? 'bg-agri-evergreen text-white shadow-sm'
                      : 'text-agri-earth-800 hover:bg-agri-earth-100 hover:text-agri-evergreen'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={cn(
                        'h-4 w-4 transition-transform group-hover:scale-110',
                        isActive ? 'text-agri-sprout-bright' : 'text-agri-earth-700'
                      )}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={cn(
                        'text-[10px] font-bold px-2 py-0.5 rounded-full',
                        isActive
                          ? 'bg-agri-sprout text-white'
                          : 'bg-agri-earth-100 text-agri-earth-800'
                      )}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Footer Info */}
        <div className="p-3 rounded-2xl bg-agri-sprout-soft/40 border border-agri-sprout-bright/30 text-xs space-y-1">
          <div className="font-bold text-agri-evergreen flex items-center justify-between">
            <span>5 Ecosystem Roles</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </div>
          <p className="text-[11px] text-agri-earth-700 leading-tight">
            Navigation structure ready for module functionality.
          </p>
        </div>
      </aside>

      {/* Mobile/Tablet Horizontal Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-agri-earth-200 px-2 py-2 flex items-center justify-around shadow-lg">
        {navItems.slice(0, 5).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-1 p-1.5 rounded-xl text-[10px] font-medium transition-colors',
                isActive ? 'text-agri-evergreen font-bold' : 'text-agri-earth-700'
              )}
            >
              <Icon className={cn('h-5 w-5', isActive ? 'text-agri-sprout' : 'text-agri-earth-700')} />
              <span>{item.label.split(' ')[0]}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};
