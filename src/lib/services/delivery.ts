import { createClient } from '@/lib/supabase/client';
import { Database, DeliveryStatus } from '@/types/database.types';

export type DeliveryTaskRow = Database['public']['Tables']['delivery_tasks']['Row'] & {
  orders?: {
    id: string;
    quantity_kg: number;
    total_price: number;
    status: string;
    created_at: string;
    buyer_id: string;
    produce_listings?: {
      id: string;
      title: string;
      category: string;
      price_per_kg: number;
      image_url: string | null;
    } | null;
    buyer_profile?: {
      full_name: string | null;
      email: string;
      phone_number: string | null;
    } | null;
  } | null;
  driver_profile?: {
    full_name: string | null;
    phone_number: string | null;
    email: string;
  } | null;
};

export interface DeliveryPartnerOption {
  id: string;
  full_name: string | null;
  phone_number: string | null;
  email: string;
}

export interface RouteStop {
  stopNumber: number;
  type: 'pickup' | 'hub' | 'delivery';
  locationName: string;
  landmark: string;
  task?: DeliveryTaskRow;
  produceTitle?: string;
  quantityKg?: number;
  contactName?: string;
  contactPhone?: string;
  status: 'pending' | 'active' | 'completed';
  etaMinutes: number;
}

function logSupabaseError(context: string, error: unknown) {
  if (error && typeof error === 'object') {
    const errObj = error as { message?: string; code?: string; details?: string; hint?: string };
    console.error(`[Supabase Error] ${context}:`, {
      message: errObj.message || String(error),
      code: errObj.code || 'UNKNOWN',
      details: errObj.details || null,
      hint: errObj.hint || null,
    });
  } else {
    console.error(`[Supabase Error] ${context}:`, error);
  }
}

/**
 * Fetch delivery tasks assigned to the authenticated driver.
 */
export async function fetchMyDeliveryTasks(driverId: string): Promise<DeliveryTaskRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('delivery_tasks')
    .select(`
      *,
      orders:order_id (
        id,
        quantity_kg,
        total_price,
        status,
        created_at,
        buyer_id,
        produce_listings:listing_id (
          id,
          title,
          category,
          price_per_kg,
          image_url
        ),
        buyer_profile:buyer_id (
          full_name,
          email,
          phone_number
        )
      ),
      driver_profile:driver_id (
        full_name,
        phone_number,
        email
      )
    `)
    .eq('driver_id', driverId)
    .order('assigned_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchMyDeliveryTasks', error);
    throw new Error(error.message || 'Failed to fetch your delivery tasks.');
  }

  return (data as DeliveryTaskRow[]) || [];
}

/**
 * Fetch all delivery tasks (admin / platform ops view).
 */
export async function fetchAllDeliveryTasks(): Promise<DeliveryTaskRow[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('delivery_tasks')
    .select(`
      *,
      orders:order_id (
        id,
        quantity_kg,
        total_price,
        status,
        created_at,
        buyer_id,
        produce_listings:listing_id (
          id,
          title,
          category,
          price_per_kg,
          image_url
        ),
        buyer_profile:buyer_id (
          full_name,
          email,
          phone_number
        )
      ),
      driver_profile:driver_id (
        full_name,
        phone_number,
        email
      )
    `)
    .order('assigned_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchAllDeliveryTasks', error);
    throw new Error(error.message || 'Failed to fetch platform delivery tasks.');
  }

  return (data as DeliveryTaskRow[]) || [];
}

/**
 * Fetch delivery task for a specific order (used for live tracking by consumer & farmer).
 */
export async function fetchDeliveryTrackingForOrder(orderId: string): Promise<DeliveryTaskRow | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('delivery_tasks')
    .select(`
      *,
      driver_profile:driver_id (
        full_name,
        phone_number,
        email
      )
    `)
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchDeliveryTrackingForOrder', error);
    throw new Error(error.message || 'Failed to fetch tracking details.');
  }

  return data as DeliveryTaskRow | null;
}

/**
 * Fetch list of registered delivery partners for assignment dropdown.
 */
export async function fetchDeliveryPartners(): Promise<DeliveryPartnerOption[]> {
  const supabase = createClient();

  // Try using the dedicated RPC first
  try {
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_available_delivery_partners');
    if (!rpcError && rpcData && rpcData.length > 0) {
      return rpcData as DeliveryPartnerOption[];
    }
  } catch {
    // Fall back to direct table select
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone_number, email')
    .eq('role', 'delivery_partner')
    .order('full_name', { ascending: true });

  if (error) {
    logSupabaseError('fetchDeliveryPartners', error);
    return [];
  }

  return (data as DeliveryPartnerOption[]) || [];
}

/**
 * Dispatch an order: converts confirmed order to delivery task and updates order status.
 */
export async function dispatchOrder(
  orderId: string,
  driverId: string | null,
  pickupLocation: string,
  deliveryLocation: string
) {
  const supabase = createClient();

  // Use the RPC for atomic validation and status update
  const { data, error } = await supabase.rpc('dispatch_and_assign_delivery_job', {
    p_order_id: orderId,
    p_driver_id: driverId,
    p_pickup_location: pickupLocation,
    p_delivery_location: deliveryLocation,
  });

  if (error) {
    logSupabaseError('dispatchOrder', error);
    throw new Error(error.message || 'Failed to dispatch order.');
  }

  return data;
}

/**
 * Advance delivery status (assigned -> picked_up -> in_transit -> delivered).
 */
export async function advanceDeliveryStatus(taskId: string, newStatus: DeliveryStatus) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('update_delivery_status', {
    p_task_id: taskId,
    p_status: newStatus,
  });

  if (error) {
    logSupabaseError('advanceDeliveryStatus', error);
    throw new Error(error.message || 'Failed to update delivery status.');
  }

  return data;
}

/**
 * Constructs a deterministic 4-8 stop route demo.
 * Maps real assigned tasks to logical pickup -> transit -> dropoff sequence,
 * or provides a structured 5-stop demo if few/no tasks exist.
 */
export function buildDeterministicRouteStops(tasks: DeliveryTaskRow[]): RouteStop[] {
  const stops: RouteStop[] = [];

  // Filter active (non-delivered) tasks
  const activeTasks = tasks.filter((t) => t.status !== 'delivered');

  if (activeTasks.length > 0) {
    let stopCounter = 1;

    // 1. Group pickups from distinct pickup locations
    const pickupLocations = Array.from(new Set(activeTasks.map((t) => t.pickup_location)));
    for (const pickup of pickupLocations) {
      const relatedTasks = activeTasks.filter((t) => t.pickup_location === pickup);
      const totalKg = relatedTasks.reduce((sum, t) => sum + (t.orders?.quantity_kg || 0), 0);
      const allPickedUp = relatedTasks.every((t) => t.status === 'picked_up' || t.status === 'in_transit' || t.status === 'delivered');

      stops.push({
        stopNumber: stopCounter++,
        type: 'pickup',
        locationName: pickup,
        landmark: 'Farm Producer Collection Center',
        produceTitle: relatedTasks.map((t) => t.orders?.produce_listings?.title).filter(Boolean).join(', ') || 'Produce Batch',
        quantityKg: totalKg,
        contactName: 'Farm Gate Ops',
        status: allPickedUp ? 'completed' : 'active',
        etaMinutes: 15,
      });
    }

    // 2. Hub consolidation checkpoint (SIH logistics requirement)
    stops.push({
      stopNumber: stopCounter++,
      type: 'hub',
      locationName: 'Regional Cold-Storage Hub #4',
      landmark: 'Consolidation & Quality Checkpoint',
      status: activeTasks.some((t) => t.status === 'in_transit') ? 'completed' : 'pending',
      etaMinutes: 35,
    });

    // 3. Delivery drop stops for each task
    for (const task of activeTasks) {
      const isDelivered = task.status === 'delivered';
      const isInTransit = task.status === 'in_transit';

      stops.push({
        stopNumber: stopCounter++,
        type: 'delivery',
        locationName: task.delivery_location,
        landmark: `Order #${task.order_id.slice(0, 8)}`,
        task,
        produceTitle: task.orders?.produce_listings?.title || 'Produce Batch',
        quantityKg: task.orders?.quantity_kg,
        contactName: task.orders?.buyer_profile?.full_name || 'Consumer',
        contactPhone: task.orders?.buyer_profile?.phone_number || undefined,
        status: isDelivered ? 'completed' : isInTransit ? 'active' : 'pending',
        etaMinutes: 50 + stops.length * 12,
      });
    }

    return stops;
  }

  // Fallback: Deterministic 5-stop demo route for evaluation if no active tasks
  return [
    {
      stopNumber: 1,
      type: 'pickup',
      locationName: 'Kolar Organic Farmer Producer Hub',
      landmark: 'Farm Gate Cluster A',
      produceTitle: 'Fresh Tomatoes & Spinach',
      quantityKg: 45,
      contactName: 'Ramesh Patel (FPO Lead)',
      contactPhone: '+91 98450 11223',
      status: 'completed',
      etaMinutes: 0,
    },
    {
      stopNumber: 2,
      type: 'pickup',
      locationName: 'Hosakote Hydroponics Facility',
      landmark: 'Greenhouse Section 2',
      produceTitle: 'Alphanso Mangoes',
      quantityKg: 30,
      contactName: 'Suresh Gowda',
      contactPhone: '+91 94480 33445',
      status: 'active',
      etaMinutes: 20,
    },
    {
      stopNumber: 3,
      type: 'hub',
      locationName: 'Bengaluru East AgriLink Consolidation Hub',
      landmark: 'Cold Chain Checkpoint #2',
      produceTitle: 'All Batches (Sorted)',
      quantityKg: 75,
      status: 'pending',
      etaMinutes: 45,
    },
    {
      stopNumber: 4,
      type: 'delivery',
      locationName: 'Sector-12 Community Hub, Koramangala',
      landmark: 'Near Central Park Gate B',
      produceTitle: 'Group Community Cart',
      quantityKg: 50,
      contactName: 'Priya Sharma (Cart Lead)',
      contactPhone: '+91 98860 55667',
      status: 'pending',
      etaMinutes: 70,
    },
    {
      stopNumber: 5,
      type: 'delivery',
      locationName: 'Apartment Cluster B, Indiranagar',
      landmark: 'Tower 4 Receiving Area',
      produceTitle: 'Direct Consumer Order',
      quantityKg: 25,
      contactName: 'Anand Verma',
      contactPhone: '+91 99000 77889',
      status: 'pending',
      etaMinutes: 90,
    },
  ];
}
