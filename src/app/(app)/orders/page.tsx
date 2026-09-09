'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUserOrders,
  fetchFarmerOrders,
  cancelOrder,
  confirmOrder,
  UserOrderRow,
} from '@/lib/services/orders';
import {
  fetchDeliveryPartners,
  dispatchOrder,
  fetchDeliveryTrackingForOrder,
  DeliveryPartnerOption,
  DeliveryTaskRow,
} from '@/lib/services/delivery';
import { fetchFarmInfo } from '@/lib/services/profile';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Package,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  User,
  Calendar,
  Sprout,
  X,
  CheckCircle2,
  Clock,
  Truck,
  Ban,
  Navigation,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export default function OrdersPage() {
  const { user, role } = useAuth();
  const isFarmer = role === 'farmer_fpo' || role === 'admin';

  const [orders, setOrders] = useState<UserOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Dispatch Modal State (Farmer only)
  const [dispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [selectedOrderForDispatch, setSelectedOrderForDispatch] = useState<UserOrderRow | null>(null);
  const [deliveryPartners, setDeliveryPartners] = useState<DeliveryPartnerOption[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [pickupLocation, setPickupLocation] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [dispatchSubmitting, setDispatchSubmitting] = useState(false);
  const [dispatchError, setDispatchError] = useState<string | null>(null);

  // Live Tracking Modal State (Consumer & Farmer)
  const [trackingModalOpen, setTrackingModalOpen] = useState(false);
  const [selectedOrderForTracking, setSelectedOrderForTracking] = useState<UserOrderRow | null>(null);
  const [activeTrackingTask, setActiveTrackingTask] = useState<DeliveryTaskRow | null>(null);
  const [trackingLoading, setTrackingLoading] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = isFarmer
        ? await fetchFarmerOrders(user.id)
        : await fetchUserOrders(user.id);
      setOrders(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load orders.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  }, [user, isFarmer]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const handleCancel = async (orderId: string) => {
    setActionLoading(orderId);
    setActionError(null);
    try {
      await cancelOrder(orderId);
      await loadOrders();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel order.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleConfirm = async (orderId: string) => {
    setActionLoading(orderId);
    setActionError(null);
    try {
      await confirmOrder(orderId);
      await loadOrders();
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to confirm order.');
    } finally {
      setActionLoading(null);
    }
  };

  // Open Dispatch Modal
  const openDispatchModal = async (order: UserOrderRow) => {
    setSelectedOrderForDispatch(order);
    setDispatchError(null);
    setDispatchSubmitting(false);

    // Pre-fill pickup location from farmer's profile / farm info if available
    let defaultPickup = 'Farmer Producer Collection Center';
    if (user) {
      try {
        const farm = await fetchFarmInfo(user.id);
        if (farm) {
          defaultPickup = [farm.organization_name, farm.district, farm.state].filter(Boolean).join(', ');
        }
      } catch {
        // Fallback to default
      }
    }
    setPickupLocation(defaultPickup);

    // Pre-fill delivery location from buyer
    setDeliveryLocation('Consumer Destination / Sector Landmark');

    // Load available delivery partners
    try {
      const partners = await fetchDeliveryPartners();
      setDeliveryPartners(partners);
      if (partners.length > 0) {
        setSelectedDriverId(partners[0].id);
      } else {
        setSelectedDriverId('');
      }
    } catch {
      setDeliveryPartners([]);
    }

    setDispatchModalOpen(true);
  };

  const closeDispatchModal = () => {
    setDispatchModalOpen(false);
    setSelectedOrderForDispatch(null);
    setDispatchError(null);
  };

  const handleConfirmDispatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderForDispatch) return;

    if (!pickupLocation.trim()) {
      setDispatchError('Pickup location is required.');
      return;
    }
    if (!deliveryLocation.trim()) {
      setDispatchError('Delivery destination is required.');
      return;
    }

    setDispatchSubmitting(true);
    setDispatchError(null);

    try {
      await dispatchOrder(
        selectedOrderForDispatch.id,
        selectedDriverId || null,
        pickupLocation.trim(),
        deliveryLocation.trim()
      );
      closeDispatchModal();
      await loadOrders();
    } catch (err: unknown) {
      setDispatchError(err instanceof Error ? err.message : 'Failed to dispatch order.');
    } finally {
      setDispatchSubmitting(false);
    }
  };

  // Open Tracking Modal
  const openTrackingModal = async (order: UserOrderRow) => {
    setSelectedOrderForTracking(order);
    setTrackingLoading(true);
    setTrackingModalOpen(true);
    try {
      const task = await fetchDeliveryTrackingForOrder(order.id);
      setActiveTrackingTask(task);
    } catch {
      setActiveTrackingTask(null);
    } finally {
      setTrackingLoading(false);
    }
  };

  const closeTrackingModal = () => {
    setTrackingModalOpen(false);
    setSelectedOrderForTracking(null);
    setActiveTrackingTask(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="harvest" className="gap-1">
            <Clock className="h-3 w-3" />
            <span>Pending Confirmation</span>
          </Badge>
        );
      case 'confirmed':
        return (
          <Badge variant="evergreen" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Confirmed</span>
          </Badge>
        );
      case 'dispatched':
        return (
          <Badge variant="sand" className="gap-1">
            <Truck className="h-3 w-3" />
            <span>Dispatched / Out for Delivery</span>
          </Badge>
        );
      case 'delivered':
        return (
          <Badge variant="sprout" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Delivered</span>
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge variant="earth" className="gap-1">
            <Ban className="h-3 w-3" />
            <span>Cancelled</span>
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const canCancel = (status: string) =>
    status === 'pending' || status === 'confirmed';

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
              <Badge variant="sprout">
                {isFarmer ? 'Incoming Orders' : 'My Direct Orders'}
              </Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              {isFarmer
                ? 'Manage orders placed against your produce listings. Confirm, dispatch, or track delivery fulfillment.'
                : 'Track your direct farm produce orders, quantities, driver assignments, and delivery schedules.'}
            </p>
          </div>
        </div>

        {!isFarmer && (
          <Link href="/marketplace">
            <Button variant="primary" size="sm" className="gap-2 font-bold shadow-sm">
              <ShoppingBag className="h-4 w-4 text-agri-sprout-bright" />
              <span>Browse Marketplace</span>
            </Button>
          </Link>
        )}
      </div>

      {/* Global Action Error */}
      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Error Alert */}
      {errorMsg && (
        <Card className="p-6 bg-red-50 border-red-200 text-red-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Error Loading Orders</span>
          </div>
          <p className="text-xs leading-relaxed">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={loadOrders} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </Button>
        </Card>
      )}

      {/* Loading Skeleton */}
      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="p-6 space-y-3 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="h-5 w-48 bg-agri-earth-100 rounded-lg" />
                <div className="h-5 w-24 bg-agri-earth-100 rounded-lg" />
              </div>
              <div className="h-4 w-32 bg-agri-earth-100 rounded-lg" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !errorMsg && orders.length === 0 && (
        <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white border-dashed border-agri-earth-300">
          <div className="h-16 w-16 rounded-3xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center">
            <ShoppingBag className="h-8 w-8 text-agri-sprout" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-lg font-bold text-agri-earth-900">
              {isFarmer ? 'No Incoming Orders Yet' : 'No Orders Found'}
            </h3>
            <p className="text-xs text-agri-earth-700 leading-relaxed">
              {isFarmer
                ? 'Buyers have not placed any orders on your produce listings yet. Create more listings to attract buyers!'
                : 'You have not placed any direct produce orders yet. Explore the marketplace to purchase fresh produce directly from farmers!'}
            </p>
          </div>
          {!isFarmer && (
            <Link href="/marketplace">
              <Button variant="primary" size="sm" className="gap-2 font-bold shadow-sm">
                <Sprout className="h-4 w-4 text-agri-sprout-bright" />
                <span>Explore Produce Marketplace</span>
              </Button>
            </Link>
          )}
        </Card>
      )}

      {/* Orders List */}
      {!loading && !errorMsg && orders.length > 0 && (
        <div className="space-y-4">
          {orders.map((order) => {
            const dateStr = new Date(order.created_at).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const listingTitle = order.produce_listings?.title || 'Produce Batch Order';
            const farmerName =
              order.produce_listings?.profiles?.full_name || 'Verified FPO Producer';
            const buyerName =
              (order as UserOrderRow & { buyer_profile?: { full_name: string | null; email: string } | null })
                .buyer_profile?.full_name ||
              (order as UserOrderRow & { buyer_profile?: { full_name: string | null; email: string } | null })
                .buyer_profile?.email ||
              'Buyer';

            const isActioning = actionLoading === order.id;
            const isCancelled = order.status === 'cancelled';
            const isDispatchedOrDelivered = order.status === 'dispatched' || order.status === 'delivered';

            return (
              <Card
                key={order.id}
                hoverEffect
                className={`p-6 bg-white border-agri-earth-200 space-y-4 ${isCancelled ? 'opacity-70' : ''}`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-agri-earth-100 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-agri-earth-900 leading-tight">
                        {listingTitle}
                      </h3>
                      {order.produce_listings?.category && (
                        <Badge variant="sprout" className="text-[10px] uppercase">
                          {order.produce_listings.category.replace('_', ' ')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-agri-earth-700">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5 text-agri-sprout" />
                        <span>{dateStr}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 font-semibold text-agri-earth-900">
                        <User className="h-3.5 w-3.5 text-agri-evergreen" />
                        {isFarmer ? (
                          <span>Buyer: {buyerName}</span>
                        ) : (
                          <span>Producer: {farmerName}</span>
                        )}
                      </span>
                    </div>
                  </div>

                  <div>{getStatusBadge(order.status)}</div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 text-xs">
                    <div>
                      <span className="text-agri-earth-600 block">Quantity Ordered</span>
                      <span className="font-extrabold text-agri-earth-900 text-sm">
                        {order.quantity_kg} kg
                      </span>
                    </div>

                    <div>
                      <span className="text-agri-earth-600 block">Total Amount</span>
                      <span className="font-extrabold text-agri-evergreen text-sm">
                        ₹{order.total_price.toLocaleString('en-IN')}
                      </span>
                    </div>

                    <div>
                      <span className="text-agri-earth-600 block">Order ID</span>
                      <span
                        className="font-mono text-[11px] text-agri-earth-700 font-semibold truncate max-w-[120px] block"
                        title={order.id}
                      >
                        #{order.id.slice(0, 8)}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {!isCancelled && (
                    <div className="flex items-center gap-2 pt-2 sm:pt-0 flex-wrap">
                      {/* Farmer actions: Confirm and Reject */}
                      {isFarmer && order.status === 'pending' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            className="gap-1.5 text-xs font-bold"
                            disabled={isActioning}
                            onClick={() => handleConfirm(order.id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5 text-agri-sprout-bright" />
                            <span>{isActioning ? 'Confirming...' : 'Confirm Order'}</span>
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs text-red-700 border-red-200 hover:bg-red-50"
                            disabled={isActioning}
                            onClick={() => handleCancel(order.id)}
                          >
                            <X className="h-3.5 w-3.5" />
                            <span>{isActioning ? 'Processing...' : 'Reject'}</span>
                          </Button>
                        </>
                      )}

                      {/* Farmer action: Dispatch confirmed order */}
                      {isFarmer && order.status === 'confirmed' && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-1.5 text-xs font-bold shadow-sm"
                          disabled={isActioning}
                          onClick={() => openDispatchModal(order)}
                        >
                          <Truck className="h-3.5 w-3.5 text-agri-sprout-bright" />
                          <span>Dispatch Order</span>
                        </Button>
                      )}

                      {/* Consumer & Farmer: Live Delivery Tracking */}
                      {isDispatchedOrDelivered && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs font-bold text-agri-evergreen border-agri-evergreen/30 hover:bg-agri-sprout-soft"
                          onClick={() => openTrackingModal(order)}
                        >
                          <Navigation className="h-3.5 w-3.5 text-agri-sprout" />
                          <span>Track Delivery</span>
                        </Button>
                      )}

                      {/* Consumer cancel (pending only) */}
                      {!isFarmer && canCancel(order.status) && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs text-red-700 border-red-200 hover:bg-red-50"
                          disabled={isActioning}
                          onClick={() => handleCancel(order.id)}
                        >
                          <X className="h-3.5 w-3.5" />
                          <span>{isActioning ? 'Cancelling...' : 'Cancel Order'}</span>
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Dispatch Order Modal (Farmer) */}
      {dispatchModalOpen && selectedOrderForDispatch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 space-y-5">
            <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
                  <Truck className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-agri-earth-900 leading-none">
                    Dispatch Order Consignment
                  </h2>
                  <p className="text-xs text-agri-earth-700 mt-1">
                    Assign delivery partner & configure pickup/drop waypoints
                  </p>
                </div>
              </div>
              <button
                onClick={closeDispatchModal}
                className="p-1.5 rounded-lg text-agri-earth-600 hover:bg-agri-earth-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Consignment Brief */}
            <div className="p-3.5 rounded-xl bg-agri-earth-50 border border-agri-earth-200 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-agri-earth-600 block">Consignment</span>
                <span className="font-extrabold text-agri-earth-900">
                  {selectedOrderForDispatch.produce_listings?.title}
                </span>
                <span className="text-agri-evergreen font-bold block">
                  {selectedOrderForDispatch.quantity_kg} kg
                </span>
              </div>
              <div>
                <span className="text-agri-earth-600 block">Buyer / Destination</span>
                <span className="font-bold text-agri-earth-900">
                  {(selectedOrderForDispatch as UserOrderRow & { buyer_profile?: { full_name: string | null } }).buyer_profile?.full_name || 'Consumer'}
                </span>
                <span className="text-agri-earth-700 block font-mono text-[11px]">
                  Order #{selectedOrderForDispatch.id.slice(0, 8)}
                </span>
              </div>
            </div>

            {dispatchError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
                <span>{dispatchError}</span>
              </div>
            )}

            <form onSubmit={handleConfirmDispatch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-agri-earth-800 mb-1.5">
                  Assign Delivery Partner
                </label>
                {deliveryPartners.length > 0 ? (
                  <select
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full rounded-xl border border-agri-earth-200 p-2.5 text-xs focus:ring-2 focus:ring-agri-sprout focus:outline-none bg-white text-agri-earth-900 font-semibold"
                    disabled={dispatchSubmitting}
                  >
                    {deliveryPartners.map((dp) => (
                      <option key={dp.id} value={dp.id}>
                        {dp.full_name || dp.email} ({dp.phone_number || 'Partner'})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs">
                    No delivery partners registered currently. Task will be posted to the open platform fleet pool.
                  </div>
                )}
              </div>

              <Input
                label="Farm Pickup Location"
                placeholder="e.g. Green Valley Farm, Kolar Road, Karnataka"
                value={pickupLocation}
                onChange={(e) => setPickupLocation(e.target.value)}
                required
                disabled={dispatchSubmitting}
              />

              <Input
                label="Delivery Destination / Landmark"
                placeholder="e.g. Sector-12 Community Drop, Koramangala"
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                required
                disabled={dispatchSubmitting}
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-agri-earth-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={closeDispatchModal}
                  disabled={dispatchSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="gap-2 font-bold"
                  disabled={dispatchSubmitting}
                >
                  <Navigation className="h-3.5 w-3.5 text-agri-sprout-bright" />
                  <span>{dispatchSubmitting ? 'Dispatching...' : 'Confirm Dispatch & Create Route Job'}</span>
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      {/* Live Delivery Tracking Drawer / Modal (Consumer & Farmer) */}
      {trackingModalOpen && selectedOrderForTracking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="w-full max-w-lg p-6 bg-white shadow-2xl rounded-2xl border-agri-earth-200 space-y-5">
            <div className="flex items-center justify-between border-b border-agri-earth-100 pb-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-agri-sprout-soft text-agri-evergreen flex items-center justify-center font-bold">
                  <Navigation className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-agri-earth-900 leading-none">
                    Delivery Fulfillment Tracking
                  </h2>
                  <p className="text-xs text-agri-earth-700 mt-1">
                    Live transit status for Order #{selectedOrderForTracking.id.slice(0, 8)}
                  </p>
                </div>
              </div>
              <button
                onClick={closeTrackingModal}
                className="p-1.5 rounded-lg text-agri-earth-600 hover:bg-agri-earth-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {trackingLoading && (
              <div className="py-8 text-center text-xs text-agri-earth-600 font-semibold animate-pulse">
                Fetching live delivery route data...
              </div>
            )}

            {!trackingLoading && (
              <div className="space-y-5">
                {/* 4-Stage Visual Progress Timeline */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-agri-earth-900 block">Fulfillment Journey</span>
                  <div className="relative border-l-2 border-agri-sprout/40 ml-3.5 space-y-4 py-1">
                    {/* Step 1: Order Placed */}
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-agri-evergreen border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-xs font-bold text-agri-earth-900">1. Order Placed</p>
                      <p className="text-[11px] text-agri-earth-600">Direct order submitted & inventory reserved.</p>
                    </div>

                    {/* Step 2: Confirmed */}
                    <div className="relative pl-6">
                      <div className="absolute -left-[9px] top-0.5 h-4 w-4 rounded-full bg-agri-evergreen border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </div>
                      <p className="text-xs font-bold text-agri-earth-900">2. Confirmed by Producer</p>
                      <p className="text-[11px] text-agri-earth-600">Producer accepted batch & prepared consignment.</p>
                    </div>

                    {/* Step 3: Out for Delivery */}
                    <div className="relative pl-6">
                      <div
                        className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                          selectedOrderForTracking.status === 'dispatched' || selectedOrderForTracking.status === 'delivered'
                            ? 'bg-agri-sprout text-white'
                            : 'bg-agri-earth-200'
                        }`}
                      >
                        <Truck className="h-2.5 w-2.5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-agri-earth-900">3. Out for Delivery / In Transit</p>
                      <p className="text-[11px] text-agri-earth-600">
                        {activeTrackingTask?.status === 'in_transit'
                          ? 'Courier in transit on assigned route.'
                          : activeTrackingTask?.status === 'picked_up'
                          ? 'Courier picked up consignment from farm.'
                          : selectedOrderForTracking.status === 'dispatched'
                          ? 'Assigned to delivery route.'
                          : 'Pending dispatch.'}
                      </p>
                    </div>

                    {/* Step 4: Delivered */}
                    <div className="relative pl-6">
                      <div
                        className={`absolute -left-[9px] top-0.5 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                          selectedOrderForTracking.status === 'delivered'
                            ? 'bg-agri-evergreen text-white'
                            : 'bg-agri-earth-200'
                        }`}
                      >
                        <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                      </div>
                      <p className="text-xs font-bold text-agri-earth-900">4. Delivered to Destination</p>
                      <p className="text-[11px] text-agri-earth-600">
                        {selectedOrderForTracking.status === 'delivered'
                          ? 'Consignment delivered and verified.'
                          : 'Estimated delivery upon route completion.'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Waypoints Card */}
                {activeTrackingTask ? (
                  <div className="p-3.5 rounded-xl bg-agri-earth-50 border border-agri-earth-200 space-y-3 text-xs">
                    <div className="space-y-1">
                      <span className="text-agri-earth-600 font-semibold flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-agri-evergreen" />
                        Pickup Origin
                      </span>
                      <p className="font-bold text-agri-earth-900 pl-4">{activeTrackingTask.pickup_location}</p>
                    </div>

                    <div className="space-y-1 border-t border-agri-earth-200 pt-2">
                      <span className="text-agri-earth-600 font-semibold flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-agri-sprout" />
                        Destination
                      </span>
                      <p className="font-bold text-agri-earth-900 pl-4">{activeTrackingTask.delivery_location}</p>
                    </div>

                    {activeTrackingTask.driver_profile && (
                      <div className="border-t border-agri-earth-200 pt-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className="h-4 w-4 text-agri-sprout" />
                          <span className="font-bold text-agri-earth-900">
                            Courier: {activeTrackingTask.driver_profile.full_name || 'Assigned Logistics Driver'}
                          </span>
                        </div>
                        {activeTrackingTask.driver_profile.phone_number && (
                          <span className="text-agri-earth-700 flex items-center gap-1">
                            <Phone className="h-3 w-3 text-agri-earth-500" />
                            <span>{activeTrackingTask.driver_profile.phone_number}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-agri-earth-50 border border-agri-earth-200 text-xs text-agri-earth-700">
                    Delivery logistics task is queued. Tracking details will update once driver begins route transit.
                  </div>
                )}

                <div className="flex justify-end pt-1">
                  <Button variant="outline" size="sm" onClick={closeTrackingModal}>
                    Close Tracking
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}
