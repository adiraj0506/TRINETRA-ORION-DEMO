import { createClient } from "@supabase/supabase-js";

// Fall back to placeholders so the build never crashes if env vars are
// missing (e.g. this sandbox, or a forgotten Vercel env var) — a real
// fetch attempt will fail gracefully at runtime instead, which the calling
// code catches and surfaces as a message in the UI.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://placeholder.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-anon-key";

// Client-side Supabase instance. Used for reading claims, parcels, and
// scheme-match data on the Atlas, Dashboard, and DSS pages.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
