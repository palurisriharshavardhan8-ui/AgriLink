'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { fetchProduceListings, ProduceListingRow } from '@/lib/services/listings';
import { CreateListingModal } from '@/components/listings/CreateListingModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Sprout, TrendingUp, PlusCircle, PackageCheck, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ProduceListingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadFarmerListings = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await fetchProduceListings({ farmerId: user.id });
      setListings(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load produce batches.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFarmerListings();
  }, [loadFarmerListings]);

  const totalStockKg = listings.reduce((sum, item) => sum + (item.available_quantity_kg || 0), 0);

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

        <Button
          variant="primary"
          size="sm"
          className="gap-2 font-bold shadow-sm"
          onClick={() => setIsCreateModalOpen(true)}
        >
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
          <div className="text-2xl font-black text-agri-earth-900">
            {loading ? '...' : listings.length} Batches Active
          </div>
          <p className="text-xs text-agri-earth-700">Live marketplace listings</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Available Stock</span>
            <Layers className="h-4 w-4 text-agri-harvest" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">
            {loading ? '...' : `${totalStockKg.toLocaleString('en-IN')} kg`}
          </div>
          <p className="text-xs text-agri-earth-700">Total batch quantity ready</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Fair Price Engine</span>
            <TrendingUp className="h-4 w-4 text-agri-evergreen" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">Benchmark Active</div>
          <p className="text-xs text-agri-earth-700">Direct mandi price discovery</p>
        </Card>
      </div>

      {/* Active Listings Table / Grid */}
      <Card className="space-y-4 p-6 bg-white border-agri-earth-200">
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-agri-earth-900">Your Published Produce Batches</h3>
            <p className="text-xs text-agri-earth-700">Live batches visible to buyers in the marketplace</p>
          </div>
          <Badge variant="sprout">{listings.length} Active</Badge>
        </div>

        {/* Error State */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-50 text-red-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span>{errorMsg}</span>
            </div>
            <Button variant="outline" size="sm" onClick={loadFarmerListings}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center text-xs text-agri-earth-600 font-semibold animate-pulse">
            Loading your produce batches from Supabase...
          </div>
        )}

        {/* Empty State */}
        {!loading && !errorMsg && listings.length === 0 && (
          <div className="py-10 text-center space-y-3 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-300">
            <p className="text-xs text-agri-earth-700">
              You have not created any produce listings yet.
            </p>
            <Button
              variant="primary"
              size="sm"
              className="gap-2 font-bold"
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusCircle className="h-4 w-4 text-agri-sprout-bright" />
              <span>Create Your First Listing</span>
            </Button>
          </div>
        )}

        {/* Listings List */}
        {!loading && !errorMsg && listings.length > 0 && (
          <div className="divide-y divide-agri-earth-100">
            {listings.map((item) => (
              <div key={item.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-agri-earth-900">{item.title}</span>
                    <Badge variant="sprout" className="text-[10px] uppercase">
                      {item.category.replace('_', ' ')}
                    </Badge>
                  </div>
                  <p className="text-xs text-agri-earth-700">
                    Stock: <span className="font-bold text-agri-earth-900">{item.available_quantity_kg} kg</span> | Price: <span className="font-bold text-agri-evergreen">₹{item.price_per_kg}/kg</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-[10px] py-1">
                    {item.mandi_benchmark_price ? `Mandi: ₹${item.mandi_benchmark_price}/kg` : 'No Benchmark'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Create Listing Modal */}
      <CreateListingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={loadFarmerListings}
      />
    </div>
  );
}
