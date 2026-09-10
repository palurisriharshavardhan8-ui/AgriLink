'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  fetchCommunityCarts,
  fetchCommunityCartById,
  joinCommunityCart,
  CommunityCartRow,
  CommunityCartMember,
  CommunityCartStatus,
  DemandInsight,
  deriveCommunityDemandInsights,
} from '@/lib/services/communityCart';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Users,
  Sparkles,
  MapPin,
  Clock,
  CheckCircle2,
  TrendingDown,
  ShoppingBag,
  ArrowRight,
  Search,
  Filter,
  AlertCircle,
  Truck,
  Store,
  X,
  RefreshCw,
  Info,
  Flame,
  Check,
  Package,
} from 'lucide-react';

const LOCALITY_OPTIONS = [
  { id: 'all', label: 'All Localities' },
  { id: 'kolar', label: 'Kolar APMC Cluster' },
  { id: 'indiranagar', label: 'Indiranagar Hub' },
  { id: 'whitefield', label: 'Whitefield Corridor' },
  { id: 'koramangala', label: 'Koramangala Block' },
];

export default function CommunityCartPage() {
  const { user, role } = useAuth();
  const isFarmer = role === 'farmer_fpo' || role === 'admin';

  const [carts, setCarts] = useState<CommunityCartRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Filters & Search
  const [selectedLocality, setSelectedLocality] = useState('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Cart for Detail / Join
  const [selectedCart, setSelectedCart] = useState<CommunityCartRow | null>(null);
  const [cartMembers, setCartMembers] = useState<CommunityCartMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  // Join Form State
  const [joinQuantity, setJoinQuantity] = useState<string>('5');
  const [deliveryOption, setDeliveryOption] = useState<'neighborhood_delivery' | 'pickup'>('neighborhood_delivery');
  const [deliveryLandmark, setDeliveryLandmark] = useState('');
  const [joining, setJoining] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<{
    message: string;
    orderId: string;
    committedKg: number;
    savings: number;
  } | null>(null);

  const loadCarts = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await fetchCommunityCarts();
      setCarts(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load community carts from database.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCarts();
  }, [loadCarts]);

  // Real data-driven demand insights
  const demandInsights = useMemo(() => {
    return deriveCommunityDemandInsights(carts);
  }, [carts]);

  // Filtered carts
  const filteredCarts = useMemo(() => {
    return carts.filter((c) => {
      if (selectedLocality !== 'all' && !c.locality.toLowerCase().includes(selectedLocality)) {
        return false;
      }
      if (statusFilter !== 'all' && c.cart_status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = c.title.toLowerCase().includes(q);
        const matchesLoc = c.locality.toLowerCase().includes(q);
        const matchesFarmer = c.farmer_name?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesLoc && !matchesFarmer) return false;
      }
      return true;
    });
  }, [carts, selectedLocality, statusFilter, searchQuery]);

  const handleOpenCartDetails = async (cart: CommunityCartRow) => {
    setSelectedCart(cart);
    setJoinQuantity(String(cart.min_commitment_kg || 2));
    setDeliveryLandmark(cart.delivery_landmark || '');
    setJoinSuccess(null);
    setErrorMsg(null);

    setMembersLoading(true);
    try {
      const { members } = await fetchCommunityCartById(cart.id);
      setCartMembers(members);
    } catch {
      setCartMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const handleConfirmJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCart) return;

    const qty = parseFloat(joinQuantity);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid quantity in kg.');
      return;
    }

    if (selectedCart.min_commitment_kg && qty < selectedCart.min_commitment_kg) {
      setErrorMsg(`Minimum commitment for this pool is ${selectedCart.min_commitment_kg} kg.`);
      return;
    }

    setJoining(true);
    setErrorMsg(null);

    try {
      const res = await joinCommunityCart({
        cartId: selectedCart.id,
        quantityKg: qty,
        deliveryOption,
        deliveryLandmark,
      });

      const savings = Math.round(qty * selectedCart.savings_per_kg * 10) / 10;
      setJoinSuccess({
        message: res.message,
        orderId: res.orderId,
        committedKg: qty,
        savings,
      });

      // Refresh live carts and active cart details
      await loadCarts();
      const { cart: refreshedCart, members: refreshedMembers } = await fetchCommunityCartById(selectedCart.id);
      if (refreshedCart) setSelectedCart(refreshedCart);
      setCartMembers(refreshedMembers);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to join community cart.';
      setErrorMsg(msg);
    } finally {
      setJoining(false);
    }
  };

  const renderStatusBadge = (status: CommunityCartStatus) => {
    switch (status) {
      case 'open':
        return <Badge variant="sprout">Open Pool</Badge>;
      case 'target_reached':
        return <Badge variant="harvest">Target Reached 🎉</Badge>;
      case 'locked':
        return <Badge variant="sand">Locked for Batching</Badge>;
      case 'farmer_confirmed':
        return <Badge variant="evergreen">Farmer Confirmed</Badge>;
      case 'preparing':
        return <Badge variant="sprout">Preparing Batch</Badge>;
      case 'out_for_delivery':
        return <Badge variant="harvest">Out for Delivery</Badge>;
      case 'completed':
        return <Badge variant="outline">Fulfilled</Badge>;
      case 'cancelled':
        return <Badge variant="earth">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Flagship Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Hyperlocal Community Carts
              </h1>
              <Badge variant="sprout">Collective Purchasing</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1 max-w-2xl leading-relaxed">
              Instead of multiple small individual orders, nearby customers combine demand into one community purchase directly from farmers to unlock wholesale prices and consolidated delivery.
            </p>
          </div>
        </div>

        {/* Live Savings / Value Prop */}
        <div className="flex items-center gap-3 bg-agri-sprout-soft/40 border border-agri-sprout-bright/30 p-3 rounded-xl shrink-0">
          <div className="h-8 w-8 rounded-lg bg-agri-evergreen text-white flex items-center justify-center font-black text-xs">
            ₹
          </div>
          <div>
            <span className="text-[11px] font-bold text-agri-earth-900 block">
              Direct Community Benefit
            </span>
            <span className="text-xs font-black text-agri-evergreen">
              Bypass middleman margins • Grouped delivery
            </span>
          </div>
        </div>
      </div>

      {/* Live SIH Demand Insights (Computed from real Supabase carts) */}
      {demandInsights.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {demandInsights.map((insight) => (
            <Card
              key={insight.id}
              className="p-4 bg-white border-agri-earth-200 space-y-2 hover:border-agri-sprout transition-all shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-agri-earth-700 flex items-center gap-1.5">
                  <Flame className="h-3.5 w-3.5 text-agri-harvest" />
                  <span>{insight.title}</span>
                </span>
                {insight.metric && (
                  <Badge variant="harvest" className="text-[9px] py-0">
                    {insight.metric}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-agri-earth-800 leading-snug">
                {insight.description}
              </p>
            </Card>
          ))}
        </div>
      )}

      {/* Search and Filters Bar */}
      <Card className="p-4 bg-white border-agri-earth-200 space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Locality Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {LOCALITY_OPTIONS.map((loc) => (
              <button
                key={loc.id}
                onClick={() => setSelectedLocality(loc.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  selectedLocality === loc.id
                    ? 'bg-agri-evergreen text-white shadow-xs'
                    : 'bg-agri-earth-100 text-agri-earth-800 hover:bg-agri-earth-200'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-agri-earth-700 pointer-events-none" />
            <input
              type="text"
              placeholder="Search produce, locality, farmer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-agri-earth-200 text-xs focus:ring-2 focus:ring-agri-sprout focus:outline-none bg-white text-agri-earth-900"
            />
          </div>
        </div>

        {/* Status Filter Row */}
        <div className="flex items-center justify-between pt-2 border-t border-agri-earth-100 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-agri-earth-700 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              <span>Filter Status:</span>
            </span>
            {['all', 'open', 'target_reached', 'completed'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-agri-sprout text-white'
                    : 'text-agri-earth-700 hover:bg-agri-earth-100'
                }`}
              >
                {st === 'all' ? 'All Pools' : st === 'target_reached' ? 'Target Reached' : st.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={loadCarts}
            className="text-[11px] text-agri-earth-600 hover:text-agri-evergreen flex items-center gap-1 font-semibold"
            title="Refresh database records"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Refresh</span>
          </button>
        </div>
      </Card>

      {/* Error Notice */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadCarts}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Loading Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-5 space-y-4 animate-pulse bg-white border-agri-earth-200">
              <div className="h-40 rounded-xl bg-agri-earth-100" />
              <div className="h-5 w-3/4 bg-agri-earth-100 rounded-lg" />
              <div className="h-10 bg-agri-earth-50 rounded-xl" />
            </Card>
          ))}
        </div>
      )}

      {/* Honest Empty State (Strict Real-Data Requirement) */}
      {!loading && !errorMsg && filteredCarts.length === 0 && (
        <Card className="py-16 text-center space-y-4 bg-white rounded-2xl border border-dashed border-agri-earth-300 p-8">
          <div className="h-14 w-14 rounded-2xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center mx-auto">
            <ShoppingBag className="h-7 w-7 text-agri-sprout" />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-base font-bold text-agri-earth-900">
              No Active Community Carts Found
            </h3>
            <p className="text-xs text-agri-earth-700 leading-relaxed">
              {searchQuery || selectedLocality !== 'all' || statusFilter !== 'all'
                ? 'No community carts match your active search or locality filter. Try resetting filters.'
                : 'There are currently no active community carts in the database. Farmers can enable Community Cart pooling when listing produce batches.'}
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            {(searchQuery || selectedLocality !== 'all' || statusFilter !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedLocality('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
              >
                Clear Filters
              </Button>
            )}

            {isFarmer && (
              <Link href="/farmer">
                <Button variant="primary" size="sm" className="gap-2 font-bold">
                  <Sparkles className="h-3.5 w-3.5 text-agri-sprout-bright" />
                  <span>List Produce & Create Pool</span>
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Community Carts Grid */}
      {!loading && !errorMsg && filteredCarts.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCarts.map((cart) => {
            const progressPercent = Math.min(
              100,
              Math.round((cart.current_aggregated_quantity_kg / cart.target_discount_quantity_kg) * 100)
            );
            const remainingKg = Math.max(0, cart.target_discount_quantity_kg - cart.current_aggregated_quantity_kg);
            const isTargetReached = cart.current_aggregated_quantity_kg >= cart.target_discount_quantity_kg;

            return (
              <Card
                key={cart.id}
                hoverEffect
                className="flex flex-col justify-between bg-white border-agri-earth-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200"
              >
                <div>
                  {/* Top Image Banner */}
                  <div className="relative h-44 w-full bg-agri-earth-100 overflow-hidden">
                    {cart.image_url ? (
                      <img
                        src={cart.image_url}
                        alt={cart.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-agri-sprout-soft/60 text-agri-evergreen">
                        <ShoppingBag className="h-12 w-12 opacity-40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      {renderStatusBadge(cart.cart_status)}
                    </div>
                    {cart.savings_per_kg > 0 && (
                      <div className="absolute top-3 right-3">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-white/95 text-agri-evergreen shadow-xs backdrop-blur-xs flex items-center gap-1">
                          <TrendingDown className="h-3.5 w-3.5 text-agri-sprout" />
                          <span>Save ₹{cart.savings_per_kg}/kg</span>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Body Details */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-1.5 text-[11px] font-bold text-agri-earth-700">
                        <MapPin className="h-3.5 w-3.5 text-agri-sprout" />
                        <span>{cart.locality}</span>
                      </div>
                      <h3 className="text-base font-extrabold text-agri-earth-900 mt-1 leading-snug">
                        {cart.title}
                      </h3>
                      <p className="text-xs text-agri-earth-700 mt-0.5">
                        Producer: <span className="font-semibold text-agri-earth-900">{cart.farmer_name || 'Verified Farmer FPO'}</span>
                      </p>
                    </div>

                    {/* Price Comparison Grid */}
                    <div className="grid grid-cols-2 gap-2 bg-agri-earth-50 p-3 rounded-xl border border-agri-earth-100">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-agri-earth-700 block">
                          Community Price
                        </span>
                        <div className="text-lg font-black text-agri-evergreen">
                          ₹{cart.community_price}
                          <span className="text-[11px] font-normal text-agri-earth-700"> /kg</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase font-bold text-agri-earth-700 block">
                          Regular Market
                        </span>
                        <div className="text-xs font-bold text-agri-earth-700 line-through mt-1">
                          ₹{cart.regular_price}/kg
                        </div>
                        {cart.mandi_benchmark_price && (
                          <span className="text-[9px] text-agri-earth-700 block">
                            Mandi: ₹{cart.mandi_benchmark_price}/kg
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar & Collective Volume */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-agri-earth-900">
                          {cart.current_aggregated_quantity_kg} kg{' '}
                          <span className="text-agri-earth-700 font-normal">/ {cart.target_discount_quantity_kg} kg Target</span>
                        </span>
                        <span className="text-agri-evergreen font-black">
                          {progressPercent}%
                        </span>
                      </div>
                      <div className="w-full bg-agri-earth-200 h-2 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            isTargetReached ? 'bg-agri-evergreen' : 'bg-agri-sprout'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-agri-earth-700 pt-1">
                        <span className="flex items-center gap-1 font-semibold">
                          <Users className="h-3 w-3 text-agri-sprout" />
                          <span>{cart.participants_count || 0} Members Joined</span>
                        </span>
                        <span className="font-semibold text-agri-earth-800">
                          {remainingKg > 0 ? `${remainingKg} kg needed` : 'Target Met!'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-5 pt-0 border-t border-agri-earth-100 mt-2 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-1 text-[10px] text-agri-earth-700">
                    <Clock className="h-3 w-3 text-agri-earth-600" />
                    <span>Closes in {Math.max(1, Math.round((new Date(cart.closing_at).getTime() - Date.now()) / 3600000))}h</span>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    className="gap-2 font-bold shadow-xs"
                    onClick={() => handleOpenCartDetails(cart)}
                  >
                    <span>View & Join Cart</span>
                    <ArrowRight className="h-3.5 w-3.5 text-agri-sprout-bright" />
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Cart Details & Join Interactive Modal */}
      {selectedCart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-xl p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 relative space-y-5 max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center font-bold">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-agri-earth-900 leading-none">
                    Community Cart Details & Joining
                  </h2>
                  <p className="text-xs text-agri-earth-700 mt-1">
                    {selectedCart.locality} • Direct Farm Collective Purchase
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCart(null)}
                className="p-1.5 rounded-lg text-agri-earth-600 hover:bg-agri-earth-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Success Confirmation Banner */}
            {joinSuccess && (
              <div className="p-4 rounded-xl bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen text-xs space-y-2 animate-in fade-in">
                <div className="flex items-center gap-2 font-black text-sm">
                  <CheckCircle2 className="h-5 w-5 text-agri-sprout shrink-0" />
                  <span>You&apos;re part of this community purchase!</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-1 text-[11px] font-semibold">
                  <div>
                    <span className="text-agri-evergreen/80 block">Committed Qty</span>
                    <span className="font-extrabold text-agri-evergreen text-xs">{joinSuccess.committedKg} kg</span>
                  </div>
                  <div>
                    <span className="text-agri-evergreen/80 block">Est. Savings</span>
                    <span className="font-extrabold text-agri-evergreen text-xs">₹{joinSuccess.savings}</span>
                  </div>
                  <div>
                    <span className="text-agri-evergreen/80 block">Order ID</span>
                    <span className="font-mono text-agri-evergreen text-[10px]">#{joinSuccess.orderId.slice(0, 8)}</span>
                  </div>
                </div>
                <p className="text-[11px] text-agri-evergreen/90 pt-1 border-t border-agri-sprout-bright/20">
                  Your order is pooled under status <code className="bg-white/60 px-1 py-0.5 rounded font-bold">community_grouped</code>. You can track this anytime in <Link href="/orders" className="underline font-bold">Orders & Tracking</Link>.
                </p>
              </div>
            )}

            {/* Produce & Economics Summary */}
            <div className="p-4 rounded-xl bg-agri-earth-50 border border-agri-earth-100 space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="font-extrabold text-base text-agri-earth-900">{selectedCart.title}</h4>
                  <p className="text-xs text-agri-earth-700 mt-0.5">
                    Farmer: <span className="font-bold text-agri-earth-900">{selectedCart.farmer_name}</span>
                  </p>
                </div>
                <div className="text-right">
                  {renderStatusBadge(selectedCart.cart_status)}
                </div>
              </div>

              {/* Benchmark vs Community Price */}
              <div className="grid grid-cols-3 gap-2 bg-white p-3 rounded-xl border border-agri-earth-200 text-center">
                <div>
                  <span className="text-[10px] uppercase font-bold text-agri-earth-600 block">Mandi Benchmark</span>
                  <span className="text-xs font-bold text-agri-earth-800">
                    {selectedCart.mandi_benchmark_price ? `₹${selectedCart.mandi_benchmark_price}/kg` : 'APMC Index'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-agri-earth-600 block">Community Rate</span>
                  <span className="text-sm font-black text-agri-evergreen">₹{selectedCart.community_price}/kg</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-agri-earth-600 block">Retail Reference</span>
                  <span className="text-xs font-bold text-agri-earth-700 line-through">₹{selectedCart.regular_price}/kg</span>
                </div>
              </div>

              {/* Progress Detail */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-agri-earth-800">
                    Progress: {selectedCart.current_aggregated_quantity_kg} / {selectedCart.target_discount_quantity_kg} kg
                  </span>
                  <span className="text-agri-evergreen">
                    {Math.round((selectedCart.current_aggregated_quantity_kg / selectedCart.target_discount_quantity_kg) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-agri-earth-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-agri-evergreen transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.round((selectedCart.current_aggregated_quantity_kg / selectedCart.target_discount_quantity_kg) * 100))}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-agri-earth-700 pt-1">
                  <span>{selectedCart.participants_count || 0} customer(s) pooled</span>
                  <span className="font-semibold text-agri-earth-800">
                    {Math.max(0, selectedCart.target_discount_quantity_kg - selectedCart.current_aggregated_quantity_kg)} kg remaining
                  </span>
                </div>
              </div>
            </div>

            {/* Participating Members List (Real Supabase records) */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-agri-earth-800 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-agri-sprout" />
                <span>Current Community Members ({cartMembers.length})</span>
              </h4>

              {membersLoading && (
                <p className="text-[11px] text-agri-earth-600 py-2">Loading member commitments from database...</p>
              )}

              {!membersLoading && cartMembers.length === 0 && (
                <p className="text-[11px] text-agri-earth-600 py-2 bg-agri-earth-50 px-3 rounded-lg border border-dashed border-agri-earth-200">
                  Be the first community member to join this purchase pool!
                </p>
              )}

              {!membersLoading && cartMembers.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1.5 pr-1 divide-y divide-agri-earth-100">
                  {cartMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-5 rounded-full bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center text-[10px] font-bold">
                          {m.buyer_name[0]?.toUpperCase() || 'C'}
                        </div>
                        <span className="font-semibold text-agri-earth-900">{m.buyer_name}</span>
                      </div>
                      <span className="font-mono font-bold text-agri-evergreen">{m.quantity_kg} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Join Form */}
            <form onSubmit={handleConfirmJoin} className="space-y-4 pt-2 border-t border-agri-earth-100">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1.5">
                  Your Committed Quantity (kg)
                </label>
                <Input
                  type="number"
                  step="0.5"
                  min={selectedCart.min_commitment_kg || 1}
                  value={joinQuantity}
                  onChange={(e) => setJoinQuantity(e.target.value)}
                  required
                  disabled={joining || selectedCart.cart_status === 'completed' || selectedCart.cart_status === 'cancelled'}
                />
                <div className="flex items-center gap-2 mt-2">
                  {[2, 5, 10, 20].map((preset) => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setJoinQuantity(String(preset))}
                      disabled={joining || selectedCart.cart_status === 'completed' || selectedCart.cart_status === 'cancelled'}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-agri-earth-200 bg-white hover:border-agri-sprout text-agri-earth-800"
                    >
                      +{preset} kg
                    </button>
                  ))}
                  <span className="text-[11px] text-agri-earth-600 ml-auto">
                    Min commitment: {selectedCart.min_commitment_kg || 2} kg
                  </span>
                </div>
              </div>

              {/* Delivery Preference */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1.5">
                  Delivery / Pickup Preference
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDeliveryOption('neighborhood_delivery')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      deliveryOption === 'neighborhood_delivery'
                        ? 'border-agri-evergreen bg-agri-sprout-soft/60 ring-1 ring-agri-evergreen text-agri-evergreen'
                        : 'border-agri-earth-200 bg-white text-agri-earth-800 hover:border-agri-earth-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Truck className="h-4 w-4 text-agri-sprout" />
                      <span>Neighborhood Drop</span>
                    </div>
                    <p className="text-[10px] text-agri-earth-700 mt-1">
                      Consolidated to {selectedCart.delivery_landmark || selectedCart.locality}
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeliveryOption('pickup')}
                    className={`p-3 rounded-xl text-left border transition-all ${
                      deliveryOption === 'pickup'
                        ? 'border-agri-evergreen bg-agri-sprout-soft/60 ring-1 ring-agri-evergreen text-agri-evergreen'
                        : 'border-agri-earth-200 bg-white text-agri-earth-800 hover:border-agri-earth-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-bold text-xs">
                      <Store className="h-4 w-4 text-agri-evergreen" />
                      <span>Self Pickup Hub</span>
                    </div>
                    <p className="text-[10px] text-agri-earth-700 mt-1">
                      Collect directly from community depot
                    </p>
                  </button>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-3.5 rounded-xl bg-agri-sprout-soft/40 border border-agri-sprout-bright/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-agri-earth-700">Total Purchase Amount:</span>
                  <span className="font-extrabold text-agri-earth-900 text-sm">
                    ₹{((parseFloat(joinQuantity) || 0) * selectedCart.community_price).toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-agri-earth-700">Your Direct Community Savings:</span>
                  <span className="font-extrabold text-agri-evergreen">
                    ₹{((parseFloat(joinQuantity) || 0) * selectedCart.savings_per_kg).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCart(null)}
                  disabled={joining}
                >
                  Close
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="gap-2 font-bold"
                  disabled={joining || selectedCart.cart_status === 'completed' || selectedCart.cart_status === 'cancelled'}
                >
                  {joining ? 'Recording Order...' : 'Confirm & Join Community Cart'}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
