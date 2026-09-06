import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Store, Search, Filter, Sprout, ArrowRight } from 'lucide-react';

export default function MarketplacePage() {
  const categories = ['All Produce', 'Vegetables', 'Fruits', 'Grains & Pulses', 'Organic Spices'];

  return (
    <div className="space-y-8">
      {/* Module Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <Store className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Produce Marketplace
              </h1>
              <Badge variant="sprout">Direct Trade Shell</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Direct Farmer & FPO produce listings with fair mandi price benchmarks.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </Button>
          <Button variant="primary" size="sm" className="gap-2">
            <Sprout className="h-4 w-4 text-agri-sprout-bright" />
            <span>List Produce</span>
          </Button>
        </div>
      </div>

      {/* Category Pills & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          {categories.map((cat, i) => (
            <Badge
              key={cat}
              variant={i === 0 ? 'evergreen' : 'outline'}
              className="cursor-pointer py-1.5 px-3 text-xs font-semibold whitespace-nowrap"
            >
              {cat}
            </Badge>
          ))}
        </div>

        <div className="w-full sm:w-72">
          <Input placeholder="Filter by produce name or region..." className="text-xs h-9" />
        </div>
      </div>

      {/* Produce Grid Skeleton Placeholder */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <Card key={item} hoverEffect className="space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Badge variant="sprout">Verified Farmer Listing</Badge>
                <span className="text-xs font-bold text-agri-evergreen">Direct Sale</span>
              </div>
              <div className="h-32 rounded-xl bg-agri-earth-100 flex items-center justify-center text-agri-earth-700">
                <Sprout className="h-8 w-8 text-agri-sprout opacity-40" />
              </div>
              <h3 className="text-base font-bold text-agri-earth-900">
                Produce Listing Placeholder #{item}
              </h3>
              <p className="text-xs text-agri-earth-700">
                Placeholder produce card layout ready for listing data in upcoming marketplace task.
              </p>
            </div>
            <div className="pt-3 border-t border-agri-earth-100 flex items-center justify-between">
              <span className="text-xs font-semibold text-agri-earth-800">Mandi Price Verified</span>
              <Button variant="outline" size="sm" className="gap-1 text-xs">
                <span>View Details</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
