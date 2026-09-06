'use client';

import React from 'react';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { AGRI_ROLES, APP_NAME, PROBLEM_STATEMENT_ID } from '@/utils/constants';
import {
  Sprout,
  Store,
  TrendingUp,
  Truck,
  Users,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  MapPin,
  CheckCircle2,
  Layers,
  ArrowDown,
  Building2,
  UserCheck,
  CircleDollarSign,
  Activity,
  Boxes,
  LayoutDashboard,
} from 'lucide-react';

export default function LandingPage() {
  const valueProps = [
    {
      icon: Store,
      badge: 'Direct Trade',
      title: 'Direct Farmer-to-Buyer Connection',
      description:
        'Connects agricultural producers directly with retail consumers and bulk institutions, cutting unnecessary intermediary overhead.',
    },
    {
      icon: TrendingUp,
      badge: 'Transparency',
      title: 'Transparent & Fair Price Discovery',
      description:
        'Provides real mandi benchmark pricing so farmers secure earned profits and buyers pay honest, transparent market rates.',
    },
    {
      icon: Users,
      badge: 'Savings',
      title: 'Community Order Aggregation',
      description:
        'Groups nearby neighbor orders into shared Hyperlocal Community Carts to lower last-mile delivery fees and carbon footprints.',
    },
    {
      icon: Truck,
      badge: 'Logistics',
      title: 'Smarter Agricultural Logistics',
      description:
        'Intelligently routes farm pickups and neighborhood drop-offs, keeping produce fresh while optimizing local driver trips.',
    },
  ];

  const workflowSteps = [
    {
      step: '01',
      role: 'Farmer / FPO',
      action: 'List Produce',
      description: 'Farmer or FPO creates a fresh produce batch listing with volume and harvest details.',
      icon: Sprout,
    },
    {
      step: '02',
      role: 'Consumer / Bulk Buyer',
      action: 'Buyer Orders',
      description: 'Retail consumers and commercial buyers discover produce and place direct orders.',
      icon: ShoppingBag,
    },
    {
      step: '03',
      role: 'Platform Ecosystem',
      action: 'Order Aggregation',
      description: 'Nearby buyer orders are grouped into Hyperlocal Community Carts for route efficiency.',
      icon: Boxes,
    },
    {
      step: '04',
      role: 'Delivery Partner',
      action: 'Smart Logistics',
      description: 'Optimized pickup and drop-off routes are assigned to local delivery logistics partners.',
      icon: Truck,
    },
    {
      step: '05',
      role: 'Ecosystem Success',
      action: 'Fulfilled & Delivered',
      description: 'Produce arrives fresh at home or business with verified status for all participants.',
      icon: CheckCircle2,
    },
  ];

  const pillarCards = [
    {
      title: 'Direct Farmer Marketplace',
      tagline: 'Producer-to-Consumer Trade',
      icon: Store,
      features: [
        'Direct FPO & individual farmer listings',
        'Transparent batch quality indicators',
        'Direct purchase for retail & bulk buyers',
      ],
      accentColor: 'border-l-4 border-l-agri-evergreen',
    },
    {
      title: 'Fair Price Engine',
      tagline: 'Benchmark Price Discovery',
      icon: CircleDollarSign,
      features: [
        'Mandi benchmark price comparison',
        'Transparent cost breakdown for buyers',
        'Guaranteed minimum fair returns',
      ],
      accentColor: 'border-l-4 border-l-agri-harvest',
    },
    {
      title: 'Hyperlocal Community Carts',
      tagline: 'Neighborhood Order Grouping',
      icon: Users,
      features: [
        'Shared cart discount thresholds',
        'Reduced per-order delivery charges',
        'Lowered urban delivery vehicle emissions',
      ],
      accentColor: 'border-l-4 border-l-agri-sprout',
    },
    {
      title: 'Smart Route & Logistics',
      tagline: 'AI Route Optimization',
      icon: MapPin,
      features: [
        'Consolidated farm pickup schedules',
        'Dynamic route dispatching for drivers',
        'Freshness-preserving delivery windows',
      ],
      accentColor: 'border-l-4 border-l-agri-harvest-sand',
    },
  ];

  const roleIcons: Record<string, React.ElementType> = {
    farmer_fpo: Sprout,
    consumer: ShoppingBag,
    bulk_buyer: Building2,
    delivery_partner: Truck,
    admin: UserCheck,
  };

  return (
    <div className="flex flex-col gap-20 pb-20">
      {/* 1. HERO SECTION */}
      <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-agri-sprout-soft/40 via-agri-earth-50 to-agri-earth-50 pt-12 pb-20 border-b border-agri-earth-200/60">
        <Container size="lg">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Hero Left Content Column */}
            <div className="lg:col-span-7 flex flex-col gap-6 text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-agri-sprout-bright/40 text-xs font-semibold text-agri-evergreen shadow-sm w-fit">
                <Sparkles className="h-4 w-4 text-agri-sprout" />
                <span>Smart India Hackathon • SIH {PROBLEM_STATEMENT_ID}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-agri-earth-900 tracking-tight leading-[1.12]">
                From Farm to Home, <span className="text-agri-evergreen underline decoration-agri-sprout-bright/60 decoration-wavy decoration-2">Connected.</span>
              </h1>

              <p className="text-lg text-agri-earth-700 leading-relaxed font-normal max-w-xl">
                AgriLink connects farmers, FPOs, consumers, bulk buyers and delivery partners through one transparent agricultural marketplace and logistics platform.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link href="/marketplace">
                  <Button variant="primary" size="lg" className="gap-2 shadow-md hover:shadow-lg transition-all">
                    <span>Launch Application</span>
                    <LayoutDashboard className="h-5 w-5 text-agri-sprout-bright" />
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const el = document.getElementById('how-it-works');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  How It Works
                </Button>
              </div>

              {/* Verified Architecture Tag */}
              <div className="flex items-center gap-3 pt-4 text-xs font-medium text-agri-earth-700">
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-agri-earth-200 shadow-sm">
                  <Activity className="h-4 w-4 text-agri-sprout" />
                  <span>5 Preserved Application Roles</span>
                </div>
                <div className="flex items-center gap-1.5 bg-white px-3 py-1.5 rounded-lg border border-agri-earth-200 shadow-sm">
                  <ShieldCheck className="h-4 w-4 text-agri-evergreen" />
                  <span>Clean Tech Foundation</span>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Component (Ecosystem Hub Card) */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md lg:max-w-none rounded-3xl bg-white p-6 shadow-xl border border-agri-earth-200/80 space-y-5">
                <div className="flex items-center justify-between border-b border-agri-earth-100 pb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full bg-agri-sprout animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider text-agri-earth-900">
                      AgriLink Supply Flow
                    </span>
                  </div>
                  <Badge variant="sprout">Phase 1 Active</Badge>
                </div>

                {/* Composed Flow Graphic Card Nodes */}
                <div className="space-y-3 text-xs">
                  {/* Node 1: Producer */}
                  <div className="p-3.5 rounded-xl bg-agri-sprout-soft/50 border border-agri-sprout-bright/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-agri-evergreen text-white flex items-center justify-center">
                        <Sprout className="h-4 w-4 text-agri-sprout-bright" />
                      </div>
                      <div>
                        <div className="font-bold text-agri-earth-900">Farmer / FPO</div>
                        <div className="text-[11px] text-agri-earth-700">Fresh Produce Listing</div>
                      </div>
                    </div>
                    <Badge variant="evergreen" className="text-[10px]">Direct Producer</Badge>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center text-agri-sprout">
                    <ArrowDown className="h-4 w-4 animate-bounce" />
                  </div>

                  {/* Node 2: Fair Pricing & Community Cart */}
                  <div className="p-3.5 rounded-xl bg-agri-harvest-soft/60 border border-agri-harvest-sand/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-agri-harvest text-agri-earth-900 flex items-center justify-center font-bold">
                        <CircleDollarSign className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-bold text-agri-earth-900">Fair Price & Aggregation</div>
                        <div className="text-[11px] text-agri-earth-700">Mandi Benchmark & Community Carts</div>
                      </div>
                    </div>
                    <Badge variant="harvest" className="text-[10px]">Transparent</Badge>
                  </div>

                  {/* Flow Arrow */}
                  <div className="flex justify-center text-agri-sprout">
                    <ArrowDown className="h-4 w-4" />
                  </div>

                  {/* Node 3: Logistics & Buyer */}
                  <div className="p-3.5 rounded-xl bg-agri-earth-100 border border-agri-earth-200 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-agri-earth-800 text-white flex items-center justify-center">
                        <Truck className="h-4 w-4 text-agri-sprout-bright" />
                      </div>
                      <div>
                        <div className="font-bold text-agri-earth-900">Delivery & Fulfilment</div>
                        <div className="text-[11px] text-agri-earth-700">Optimized Logistics Routes</div>
                      </div>
                    </div>
                    <Badge variant="sand" className="text-[10px]">Last-Mile</Badge>
                  </div>
                </div>

                <div className="pt-2 text-center border-t border-agri-earth-100">
                  <p className="text-[11px] text-agri-earth-700 font-medium">
                    Integrated Marketplace Architecture for SIH26033
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 2. VALUE PROPOSITION SECTION */}
      <section className="py-4">
        <Container size="lg">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="sprout" className="mb-3">
              Core Value Proposition
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-agri-earth-900 tracking-tight">
              Transforming Agricultural Supply Chains
            </h2>
            <p className="text-base text-agri-earth-700 mt-3 leading-relaxed">
              AgriLink replaces fragmented market channels with an integrated platform built for trust, price fairness, and logistical efficiency.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {valueProps.map((prop, idx) => {
              const Icon = prop.icon;
              return (
                <Card key={idx} hoverEffect className="flex flex-col justify-between h-full p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-agri-sprout-soft text-agri-evergreen">
                        <Icon className="h-6 w-6" />
                      </div>
                      <Badge variant="outline" className="text-[11px]">
                        {prop.badge}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-agri-earth-900 leading-snug">
                      {prop.title}
                    </h3>
                    <p className="text-sm text-agri-earth-700 leading-relaxed">
                      {prop.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section id="how-it-works" className="py-16 bg-white border-y border-agri-earth-200">
        <Container size="lg">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <Badge variant="harvest" className="mb-3">
              Ecosystem Flow
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-agri-earth-900 tracking-tight">
              How AgriLink Operates
            </h2>
            <p className="text-base text-agri-earth-700 mt-3 leading-relaxed">
              From produce creation on the farm to last-mile neighborhood delivery.
            </p>
          </div>

          {/* Workflow Steps Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 relative">
            {workflowSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={index} className="flex flex-col">
                  <Card hoverEffect className="flex flex-col justify-between h-full p-5 relative group">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-agri-sprout tracking-widest">
                          STEP {step.step}
                        </span>
                        <div className="h-8 w-8 rounded-lg bg-agri-earth-100 text-agri-evergreen flex items-center justify-center group-hover:bg-agri-sprout group-hover:text-white transition-colors">
                          <Icon className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-[11px] font-bold text-agri-earth-700 uppercase tracking-wider">
                        {step.role}
                      </div>
                      <h4 className="text-base font-bold text-agri-earth-900 leading-tight">
                        {step.action}
                      </h4>
                      <p className="text-xs text-agri-earth-700 leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 4. FIVE PLATFORM ROLES SECTION */}
      <section id="roles" className="py-4">
        <Container size="lg">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="sprout" className="mb-3">
              Application Roles
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-agri-earth-900 tracking-tight">
              Built for All 5 Key Ecosystem Roles
            </h2>
            <p className="text-base text-agri-earth-700 mt-3 leading-relaxed">
              AgriLink preserves specialized interfaces and permissions for every participant in the agricultural chain.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
            {AGRI_ROLES.map((role) => {
              const IconComponent = roleIcons[role.id] || Sprout;
              return (
                <Card
                  key={role.id}
                  hoverEffect
                  className="flex flex-col justify-between p-6 h-full border-t-4 border-t-agri-evergreen"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-10 w-10 rounded-xl bg-agri-earth-100 text-agri-evergreen flex items-center justify-center">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <Badge variant={role.badgeVariant} className="text-[10px]">
                        {role.id.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>

                    <h3 className="text-lg font-bold text-agri-earth-900">
                      {role.label}
                    </h3>

                    <p className="text-xs text-agri-earth-700 leading-relaxed">
                      {role.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-3 border-t border-agri-earth-100 flex items-center justify-between text-xs font-semibold text-agri-evergreen">
                    <span>Architecture Ready</span>
                    <CheckCircle2 className="h-4 w-4 text-agri-sprout" />
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 5. PLATFORM PILLARS SECTION */}
      <section id="platform" className="py-16 bg-white border-y border-agri-earth-200">
        <Container size="lg">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <Badge variant="harvest" className="mb-3">
              Platform Pillars
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-agri-earth-900 tracking-tight">
              AgriLink Core Technical Pillars
            </h2>
            <p className="text-base text-agri-earth-700 mt-3 leading-relaxed">
              Four fundamental architectural pillars driving our marketplace and logistics framework.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {pillarCards.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <Card key={idx} hoverEffect className={`p-8 ${pillar.accentColor}`}>
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-agri-earth-100 text-agri-evergreen flex items-center justify-center shrink-0">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-bold text-agri-sprout uppercase tracking-wider">
                          {pillar.tagline}
                        </span>
                        <h3 className="text-xl font-bold text-agri-earth-900 mt-0.5">
                          {pillar.title}
                        </h3>
                      </div>
                      <ul className="space-y-2 pt-1">
                        {pillar.features.map((feat, fIdx) => (
                          <li key={fIdx} className="flex items-center gap-2 text-sm text-agri-earth-700">
                            <CheckCircle2 className="h-4 w-4 text-agri-sprout shrink-0" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 6. FINAL CTA BANNER */}
      <section className="pt-4">
        <Container size="lg">
          <div className="rounded-3xl bg-gradient-to-r from-agri-evergreen-dark via-agri-evergreen to-agri-evergreen-light text-white p-10 sm:p-14 relative overflow-hidden shadow-xl">
            <div className="relative z-10 max-w-2xl flex flex-col gap-5">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-xs font-semibold text-agri-sprout-bright w-fit">
                <Layers className="h-4 w-4" />
                <span>SIH Problem Statement SIH26033</span>
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                Ready to Experience Next-Generation Agricultural Commerce?
              </h2>

              <p className="text-base text-agri-sprout-soft leading-relaxed">
                AgriLink provides a scalable technical foundation built for farmers, FPOs, retail buyers, bulk institutions, and delivery partners across India.
              </p>

              <div className="flex flex-wrap items-center gap-4 pt-3">
                <Link href="/marketplace">
                  <Button
                    variant="harvest"
                    size="lg"
                    className="gap-2 text-agri-earth-900 font-bold"
                  >
                    <span>Launch Application</span>
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>

                <Button
                  variant="outline"
                  size="lg"
                  className="bg-transparent border-white/30 text-white hover:bg-white/10 hover:border-white"
                  onClick={() => {
                    const el = document.getElementById('roles');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  View Application Roles
                </Button>
              </div>
            </div>

            {/* Background Decorative Graphic */}
            <Sprout className="absolute -bottom-12 -right-12 h-72 w-72 text-white/5 pointer-events-none" />
          </div>
        </Container>
      </section>
    </div>
  );
}
