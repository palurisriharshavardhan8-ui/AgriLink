import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    const lines = content.split('\n');
    for (const line of lines) {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://xmrtgxvnvzgkgcqmngri.supabase.co';
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || '';

export function getPublicClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_KEY);
}

export async function getAuthenticatedClient(email: string, password = 'password123'): Promise<SupabaseClient> {
  const client = createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: { persistSession: false },
  });
  const { error } = await client.auth.signInWithPassword({ email, password });
  if (error) {
    throw new Error(`Failed to sign in as ${email}: ${error.message}`);
  }
  return client;
}

export interface CreatedTestOrder {
  orderId: string;
  listingId: string;
  quantityKg: number;
  totalPrice: number;
}

/**
 * Creates a dedicated direct order as consumer, confirms it as farmer.
 * Returns order details ready for testing dispatch.
 */
export async function createConfirmedOrder(params?: {
  consumerEmail?: string;
  farmerEmail?: string;
  quantityKg?: number;
}): Promise<CreatedTestOrder> {
  const consumerEmail = params?.consumerEmail || 'consumer@gmail.com';
  const farmerEmail = params?.farmerEmail || 'harshafarmer@gmail.com';
  const quantityKg = params?.quantityKg || 1;

  const consumerClient = await getAuthenticatedClient(consumerEmail);

  // Find an active produce listing owned by farmer
  const { data: listings, error: lError } = await consumerClient
    .from('produce_listings')
    .select('id, title, price_per_kg, available_quantity_kg, farmer_id')
    .gt('available_quantity_kg', 1)
    .limit(1);

  if (lError || !listings || listings.length === 0) {
    throw new Error(`No available listings found for testing: ${lError?.message}`);
  }

  const listing = listings[0];

  // 1. Place order as consumer
  const { data: orderRes, error: orderErr } = await consumerClient.rpc('place_direct_order', {
    p_listing_id: listing.id,
    p_quantity_kg: quantityKg,
  });

  if (orderErr || !orderRes) {
    throw new Error(`place_direct_order failed: ${orderErr?.message}`);
  }

  const orderData = typeof orderRes === 'string' ? JSON.parse(orderRes) : orderRes;
  const orderId = orderData.order_id || orderData.id;

  // 2. Confirm order as farmer
  const farmerClient = await getAuthenticatedClient(farmerEmail);
  const { error: confErr } = await farmerClient.rpc('confirm_order', {
    p_order_id: orderId,
  });

  if (confErr) {
    throw new Error(`confirm_order failed: ${confErr.message}`);
  }

  return {
    orderId,
    listingId: listing.id,
    quantityKg,
    totalPrice: (orderData.total_price as number) || listing.price_per_kg * quantityKg,
  };
}

/**
 * Query delivery_task for a given order ID using an authenticated client.
 */
export async function getDeliveryTaskForOrder(orderId: string, client?: SupabaseClient) {
  const c = client || (await getAuthenticatedClient('harshafarmer@gmail.com'));
  const { data, error } = await c
    .from('delivery_tasks')
    .select('*')
    .eq('order_id', orderId)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to query delivery task for order ${orderId}: ${error.message}`);
  }
  return data;
}

/**
 * Query order status and details directly from database.
 */
export async function getOrder(orderId: string, client?: SupabaseClient) {
  const c = client || (await getAuthenticatedClient('harshafarmer@gmail.com'));
  const { data, error } = await c
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    throw new Error(`Failed to query order ${orderId}: ${error.message}`);
  }
  return data;
}

/**
 * Cleanup created test delivery tasks and orders after tests.
 */
export async function cleanupOrder(orderId: string) {
  try {
    const adminClient = await getAuthenticatedClient('admin@gmail.com');
    // Delete delivery tasks first (FK cascade might handle it, but explicit is safest)
    await adminClient.from('delivery_tasks').delete().eq('order_id', orderId);
    // Delete order
    await adminClient.from('orders').delete().eq('id', orderId);
  } catch (err) {
    console.warn(`[Cleanup Warning] Could not delete test order ${orderId}:`, err);
  }
}
