"use client";

import { useEffect, useState, useMemo } from "react";
import { fetchClaimsForMap, executeClaimAction } from "@/lib/queries";
import { useRole, MOCK_CURRENT_CLAIMANT_ID } from "@/lib/role-store";
import { computeStats, type StateStats } from "@/lib/stats";
import type { ClaimMapRow } from "@/lib/types";
import { CLAIM_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import { Stat } from "@/components/marketing/stat";
import { RateComparisonChart } from "@/components/dashboard/rate-comparison-chart";
import { StatusBreakdownChart } from "@/components/dashboard/status-breakdown-chart";
import { DigitizationProgress } from "@/components/dashboard/digitization-progress";
import { ConvergenceCardModal } from "@/components/dss/convergence-card-modal";

export default function DashboardPage() {
  const { role, isCommunity, isVerifier, isAdmin } = useRole();
  const [claims, setClaims] = useState<ClaimMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for rendering the welfare card convergence modal
  const [selectedClaimForWelfare, setSelectedClaimForWelfare] = useState<ClaimMapRow | null>(null);
  const [batchSyncing, setBatchSyncing] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchClaimsForMap()
      .then(setClaims)
      .catch((err) => {
        console.error(err);
        setError(
          "Couldn't load claims. Make sure the database is set up — see supabase/README.md."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateStatus = async (claimId: string, newStatus: ClaimMapRow["status"]) => {
    try {
      if (newStatus === "approved" || newStatus === "rejected") {
        const actionType = newStatus === "approved" ? "approve" : "reject";
        await executeClaimAction(claimId, actionType, {
          notes: newStatus === "approved" ? "Approved from Dashboard Queue." : undefined,
          reason: newStatus === "rejected" ? "Rejected from Dashboard Queue." : undefined,
        });
      }
      setClaims((prev) =>
        prev.map((c) =>
          c.claim_id === claimId
            ? {
                ...c,
                status: newStatus,
                decided_on: newStatus !== "pending" ? new Date().toISOString().slice(0, 10) : null
              }
            : c
        )
      );
    } catch (err: any) {
      console.error("Dashboard action failed:", err);
      alert(`Action error: ${err.message}`);
    }
  };

  const handleBatchWelfare = () => {
    setBatchSyncing(true);
    setBatchMessage("Evaluating eligibility criteria for all approved titles...");
    setTimeout(() => {
      setBatchMessage("Generating welfare convergence cards...");
      setTimeout(() => {
        setBatchSyncing(false);
        setBatchMessage(null);
        alert("Batch welfare package generation complete! Ready for download/print.");
      }, 1500);
    }, 1500);
  };

  // Helper to determine if a claim belongs to the mock user ("Kunti Kondh" / MOCK_CURRENT_CLAIMANT_ID)
  // In seed.sql, claimant ID '6051fe98-5dd3-4c7c-b14a-cb140a28f7eb' is 'Kunti Kondh'
  // TODO: Once the claims_map view returns claimant_id, filter by c.claimant_id === MOCK_CURRENT_CLAIMANT_ID
  const isCurrentUserClaim = (c: ClaimMapRow) => c.full_name === "Kunti Kondh";

  // Filtered claims based on current role
  const displayedClaims = useMemo(() => {
    if (isCommunity) {
      return claims.filter(isCurrentUserClaim);
    }
    if (role === "verifier") {
      return claims.filter((c) => c.status === "pending");
    }
    return claims; // admin sees everything
  }, [claims, role, isCommunity]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft animate-pulse">
          Loading dashboard…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-lg border border-rejected/30 bg-rejected/5 p-4 text-sm text-rejected">
          {error}
        </div>
      </div>
    );
  }

  // Analytics stats
  const { national, byState } = computeStats(claims);

  // Verifier specific counts
  const pendingCount = claims.filter((c) => c.status === "pending").length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Header section based on role */}
      <div>
        <p className="font-mono text-xs uppercase tracking-wider text-clay">
          {isCommunity
            ? "Stakeholder Portal"
            : role === "verifier"
            ? "Verification Workspace"
            : "Administrator Dashboard"}
        </p>
        <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
          {isCommunity
            ? "My Forest Rights Claims"
            : role === "verifier"
            ? "Verification Queue"
            : "The numbers, by state"}
        </h1>
        <p className="mt-4 max-w-2xl text-ink-soft">
          {isCommunity
            ? "Track the real-time processing status, geospatial verification, and scheme eligibility matching of your FRA claims."
            : role === "verifier"
            ? "Verify and decide on outstanding forest land title requests. View pending GPS polygons and satellite overlay indicators."
            : "Every figure here is computed live from the same claim records shown on the Atlas — not a static export."}
        </p>
      </div>

      {/* Role Switcher Hint Widget (Cosmetic & informative) */}
      <div className="mt-6 inline-flex items-center gap-2 rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-[10px] text-ink-soft">
        Current Mode:{" "}
        <span className="font-bold uppercase text-clay">{role}</span>
        {isCommunity && (
          <span className="text-[10px] text-ink-soft italic">
            (Filtered to Claimant: Kunti Kondh)
          </span>
        )}
      </div>

      {/* 1. STAKEHOLDER VIEW */}
      {isCommunity && (
        <div className="mt-12 space-y-8">
          <div className="rounded-xl border border-line bg-paper-raised overflow-hidden">
            <div className="border-b border-line bg-paper/50 px-6 py-4">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                Your Filed Claims Ledger (Read-Only)
              </h3>
            </div>
            <div className="divide-y divide-line">
              {displayedClaims.length === 0 ? (
                <div className="p-8 text-center text-sm text-ink-soft">
                  No active claims found for your claimant profile.
                </div>
              ) : (
                displayedClaims.map((claim) => (
                  <div key={claim.claim_id} className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-3">
                          <h4 className="font-display text-lg text-ink font-semibold">
                            {claim.full_name}
                          </h4>
                          <span
                            className={`rounded-full px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-bold ${
                              claim.status === "approved"
                                ? "bg-approved/15 text-approved"
                                : claim.status === "pending"
                                ? "bg-pending/15 text-pending"
                                : "bg-rejected/15 text-rejected"
                            }`}
                          >
                            {STATUS_LABELS[claim.status]}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-ink-soft">
                          {claim.village}, {claim.district} · ULPIN:{" "}
                          <span className="font-mono">{claim.ulpin || "Pending Verification"}</span>
                        </p>
                        <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-2 text-xs">
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-mono text-ink-soft block">
                              Type
                            </span>
                            <span className="font-medium text-ink">
                              {CLAIM_TYPE_LABELS[claim.claim_type]}
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-mono text-ink-soft block">
                              Area Size
                            </span>
                            <span className="font-mono font-semibold text-ink">
                              {claim.area_claimed_hectares} ha
                            </span>
                          </div>
                          <div>
                            <span className="text-[10px] uppercase tracking-wider font-mono text-ink-soft block">
                              Filed On
                            </span>
                            <span className="font-mono text-ink">
                              {claim.submitted_on}
                            </span>
                          </div>
                        </div>
                        {claim.status === "rejected" && claim.rejection_reason && (
                          <div className="mt-3 rounded border border-rejected/25 bg-rejected/5 p-3 text-xs text-rejected">
                            <strong>Rejection Reason:</strong> {claim.rejection_reason}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 2. VERIFIER VIEW */}
      {role === "verifier" && (
        <div className="mt-12 space-y-12">
          {/* Basic Counts Row (no charts) */}
          <div className="grid grid-cols-3 gap-6 border-y border-line py-8">
            <Stat value={`${pendingCount}`} label="Pending Review" />
            <Stat value={`${approvedCount}`} label="Approved Claims" />
            <Stat value={`${rejectedCount}`} label="Rejected Claims" />
          </div>

          <div className="rounded-xl border border-line bg-paper-raised overflow-hidden">
            <div className="border-b border-line bg-paper/50 px-6 py-4 flex items-center justify-between">
              <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                Verification Queue ({displayedClaims.length} pending claims)
              </h3>
            </div>
            <div className="divide-y divide-line">
              {displayedClaims.length === 0 ? (
                <div className="p-12 text-center text-sm text-ink-soft">
                  ✓ Excellent work! The verification queue is currently empty.
                </div>
              ) : (
                displayedClaims.map((claim) => (
                  <div key={claim.claim_id} className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <h4 className="font-display text-lg text-ink font-semibold">
                            {claim.full_name}
                          </h4>
                          <span className="rounded-full bg-pending/15 text-pending px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider font-bold">
                            Pending Review
                          </span>
                          {claim.has_canopy_violation && (
                            <span className="rounded bg-rejected/10 text-rejected border border-rejected/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold">
                              Canopy Conflict
                            </span>
                          )}
                          {claim.has_restricted_zone_overlap && (
                            <span className="rounded bg-rejected/10 text-rejected border border-rejected/20 px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold">
                              Zone Overlap
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-ink-soft">
                          {claim.village}, {claim.district} · Type:{" "}
                          <strong className="text-ink">{CLAIM_TYPE_LABELS[claim.claim_type]}</strong> · Area:{" "}
                          <span className="font-mono font-semibold">{claim.area_claimed_hectares} ha</span>
                        </p>
                        <p className="mt-2 text-xs text-ink-soft font-mono">
                          Submitted: {claim.submitted_on} · ULPIN: {claim.ulpin || "Auto-Generate"}
                        </p>
                      </div>

                      {/* Approve/Reject Action Panel */}
                      <div className="flex items-center gap-3 self-end lg:self-start">
                        <button
                          onClick={() => handleUpdateStatus(claim.claim_id, "approved")}
                          type="button"
                          className="rounded-lg bg-approved/10 text-approved border border-approved/20 hover:bg-approved/20 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                        >
                          ✓ Approve Title
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(claim.claim_id, "rejected")}
                          type="button"
                          className="rounded-lg bg-rejected/10 text-rejected border border-rejected/20 hover:bg-rejected/20 px-3.5 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all cursor-pointer"
                        >
                          ✗ Reject Title
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. ADMINISTRATOR VIEW */}
      {isAdmin && (
        <div className="mt-12 space-y-16">
          {/* National headline stats */}
          <div className="grid grid-cols-2 gap-8 border-y border-line py-10 md:grid-cols-4">
            <Stat value={`${national.total}`} label="Total claims in this demo" />
            <Stat value={`${national.approvalRate}%`} label="National approval rate" />
            <Stat value={`${national.conflictRate}%`} label="National conflict rate" />
            <Stat value={`${national.digitizedPct}%`} label="Records digitized" />
          </div>

          {/* Recharts Analytics Panel */}
          <div>
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
              <section>
                <h2 className="font-display text-2xl text-ink font-semibold">
                  Approval vs. conflict rate, by state
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  The same divide seen nationally — Tripura resolves cleanly, while
                  Telangana and Odisha carry a heavier share of disputed claims.
                </p>
                <div className="mt-6 rounded-xl border border-line bg-paper-raised p-6">
                  <RateComparisonChart data={byState} />
                </div>
              </section>

              <section>
                <h2 className="font-display text-2xl text-ink font-semibold">
                  Claim status breakdown
                </h2>
                <p className="mt-2 text-sm text-ink-soft">
                  Raw counts of approved, pending, and rejected claims per state in this dataset.
                </p>
                <div className="mt-6 rounded-xl border border-line bg-paper-raised p-6">
                  <StatusBreakdownChart data={byState} />
                </div>
              </section>
            </div>

            <section className="mt-16">
              <h2 className="font-display text-2xl text-ink font-semibold">
                Digitization progress
              </h2>
              <p className="mt-2 max-w-xl text-sm text-ink-soft">
                Share of legacy claim records converted into structured digital data.
              </p>
              <div className="mt-6 max-w-2xl rounded-xl border border-line bg-paper-raised p-6">
                <DigitizationProgress data={byState} />
              </div>
            </section>
          </div>

          {/* Full Claim List & Batch Action Ledger */}
          <div className="rounded-xl border border-line bg-paper-raised overflow-hidden">
            <div className="border-b border-line bg-paper/50 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <h3 className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                  Complete Claims Ledger
                </h3>
                <p className="text-xs text-ink-soft mt-0.5">
                  Showing all {claims.length} claims inside the demo repository.
                </p>
              </div>

              {/* Batch Action button */}
              <button
                onClick={handleBatchWelfare}
                disabled={batchSyncing}
                type="button"
                className="self-start sm:self-auto rounded-full bg-forest text-paper-raised px-4 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all hover:bg-forest-deep cursor-pointer disabled:opacity-50"
              >
                ⚡ Batch Generate Welfare Cards
              </button>
            </div>

            {batchMessage && (
              <div className="bg-forest/5 text-forest border-b border-line px-6 py-3 text-xs font-mono animate-pulse">
                {batchMessage}
              </div>
            )}

            <div className="max-h-[500px] overflow-y-auto divide-y divide-line">
              {claims.map((claim) => (
                <div key={claim.claim_id} className="p-4 hover:bg-paper/40 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-sm text-ink font-semibold">{claim.full_name}</strong>
                        <span
                          className={`rounded px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider font-bold ${
                            claim.status === "approved"
                              ? "bg-approved/15 text-approved"
                              : claim.status === "pending"
                              ? "bg-pending/15 text-pending"
                              : "bg-rejected/15 text-rejected"
                          }`}
                        >
                          {STATUS_LABELS[claim.status]}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft mt-1">
                        {claim.village}, {claim.district} · {claim.state_name} · {claim.area_claimed_hectares} ha
                      </p>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <button
                        onClick={() => setSelectedClaimForWelfare(claim)}
                        type="button"
                        className="rounded border border-line bg-paper px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider font-bold hover:border-forest text-ink hover:text-forest transition-all cursor-pointer"
                      >
                        📄 Welfare Card
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(claim.claim_id, claim.status === "approved" ? "rejected" : "approved")}
                        type="button"
                        className="rounded border border-line bg-paper px-2.5 py-1.5 font-mono text-[9px] uppercase tracking-wider font-bold hover:border-clay text-ink hover:text-clay transition-all cursor-pointer"
                      >
                        Toggle Status
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Welfare Referral Package Modal Overlay */}
      {selectedClaimForWelfare && (
        <ConvergenceCardModal
          claim={selectedClaimForWelfare}
          onClose={() => setSelectedClaimForWelfare(null)}
        />
      )}
    </div>
  );
}
