import React from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Users, Sparkles, MapPin, ArrowRight, TrendingDown, Store } from 'lucide-react';

export default function ConsumerHubPage() {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Consumer Retail Hub
              </h1>
              <Badge variant="sprout">Consumer Role</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Order fresh farm produce, join Hyperlocal Community Carts, and track neighborhood deliveries.
            </p>
          </div>
        </div>

        <Link href="/community-cart">
          <Button variant="harvest" size="sm" className="gap-2 text-agri-earth-900 font-bold shadow-xs">
            <Users className="h-4 w-4" />
            <span>Explore Community Carts</span>
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </div>

      {/* Flagship Community Cart Banner */}
      <Card className="bg-gradient-to-r from-agri-sprout-soft/70 via-white to-agri-harvest-soft/40 border-agri-sprout-bright/40 space-y-4 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-agri-sprout" />
              <h3 className="text-lg font-bold text-agri-earth-900">Hyperlocal Community Cart</h3>
              <Badge variant="sprout">Neighborhood Discount Active</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 leading-relaxed max-w-2xl">
              Community Carts pool nearby orders from your local apartment complex or ward to unlock 12–18% lower prices directly from local farmer FPOs.
            </p>
          </div>

          <Link href="/community-cart">
            <Button variant="primary" size="sm" className="gap-2 shrink-0 font-bold">
              <span>View Active Pools</span>
              <ArrowRight className="h-3.5 w-3.5 text-agri-sprout-bright" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-agri-sprout/20">
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen">
            <MapPin className="h-4 w-4 text-agri-sprout" />
            <span>Kolar, Indiranagar, Whitefield Active</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen">
            <TrendingDown className="h-4 w-4 text-agri-harvest" />
            <span>Save up to ₹15/kg on Produce</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen">
            <Users className="h-4 w-4 text-agri-sprout" />
            <span>Consolidated Neighborhood Drop</span>
          </div>
        </div>
      </Card>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hoverEffect className="p-6 space-y-3 bg-white border-agri-earth-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-agri-earth-700">Direct Retail</span>
            <Store className="h-5 w-5 text-agri-sprout" />
          </div>
          <h4 className="text-lg font-bold text-agri-earth-900">Browse Full Marketplace</h4>
          <p className="text-xs text-agri-earth-700">
            Order single batches directly from individual farmers with mandi price transparency.
          </p>
          <Link href="/marketplace" className="inline-block pt-1">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <span>Go to Marketplace</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>

        <Card hoverEffect className="p-6 space-y-3 bg-white border-agri-earth-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-agri-earth-700">Collective Demand</span>
            <Users className="h-5 w-5 text-agri-evergreen" />
          </div>
          <h4 className="text-lg font-bold text-agri-earth-900">Neighborhood Community Pools</h4>
          <p className="text-xs text-agri-earth-700">
            Join collective purchase lots with your neighbors for wholesale farmer pricing and grouped delivery.
          </p>
          <Link href="/community-cart" className="inline-block pt-1">
            <Button variant="harvest" size="sm" className="gap-1.5 text-xs font-bold text-agri-earth-900">
              <span>Join a Community Cart</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </Card>
      </div>
    </div>
  );
}
