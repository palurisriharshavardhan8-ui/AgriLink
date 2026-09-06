'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { APP_NAME, PROBLEM_STATEMENT_ID } from '@/utils/constants';
import { Sprout, Menu, X, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '#' },
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Platform Pillars', href: '#platform' },
    { label: 'Ecosystem Roles', href: '#roles' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-agri-earth-200/80 bg-white/95 backdrop-blur-md transition-all">
      <Container size="lg">
        <div className="flex h-20 items-center justify-between">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-agri-evergreen text-white shadow-sm transition-transform group-hover:scale-105">
              <Sprout className="h-6 w-6 text-agri-sprout-bright" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-agri-earth-900">
                  {APP_NAME}
                </span>
                <Badge variant="sprout" className="text-[10px] py-0 px-2 hidden sm:inline-flex">
                  SIH {PROBLEM_STATEMENT_ID}
                </Badge>
              </div>
              <span className="text-xs font-medium text-agri-earth-700 leading-tight">
                Farm-to-Consumer & AI Logistics
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-sm font-medium text-agri-earth-800 hover:text-agri-evergreen transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Desktop Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const el = document.getElementById('roles');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              Explore Roles
            </Button>
            <Button
              variant="primary"
              size="sm"
              className="gap-2"
              onClick={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <span>Get Started</span>
              <ArrowRight className="h-4 w-4 text-agri-sprout-bright" />
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="lg:hidden p-2 rounded-xl text-agri-earth-800 hover:bg-agri-earth-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-agri-earth-200 py-4 px-2 space-y-3 bg-white animate-in slide-in-from-top-2 duration-200">
            <nav className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium text-agri-earth-800 hover:bg-agri-earth-100 hover:text-agri-evergreen transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.label}
                </a>
              ))}
            </nav>
            <div className="pt-2 border-t border-agri-earth-100 flex flex-col gap-2 px-2">
              <Button
                variant="outline"
                size="md"
                className="w-full justify-center"
                onClick={() => {
                  setMobileMenuOpen(false);
                  const el = document.getElementById('roles');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                Explore Roles
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-full justify-center gap-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  const el = document.getElementById('how-it-works');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
              >
                <span>Get Started</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Container>
    </header>
  );
};
