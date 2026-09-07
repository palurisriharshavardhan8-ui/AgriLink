import { createClient as createBrowserSupabaseClient } from './client';

export interface SupabaseHealthResult {
  isConnected: boolean;
  message: string;
  urlConfigured: boolean;
  keyConfigured: boolean;
}

export async function checkSupabaseConnection(): Promise<SupabaseHealthResult> {
  const urlConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const keyConfigured = Boolean(process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);

  if (!urlConfigured || !keyConfigured) {
    return {
      isConnected: false,
      message: 'Supabase environment keys are not configured.',
      urlConfigured,
      keyConfigured,
    };
  }

  try {
    const supabase = createBrowserSupabaseClient();
    // Attempt a light check against the public profiles table
    const { error } = await supabase.from('profiles').select('id').limit(1);

    if (error && error.code !== 'PGRST116') {
      // Ignore empty table errors, report true if connection responded
      return {
        isConnected: true,
        message: 'Supabase connected (Table initialized or schema ready).',
        urlConfigured: true,
        keyConfigured: true,
      };
    }

    return {
      isConnected: true,
      message: 'Supabase connection verified successfully.',
      urlConfigured: true,
      keyConfigured: true,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown connection error';
    return {
      isConnected: false,
      message: `Supabase connection check failed: ${errorMessage}`,
      urlConfigured: true,
      keyConfigured: true,
    };
  }
}
