import React from 'react';
import Link from 'next/link';
import { Sprout, Globe } from 'lucide-react';
import { APP_NAME } from '@/utils/constants';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-agri-sprout-soft/40 via-agri-earth-50 to-agri-earth-50">
      {/* Auth Header */}
      <header className="w-full py-6 px-6 flex items-center justify-between max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-agri-evergreen text-white shadow-sm transition-transform group-hover:scale-105">
            <Sprout className="h-5 w-5 text-agri-sprout-bright" />
          </div>
          <span className="font-extrabold text-xl tracking-tight text-agri-earth-900">
            {APP_NAME}
          </span>
        </Link>

        <Link
          href="/"
          className="text-xs font-semibold text-agri-earth-700 hover:text-agri-evergreen flex items-center gap-1.5 transition-colors"
        >
          <Globe className="h-4 w-4" />
          <span>Back to Home</span>
        </Link>
      </header>

      {/* Auth Main Body */}
      <main className="flex-1 flex items-center justify-center p-4 py-8">
        {children}
      </main>

      {/* Auth Footer */}
      <footer className="py-4 text-center text-xs text-agri-earth-700">
        <p>© {new Date().getFullYear()} {APP_NAME}. SIH Problem Statement SIH26033.</p>
      </footer>
    </div>
  );
}
