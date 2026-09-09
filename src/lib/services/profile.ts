import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

export type FarmFpoRow = Database['public']['Tables']['farms_fpos']['Row'];

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

export type ProfileRow = Database['public']['Tables']['profiles']['Row'];

/**
 * Fetch a profile record by user ID.
 */
export async function fetchProfile(userId: string): Promise<ProfileRow | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchProfile', error);
    throw new Error(error.message || 'Failed to fetch user profile.');
  }

  return data;
}

/**
 * Update the authenticated user's own profile (full_name, phone_number).
 * RLS enforces: auth.uid() = id.
 */
export async function updateProfile(
  userId: string,
  data: { full_name?: string; phone_number?: string }
) {
  const supabase = createClient();

  const { error } = await supabase
    .from('profiles')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) {
    logSupabaseError('updateProfile', error);
    throw new Error(error.message || 'Failed to update profile.');
  }
}

/**
 * Fetch the farms_fpos record for a given profile.
 * Returns null if the farmer hasn't created one yet.
 */
export async function fetchFarmInfo(profileId: string): Promise<FarmFpoRow | null> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('farms_fpos')
    .select('*')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchFarmInfo', error);
    throw new Error(error.message || 'Failed to fetch farm/FPO information.');
  }

  return data;
}

/**
 * Create or update a farms_fpos record for the authenticated farmer.
 * Checks if a record exists first to decide INSERT vs UPDATE.
 * RLS enforces: auth.uid() = profile_id.
 */
export async function upsertFarmInfo(
  profileId: string,
  data: {
    organization_name: string;
    district?: string;
    state?: string;
    is_fpo?: boolean;
  }
) {
  const supabase = createClient();

  // Check for an existing record first
  const { data: existing } = await supabase
    .from('farms_fpos')
    .select('id')
    .eq('profile_id', profileId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from('farms_fpos')
      .update({
        organization_name: data.organization_name,
        district: data.district || null,
        state: data.state || null,
        is_fpo: data.is_fpo ?? false,
      })
      .eq('profile_id', profileId);

    if (error) {
      logSupabaseError('upsertFarmInfo:update', error);
      throw new Error(error.message || 'Failed to update farm/FPO information.');
    }
  } else {
    const { error } = await supabase
      .from('farms_fpos')
      .insert({
        profile_id: profileId,
        organization_name: data.organization_name,
        district: data.district || null,
        state: data.state || null,
        is_fpo: data.is_fpo ?? false,
      });

    if (error) {
      logSupabaseError('upsertFarmInfo:insert', error);
      throw new Error(error.message || 'Failed to create farm/FPO record.');
    }
  }
}
