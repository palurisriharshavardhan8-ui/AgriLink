import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type UserOrderRow = Database['public']['Tables']['orders']['Row'] & {
  produce_listings?: {
    id: string;
    title: string;
    category: string;
    price_per_kg: number;
    image_url: string | null;
    farmer_id: string;
    profiles?: {
      full_name: string | null;
      email: string;
    } | null;
  } | null;
  // Buyer profile for farmer-side view
  buyer_profile?: {
    full_name: string | null;
    email: string;
  } | null;
};

/**
 * Helper to log detailed Supabase errors clearly.
 */
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
 * Fetch orders placed BY the authenticated consumer (buyer view).
 */
export async function fetchUserOrders(buyerId: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      produce_listings:listing_id (
        id,
        title,
        category,
        price_per_kg,
        image_url,
        farmer_id,
        profiles:farmer_id (
          full_name,
          email
        )
      )
    `)
    .eq('buyer_id', buyerId)
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchUserOrders', error);
    throw new Error(error.message || 'Failed to fetch your orders.');
  }

  return (data as UserOrderRow[]) || [];
}

/**
 * Fetch orders for a farmer/FPO's produce listings (seller view).
 * Queries orders WHERE the related produce_listing belongs to the given farmer.
 * RLS on the server enforces: only orders where produce_listing.farmer_id = auth.uid().
 */
export async function fetchFarmerOrders(farmerId: string) {
  const supabase = createClient();

  // First get all listing IDs owned by this farmer
  const { data: listings, error: listingsError } = await supabase
    .from('produce_listings')
    .select('id')
    .eq('farmer_id', farmerId);

  if (listingsError) {
    logSupabaseError('fetchFarmerOrders:listings', listingsError);
    throw new Error(listingsError.message || 'Failed to fetch your listings.');
  }

  if (!listings || listings.length === 0) {
    return []; // Farmer has no listings yet, so no orders either
  }

  const listingIds = listings.map((l) => l.id);

  // Now fetch all orders placed on those listings
  const { data, error } = await supabase
    .from('orders')
    .select(`
      *,
      produce_listings:listing_id (
        id,
        title,
        category,
        price_per_kg,
        image_url,
        farmer_id
      ),
      buyer_profile:buyer_id (
        full_name,
        email
      )
    `)
    .in('listing_id', listingIds)
    .order('created_at', { ascending: false });

  if (error) {
    logSupabaseError('fetchFarmerOrders', error);
    throw new Error(error.message || 'Failed to fetch incoming orders.');
  }

  return (data as UserOrderRow[]) || [];
}

/**
 * Cancel an order (buyer or farmer).
 * Calls the secure cancel_order RPC which validates identity, idempotency, and restores stock atomically.
 */
export async function cancelOrder(orderId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('cancel_order', {
    p_order_id: orderId,
  });

  if (error) {
    logSupabaseError('cancelOrder', error);
    throw new Error(error.message || 'Failed to cancel order.');
  }

  return data;
}

/**
 * Confirm an order (farmer only).
 * Calls the secure confirm_order RPC which validates farmer identity.
 */
export async function confirmOrder(orderId: string) {
  const supabase = createClient();

  const { data, error } = await supabase.rpc('confirm_order', {
    p_order_id: orderId,
  });

  if (error) {
    logSupabaseError('confirmOrder', error);
    throw new Error(error.message || 'Failed to confirm order.');
  }

  return data;
}
