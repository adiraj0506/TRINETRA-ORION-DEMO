import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ClaimMapRow } from "@/lib/types";
import { STATIC_SCHEMES, SchemeRow } from "@/lib/dss";
import type { FullClaimDetails } from "@/lib/services/claim-service";

/**
 * Fetches all claims with joined claimant/state info and parcel centroids.
 * Priority:
 *  1. Internal Next.js API Route (/api/claims) connected to PostgreSQL pool.
 *  2. Client-side Supabase query (if credentials configured).
 *  3. Empty array / graceful fallback with diagnostic logging.
 */
export async function fetchClaimsForMap(): Promise<ClaimMapRow[]> {
  try {
    const res = await fetch("/api/claims", { cache: "no-store" });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return data as ClaimMapRow[];
      }
    }
  } catch (err: any) {
    console.warn("[TRINETRA] /api/claims fetch failed:", err.message);
  }

  // Fallback to client Supabase instance if validly configured
  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("claims_map")
        .select("*")
        .order("submitted_on", { ascending: false });

      if (!error && data && data.length > 0) {
        return data as ClaimMapRow[];
      }
    } catch (err: any) {
      console.warn("[TRINETRA] Client Supabase fetchClaimsForMap error:", err.message);
    }
  }

  return [];
}

/** Fetches full unified details for a single claim across all tabs. */
export async function fetchClaimDetails(claimId: string): Promise<FullClaimDetails | null> {
  const res = await fetch(`/api/claims/${claimId}`, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load claim details: ${res.statusText}`);
  }
  return res.json();
}

/** Executes an administrative action on a claim (approve, reject, return, field_verification). */
export async function executeClaimAction(
  claimId: string,
  action: "approve" | "reject" | "return" | "field_verification",
  payload?: { notes?: string; reason?: string }
): Promise<{ success: boolean; claimId: string; action: string }> {
  const res = await fetch(`/api/claims/${claimId}/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Action execution failed");
  }

  return res.json();
}

/** Submits a newly digitized and reviewed claim form into the database. */
export async function submitClaimToDatabase(payload: any): Promise<{ success: boolean; claimId: string; claimantId: string }> {
  const res = await fetch("/api/claims", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Submission failed");
  }

  return res.json();
}

/** Fetches government scheme reference data used by the DSS. */
export async function fetchSchemes(): Promise<SchemeRow[]> {
  try {
    const res = await fetch("/api/schemes", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data) && json.data.length > 0) {
        return json.data as SchemeRow[];
      }
    }
  } catch (err: any) {
    console.warn("[TRINETRA] /api/schemes fetch failed:", err.message);
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase
        .from("schemes")
        .select("code, name, description, eligibility_json, department, benefit_description");

      if (!error && data && data.length > 0) {
        return data as SchemeRow[];
      }
    } catch (err: any) {
      console.warn("[TRINETRA] Client Supabase fetchSchemes error:", err.message);
    }
  }

  return STATIC_SCHEMES;
}

/** Fetches spatial dispute zones (canopy loss and restricted boundaries) from PostGIS. */
export async function fetchDisputeZones(): Promise<any[]> {
  try {
    const res = await fetch("/api/dispute-zones", { cache: "no-store" });
    if (res.ok) {
      const json = await res.json();
      if (json.data && Array.isArray(json.data)) {
        return json.data;
      }
    }
  } catch (err: any) {
    console.warn("[TRINETRA] /api/dispute-zones fetch failed:", err.message);
  }

  if (isSupabaseConfigured()) {
    try {
      const { data, error } = await supabase.from("dispute_zones_map").select("*");
      if (!error && data && data.length > 0) return data;
    } catch (err: any) {
      console.warn("[TRINETRA] Client Supabase fetchDisputeZones error:", err.message);
    }
  }

  return [];
}

