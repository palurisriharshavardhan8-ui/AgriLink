import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sprout, TrendingUp, PlusCircle, PackageCheck } from 'lucide-react';

export default function FarmerDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Module Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <Sprout className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Farmer & FPO Console
              </h1>
              <Badge variant="evergreen">Producer Role</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Manage produce batches, monitor mandi benchmarks, and fulfill buyer orders.
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4 text-agri-sprout-bright" />
          <span>Create New Listing</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Produce Batches</span>
            <PackageCheck className="h-4 w-4 text-agri-sprout" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">Ready for Data</div>
          <p className="text-xs text-agri-earth-700">Active produce batch management</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Fair Price Engine</span>
            <TrendingUp className="h-4 w-4 text-agri-harvest" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">Benchmark Active</div>
          <p className="text-xs text-agri-earth-700">Real mandi price discovery</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>FPO Direct Sales</span>
            <Sprout className="h-4 w-4 text-agri-evergreen" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">Zero Middlemen</div>
          <p className="text-xs text-agri-earth-700">Direct consumer & bulk trade</p>
        </Card>
      </div>

      {/* Active Listings Shell */}
      <Card className="space-y-4">
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <h3 className="text-base font-bold text-agri-earth-900">Active Produce Batches</h3>
          <Badge variant="outline">Farmer Dashboard Shell</Badge>
        </div>
        <p className="text-xs text-agri-earth-700 leading-relaxed">
          Produce creation, mandi price indexing, and batch sales management UI components will be connected in future modules.
        </p>
      </Card>
    </div>
  );
}
