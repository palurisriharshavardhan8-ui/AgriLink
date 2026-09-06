import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Truck, MapPin, CheckCircle2, Navigation } from 'lucide-react';

export default function DeliveryPartnerPage() {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Delivery & Route Logistics Console
              </h1>
              <Badge variant="sand">Delivery Partner Role</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Optimized farm pickup routes, regional hub consolidation, and hyperlocal delivery dispatch.
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" className="gap-2">
          <Navigation className="h-4 w-4 text-agri-sprout-bright" />
          <span>Active Route View</span>
        </Button>
      </div>

      {/* Logistics Overview Shell */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card hoverEffect className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-agri-earth-900">Farm Pickup Logistics</h3>
            <Badge variant="outline">Route Optimization</Badge>
          </div>
          <p className="text-xs text-agri-earth-700 leading-relaxed">
            Consolidated pickup routes connecting regional farms and FPO collection centers to regional cold-storage hubs.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen pt-2">
            <MapPin className="h-4 w-4 text-agri-sprout" />
            <span>Farm Pickup Schedule Shell</span>
          </div>
        </Card>

        <Card hoverEffect className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-agri-earth-900">Hyperlocal Last-Mile Delivery</h3>
            <Badge variant="sprout">Community Cart Delivery</Badge>
          </div>
          <p className="text-xs text-agri-earth-700 leading-relaxed">
            Batch delivery execution for aggregated neighborhood Community Carts with proof-of-delivery status.
          </p>
          <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen pt-2">
            <CheckCircle2 className="h-4 w-4 text-agri-sprout" />
            <span>Last-Mile Route Shell</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
