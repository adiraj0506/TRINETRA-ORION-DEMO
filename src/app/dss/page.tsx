"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchClaimsForMap, fetchSchemes } from "@/lib/queries";
import { evaluateSchemes, type SchemeRow } from "@/lib/dss";
import type { ClaimMapRow } from "@/lib/types";
import { ClaimantPicker } from "@/components/dss/claimant-picker";
import { DssResults } from "@/components/dss/dss-results";
import { useRole } from "@/lib/role-store";

export default function DssPage() {
  const { isCommunity } = useRole();
  const [claims, setClaims] = useState<ClaimMapRow[]>([]);
  const [schemes, setSchemes] = useState<SchemeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    null
  );

  useEffect(() => {
    Promise.all([fetchClaimsForMap(), fetchSchemes()])
      .then(([claimsData, schemesData]) => {
        setClaims(claimsData);
        setSchemes(schemesData);
      })
      .catch((err) => {
        console.error(err);
        setError(
          "Couldn't load data. Make sure the database is set up — see supabase/README.md."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  // Filter claims based on role (Stakeholder sees only their own claims)
  const roleFilteredClaims = useMemo(() => {
    if (isCommunity) {
      return claims.filter((c) => c.full_name === "Kunti Kondh");
    }
    return claims;
  }, [claims, isCommunity]);

  // Pre-select the stakeholder's claim once loaded
  useEffect(() => {
    if (isCommunity && roleFilteredClaims.length > 0 && !selectedClaimId) {
      setSelectedClaimId(roleFilteredClaims[0].claim_id);
    }
  }, [isCommunity, roleFilteredClaims, selectedClaimId]);

  const selectedClaim = useMemo(
    () => roleFilteredClaims.find((c) => c.claim_id === selectedClaimId) ?? null,
    [roleFilteredClaims, selectedClaimId]
  );

  const results = useMemo(() => {
    if (!selectedClaim || schemes.length === 0) return [];
    return evaluateSchemes(selectedClaim, schemes);
  }, [selectedClaim, schemes]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <div className="mb-6">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">
          Decision Support
        </p>
        <h1 className="font-display text-3xl text-ink">
          Decision Support System
        </h1>
        <p className="mt-2 max-w-2xl text-ink-soft">
          A deterministic rule engine — no ML, fully explainable — matches
          every titleholder to the government schemes they qualify for.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-rejected/30 bg-rejected/5 p-4 text-sm text-rejected">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-[60vh] items-center justify-center rounded-xl border border-line">
          <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
            Loading claimants…
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 overflow-hidden rounded-xl border border-line lg:grid-cols-[360px_1fr]">
          <div className="h-[50vh] min-h-[340px] border-b border-line lg:h-[70vh] lg:min-h-[420px] lg:border-b-0 lg:border-r">
            <ClaimantPicker
              claims={roleFilteredClaims}
              selectedClaimId={selectedClaimId}
              onSelect={setSelectedClaimId}
            />
          </div>
          <div className="h-[50vh] min-h-[340px] lg:h-[70vh] lg:min-h-[420px]">
            <DssResults claim={selectedClaim} results={results} />
          </div>
        </div>
      )}
    </div>
  );
}
