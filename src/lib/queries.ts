import { supabase } from "@/lib/supabase";
import type { ClaimMapRow } from "@/lib/types";
import type { SchemeRow } from "@/lib/dss";

/**
 * Fetches every claim with its joined claimant/state info and parcel
 * centroid, via the `claims_map` view (see supabase/day3_atlas_view.sql).
 * The dataset is small (~430 rows) so we fetch it all client-side and
 * filter in the browser rather than paginating.
 */
export async function fetchClaimsForMap(): Promise<ClaimMapRow[]> {
  const { data, error } = await supabase
    .from("claims_map")
    .select("*")
    .order("submitted_on", { ascending: false });

  if (error) throw error;
  return (data ?? []) as ClaimMapRow[];
}

/** Fetches the government scheme reference data used by the DSS. */
export async function fetchSchemes(): Promise<SchemeRow[]> {
  try {
    const { data, error } = await supabase
      .from("schemes")
      .select("code, name, description, eligibility_json");

    if (error) throw error;
    if (data && data.length > 0) {
      return data as SchemeRow[];
    }
  } catch (err) {
    console.warn("fetchSchemes failed, using static fallback:", err);
  }

  // Static fallback schemes matching seed.sql
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
  const { data, error } = await supabase
    .from("dispute_zones_map")
    .select("*");

  if (error) {
    // Fall back to empty array and warn, letting client fall back to static geojson file
    console.warn("fetchDisputeZones from Supabase failed, falling back to static files:", error.message);
    return [];
  }
  return data ?? [];
}

