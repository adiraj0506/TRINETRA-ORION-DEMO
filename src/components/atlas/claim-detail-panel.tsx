"use client";

import { useState } from "react";
import type { ClaimMapRow } from "@/lib/types";
import { CLAIM_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import { ConvergenceCardModal } from "@/components/dss/convergence-card-modal";
import { useRole } from "@/lib/role-store";

const STATUS_BADGE_CLASSES: Record<ClaimMapRow["status"], string> = {
  approved: "bg-approved/15 text-approved",
  pending: "bg-pending/15 text-pending",
  rejected: "bg-rejected/15 text-rejected",
};

interface ClaimDetailPanelProps {
  claim: ClaimMapRow | null;
  onClose?: () => void;
  onUpdateStatus?: (claimId: string, newStatus: ClaimMapRow["status"]) => void;
}

function getTimelineStages(claim: ClaimMapRow) {
  const filedDate = claim.submitted_on;
  let verifiedDate = "";
  let verifiedStatus: "completed" | "pending" = "completed";
  let disposedDate = claim.decided_on || "";
  let disposedStatus: "approved" | "rejected" | "pending" = claim.status;

  if (claim.decided_on) {
    const start = new Date(claim.submitted_on).getTime();
    const end = new Date(claim.decided_on).getTime();
    const mid = new Date(start + (end - start) / 2);
    verifiedDate = mid.toISOString().slice(0, 10);
    verifiedStatus = "completed";
  } else {
    const start = new Date(claim.submitted_on).getTime();
    const today = new Date().getTime();
    const diffDays = (today - start) / (1000 * 60 * 60 * 24);
    if (diffDays > 45) {
      const mid = new Date(start + 45 * 24 * 60 * 60 * 1000);
      verifiedDate = mid.toISOString().slice(0, 10);
      verifiedStatus = "completed";
    } else {
      verifiedDate = "In progress";
      verifiedStatus = "pending";
    }
  }

  return {
    filedDate,
    verifiedDate,
    verifiedStatus,
    disposedDate,
    disposedStatus,
  };
}

export function ClaimDetailPanel({ claim, onClose, onUpdateStatus }: ClaimDetailPanelProps) {
  const [showReferrals, setShowReferrals] = useState(false);
  const { isAdmin, isVerifier } = useRole();

  if (!claim) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
          No claim selected
        </p>
        <p className="mt-2 max-w-xs text-sm text-ink-soft">
          Click any point on the map to see the claimant, land details, and
          current status.
        </p>
      </div>
    );
  }

  const timeline = getTimelineStages(claim);

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
        <div className="flex flex-wrap gap-2">
          <span
            className={`inline-block rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wider ${STATUS_BADGE_CLASSES[claim.status]}`}
          >
            {STATUS_LABELS[claim.status]}
          </span>
          {claim.has_canopy_violation && (
            <span className="inline-block rounded-full bg-rejected/10 text-rejected border border-rejected/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-semibold">
              ⚠️ Spatial Dispute / Canopy Violation
            </span>
          )}
          {claim.has_restricted_zone_overlap && (
            <span className="inline-block rounded-full bg-rejected/10 text-rejected border border-rejected/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider font-semibold">
              ⚠️ Spatial Dispute / Restricted Zone Overlap
            </span>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line text-ink-soft hover:text-ink hover:border-forest transition-colors cursor-pointer"
            aria-label="Close panel"
          >
            ✕
          </button>
        )}
      </div>

      <h3 className="font-display text-2xl text-ink font-semibold">
        {claim.full_name}
      </h3>
      <p className="mt-1 text-sm text-ink-soft">
        {claim.village}, {claim.district} — {claim.state_name}
      </p>

      {/* ULPIN Code Highlight Card */}
      <div className="mt-4 rounded-lg bg-paper p-3.5 border border-line flex items-center justify-between shadow-xs">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-wider text-ink-soft block font-bold">ULPIN Code</span>
          <span className="font-mono text-sm text-ink font-semibold tracking-wider">{claim.ulpin || "AWAITING-GEN"}</span>
        </div>
        <span className="rounded bg-forest/5 px-2 py-1 font-mono text-[9px] font-bold text-forest border border-forest/15 select-none">
          Ledger Certified
        </span>
      </div>

      {/* Welfare Referral Action button (Admin only) */}
      {isAdmin && (
        <button
          onClick={() => setShowReferrals(true)}
          type="button"
          className="w-full mt-3 rounded-lg border border-forest/30 bg-forest/5 text-forest px-4 py-2.5 font-mono text-xs uppercase tracking-wider font-bold transition-all hover:bg-forest/10 flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
        >
          📄 Generate Welfare Referral Package
        </button>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-line pt-6">
        <div>
          <dt className="text-xs uppercase tracking-wider text-ink-soft font-semibold">
            Claim type
          </dt>
          <dd className="mt-1 text-sm text-ink font-medium">
            {CLAIM_TYPE_LABELS[claim.claim_type]}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ink-soft font-semibold">
            Area claimed
          </dt>
          <dd className="mt-1 font-mono text-sm text-ink font-semibold">
            {claim.area_claimed_hectares} ha
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ink-soft font-semibold">
            Category
          </dt>
          <dd className="mt-1 text-sm text-ink font-medium">
            {claim.category === "ST"
              ? "Scheduled Tribe"
              : "Other Traditional Forest Dweller"}
          </dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wider text-ink-soft font-semibold">
            Household size
          </dt>
          <dd className="mt-1 text-sm text-ink font-medium">{claim.household_size} members</dd>
        </div>
      </dl>

      {/* Action Buttons (Verifier / Admin only) */}
      {isVerifier && (
        <div className="mt-6 border-t border-line pt-6">
          <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-3 font-semibold">Verification Actions</h4>
          <div className="flex gap-3">
            <button
              onClick={() => onUpdateStatus && onUpdateStatus(claim.claim_id, "approved")}
              disabled={claim.status === "approved"}
              type="button"
              className={`flex-1 rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                claim.status === "approved"
                  ? "bg-approved/15 text-approved/55 border-approved/20"
                  : "bg-approved/5 text-approved border-approved/30 hover:bg-approved/15"
              }`}
            >
              ✓ Approve Title
            </button>
            <button
              onClick={() => onUpdateStatus && onUpdateStatus(claim.claim_id, "rejected")}
              disabled={claim.status === "rejected"}
              type="button"
              className={`flex-1 rounded-lg px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-all border cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed ${
                claim.status === "rejected"
                  ? "bg-rejected/15 text-rejected/70 border-rejected/25"
                  : "bg-rejected/5 text-rejected border-rejected/30 hover:bg-rejected/15"
              }`}
            >
              ✗ Reject Title
            </button>
          </div>
        </div>
      )}

      {/* Vertical Stepper Timeline */}
      <div className="mt-6 border-t border-line pt-6">
        <h4 className="text-xs font-bold uppercase tracking-wider text-ink-soft mb-4">Claim Processing Timeline</h4>
        <div className="relative pl-6 space-y-6 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[1px] before:bg-line">
          {/* Step 1: Filed */}
          <div className="relative">
            <span className="absolute -left-[20px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-approved text-paper-raised text-[9px] font-bold select-none">
              ✓
            </span>
            <div>
              <p className="text-sm font-semibold text-ink">FRA Claim Filed</p>
              <p className="font-mono text-[10px] text-ink-soft">{timeline.filedDate}</p>
              <p className="text-xs text-ink-soft mt-0.5">Claim form registered under state digital ledger.</p>
            </div>
          </div>

          {/* Step 2: Verification */}
          <div className="relative">
            {timeline.verifiedStatus === "completed" ? (
              <span className="absolute -left-[20px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-approved text-paper-raised text-[9px] font-bold select-none">
                ✓
              </span>
            ) : (
              <span className="absolute -left-[20px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-pending text-paper-raised text-[9px] font-bold animate-pulse select-none">
                ●
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-ink">Field Verification Survey</p>
              <p className="font-mono text-[10px] text-ink-soft">{timeline.verifiedDate}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {timeline.verifiedStatus === "completed"
                  ? "Joint forest rights survey and GPS mapping complete."
                  : "Gram Sabha & revenue mapping survey is in progress."}
              </p>
            </div>
          </div>

          {/* Step 3: Decision */}
          <div className="relative">
            {timeline.disposedStatus === "approved" ? (
              <span className="absolute -left-[20px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-approved text-paper-raised text-[9px] font-bold select-none">
                ✓
              </span>
            ) : timeline.disposedStatus === "rejected" ? (
              <span className="absolute -left-[20px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-rejected text-paper-raised text-[9px] font-bold select-none">
                ✗
              </span>
            ) : (
              <span className="absolute -left-[20px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-line text-ink-soft text-[9px] font-bold select-none">
                ●
              </span>
            )}
            <div>
              <p className="text-sm font-semibold text-ink">
                {timeline.disposedStatus === "approved"
                  ? "Title Approved & Disposed"
                  : timeline.disposedStatus === "rejected"
                  ? "Claim Rejected & Closed"
                  : "Disposal Decision Pending"}
              </p>
              <p className="font-mono text-[10px] text-ink-soft">{timeline.disposedDate || "Awaiting SDLC/DLC review"}</p>
              <p className="text-xs text-ink-soft mt-0.5">
                {timeline.disposedStatus === "approved"
                  ? "Forest rights patta deed granted and registered under ULPIN."
                  : timeline.disposedStatus === "rejected"
                  ? `Claim rejected. Reason: ${claim.rejection_reason || "Insufficient occupancy evidence"}`
                  : "Awaiting final decision by the Sub-Divisional Committee."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex items-center gap-2 border-t border-line pt-4">
        <span
          className={`h-2 w-2 rounded-full ${claim.digitized ? "bg-approved" : "bg-line"}`}
        />
        <span className="text-xs text-ink-soft">
          {claim.digitized
            ? "Record digitized"
            : "Not yet digitized"}
        </span>
      </div>

      {/* Welfare Referral Package Modal Overlay */}
      {showReferrals && (
        <ConvergenceCardModal claim={claim} onClose={() => setShowReferrals(false)} />
      )}
    </div>
  );
}
