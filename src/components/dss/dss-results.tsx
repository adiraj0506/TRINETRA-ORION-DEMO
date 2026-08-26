import { useState } from "react";
import type { ClaimMapRow } from "@/lib/types";
import { CLAIM_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import type { SchemeEligibilityResult } from "@/lib/dss";
import { ConvergenceCardModal } from "@/components/dss/convergence-card-modal";
import { useRole } from "@/lib/role-store";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";

export function DssResults({
  claim,
  results,
}: {
  claim: ClaimMapRow | null;
  results: SchemeEligibilityResult[];
}) {
  const [showReferrals, setShowReferrals] = useState(false);
  const { isAdmin } = useRole();

  if (!claim) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
          No claimant selected
        </p>
        <p className="mt-2 max-w-xs text-sm text-ink-soft">
          Pick a claimant on the left to see which government schemes they
          qualify for, and why.
        </p>
      </div>
    );
  }

  const eligibleCount = results.filter((r) => r.eligible).length;

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="font-display text-2xl text-ink font-semibold">{claim.full_name}</h2>
            <StatusBadge status={claim.status} size="sm" />
          </div>
          <p className="mt-1 text-sm text-ink-soft">
            {claim.village}, {claim.district} — {claim.state_name}
          </p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowReferrals(true)}
            variant="clay"
            size="sm"
          >
            📄 Generate Welfare Package
          </Button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs text-ink-soft">
        <span>{CLAIM_TYPE_LABELS[claim.claim_type]}</span>
        <span>{claim.area_claimed_hectares} ha</span>
        <span>{claim.category}</span>
        {claim.ulpin && <span>ULPIN: {claim.ulpin}</span>}
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
        <span className="font-mono text-2xl text-forest">
          {eligibleCount}
        </span>
        <span className="text-sm text-ink-soft">
          of {results.length} schemes matched
        </span>
      </div>

      <div className="mt-4 space-y-3">
        {results.map((r) => (
          <div
            key={r.schemeCode}
            className={`rounded-lg border p-4 ${
              r.eligible
                ? "border-approved/30 bg-approved/5"
                : "border-line bg-paper-raised"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-display text-base text-ink">
                {r.schemeName}
              </h3>
              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                  r.eligible
                    ? "bg-approved/15 text-approved"
                    : "bg-line text-ink-soft"
                }`}
              >
                {r.eligible ? "Eligible" : "Not eligible"}
              </span>
            </div>
            {r.schemeDescription && (
              <p className="mt-1 text-xs text-ink-soft">
                {r.schemeDescription}
              </p>
            )}
            <p className="mt-2 text-sm text-ink">{r.reason}</p>
          </div>
        ))}
      </div>
      {showReferrals && (
        <ConvergenceCardModal claim={claim} onClose={() => setShowReferrals(false)} />
      )}
    </div>
  );
}
