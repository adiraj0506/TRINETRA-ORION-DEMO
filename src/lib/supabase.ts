import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

/**
 * Checks if Supabase client credentials are validly configured.
 */
export function isSupabaseConfigured(): boolean {
  if (!supabaseUrl || !supabaseAnonKey) return false;
  if (supabaseUrl.includes("placeholder") || supabaseAnonKey.includes("placeholder")) {
    return false;
  }
  try {
    const parsed = new URL(supabaseUrl);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

let _supabaseInstance: SupabaseClient | null = null;

/**
 * Returns the central Supabase client instance if configured.
 * Throws a descriptive configuration error if credentials are missing or invalid.
 */
export function getSupabaseClient(): SupabaseClient {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "[TRINETRA] Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing or set to placeholder values. Please configure them in your .env.local or Vercel project settings."
    );
  }

  if (!_supabaseInstance) {
    _supabaseInstance = createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        persistSession: typeof window !== "undefined",
        autoRefreshToken: true,
      },
    });
  }

  return _supabaseInstance;
}

/**
 * Client-side Supabase instance accessor.
 * Proxy ensures calls fail clearly with helpful messages when credentials are not configured,
 * preventing any invalid network requests to fake hostnames.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

