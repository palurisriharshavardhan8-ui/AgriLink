'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  fetchMyDeliveryTasks,
  fetchAllDeliveryTasks,
  advanceDeliveryStatus,
  buildDeterministicRouteStops,
  DeliveryTaskRow,
  RouteStop,
} from '@/lib/services/delivery';
import { DeliveryStatus } from '@/types/database.types';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import {
  Truck,
  MapPin,
  CheckCircle2,
  Navigation,
  AlertCircle,
  RefreshCw,
  Package,
  Clock,
  ArrowRight,
  Phone,
  User,
  Layers,
  Sparkles,
} from 'lucide-react';

const STATUS_PROGRESSION: Record<
  DeliveryStatus,
  { label: string; next: DeliveryStatus | null; nextLabel: string | null; variant: 'harvest' | 'sprout' | 'sand' | 'evergreen' }
> = {
  assigned: { label: 'Assigned', next: 'picked_up', nextLabel: 'Mark Picked Up', variant: 'harvest' },
  picked_up: { label: 'Picked Up', next: 'in_transit', nextLabel: 'Out for Delivery', variant: 'sand' },
  in_transit: { label: 'Out for Delivery', next: 'delivered', nextLabel: 'Mark Delivered', variant: 'sprout' },
  delivered: { label: 'Delivered', next: null, nextLabel: null, variant: 'evergreen' },
};

export default function DeliveryPartnerPage() {
  const { user, role, profile } = useAuth();
  const isAdmin = role === 'admin';

  const [tasks, setTasks] = useState<DeliveryTaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Active view tab: 'route' or 'all_tasks'
  const [activeTab, setActiveTab] = useState<'route' | 'all_tasks'>('route');

  const loadTasks = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = isAdmin
        ? await fetchAllDeliveryTasks()
        : await fetchMyDeliveryTasks(user.id);
      setTasks(data);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to load delivery tasks.');
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleAdvanceStatus = async (taskId: string, nextStatus: DeliveryStatus) => {
    setActionLoading(taskId);
    setActionError(null);
    setActionSuccess(null);
    try {
      await advanceDeliveryStatus(taskId, nextStatus);
      setActionSuccess(`Delivery status updated to ${STATUS_PROGRESSION[nextStatus].label}`);
      await loadTasks();
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setActionError(err instanceof Error ? err.message : 'Failed to advance status.');
    } finally {
      setActionLoading(null);
    }
  };

  const activeTasks = tasks.filter((t) => t.status !== 'delivered');
  const completedTasks = tasks.filter((t) => t.status === 'delivered');
  const inTransitCount = tasks.filter((t) => t.status === 'in_transit').length;

  const routeStops: RouteStop[] = buildDeterministicRouteStops(tasks);

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-agri-earth-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-agri-earth-900">
                Delivery & Route Logistics
              </h1>
              <Badge variant="sand">
                {isAdmin ? 'Admin Logistics Console' : 'Delivery Partner Role'}
              </Badge>
            </div>
            <p className="text-xs text-agri-earth-700 mt-1">
              {isAdmin
                ? 'Platform-wide logistics monitoring, vehicle route tracking, and delivery task dispatch.'
                : `Active logistics partner: ${profile?.fullName || user?.email} · Manage assigned farm pickups and consumer drops.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'route' ? 'primary' : 'outline'}
            size="sm"
            className="gap-1.5 text-xs font-bold"
            onClick={() => setActiveTab('route')}
          >
            <Navigation className="h-3.5 w-3.5" />
            <span>Route Console</span>
          </Button>
          <Button
            variant={activeTab === 'all_tasks' ? 'primary' : 'outline'}
            size="sm"
            className="gap-1.5 text-xs"
            onClick={() => setActiveTab('all_tasks')}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>All Tasks ({tasks.length})</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 text-xs"
            onClick={loadTasks}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card hoverEffect className="space-y-1 p-4">
          <div className="flex items-center justify-between text-xs text-agri-earth-600 font-bold">
            <span>Assigned Jobs</span>
            <Package className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-agri-earth-900">{activeTasks.length}</div>
          <p className="text-[11px] text-agri-earth-600">Pending or in progress</p>
        </Card>

        <Card hoverEffect className="space-y-1 p-4">
          <div className="flex items-center justify-between text-xs text-agri-earth-600 font-bold">
            <span>Out for Delivery</span>
            <Truck className="h-4 w-4 text-agri-sprout" />
          </div>
          <div className="text-2xl font-black text-agri-sprout-dark">{inTransitCount}</div>
          <p className="text-[11px] text-agri-earth-600">Active on road</p>
        </Card>

        <Card hoverEffect className="space-y-1 p-4">
          <div className="flex items-center justify-between text-xs text-agri-earth-600 font-bold">
            <span>Completed Deliveries</span>
            <CheckCircle2 className="h-4 w-4 text-agri-evergreen" />
          </div>
          <div className="text-2xl font-black text-agri-evergreen">{completedTasks.length}</div>
          <p className="text-[11px] text-agri-earth-600">Successfully delivered</p>
        </Card>

        <Card hoverEffect className="space-y-1 p-4">
          <div className="flex items-center justify-between text-xs text-agri-earth-600 font-bold">
            <span>Route Stops</span>
            <Navigation className="h-4 w-4 text-agri-harvest-dark" />
          </div>
          <div className="text-2xl font-black text-agri-harvest-dark">{routeStops.length}</div>
          <p className="text-[11px] text-agri-earth-600">Sequential stops in route</p>
        </Card>
      </div>

      {/* Action Banners */}
      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-agri-sprout-soft border border-agri-sprout-bright/40 text-agri-evergreen text-xs flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-agri-sprout shrink-0" />
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <span>{actionError}</span>
        </div>
      )}

      {errorMsg && (
        <Card className="p-6 bg-red-50 border-red-200 text-red-800 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span>Error Loading Delivery Tasks</span>
          </div>
          <p className="text-xs leading-relaxed">{errorMsg}</p>
          <Button variant="outline" size="sm" onClick={loadTasks} className="gap-2 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            <span>Retry Connection</span>
          </Button>
        </Card>
      )}

      {/* Main Content Area */}
      {activeTab === 'route' ? (
        /* Deterministic Route & Stop Console */
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-agri-earth-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-agri-earth-900">
                  Active Dispatch Route Console
                </h2>
                <Badge variant="sprout" className="gap-1 text-[10px]">
                  <Sparkles className="h-3 w-3" />
                  Deterministic Stop Order
                </Badge>
              </div>
              <p className="text-xs text-agri-earth-700 mt-0.5">
                Sequential pickup and delivery waypoint plan. Follow stops sequentially to optimize cold-chain transit.
              </p>
            </div>
            <div className="text-xs font-semibold text-agri-earth-600">
              Total Route Distance: <span className="font-bold text-agri-earth-900">38.4 km</span> · Est. Total: <span className="font-bold text-agri-earth-900">1h 45m</span>
            </div>
          </div>

          {/* Sequential Stops Timeline / Cards */}
          <div className="space-y-4">
            {routeStops.map((stop, idx) => {
              const isFirst = idx === 0;
              const isLast = idx === routeStops.length - 1;
              const task = stop.task;
              const currentStatus = task?.status as DeliveryStatus | undefined;
              const prog = currentStatus ? STATUS_PROGRESSION[currentStatus] : null;
              const isActioning = task ? actionLoading === task.id : false;

              let typeBadgeVariant: 'evergreen' | 'harvest' | 'sand' = 'sand';
              let typeLabel = 'DELIVERY STOP';
              if (stop.type === 'pickup') {
                typeBadgeVariant = 'evergreen';
                typeLabel = 'FARM PICKUP';
              } else if (stop.type === 'hub') {
                typeBadgeVariant = 'harvest';
                typeLabel = 'REGIONAL HUB';
              }

              return (
                <Card
                  key={stop.stopNumber}
                  hoverEffect
                  className={`p-5 bg-white border-agri-earth-200 space-y-4 transition-all ${
                    stop.status === 'completed'
                      ? 'opacity-70 bg-agri-earth-50/50'
                      : stop.status === 'active'
                      ? 'ring-2 ring-agri-sprout border-agri-sprout shadow-md'
                      : ''
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-agri-earth-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm ${
                          stop.status === 'completed'
                            ? 'bg-agri-evergreen text-white'
                            : stop.status === 'active'
                            ? 'bg-agri-sprout text-white animate-pulse'
                            : 'bg-agri-earth-100 text-agri-earth-700'
                        }`}
                      >
                        {stop.stopNumber}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <Badge variant={typeBadgeVariant} className="text-[10px] font-bold">
                            {typeLabel}
                          </Badge>
                          <h3 className="text-base font-extrabold text-agri-earth-900">
                            {stop.locationName}
                          </h3>
                        </div>
                        <p className="text-xs text-agri-earth-600 mt-0.5 flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-agri-sprout" />
                          <span>{stop.landmark}</span>
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-semibold text-agri-earth-600 flex items-center gap-1">
                        <Clock className="h-3 w-3 text-agri-harvest" />
                        <span>ETA +{stop.etaMinutes} mins</span>
                      </span>

                      {stop.status === 'completed' ? (
                        <Badge variant="evergreen" className="gap-1 text-xs">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Completed</span>
                        </Badge>
                      ) : stop.status === 'active' ? (
                        <Badge variant="sprout" className="gap-1 text-xs">
                          <Navigation className="h-3 w-3" />
                          <span>Current Stop</span>
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          Upcoming
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stop Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                    <div>
                      <span className="text-agri-earth-600 block">Produce Consignment</span>
                      <span className="font-bold text-agri-earth-900 block text-sm">
                        {stop.produceTitle || 'Produce Lots'}
                      </span>
                      {stop.quantityKg && (
                        <span className="text-agri-evergreen font-semibold">
                          {stop.quantityKg} kg load
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-agri-earth-600 block">Point of Contact</span>
                      <span className="font-bold text-agri-earth-900 flex items-center gap-1 mt-0.5">
                        <User className="h-3.5 w-3.5 text-agri-sprout" />
                        <span>{stop.contactName || 'On-site Dispatcher'}</span>
                      </span>
                      {stop.contactPhone && (
                        <span className="text-agri-earth-700 flex items-center gap-1 mt-0.5">
                          <Phone className="h-3 w-3 text-agri-earth-500" />
                          <span>{stop.contactPhone}</span>
                        </span>
                      )}
                    </div>

                    {/* Progression Action for Real Tasks */}
                    <div className="flex flex-col justify-end items-start sm:items-end">
                      {task && prog?.next && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-2 text-xs font-bold shadow-sm"
                          disabled={isActioning}
                          onClick={() => handleAdvanceStatus(task.id, prog.next!)}
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-agri-sprout-bright" />
                          <span>{isActioning ? 'Updating...' : prog.nextLabel}</span>
                        </Button>
                      )}

                      {task && task.status === 'delivered' && (
                        <span className="text-xs font-bold text-agri-evergreen flex items-center gap-1">
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Delivered to Customer</span>
                        </span>
                      )}

                      {!task && (
                        <span className="text-[11px] text-agri-earth-500 italic">
                          Checkpoint Stop
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ) : (
        /* All Assigned Delivery Tasks View */
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-agri-earth-200 pb-3">
            <h2 className="text-lg font-extrabold text-agri-earth-900">
              Assigned Delivery Tasks ({tasks.length})
            </h2>
            <Badge variant="outline">{activeTasks.length} Active · {completedTasks.length} Delivered</Badge>
          </div>

          {loading && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="p-6 space-y-3 animate-pulse">
                  <div className="h-5 w-48 bg-agri-earth-100 rounded-lg" />
                  <div className="h-4 w-32 bg-agri-earth-100 rounded-lg" />
                </Card>
              ))}
            </div>
          )}

          {!loading && tasks.length === 0 && (
            <Card className="p-12 text-center flex flex-col items-center justify-center space-y-4 bg-white border-dashed border-agri-earth-300">
              <div className="h-16 w-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Truck className="h-8 w-8" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-lg font-bold text-agri-earth-900">No Assigned Tasks Found</h3>
                <p className="text-xs text-agri-earth-700">
                  When producers confirm and dispatch orders, tasks will appear here. Switch to the <strong>Route Console</strong> tab to explore the demo route sequence.
                </p>
              </div>
            </Card>
          )}

          {!loading && tasks.length > 0 && (
            <div className="space-y-4">
              {tasks.map((task) => {
                const status = task.status as DeliveryStatus;
                const prog = STATUS_PROGRESSION[status] || STATUS_PROGRESSION.assigned;
                const isActioning = actionLoading === task.id;
                const isDone = status === 'delivered';
                const order = task.orders;

                return (
                  <Card
                    key={task.id}
                    hoverEffect
                    className={`p-6 bg-white border-agri-earth-200 space-y-4 ${isDone ? 'opacity-75' : ''}`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-agri-earth-100 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-lg font-extrabold text-agri-earth-900">
                            {order?.produce_listings?.title || 'Produce Batch Consignment'}
                          </h3>
                          <Badge variant={prog.variant} className="text-[10px] uppercase font-bold">
                            {prog.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-agri-earth-600 mt-1">
                          Order ID: <span className="font-mono font-semibold">#{task.order_id.slice(0, 8)}</span> · Assigned {new Date(task.assigned_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>

                      {prog.next && (
                        <Button
                          variant="primary"
                          size="sm"
                          className="gap-2 text-xs font-bold shrink-0"
                          disabled={isActioning}
                          onClick={() => handleAdvanceStatus(task.id, prog.next!)}
                        >
                          <ArrowRight className="h-3.5 w-3.5 text-agri-sprout-bright" />
                          <span>{isActioning ? 'Updating...' : prog.nextLabel}</span>
                        </Button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                      <div className="space-y-1">
                        <span className="text-agri-earth-600 font-semibold block">Pickup Location</span>
                        <p className="font-bold text-agri-earth-900 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-agri-evergreen shrink-0 mt-0.5" />
                          <span>{task.pickup_location}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-agri-earth-600 font-semibold block">Delivery Location</span>
                        <p className="font-bold text-agri-earth-900 flex items-start gap-1">
                          <MapPin className="h-3.5 w-3.5 text-agri-sprout shrink-0 mt-0.5" />
                          <span>{task.delivery_location}</span>
                        </p>
                      </div>

                      <div className="space-y-1">
                        <span className="text-agri-earth-600 font-semibold block">Consignee & Load</span>
                        <p className="font-bold text-agri-earth-900">
                          {order?.buyer_profile?.full_name || 'Direct Buyer'} · {order?.quantity_kg} kg
                        </p>
                        {order?.buyer_profile?.phone_number && (
                          <p className="text-agri-earth-700 flex items-center gap-1 mt-0.5">
                            <Phone className="h-3 w-3 text-agri-earth-500" />
                            <span>{order.buyer_profile.phone_number}</span>
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Progress Track */}
                    <div className="space-y-1 pt-2 border-t border-agri-earth-100">
                      <div className="flex items-center justify-between text-[10px] text-agri-earth-600 font-semibold">
                        <span>1. Assigned</span>
                        <span>2. Picked Up</span>
                        <span>3. Out for Delivery</span>
                        <span>4. Delivered</span>
                      </div>
                      <div className="h-2 rounded-full bg-agri-earth-100 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-agri-sprout transition-all"
                          style={{
                            width:
                              status === 'delivered'
                                ? '100%'
                                : status === 'in_transit'
                                ? '75%'
                                : status === 'picked_up'
                                ? '50%'
                                : '25%',
                          }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
