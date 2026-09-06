import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Package, Clock, CheckCircle2 } from 'lucide-react';

export default function OrdersPage() {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Orders & Tracking
              </h1>
              <Badge variant="sprout">Ecosystem Orders</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Unified order status, Community Cart aggregations, and delivery route tracking.
            </p>
          </div>
        </div>
      </div>

      {/* Orders Shell Content */}
      <Card className="space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-agri-sprout" />
            <h3 className="text-base font-bold text-agri-earth-900">Order Management Shell</h3>
          </div>
          <Badge variant="outline">Phase 1 Console</Badge>
        </div>
        <p className="text-xs text-agri-earth-700 leading-relaxed">
          Order placement, payment escrow status, and live route tracking workflows will be integrated in upcoming bounded modules.
        </p>
        <div className="flex items-center gap-2 text-xs font-semibold text-agri-evergreen pt-2">
          <CheckCircle2 className="h-4 w-4 text-agri-sprout" />
          <span>Unified Order Architecture Ready</span>
        </div>
      </Card>
    </div>
  );
}
