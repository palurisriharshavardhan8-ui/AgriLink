import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ShoppingBag, Users, Sparkles, MapPin } from 'lucide-react';

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

        <Button variant="harvest" size="sm" className="gap-2 text-agri-earth-900 font-bold">
          <Users className="h-4 w-4" />
          <span>Join Community Cart</span>
        </Button>
      </div>

      {/* Community Cart Banner Shell */}
      <Card className="bg-gradient-to-r from-agri-sprout-soft/60 to-white border-agri-sprout-bright/40 space-y-4 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-agri-sprout" />
            <h3 className="text-lg font-bold text-agri-earth-900">Hyperlocal Community Cart</h3>
          </div>
          <Badge variant="sprout">Neighborhood Discount</Badge>
        </div>
        <p className="text-xs text-agri-earth-700 leading-relaxed max-w-2xl">
          Community Carts group nearby orders from your local sector or apartment complex to unlock lower delivery fees and direct farm-fresh pricing.
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen">
          <MapPin className="h-4 w-4 text-agri-sprout" />
          <span>Neighborhood Cart Aggregation Active</span>
        </div>
      </Card>
    </div>
  );
}
