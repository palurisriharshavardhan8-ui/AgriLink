import { createClient } from '@/lib/supabase/client';
import { Database, ProduceCategory } from '@/types/database.types';

export type ProduceListingRow = Database['public']['Tables']['produce_listings']['Row'] & {
  profiles?: {
    full_name: string | null;
    email: string;
    role: string;
  } | null;
};

export interface CreateListingParams {
  title: string;
  category: ProduceCategory;
  description?: string;
  price_per_kg: number;
  mandi_benchmark_price?: number;
  available_quantity_kg: number;
  image_url?: string;
}

export interface DirectOrderParams {
  listing_id: string;
  quantity_kg: number;
}

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
 * Fetch produce listings with optional category and search filters.
 */
export async function fetchProduceListings(options?: {
  category?: string;
  search?: string;
  farmerId?: string;
}) {
  const supabase = createClient();

  let query = supabase
    .from('produce_listings')
    .select(`
      *,
      profiles:farmer_id (
        full_name,
        email,
        role
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (options?.farmerId) {
    query = query.eq('farmer_id', options.farmerId);
  }

  if (options?.category && options.category !== 'all' && options.category !== 'All Produce') {
    const catLower = options.category.toLowerCase().replace(/ & /g, '_').replace(/ /g, '_');
    query = query.eq('category', catLower as ProduceCategory);
  }

  if (options?.search && options.search.trim() !== '') {
    const term = `%${options.search.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term}`);
  }

  const { data, error } = await query;

  if (error) {
    logSupabaseError('fetchProduceListings', error);
    throw new Error(error.message || 'Failed to fetch produce listings.');
  }

  return (data as ProduceListingRow[]) || [];
}

/**
 * Fetch a single produce listing by ID.
 */
export async function fetchListingById(id: string) {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('produce_listings')
    .select(`
      *,
      profiles:farmer_id (
        full_name,
        email,
        role
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    logSupabaseError('fetchListingById', error);
    throw new Error(error.message || 'Failed to fetch listing by ID.');
  }

  return data as ProduceListingRow;
}

/**
 * Create a new produce listing as a logged-in farmer.
 */
export async function createProduceListing(
  farmerId: string,
  params: CreateListingParams,
  imageFile?: File | null
) {
  const supabase = createClient();
  let uploadedImageUrl = params.image_url || null;

  if (imageFile) {
    try {
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${farmerId}/${Date.now()}.${fileExt}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('produce-images')
        .upload(fileName, imageFile, { upsert: true });

      if (!uploadError && uploadData) {
        const { data: publicUrlData } = supabase.storage
          .from('produce-images')
          .getPublicUrl(uploadData.path);
        uploadedImageUrl = publicUrlData.publicUrl;
      } else {
        console.warn('Image upload failed, continuing with default image:', uploadError?.message);
      }
    } catch (err) {
      console.warn('Image upload exception:', err);
    }
  }

  const { data, error } = await supabase
    .from('produce_listings')
    .insert({
      farmer_id: farmerId,
      title: params.title,
      category: params.category,
      description: params.description || null,
      price_per_kg: params.price_per_kg,
      mandi_benchmark_price: params.mandi_benchmark_price || null,
      available_quantity_kg: params.available_quantity_kg,
      image_url: uploadedImageUrl,
      is_active: true,
    })
    .select()
    .single();

  if (error) {
    logSupabaseError('createProduceListing', error);
    throw new Error(error.message || 'Failed to create produce listing.');
  }

  return data;
}

/**
 * Place a direct order for a produce listing atomically using stored RPC.
 * Authenticated buyer identity (auth.uid()) and total_price calculation are handled securely inside database.
 */
export async function createDirectOrder(params: DirectOrderParams) {
  const supabase = createClient();

  // Retrieve authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Unauthenticated request: You must be signed in to place an order.');
  }

  // Check listing owner to reject self-purchase at application service layer
  const { data: listing, error: listingError } = await supabase
    .from('produce_listings')
    .select('farmer_id, is_active')
    .eq('id', params.listing_id)
    .single();

  if (listing && listing.farmer_id === user.id) {
    throw new Error('Self-purchase is not allowed: Producers cannot purchase their own produce listings.');
  }

  const { data, error } = await supabase.rpc('place_direct_order', {
    p_listing_id: params.listing_id,
    p_quantity_kg: params.quantity_kg,
  });

  if (error) {
    logSupabaseError('createDirectOrder', error);
    throw new Error(error.message || 'Failed to place direct order.');
  }

  return data;
}
