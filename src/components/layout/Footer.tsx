import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { APP_NAME, PROBLEM_STATEMENT_ID } from '@/utils/constants';
import { Sprout, Heart, Shield } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-agri-earth-200 bg-agri-earth-800 text-agri-earth-100 pt-16 pb-12">
      <Container size="lg">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="md:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-agri-sprout text-agri-earth-900 shadow-sm">
                <Sprout className="h-5 w-5 text-agri-evergreen-dark" />
              </div>
              <div className="flex flex-col">
                <span className="font-extrabold text-xl tracking-tight text-white">
                  {APP_NAME}
                </span>
                <span className="text-xs text-agri-earth-300">
                  Direct Farm-to-Consumer & AI Logistics
                </span>
              </div>
            </Link>
            <p className="text-sm text-agri-earth-300 leading-relaxed max-w-sm">
              Empowering agricultural producers with direct buyer access, fair price discovery, hyperlocal community ordering, and AI-assisted regional logistics routes.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <Badge variant="sprout" className="bg-agri-evergreen-light text-white border-0 text-[11px]">
                SIH Problem Statement {PROBLEM_STATEMENT_ID}
              </Badge>
              <Badge variant="outline" className="text-agri-earth-300 border-agri-earth-700 text-[11px]">
                Direct Marketplace Architecture
              </Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-agri-harvest-sand mb-4">
              Navigation
            </h4>
            <ul className="space-y-2.5 text-sm text-agri-earth-300">
              <li>
                <a href="/" className="hover:text-white transition-colors">
                  Home
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#platform" className="hover:text-white transition-colors">
                  Platform Pillars
                </a>
              </li>
              <li>
                <a href="#roles" className="hover:text-white transition-colors">
                  Ecosystem Roles
                </a>
              </li>
            </ul>
          </div>

          {/* Core Pillars */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-agri-harvest-sand mb-4">
              Platform Pillars
            </h4>
            <ul className="space-y-2.5 text-sm text-agri-earth-300">
              <li>Direct Farmer Marketplace</li>
              <li>Fair Price Engine</li>
              <li>Hyperlocal Community Carts</li>
              <li>Smart Route & Logistics</li>
              <li>ONDC Readiness</li>
            </ul>
          </div>

          {/* Preserved Roles */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-agri-harvest-sand mb-4">
              Preserved Roles
            </h4>
            <ul className="space-y-2.5 text-sm text-agri-earth-300">
              <li>Farmer & FPO</li>
              <li>Consumer</li>
              <li>Bulk Buyer</li>
              <li>Delivery Partner</li>
              <li>Platform Admin</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-agri-earth-700 flex flex-col sm:flex-row items-center justify-between text-xs text-agri-earth-300 gap-4">
          <p>© {new Date().getFullYear()} {APP_NAME}. Smart India Hackathon {PROBLEM_STATEMENT_ID}.</p>
          <div className="flex items-center gap-2 text-agri-earth-300">
            <Shield className="h-4 w-4 text-agri-sprout-bright" />
            <span>Built with clean, scalable technical foundation</span>
          </div>
        </div>
      </Container>
    </footer>
  );
};
