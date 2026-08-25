export type ClaimStatus = "approved" | "pending" | "rejected";
export type ClaimType = "IFR" | "CR" | "CFR";
export type ClaimantCategory = "ST" | "OTFD";
export type StateCode = "MP" | "OD" | "TS" | "TR";

export interface ClaimMapRow {
  claim_id: string;
  state_code: StateCode;
  state_name: string;
  claim_type: ClaimType;
  area_claimed_hectares: number;
  status: ClaimStatus;
  submitted_on: string;
  decided_on: string | null;
  rejection_reason: string | null;
  digitized: boolean;
  full_name: string;
  village: string;
  district: string;
  category: ClaimantCategory;
  household_size: number;
  lat: number;
  lng: number;
  ulpin?: string;
  geom_geojson?: any;
  has_canopy_violation?: boolean;
  has_restricted_zone_overlap?: boolean;
}

export const CLAIM_TYPE_LABELS: Record<ClaimType, string> = {
  IFR: "Individual Forest Rights",
  CR: "Community Rights",
  CFR: "Community Forest Resource Rights",
};

export const STATUS_COLORS: Record<ClaimStatus, string> = {
  approved: "var(--color-approved)",
  pending: "var(--color-pending)",
  rejected: "var(--color-rejected)",
};

export const STATUS_LABELS: Record<ClaimStatus, string> = {
  approved: "Approved",
  pending: "Pending",
  rejected: "Rejected",
};

export interface Scheme {
  code: string;
  name: string;
  description: string;
  eligibility_json: Record<string, unknown>;
}
