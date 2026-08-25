import type { ClaimantCategory, ClaimMapRow } from "@/lib/types";

export interface SchemeRow {
  code: string;
  name: string;
  description: string | null;
  eligibility_json: SchemeEligibilityCriteria;
}

export interface SchemeEligibilityCriteria {
  requires_title?: boolean;
  category?: ClaimantCategory[];
  min_land_hectares?: number;
}

export const STATIC_SCHEMES: SchemeRow[] = [
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
];

export interface SchemeEligibilityResult {
  schemeCode: string;
  schemeName: string;
  schemeDescription: string | null;
  eligible: boolean;
  reason: string;
}

/**
 * Deterministic rule engine — no ML, no external calls. Each scheme's
 * eligibility_json (seeded in Day 2) defines the criteria; this function
 * checks a claimant + their claim against every scheme and explains why.
 */
export function evaluateSchemes(
  claimRow: ClaimMapRow,
  schemes: SchemeRow[]
): SchemeEligibilityResult[] {
  const hasTitle = claimRow.status === "approved";

  return schemes.map((scheme) => {
    const criteria = scheme.eligibility_json ?? {};
    const checks: { label: string; passed: boolean }[] = [];

    if (criteria.requires_title !== undefined) {
      checks.push({
        label: criteria.requires_title
          ? "holds an approved land title"
          : "does not require a land title",
        passed: criteria.requires_title ? hasTitle : true,
      });
    }

    if (criteria.category) {
      checks.push({
        label: `belongs to an eligible category (${criteria.category.join("/")})`,
        passed: criteria.category.includes(claimRow.category),
      });
    }

    if (criteria.min_land_hectares !== undefined) {
      checks.push({
        label: `claims at least ${criteria.min_land_hectares} ha`,
        passed: claimRow.area_claimed_hectares >= criteria.min_land_hectares,
      });
    }

    const eligible = checks.every((c) => c.passed);
    const failed = checks.filter((c) => !c.passed);

    const reason = eligible
      ? checks.length
        ? `Eligible — ${claimRow.full_name} ${checks.map((c) => c.label).join(" and ")}.`
        : `Eligible — no restrictive criteria apply.`
      : `Not eligible — ${failed
          .map((c) => `does not meet: ${c.label}`)
          .join("; ")}.`;

    return {
      schemeCode: scheme.code,
      schemeName: scheme.name,
      schemeDescription: scheme.description,
      eligible,
      reason,
    };
  });
}
