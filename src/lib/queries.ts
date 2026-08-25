import { supabase } from "@/lib/supabase";
import type { ClaimMapRow } from "@/lib/types";
import type { SchemeRow } from "@/lib/dss";
import type { FullClaimDetails } from "@/lib/services/claim-service";

/**
 * Fetches all claims with joined claimant/state info and parcel centroids.
 * First tries internal Next.js API / database query, falling back to Supabase client.
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
  } catch (err) {
    console.warn("API /api/claims fetch failed, attempting client Supabase fetch:", err);
  }

  // Fallback to client Supabase instance
  const { data, error } = await supabase
    .from("claims_map")
    .select("*")
    .order("submitted_on", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClaimMapRow[];
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
    const { data, error } = await supabase
      .from("schemes")
      .select("code, name, description, eligibility_json, department, benefit_description");

    if (error) throw error;
    if (data && data.length > 0) {
      return data as SchemeRow[];
    }
  } catch (err) {
    console.warn("fetchSchemes failed, using default schemes:", err);
  }

  return [
    {
      code: "PM_KISAN",
      name: "PM-KISAN",
      description: "Income support of Rs 6,000/year for landholding farmer families.",
      eligibility_json: { min_land_hectares: 0.01, requires_title: true },
    },
    {
      code: "MGNREGA",
      name: "MGNREGA",
      description: "Guaranteed 100 days of wage employment per year to rural households.",
      eligibility_json: { requires_title: false, category: ["ST", "OTFD"] },
    },
    {
      code: "JJM",
      name: "Jal Jeevan Mission",
      description: "Functional household tap water connection for every rural household.",
      eligibility_json: { requires_title: false },
    },
    {
      code: "DAJGUA",
      name: "Dharti Aaba Janjatiya Gram Utkarsh Abhiyan",
      description: "Saturation of infrastructure and livelihood schemes in tribal-majority villages.",
      eligibility_json: { requires_title: true, category: ["ST"] },
    },
    {
      code: "PM_JANMAN",
      name: "PM-JANMAN",
      description: "Housing, clean water, sanitation, and livelihood support for Particularly Vulnerable Tribal Groups (PVTGs).",
      eligibility_json: { requires_title: false, category: ["ST"] },
    },
  ] as SchemeRow[];
}

/** Fetches spatial dispute zones (canopy loss and restricted boundaries) from PostGIS. */
export async function fetchDisputeZones(): Promise<any[]> {
  try {
    const { data, error } = await supabase.from("dispute_zones_map").select("*");
    if (error) throw error;
    if (data && data.length > 0) return data;
  } catch (error: any) {
    console.warn("fetchDisputeZones from Supabase failed, using static fallback:", error.message);
  }
  return [];
}
