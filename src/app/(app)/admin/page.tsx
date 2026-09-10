'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchAdminDashboardStats,
  fetchAdminFarmers,
  fetchAdminCustomers,
  fetchAdminListings,
  fetchAdminOrders,
  fetchAdminAlerts,
  fetchAdminAnalytics,
  cancelCommunityCartByAdmin,
  toggleUserStatus,
  AdminKPICards,
  AdminFarmerRow,
  AdminCustomerRow,
  AdminListingRow,
  AdminOrderRow,
  AdminAlert,
  AdminAnalyticsData,
} from '@/lib/services/admin';
import {
  fetchCommunityCarts,
  fetchCommunityCartById,
  updateCommunityCartStatus,
  deriveCommunityDemandInsights,
  CommunityCartRow,
  CommunityCartMember,
  CommunityCartStatus,
  DemandInsight,
} from '@/lib/services/communityCart';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Users,
  Sprout,
  Store,
  Package,
  Clock,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  Search,
  Filter,
  RefreshCw,
  X,
  AlertCircle,
  Layers,
  MapPin,
  Flame,
  ArrowRight,
  Eye,
  Ban,
  Check,
  BarChart3,
  Building2,
  Truck,
} from 'lucide-react';

type AdminTab = 'overview' | 'community_carts' | 'farmers' | 'customers' | 'listings' | 'orders' | 'analytics';

export default function AdminDashboardPage() {
  const { user, role } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Loading & State
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Data States (Strictly queried from Supabase)
  const [kpis, setKpis] = useState<AdminKPICards | null>(null);
  const [alerts, setAlerts] = useState<AdminAlert[]>([]);
  const [insights, setInsights] = useState<DemandInsight[]>([]);
  const [carts, setCarts] = useState<CommunityCartRow[]>([]);
  const [farmers, setFarmers] = useState<AdminFarmerRow[]>([]);
  const [customers, setCustomers] = useState<AdminCustomerRow[]>([]);
  const [listings, setListings] = useState<AdminListingRow[]>([]);
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);

  // Table Filters & Search
  const [cartSearch, setCartSearch] = useState('');
  const [cartStatusFilter, setCartStatusFilter] = useState('all');
  const [listingCategoryFilter, setListingCategoryFilter] = useState('all');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Interactive Action Modals
  const [selectedCartDetail, setSelectedCartDetail] = useState<CommunityCartRow | null>(null);
  const [cartMembers, setCartMembers] = useState<CommunityCartMember[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirmation Modal State (Destructive Actions)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    actionLabel: string;
    isDestructive: boolean;
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    description: '',
    actionLabel: '',
    isDestructive: false,
    onConfirm: async () => {},
  });

  const [actionInProgress, setActionInProgress] = useState(false);
  const [actionSuccessNotice, setActionSuccessNotice] = useState<string | null>(null);

  const loadAllAdminData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    try {
      const [
        statsData,
        alertsData,
        cartsData,
        farmersData,
        customersData,
        listingsData,
        ordersData,
        analyticsData,
      ] = await Promise.all([
        fetchAdminDashboardStats(),
        fetchAdminAlerts(),
        fetchCommunityCarts(),
        fetchAdminFarmers(),
        fetchAdminCustomers(),
        fetchAdminListings(),
        fetchAdminOrders(),
        fetchAdminAnalytics(),
      ]);

      setKpis(statsData);
      setAlerts(alertsData);
      setCarts(cartsData);
      setFarmers(farmersData);
      setCustomers(customersData);
      setListings(listingsData);
      setOrders(ordersData);
      setAnalytics(analyticsData);
      setInsights(deriveCommunityDemandInsights(cartsData));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load administrative console data.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllAdminData();
  }, [loadAllAdminData]);

  // Open Cart Detail modal
  const handleViewCartDetail = async (cart: CommunityCartRow) => {
    setSelectedCartDetail(cart);
    setDetailLoading(true);
    try {
      const { members } = await fetchCommunityCartById(cart.id);
      setCartMembers(members);
    } catch {
      setCartMembers([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Open Confirmation Modal for Cart Cancellation
  const handlePromptCancelCart = (cart: CommunityCartRow) => {
    setConfirmModal({
      isOpen: true,
      title: 'Cancel Community Cart Pool',
      description: `Are you sure you want to cancel the collective purchase cart for "${cart.title}" in ${cart.locality}? This will halt all pooling orders.`,
      actionLabel: 'Confirm Cancellation',
      isDestructive: true,
      onConfirm: async () => {
        await cancelCommunityCartByAdmin(cart.id);
        setActionSuccessNotice(`Community Cart "${cart.title}" was successfully cancelled.`);
        await loadAllAdminData();
      },
    });
  };

  // Advance Cart Lifecycle
  const handleAdvanceCartStatus = (cart: CommunityCartRow, newStatus: CommunityCartStatus) => {
    setConfirmModal({
      isOpen: true,
      title: 'Advance Community Cart Status',
      description: `Transition cart "${cart.title}" status from ${cart.cart_status.toUpperCase()} to ${newStatus.toUpperCase()}?`,
      actionLabel: `Set to ${newStatus.replace('_', ' ').toUpperCase()}`,
      isDestructive: false,
      onConfirm: async () => {
        await updateCommunityCartStatus(cart.id, newStatus);
        setActionSuccessNotice(`Cart status advanced to ${newStatus}.`);
        await loadAllAdminData();
        if (selectedCartDetail?.id === cart.id) {
          const { cart: updated } = await fetchCommunityCartById(cart.id);
          setSelectedCartDetail(updated);
        }
      },
    });
  };

  // Filtered Community Carts for Table
  const filteredCarts = carts.filter((c) => {
    if (cartStatusFilter !== 'all' && c.cart_status !== cartStatusFilter) return false;
    if (cartSearch.trim()) {
      const q = cartSearch.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.locality.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.farmer_name?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered Listings
  const filteredListings = listings.filter((l) => {
    if (listingCategoryFilter !== 'all' && l.category !== listingCategoryFilter) return false;
    return true;
  });

  // Filtered Orders
  const filteredOrders = orders.filter((o) => {
    if (orderStatusFilter !== 'all' && o.status !== orderStatusFilter) return false;
    return true;
  });

  return (
    <div className="space-y-8">
      {/* Platform Ops Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-agri-earth-900 text-white flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-agri-sprout-bright" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                AgriLink Control Center
              </h1>
              <Badge variant="earth">Platform Administrator</Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              Centralized ecosystem operations, Hyperlocal Community Carts, and live producer-consumer market monitoring.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={loadAllAdminData} className="gap-2 text-xs font-semibold">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Sync Live DB</span>
          </Button>
          <Badge variant="sprout" className="text-xs py-1 px-3">
            SIH26033 Platform Ops
          </Badge>
        </div>
      </div>

      {/* Action Success Toast */}
      {actionSuccessNotice && (
        <div className="p-3.5 rounded-xl bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen text-xs flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-agri-sprout" />
            <span className="font-bold">{actionSuccessNotice}</span>
          </div>
          <button onClick={() => setActionSuccessNotice(null)}>
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-agri-earth-200 pb-2 scrollbar-none">
        {[
          { id: 'overview', label: 'Ecosystem Overview', icon: Layers },
          { id: 'community_carts', label: `Community Carts (${carts.length})`, icon: Users },
          { id: 'farmers', label: `Farmers (${farmers.length})`, icon: Sprout },
          { id: 'customers', label: `Customers (${customers.length})`, icon: Users },
          { id: 'listings', label: `Produce Batches (${listings.length})`, icon: Store },
          { id: 'orders', label: `Orders (${orders.length})`, icon: Package },
          { id: 'analytics', label: 'Demand Analytics', icon: BarChart3 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                isActive
                  ? 'bg-agri-earth-900 text-white shadow-xs'
                  : 'bg-white text-agri-earth-700 hover:bg-agri-earth-100 border border-agri-earth-200'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-agri-sprout-bright' : 'text-agri-earth-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Global Error Banner */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <Button variant="outline" size="sm" onClick={loadAllAdminData}>
            Retry Sync
          </Button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ECOSYSTEM OVERVIEW (8 TOP KPIS & ALERTS) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Top 8 KPI Cards (Computed from Real Supabase Data) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>1. Total Farmers</span>
                <Sprout className="h-4 w-4 text-agri-evergreen" />
              </div>
              <div className="text-2xl font-black text-agri-earth-900">
                {loading ? '...' : kpis?.totalFarmers || 0}
              </div>
              <p className="text-[10px] text-agri-earth-600">Registered producers</p>
            </Card>

            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>2. Total Customers</span>
                <Users className="h-4 w-4 text-agri-sprout" />
              </div>
              <div className="text-2xl font-black text-agri-earth-900">
                {loading ? '...' : kpis?.totalCustomers || 0}
              </div>
              <p className="text-[10px] text-agri-earth-600">Retail & bulk buyers</p>
            </Card>

            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>3. Active Listings</span>
                <Store className="h-4 w-4 text-agri-harvest" />
              </div>
              <div className="text-2xl font-black text-agri-earth-900">
                {loading ? '...' : kpis?.activeProduceListings || 0}
              </div>
              <p className="text-[10px] text-agri-earth-600">Live produce batches</p>
            </Card>

            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>4. Active Carts</span>
                <Users className="h-4 w-4 text-agri-evergreen" />
              </div>
              <div className="text-2xl font-black text-agri-evergreen">
                {loading ? '...' : kpis?.activeCommunityCarts || 0}
              </div>
              <p className="text-[10px] text-agri-earth-600">Community pools open</p>
            </Card>

            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>5. Total Orders</span>
                <Package className="h-4 w-4 text-agri-sprout" />
              </div>
              <div className="text-2xl font-black text-agri-earth-900">
                {loading ? '...' : kpis?.totalOrders || 0}
              </div>
              <p className="text-[10px] text-agri-earth-600">Direct & community orders</p>
            </Card>

            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>6. Pending Actions</span>
                <Clock className="h-4 w-4 text-agri-harvest" />
              </div>
              <div className="text-2xl font-black text-amber-600">
                {loading ? '...' : kpis?.pendingActions || 0}
              </div>
              <p className="text-[10px] text-agri-earth-600">Closing carts / reviews</p>
            </Card>

            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>7. Completed Orders</span>
                <CheckCircle2 className="h-4 w-4 text-agri-evergreen" />
              </div>
              <div className="text-2xl font-black text-agri-evergreen">
                {loading ? '...' : kpis?.completedTransactions || 0}
              </div>
              <p className="text-[10px] text-agri-earth-600">Fulfilled transactions</p>
            </Card>

            <Card hoverEffect className="p-4 bg-white border-agri-earth-200 space-y-1">
              <div className="flex items-center justify-between text-agri-earth-600 text-xs font-bold">
                <span>8. Produce Volume</span>
                <TrendingUp className="h-4 w-4 text-agri-sprout" />
              </div>
              <div className="text-2xl font-black text-agri-earth-900">
                {loading ? '...' : `${(kpis?.totalProduceVolumeKg || 0).toLocaleString('en-IN')} kg`}
              </div>
              <p className="text-[10px] text-agri-earth-600">Stock & pooled volume</p>
            </Card>
          </div>

          {/* Operational Alerts & Demand Insights Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Real System Alerts */}
            <Card className="p-6 bg-white border-agri-earth-200 space-y-4">
              <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-agri-harvest" />
                  <h3 className="font-extrabold text-sm text-agri-earth-900">Operational Alerts & Pending Tasks</h3>
                </div>
                <Badge variant="harvest">{alerts.length} Active</Badge>
              </div>

              {alerts.length === 0 ? (
                <div className="py-6 text-center text-xs text-agri-earth-600">
                  All systems operational. No urgent administrative tasks pending.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {alerts.map((al) => (
                    <div
                      key={al.id}
                      className={`p-3 rounded-xl border text-xs space-y-1 ${
                        al.severity === 'urgent'
                          ? 'bg-amber-50/70 border-amber-300 text-amber-950'
                          : al.severity === 'warning'
                          ? 'bg-yellow-50/60 border-yellow-200 text-yellow-950'
                          : 'bg-agri-earth-50 border-agri-earth-200 text-agri-earth-900'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold">
                        <span>{al.title}</span>
                        <span className="text-[10px] uppercase opacity-75">{al.severity}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed opacity-90">{al.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Real Demand Insights */}
            <Card className="p-6 bg-white border-agri-earth-200 space-y-4">
              <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
                <div className="flex items-center gap-2">
                  <Flame className="h-4 w-4 text-agri-harvest" />
                  <h3 className="font-extrabold text-sm text-agri-earth-900">Collective Demand Insights</h3>
                </div>
                <Badge variant="sprout">Data-Driven</Badge>
              </div>

              {insights.length === 0 ? (
                <div className="py-6 text-center text-xs text-agri-earth-600">
                  No active carts currently registered to derive demand insights.
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                  {insights.map((ins) => (
                    <div key={ins.id} className="p-3 rounded-xl bg-agri-sprout-soft/30 border border-agri-sprout/30 space-y-1 text-xs">
                      <div className="flex items-center justify-between font-bold text-agri-evergreen">
                        <span>{ins.title}</span>
                        {ins.metric && <span className="font-mono text-[10px]">{ins.metric}</span>}
                      </div>
                      <p className="text-[11px] text-agri-earth-800 leading-relaxed">{ins.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: COMMUNITY CART MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'community_carts' && (
        <Card className="p-6 bg-white border-agri-earth-200 space-y-5 animate-in fade-in duration-150">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-agri-earth-100 pb-4">
            <div>
              <h3 className="text-base font-extrabold text-agri-earth-900">Community Cart Management</h3>
              <p className="text-xs text-agri-earth-700 mt-0.5">
                Monitor pooled volume, member rosters, and control batch lifecycle status.
              </p>
            </div>

            {/* Filter & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <div className="relative w-full sm:w-60">
                <Search className="h-3.5 w-3.5 text-agri-earth-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search carts, produce..."
                  value={cartSearch}
                  onChange={(e) => setCartSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl border border-agri-earth-200 text-xs bg-white text-agri-earth-900 focus:outline-none focus:ring-1 focus:ring-agri-sprout"
                />
              </div>

              <select
                value={cartStatusFilter}
                onChange={(e) => setCartStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl border border-agri-earth-200 text-xs bg-white text-agri-earth-800 font-semibold"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="target_reached">Target Reached</option>
                <option value="locked">Locked</option>
                <option value="farmer_confirmed">Farmer Confirmed</option>
                <option value="preparing">Preparing</option>
                <option value="out_for_delivery">Out for Delivery</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          {/* Table */}
          {filteredCarts.length === 0 ? (
            <div className="py-12 text-center text-xs text-agri-earth-600 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-200 p-4">
              No community carts match your search or filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-agri-earth-900">
                <thead className="bg-agri-earth-50 text-[11px] font-extrabold uppercase text-agri-earth-700 border-b border-agri-earth-200">
                  <tr>
                    <th className="p-3">Cart ID / Produce</th>
                    <th className="p-3">Farmer</th>
                    <th className="p-3">Locality</th>
                    <th className="p-3 text-right">Pooled / Target</th>
                    <th className="p-3 text-right">Members</th>
                    <th className="p-3 text-right">Community Rate</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-agri-earth-100">
                  {filteredCarts.map((c) => {
                    const pct = Math.min(100, Math.round((c.current_aggregated_quantity_kg / c.target_discount_quantity_kg) * 100));
                    return (
                      <tr key={c.id} className="hover:bg-agri-earth-50/60 transition-colors">
                        <td className="p-3 font-semibold">
                          <div className="font-extrabold text-agri-earth-900">{c.title}</div>
                          <div className="text-[10px] font-mono text-agri-earth-500">#{c.id.slice(0, 8)}</div>
                        </td>
                        <td className="p-3 text-agri-earth-800">{c.farmer_name || 'FPO Producer'}</td>
                        <td className="p-3 text-agri-earth-800">{c.locality}</td>
                        <td className="p-3 text-right font-mono">
                          <span className="font-bold text-agri-evergreen">{c.current_aggregated_quantity_kg}</span> / {c.target_discount_quantity_kg} kg
                          <div className="text-[10px] text-agri-earth-500 font-sans">{pct}%</div>
                        </td>
                        <td className="p-3 text-right font-bold text-agri-earth-800">{c.participants_count || 0}</td>
                        <td className="p-3 text-right font-bold text-agri-evergreen">₹{c.community_price}/kg</td>
                        <td className="p-3">
                          <Badge variant={c.cart_status === 'target_reached' ? 'harvest' : c.cart_status === 'open' ? 'sprout' : 'outline'} className="text-[10px]">
                            {c.cart_status.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </td>
                        <td className="p-3 text-right space-x-1.5">
                          <Button variant="outline" size="sm" onClick={() => handleViewCartDetail(c)} className="text-[11px] py-1 px-2.5">
                            <Eye className="h-3 w-3 mr-1" /> View
                          </Button>
                          {c.cart_status !== 'cancelled' && c.cart_status !== 'completed' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePromptCancelCart(c)}
                              className="text-[11px] py-1 px-2 text-red-700 border-red-200 hover:bg-red-50"
                            >
                              <Ban className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: FARMER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'farmers' && (
        <Card className="p-6 bg-white border-agri-earth-200 space-y-5 animate-in fade-in duration-150">
          <div className="border-b border-agri-earth-100 pb-3">
            <h3 className="text-base font-extrabold text-agri-earth-900">Farmer & FPO Producer Management</h3>
            <p className="text-xs text-agri-earth-700 mt-0.5">
              Verified producer accounts, active marketplace batches, and regional compliance.
            </p>
          </div>

          {farmers.length === 0 ? (
            <div className="py-12 text-center text-xs text-agri-earth-600 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-200 p-4">
              No registered farmers found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-agri-earth-900">
                <thead className="bg-agri-earth-50 text-[11px] font-extrabold uppercase text-agri-earth-700 border-b border-agri-earth-200">
                  <tr>
                    <th className="p-3">Farmer Name / Organization</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">District / State</th>
                    <th className="p-3 text-center">FPO Status</th>
                    <th className="p-3 text-right">Listings</th>
                    <th className="p-3 text-right">Active Pools</th>
                    <th className="p-3">Account Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-agri-earth-100">
                  {farmers.map((f) => (
                    <tr key={f.id} className="hover:bg-agri-earth-50/60">
                      <td className="p-3 font-extrabold text-agri-earth-900">{f.fullName}</td>
                      <td className="p-3 text-agri-earth-700 font-mono text-[11px]">{f.email}</td>
                      <td className="p-3 text-agri-earth-800">{f.district}, {f.state}</td>
                      <td className="p-3 text-center">
                        <Badge variant={f.isFpo ? 'evergreen' : 'outline'} className="text-[10px]">
                          {f.isFpo ? 'Registered FPO' : 'Individual Producer'}
                        </Badge>
                      </td>
                      <td className="p-3 text-right font-bold">{f.listingsCount}</td>
                      <td className="p-3 text-right font-bold text-agri-evergreen">{f.activeCartsCount}</td>
                      <td className="p-3">
                        <Badge variant="sprout" className="text-[10px]">Active</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2 text-agri-earth-700"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Suspend Farmer Producer',
                              description: `Suspend account privileges for ${f.fullName} (${f.email})? They will not be able to publish new produce listings.`,
                              actionLabel: 'Suspend Account',
                              isDestructive: true,
                              onConfirm: async () => {
                                await toggleUserStatus(f.id, 'suspended');
                                setActionSuccessNotice(`Account for ${f.fullName} suspended.`);
                              },
                            });
                          }}
                        >
                          Suspend
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CUSTOMER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'customers' && (
        <Card className="p-6 bg-white border-agri-earth-200 space-y-5 animate-in fade-in duration-150">
          <div className="border-b border-agri-earth-100 pb-3">
            <h3 className="text-base font-extrabold text-agri-earth-900">Customer & Buyer Management</h3>
            <p className="text-xs text-agri-earth-700 mt-0.5">
              Consumer accounts, community cart participation, and direct purchase records.
            </p>
          </div>

          {customers.length === 0 ? (
            <div className="py-12 text-center text-xs text-agri-earth-600 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-200 p-4">
              No registered customers found in the database.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-agri-earth-900">
                <thead className="bg-agri-earth-50 text-[11px] font-extrabold uppercase text-agri-earth-700 border-b border-agri-earth-200">
                  <tr>
                    <th className="p-3">Customer Name</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Role</th>
                    <th className="p-3 text-right">Joined Pools</th>
                    <th className="p-3 text-right">Total Orders</th>
                    <th className="p-3">Status</th>
                    <th className="p-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-agri-earth-100">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-agri-earth-50/60">
                      <td className="p-3 font-extrabold text-agri-earth-900">{c.fullName}</td>
                      <td className="p-3 text-agri-earth-700 font-mono text-[11px]">{c.email}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] uppercase">{c.role}</Badge>
                      </td>
                      <td className="p-3 text-right font-bold text-agri-evergreen">{c.joinedCartsCount}</td>
                      <td className="p-3 text-right font-bold">{c.ordersCount}</td>
                      <td className="p-3">
                        <Badge variant="sprout" className="text-[10px]">Active</Badge>
                      </td>
                      <td className="p-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-[10px] py-1 px-2 text-agri-earth-700"
                          onClick={() => {
                            setConfirmModal({
                              isOpen: true,
                              title: 'Suspend Customer Account',
                              description: `Suspend account for ${c.fullName} (${c.email})?`,
                              actionLabel: 'Suspend Account',
                              isDestructive: true,
                              onConfirm: async () => {
                                await toggleUserStatus(c.id, 'suspended');
                                setActionSuccessNotice(`Customer ${c.fullName} suspended.`);
                              },
                            });
                          }}
                        >
                          Suspend
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: PRODUCE LISTINGS OVERVIEW */}
      {/* ========================================================================= */}
      {activeTab === 'listings' && (
        <Card className="p-6 bg-white border-agri-earth-200 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-agri-earth-900">Marketplace Produce Listings</h3>
              <p className="text-xs text-agri-earth-700 mt-0.5">
                Active produce batches, fair mandi benchmarks, and community cart availability.
              </p>
            </div>
            <select
              value={listingCategoryFilter}
              onChange={(e) => setListingCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-agri-earth-200 text-xs bg-white font-semibold"
            >
              <option value="all">All Categories</option>
              <option value="vegetables">Vegetables</option>
              <option value="fruits">Fruits</option>
              <option value="grains_pulses">Grains & Pulses</option>
              <option value="spices">Spices</option>
              <option value="dairy_other">Dairy & Other</option>
            </select>
          </div>

          {filteredListings.length === 0 ? (
            <div className="py-12 text-center text-xs text-agri-earth-600 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-200 p-4">
              No produce listings match the selected category.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-agri-earth-900">
                <thead className="bg-agri-earth-50 text-[11px] font-extrabold uppercase text-agri-earth-700 border-b border-agri-earth-200">
                  <tr>
                    <th className="p-3">Produce Title</th>
                    <th className="p-3">Farmer</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Available Stock</th>
                    <th className="p-3 text-right">Selling Price</th>
                    <th className="p-3 text-right">Mandi Benchmark</th>
                    <th className="p-3 text-center">Community Pool</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-agri-earth-100">
                  {filteredListings.map((l) => (
                    <tr key={l.id} className="hover:bg-agri-earth-50/60">
                      <td className="p-3 font-extrabold text-agri-earth-900">{l.title}</td>
                      <td className="p-3 text-agri-earth-800">{l.farmerName}</td>
                      <td className="p-3">
                        <Badge variant="outline" className="text-[10px] uppercase">{l.category.replace('_', ' ')}</Badge>
                      </td>
                      <td className="p-3 text-right font-mono font-bold">{l.availableQuantityKg} kg</td>
                      <td className="p-3 text-right font-bold text-agri-evergreen">₹{l.pricePerKg}/kg</td>
                      <td className="p-3 text-right text-agri-earth-700">
                        {l.mandiBenchmarkPrice ? `₹${l.mandiBenchmarkPrice}/kg` : 'N/A'}
                      </td>
                      <td className="p-3 text-center">
                        {l.hasCommunityCart ? (
                          <Badge variant="sprout" className="text-[10px]">Active Pool</Badge>
                        ) : (
                          <span className="text-[11px] text-agri-earth-400">—</span>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge variant={l.isActive ? 'evergreen' : 'earth'} className="text-[10px]">
                          {l.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: ORDER MONITORING */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <Card className="p-6 bg-white border-agri-earth-200 space-y-5 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-agri-earth-900">Ecosystem Order Monitoring</h3>
              <p className="text-xs text-agri-earth-700 mt-0.5">
                Centralized lifecycle audit of direct purchase and collective community cart orders.
              </p>
            </div>
            <select
              value={orderStatusFilter}
              onChange={(e) => setOrderStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-agri-earth-200 text-xs bg-white font-semibold"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="community_grouped">Community Grouped</option>
              <option value="confirmed">Confirmed</option>
              <option value="dispatched">Dispatched</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {filteredOrders.length === 0 ? (
            <div className="py-12 text-center text-xs text-agri-earth-600 bg-agri-earth-50 rounded-xl border border-dashed border-agri-earth-200 p-4">
              No orders recorded under the active status filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-agri-earth-900">
                <thead className="bg-agri-earth-50 text-[11px] font-extrabold uppercase text-agri-earth-700 border-b border-agri-earth-200">
                  <tr>
                    <th className="p-3">Order ID</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3">Produce Batch</th>
                    <th className="p-3">Farmer</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Amount</th>
                    <th className="p-3 text-center">Type</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-agri-earth-100">
                  {filteredOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-agri-earth-50/60">
                      <td className="p-3 font-mono font-bold text-agri-earth-700 text-[11px]">#{o.id.slice(0, 8)}</td>
                      <td className="p-3 font-semibold text-agri-earth-900">{o.buyerName}</td>
                      <td className="p-3 text-agri-earth-800">{o.produceTitle}</td>
                      <td className="p-3 text-agri-earth-700">{o.farmerName}</td>
                      <td className="p-3 text-right font-bold">{o.quantityKg} kg</td>
                      <td className="p-3 text-right font-extrabold text-agri-evergreen">₹{o.totalPrice.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-center">
                        {o.isCommunityCart ? (
                          <Badge variant="sprout" className="text-[10px]">Community Cart</Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">Direct</Badge>
                        )}
                      </td>
                      <td className="p-3">
                        <Badge
                          variant={
                            o.status === 'delivered'
                              ? 'evergreen'
                              : o.status === 'confirmed'
                              ? 'sprout'
                              : o.status === 'pending'
                              ? 'harvest'
                              : 'outline'
                          }
                          className="text-[10px] uppercase"
                        >
                          {o.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-3 text-agri-earth-600 text-[11px]">
                        {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DEMAND ANALYTICS */}
      {/* ========================================================================= */}
      {activeTab === 'analytics' && (
        <div className="space-y-6 animate-in fade-in duration-150">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <Card className="p-4 bg-white border-agri-earth-200">
              <span className="text-[10px] uppercase font-bold text-agri-earth-600 block">Total Pooled Volume</span>
              <span className="text-2xl font-black text-agri-evergreen mt-1 block">
                {(analytics?.totalPooledVolumeKg || 0).toLocaleString('en-IN')} kg
              </span>
            </Card>
            <Card className="p-4 bg-white border-agri-earth-200">
              <span className="text-[10px] uppercase font-bold text-agri-earth-600 block">Active Community Pools</span>
              <span className="text-2xl font-black text-agri-earth-900 mt-1 block">
                {analytics?.activeCartsCount || 0}
              </span>
            </Card>
            <Card className="p-4 bg-white border-agri-earth-200">
              <span className="text-[10px] uppercase font-bold text-agri-earth-600 block">Completed Batches</span>
              <span className="text-2xl font-black text-agri-earth-900 mt-1 block">
                {analytics?.completedCartsCount || 0}
              </span>
            </Card>
            <Card className="p-4 bg-white border-agri-earth-200">
              <span className="text-[10px] uppercase font-bold text-agri-earth-600 block">Avg Members / Cart</span>
              <span className="text-2xl font-black text-agri-sprout mt-1 block">
                {analytics?.avgParticipantsPerCart || 0}
              </span>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Locality Demand Distribution */}
            <Card className="p-6 bg-white border-agri-earth-200 space-y-4">
              <h3 className="font-extrabold text-sm text-agri-earth-900 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-agri-sprout" />
                <span>Locality Demand Distribution</span>
              </h3>

              {!analytics?.localityDemand || analytics.localityDemand.length === 0 ? (
                <p className="text-xs text-agri-earth-600 py-6 text-center">No locality data available yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.localityDemand.map((loc) => {
                    const maxVol = Math.max(...analytics.localityDemand.map((l) => l.volumeKg), 1);
                    const pct = Math.round((loc.volumeKg / maxVol) * 100);
                    return (
                      <div key={loc.locality} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-agri-earth-900">{loc.locality}</span>
                          <span className="text-agri-evergreen font-bold">{loc.volumeKg} kg pooled ({loc.count} pools)</span>
                        </div>
                        <div className="w-full bg-agri-earth-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-agri-sprout" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Produce Category Demand */}
            <Card className="p-6 bg-white border-agri-earth-200 space-y-4">
              <h3 className="font-extrabold text-sm text-agri-earth-900 flex items-center gap-2">
                <Store className="h-4 w-4 text-agri-harvest" />
                <span>Produce Category Pooling Volume</span>
              </h3>

              {!analytics?.categoryBreakdown || analytics.categoryBreakdown.length === 0 ? (
                <p className="text-xs text-agri-earth-600 py-6 text-center">No category pooling data yet.</p>
              ) : (
                <div className="space-y-3">
                  {analytics.categoryBreakdown.map((cat) => {
                    const maxVol = Math.max(...analytics.categoryBreakdown.map((c) => c.volumeKg), 1);
                    const pct = Math.round((cat.volumeKg / maxVol) * 100);
                    return (
                      <div key={cat.category} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-agri-earth-900 uppercase text-[11px]">{cat.category.replace('_', ' ')}</span>
                          <span className="text-agri-evergreen font-bold">{cat.volumeKg} kg ({cat.count} pools)</span>
                        </div>
                        <div className="w-full bg-agri-earth-100 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-agri-evergreen" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: COMMUNITY CART DETAILS & MEMBER INSPECTION */}
      {/* ========================================================================= */}
      {selectedCartDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-agri-earth-900">{selectedCartDetail.title}</h3>
                <p className="text-xs text-agri-earth-600">ID: {selectedCartDetail.id}</p>
              </div>
              <button onClick={() => setSelectedCartDetail(null)}>
                <X className="h-5 w-5 text-agri-earth-600" />
              </button>
            </div>

            {/* Overview Details */}
            <div className="p-3.5 rounded-xl bg-agri-earth-50 border border-agri-earth-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-agri-earth-600 block">Locality</span>
                <span className="font-bold text-agri-earth-900">{selectedCartDetail.locality}</span>
              </div>
              <div>
                <span className="text-agri-earth-600 block">Producer / Farmer</span>
                <span className="font-bold text-agri-earth-900">{selectedCartDetail.farmer_name}</span>
              </div>
              <div>
                <span className="text-agri-earth-600 block">Community Price</span>
                <span className="font-black text-agri-evergreen">₹{selectedCartDetail.community_price}/kg</span>
              </div>
              <div>
                <span className="text-agri-earth-600 block">Progress</span>
                <span className="font-bold">{selectedCartDetail.current_aggregated_quantity_kg} / {selectedCartDetail.target_discount_quantity_kg} kg</span>
              </div>
            </div>

            {/* Lifecycle Status Progression Controls */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase text-agri-earth-700 block">Advance Status</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['open', 'target_reached', 'locked', 'farmer_confirmed', 'preparing', 'out_for_delivery', 'completed'] as CommunityCartStatus[]).map((st) => (
                  <button
                    key={st}
                    onClick={() => handleAdvanceCartStatus(selectedCartDetail, st)}
                    className={`px-2 py-1 rounded-lg text-[10px] font-bold border transition-all ${
                      selectedCartDetail.cart_status === st
                        ? 'bg-agri-evergreen text-white border-agri-evergreen'
                        : 'bg-white text-agri-earth-700 hover:bg-agri-earth-100 border-agri-earth-200'
                    }`}
                  >
                    {st.replace('_', ' ').toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Participating Members */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-agri-earth-800">
                Participant Orders ({cartMembers.length})
              </h4>
              {detailLoading && <p className="text-xs text-agri-earth-600">Loading members...</p>}
              {!detailLoading && cartMembers.length === 0 && (
                <p className="text-xs text-agri-earth-600 py-3 bg-agri-earth-50 rounded-lg text-center">
                  No orders recorded for this cart yet.
                </p>
              )}
              {!detailLoading && cartMembers.length > 0 && (
                <div className="max-h-36 overflow-y-auto space-y-1.5 divide-y divide-agri-earth-100">
                  {cartMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between text-xs py-1">
                      <span className="font-semibold text-agri-earth-900">{m.buyer_name}</span>
                      <span className="font-mono font-bold text-agri-evergreen">{m.quantity_kg} kg</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-agri-earth-100">
              <Button variant="outline" size="sm" onClick={() => setSelectedCartDetail(null)}>
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: GENERIC ACTION CONFIRMATION MODAL (DESTRUCTIVE SAFEGUARD) */}
      {/* ========================================================================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-md p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`h-10 w-10 rounded-xl flex items-center justify-center font-bold ${
                  confirmModal.isDestructive
                    ? 'bg-red-100 text-red-700'
                    : 'bg-agri-sprout-soft text-agri-evergreen'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-base font-extrabold text-agri-earth-900 leading-tight">
                {confirmModal.title}
              </h3>
            </div>

            <p className="text-xs text-agri-earth-700 leading-relaxed">
              {confirmModal.description}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-agri-earth-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
                disabled={actionInProgress}
              >
                Cancel
              </Button>
              <Button
                variant={confirmModal.isDestructive ? 'outline' : 'primary'}
                size="sm"
                className={`font-bold ${
                  confirmModal.isDestructive
                    ? 'bg-red-600 text-white hover:bg-red-700 border-transparent'
                    : ''
                }`}
                disabled={actionInProgress}
                onClick={async () => {
                  setActionInProgress(true);
                  try {
                    await confirmModal.onConfirm();
                    setConfirmModal((prev) => ({ ...prev, isOpen: false }));
                  } catch (err: unknown) {
                    const msg = err instanceof Error ? err.message : 'Action failed';
                    setErrorMsg(msg);
                  } finally {
                    setActionInProgress(false);
                  }
                }}
              >
                {actionInProgress ? 'Processing...' : confirmModal.actionLabel}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
