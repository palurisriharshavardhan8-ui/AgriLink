'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { APP_NAME } from '@/utils/constants';
import { Sprout, Search, Globe, User, Bell } from 'lucide-react';

export const AppHeader: React.FC = () => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-agri-earth-200 bg-white/95 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
        {/* Left: Brand Logo & Workspace Tag */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-agri-evergreen text-white transition-transform group-hover:scale-105">
              <Sprout className="h-5 w-5 text-agri-sprout-bright" />
            </div>
            <span className="font-extrabold text-lg tracking-tight text-agri-earth-900 hidden sm:inline-block">
              {APP_NAME}
            </span>
          </Link>
          <span className="text-agri-earth-300 hidden sm:inline-block">|</span>
          <Badge variant="sprout" className="text-[11px] font-semibold">
            App Console
          </Badge>
        </div>

        {/* Center: Quick Search Bar Placeholder */}
        <div className="hidden md:flex flex-1 max-w-md items-center relative">
          <Input
            placeholder="Search produce, FPO listings, delivery routes, orders..."
            className="pl-9 text-xs h-9 bg-agri-earth-50 border-agri-earth-200 focus:bg-white"
          />
          <Search className="h-4 w-4 text-agri-earth-700 absolute left-3 top-2.5 pointer-events-none" />
        </div>

        {/* Right: Actions, Back to Public Site, User Profile Shell */}
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-agri-earth-700 hover:text-agri-evergreen">
              <Globe className="h-4 w-4" />
              <span className="hidden md:inline">Public Website</span>
            </Button>
          </Link>

          <button
            type="button"
            className="h-9 w-9 rounded-xl border border-agri-earth-200 bg-white flex items-center justify-center text-agri-earth-700 hover:bg-agri-earth-100 transition-colors relative"
            title="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-agri-sprout" />
          </button>

          {/* User Profile Avatar Placeholder */}
          <div className="flex items-center gap-2.5 pl-2 border-l border-agri-earth-200">
            <div className="h-8 w-8 rounded-full bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen flex items-center justify-center font-bold text-xs">
              <User className="h-4 w-4" />
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-bold text-agri-earth-900 leading-none">
                AgriLink User
              </span>
              <span className="text-[10px] text-agri-earth-700 leading-tight">
                Role Select Active
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
