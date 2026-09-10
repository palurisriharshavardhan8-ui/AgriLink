'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { fetchProduceListings, ProduceListingRow } from '@/lib/services/listings';
import { fetchCommunityCarts, CommunityCartRow } from '@/lib/services/communityCart';
import { CreateListingModal } from '@/components/listings/CreateListingModal';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Sprout,
  TrendingUp,
  PlusCircle,
  PackageCheck,
  AlertCircle,
  RefreshCw,
  Layers,
  Users,
  ArrowRight,
  Clock,
  CheckCircle2,
} from 'lucide-react';

export default function FarmerDashboardPage() {
  const { user } = useAuth();
  const [listings, setListings] = useState<ProduceListingRow[]>([]);
  const [farmerCarts, setFarmerCarts] = useState<CommunityCartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const loadFarmerData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const [listingsData, cartsData] = await Promise.all([
        fetchProduceListings({ farmerId: user.id }),
        fetchCommunityCarts({ farmerId: user.id }),
      ]);
      setListings(listingsData);
      setFarmerCarts(cartsData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load farmer batches and carts.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadFarmerData();
  }, [loadFarmerData]);

  const totalStockKg = listings.reduce((sum, item) => sum + (item.available_quantity_kg || 0), 0);
  const totalPooledKg = farmerCarts.reduce((sum, item) => sum + (item.current_aggregated_quantity_kg || 0), 0);

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
              Manage produce batches, monitor mandi benchmarks, and fulfill pooled community cart orders.
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
          <span>List Produce & Community Cart</span>
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Produce Batches</span>
            <PackageCheck className="h-4 w-4 text-agri-sprout" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">
            {loading ? '...' : listings.length} Active
          </div>
          <p className="text-xs text-agri-earth-700">Live marketplace listings</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Community Pools</span>
            <Users className="h-4 w-4 text-agri-evergreen" />
          </div>
          <div className="text-2xl font-black text-agri-evergreen">
            {loading ? '...' : farmerCarts.length} Pools
          </div>
          <p className="text-xs text-agri-earth-700">Hyperlocal community carts</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Available Stock</span>
            <Layers className="h-4 w-4 text-agri-harvest" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">
            {loading ? '...' : `${totalStockKg.toLocaleString('en-IN')} kg`}
          </div>
          <p className="text-xs text-agri-earth-700">Individual batch stock</p>
        </Card>

        <Card hoverEffect className="space-y-2">
          <div className="flex items-center justify-between text-agri-earth-700 text-xs font-bold">
            <span>Pooled Demand</span>
            <TrendingUp className="h-4 w-4 text-agri-sprout" />
          </div>
          <div className="text-2xl font-black text-agri-evergreen">
            {loading ? '...' : `${totalPooledKg.toLocaleString('en-IN')} kg`}
          </div>
          <p className="text-xs text-agri-earth-700">Consolidated bulk demand</p>
        </Card>
      </div>

      {/* Active Community Carts Section (Farmer Owned) */}
      <Card className="space-y-4 p-6 bg-white border-agri-earth-200">
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-agri-evergreen" />
            <div>
              <h3 className="text-base font-bold text-agri-earth-900">Your Active Community Pools</h3>
              <p className="text-xs text-agri-earth-700">Grouped bulk orders collected from nearby localities</p>
            </div>
          </div>
          <Link href="/community-cart">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
              <span>View All Community Carts</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>

        {/* Empty State for Carts */}
        {!loading && farmerCarts.length === 0 && (
          <div className="py-8 text-center space-y-2 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-300 p-4">
            <p className="text-xs text-agri-earth-700">
              You haven&apos;t created any Community Carts yet. When you create a listing, turn on <strong>Enable Community Cart</strong> to pool neighborhood orders.
            </p>
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)} className="gap-1.5 font-bold">
              <PlusCircle className="h-4 w-4 text-agri-sprout-bright" />
              <span>Create Listing with Community Cart</span>
            </Button>
          </div>
        )}

        {/* Carts List */}
        {!loading && farmerCarts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {farmerCarts.map((cart) => {
              const pct = Math.min(100, Math.round((cart.current_aggregated_quantity_kg / cart.target_discount_quantity_kg) * 100));
              const isTargetReached = cart.current_aggregated_quantity_kg >= cart.target_discount_quantity_kg;

              return (
                <div key={cart.id} className="p-4 rounded-xl border border-agri-earth-200 bg-white space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-extrabold text-sm text-agri-earth-900">{cart.title}</h4>
                      <p className="text-[11px] text-agri-earth-700">{cart.locality}</p>
                    </div>
                    <Badge variant={isTargetReached ? 'harvest' : 'sprout'} className="text-[10px]">
                      {cart.cart_status.replace('_', ' ').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-agri-earth-800">
                        {cart.current_aggregated_quantity_kg} / {cart.target_discount_quantity_kg} kg
                      </span>
                      <span className="text-agri-evergreen">{pct}%</span>
                    </div>
                    <div className="w-full bg-agri-earth-200 h-2 rounded-full overflow-hidden">
                      <div className="h-full bg-agri-evergreen" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-agri-earth-600 pt-0.5">
                      <span>Rate: ₹{cart.community_price}/kg</span>
                      <span>{cart.participants_count || 0} participants</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-agri-earth-100 flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 text-agri-earth-600">
                      <Clock className="h-3 w-3" />
                      <span>Closes in {Math.max(1, Math.round((new Date(cart.closing_at).getTime() - Date.now()) / 3600000))}h</span>
                    </span>
                    <Link href="/community-cart">
                      <span className="text-agri-evergreen font-bold hover:underline flex items-center gap-1">
                        View Pool <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Active Listings Table / Grid */}
      <Card className="space-y-4 p-6 bg-white border-agri-earth-200">
        <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
          <div>
            <h3 className="text-base font-bold text-agri-earth-900">Your Published Produce Batches</h3>
            <p className="text-xs text-agri-earth-700">Live marketplace listings visible to buyers</p>
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
            <Button variant="outline" size="sm" onClick={loadFarmerData}>
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="py-8 text-center text-xs text-agri-earth-600 font-semibold animate-pulse">
            Loading your produce batches and community carts from Supabase...
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
        onSuccess={loadFarmerData}
      />
    </div>
  );
}
