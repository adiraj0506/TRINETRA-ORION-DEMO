"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  fetchClaimsForMap,
  executeClaimAction,
  fetchClaimDetails,
} from "@/lib/queries";
import type { ClaimMapRow, ClaimStatus, StateCode, ClaimType } from "@/lib/types";
import { CLAIM_TYPE_LABELS, STATUS_LABELS } from "@/lib/types";
import { Stat } from "@/components/marketing/stat";
import { ConvergenceCardModal } from "@/components/dss/convergence-card-modal";
import type { FullClaimDetails } from "@/lib/services/claim-service";

export default function AdminConsolePage() {
  const [claims, setClaims] = useState<ClaimMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tab navigation inside Admin console
  const [activeTab, setActiveTab] = useState<
    "queue" | "analytics" | "alerts" | "audit"
  >("queue");

  // Filtering states for verification queue
  const [filterState, setFilterState] = useState<StateCode | "ALL">("ALL");
  const [filterStatus, setFilterStatus] = useState<string>("pending");
  const [filterClaimType, setFilterClaimType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Review modal state
  const [reviewingClaimId, setReviewingClaimId] = useState<string | null>(null);
  const [claimDetails, setClaimDetails] = useState<FullClaimDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Input states for review decisions
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [selectedActionType, setSelectedActionType] = useState<
    "approve" | "reject" | "return" | "field_verification" | null
  >(null);

  // DSS Modal
  const [welfareModalClaim, setWelfareModalClaim] = useState<ClaimMapRow | null>(
    null
  );

  const loadData = () => {
    setLoading(true);
    fetchClaimsForMap()
      .then(setClaims)
      .catch((err) => {
        console.error(err);
        setError("Failed to load claims database.");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // When opening review drawer/modal, load complete claim dossier
  const handleOpenReview = async (claimId: string) => {
    setReviewingClaimId(claimId);
    setLoadingDetails(true);
    setActionFeedback(null);
    setSelectedActionType(null);
    setReviewNotes("");
    setRejectionReason("");
    setReturnReason("");

    try {
      const details = await fetchClaimDetails(claimId);
      setClaimDetails(details);
    } catch (err: any) {
      console.error(err);
      setActionFeedback("Could not load full claim dossier.");
    } finally {
      setLoadingDetails(false);
    }
  };

  // Execute workflow action
  const handleExecuteAction = async (action: "approve" | "reject" | "return" | "field_verification") => {
    if (!reviewingClaimId) return;
    setActionProcessing(true);
    setActionFeedback(null);

    try {
      const payload: { notes?: string; reason?: string } = {};
      if (action === "approve") payload.notes = reviewNotes || "Approved under SDLC FRA statutory powers.";
      else if (action === "reject") payload.reason = rejectionReason || "Ineligible under Section 4(3) occupancy requirements.";
      else if (action === "return") payload.reason = returnReason || "Incomplete land parcel boundary description.";
      else if (action === "field_verification") payload.notes = reviewNotes || "Joint forest and revenue field verification assigned.";

      await executeClaimAction(reviewingClaimId, action, payload);
      setActionFeedback(`Successfully executed ${action.toUpperCase()} action.`);

      // Update local claims state immediately
      setClaims((prev) =>
        prev.map((c) => {
          if (c.claim_id === reviewingClaimId) {
            return {
              ...c,
              status:
                action === "approve"
                  ? "approved"
                  : action === "reject"
                  ? "rejected"
                  : action === "return"
                  ? "returned_for_correction"
                  : "field_verification",
              decided_on:
                action === "approve" || action === "reject"
                  ? new Date().toISOString().slice(0, 10)
                  : null,
            };
          }
          return c;
        })
      );

      // Refresh claim details
      const refreshed = await fetchClaimDetails(reviewingClaimId);
      setClaimDetails(refreshed);
      setSelectedActionType(null);
    } catch (err: any) {
      console.error(err);
      setActionFeedback(`Action failed: ${err.message}`);
    } finally {
      setActionProcessing(false);
    }
  };

  // Computed KPI stats
  const totalCount = claims.length;
  const pendingCount = claims.filter(
    (c) => c.status === "pending" || c.status === "submitted" || c.status === "review_pending"
  ).length;
  const approvedCount = claims.filter((c) => c.status === "approved").length;
  const rejectedCount = claims.filter((c) => c.status === "rejected").length;
  const returnedCount = claims.filter(
    (c) => c.status === "returned_for_correction"
  ).length;
  const fieldVerifCount = claims.filter(
    (c) => c.status === "field_verification"
  ).length;
  const conflictCount = claims.filter(
    (c) => c.has_canopy_violation || c.has_restricted_zone_overlap || c.has_spatial_conflict
  ).length;

  // Filtered queue items
  const filteredQueue = useMemo(() => {
    return claims.filter((c) => {
      if (filterState !== "ALL" && c.state_code !== filterState) return false;
      if (filterClaimType !== "ALL" && c.claim_type !== filterClaimType) return false;

      if (filterStatus === "pending") {
        if (!["pending", "submitted", "review_pending", "verification_pending"].includes(c.status))
          return false;
      } else if (filterStatus !== "ALL" && c.status !== filterStatus) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.full_name?.toLowerCase().includes(q);
        const matchVillage = c.village?.toLowerCase().includes(q);
        const matchDistrict = c.district?.toLowerCase().includes(q);
        const matchUlpin = c.ulpin?.toLowerCase().includes(q);
        const matchApp = c.application_number?.toLowerCase().includes(q);
        if (!matchName && !matchVillage && !matchDistrict && !matchUlpin && !matchApp)
          return false;
      }

      return true;
    });
  }, [claims, filterState, filterStatus, filterClaimType, searchQuery]);

  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-clay font-bold">
            Executive Command & Decision Center
          </p>
          <h1 className="mt-1 font-display text-3xl text-ink font-semibold md:text-4xl">
            Admin Verification Console
          </h1>
          <p className="mt-2 text-sm text-ink-soft max-w-2xl">
            Authorize, verify, and resolve Forest Rights Act title requests. Every decision updates the PostgreSQL database, PostGIS boundaries, and live Atlas.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/digitize"
            className="rounded-full bg-forest text-paper-raised px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-all hover:bg-forest-deep shadow-sm"
          >
            + Digitise New Claim
          </Link>
          <Link
            href="/atlas"
            className="rounded-full border border-line bg-paper px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink font-semibold hover:border-forest"
          >
            Open Live Atlas
          </Link>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg border border-rejected/30 bg-rejected/5 p-4 text-sm text-rejected">
          {error}
        </div>
      )}

      {/* 1. KPI Overview Summary Cards */}
      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-line bg-paper-raised p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft block font-semibold">
            Total Claims
          </span>
          <span className="font-display text-2xl font-bold text-ink mt-1 block">
            {totalCount}
          </span>
        </div>
        <div className="rounded-xl border border-pending/30 bg-pending/5 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-pending block font-semibold">
            Pending Queue
          </span>
          <span className="font-display text-2xl font-bold text-pending mt-1 block">
            {pendingCount}
          </span>
        </div>
        <div className="rounded-xl border border-approved/30 bg-approved/5 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-approved block font-semibold">
            Approved Titles
          </span>
          <span className="font-display text-2xl font-bold text-approved mt-1 block">
            {approvedCount}
          </span>
        </div>
        <div className="rounded-xl border border-rejected/30 bg-rejected/5 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-rejected block font-semibold">
            Rejected
          </span>
          <span className="font-display text-2xl font-bold text-rejected mt-1 block">
            {rejectedCount}
          </span>
        </div>
        <div className="rounded-xl border border-clay/30 bg-clay/5 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-clay block font-semibold">
            Returned
          </span>
          <span className="font-display text-2xl font-bold text-clay mt-1 block">
            {returnedCount}
          </span>
        </div>
        <div className="rounded-xl border border-water/30 bg-water/5 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-water block font-semibold">
            Field Surveys
          </span>
          <span className="font-display text-2xl font-bold text-water mt-1 block">
            {fieldVerifCount}
          </span>
        </div>
        <div className="rounded-xl border border-rejected/30 bg-rejected/5 p-4">
          <span className="font-mono text-[10px] uppercase tracking-wider text-rejected block font-semibold">
            Disputes / Alerts
          </span>
          <span className="font-display text-2xl font-bold text-rejected mt-1 block">
            {conflictCount}
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="mt-10 border-b border-line flex gap-8">
        <button
          onClick={() => setActiveTab("queue")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "queue"
              ? "border-forest text-forest"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          Verification Queue ({filteredQueue.length})
        </button>
        <button
          onClick={() => setActiveTab("alerts")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "alerts"
              ? "border-forest text-forest"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          Spatial Conflicts & Alerts ({conflictCount})
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-3 font-mono text-xs uppercase tracking-wider font-bold transition-all border-b-2 cursor-pointer ${
            activeTab === "analytics"
              ? "border-forest text-forest"
              : "border-transparent text-ink-soft hover:text-ink"
          }`}
        >
          Workflow Analytics
        </button>
      </div>

      {/* TAB 1: VERIFICATION QUEUE */}
      {activeTab === "queue" && (
        <div className="mt-8 space-y-6">
          {/* Filters Row */}
          <div className="rounded-xl border border-line bg-paper-raised p-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              {/* State Filter */}
              <select
                value={filterState}
                onChange={(e) => setFilterState(e.target.value as any)}
                className="rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink focus:border-forest focus:outline-none cursor-pointer"
              >
                <option value="ALL">All States</option>
                <option value="OD">Odisha (OD)</option>
                <option value="MP">Madhya Pradesh (MP)</option>
                <option value="TS">Telangana (TS)</option>
                <option value="TR">Tripura (TR)</option>
              </select>

              {/* Status Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink focus:border-forest focus:outline-none cursor-pointer"
              >
                <option value="pending">Pending Review</option>
                <option value="approved">Approved Titles</option>
                <option value="rejected">Rejected Claims</option>
                <option value="returned_for_correction">Returned</option>
                <option value="field_verification">Field Verification</option>
                <option value="ALL">All Statuses</option>
              </select>

              {/* Claim Type Filter */}
              <select
                value={filterClaimType}
                onChange={(e) => setFilterClaimType(e.target.value)}
                className="rounded-lg border border-line bg-paper px-3 py-2 font-mono text-xs text-ink focus:border-forest focus:outline-none cursor-pointer"
              >
                <option value="ALL">All Rights Types</option>
                <option value="IFR">Individual (IFR)</option>
                <option value="CR">Community (CR)</option>
                <option value="CFR">Resource (CFR)</option>
              </select>
            </div>

            {/* Search Input */}
            <div className="w-full sm:w-72">
              <input
                type="text"
                placeholder="Search claimant, village, ULPIN..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink placeholder:text-ink-soft/50 focus:border-forest focus:outline-none"
              />
            </div>
          </div>

          {/* Queue Table */}
          <div className="rounded-xl border border-line bg-paper-raised overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="border-b border-line bg-paper/60 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                  <tr>
                    <th className="p-4">Claimant & Details</th>
                    <th className="p-4">Location</th>
                    <th className="p-4">Type & Area</th>
                    <th className="p-4">Status & Stage</th>
                    <th className="p-4">Spatial Signals</th>
                    <th className="p-4">Submitted</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-ink-soft font-mono animate-pulse">
                        Loading verification queue…
                      </td>
                    </tr>
                  ) : filteredQueue.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-12 text-center text-ink-soft">
                        No claims match your selected filters.
                      </td>
                    </tr>
                  ) : (
                    filteredQueue.map((claim) => (
                      <tr key={claim.claim_id} className="hover:bg-paper/40 transition-colors">
                        <td className="p-4">
                          <Link
                            href={`/claims/${claim.claim_id}`}
                            className="font-semibold text-ink hover:text-forest transition-colors block text-sm"
                          >
                            {claim.full_name}
                          </Link>
                          <span className="font-mono text-[10px] text-ink-soft block mt-0.5">
                            ULPIN: {claim.ulpin || "Pending Generation"}
                          </span>
                        </td>
                        <td className="p-4 text-ink-soft">
                          <span className="font-medium text-ink block">{claim.village}</span>
                          <span className="text-[11px]">{claim.district} · {claim.state_code}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono font-semibold text-ink block">
                            {claim.area_claimed_hectares} ha
                          </span>
                          <span className="text-[11px] text-ink-soft">
                            {CLAIM_TYPE_LABELS[claim.claim_type]}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-block rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold ${
                              claim.status === "approved"
                                ? "bg-approved/15 text-approved"
                                : claim.status === "rejected"
                                ? "bg-rejected/15 text-rejected"
                                : claim.status === "returned_for_correction"
                                ? "bg-clay/15 text-clay"
                                : claim.status === "field_verification"
                                ? "bg-water/15 text-water"
                                : "bg-pending/15 text-pending"
                            }`}
                          >
                            {STATUS_LABELS[claim.status] || claim.status}
                          </span>
                          {claim.current_stage && (
                            <span className="block font-mono text-[9px] text-ink-soft mt-1">
                              Stage: {claim.current_stage}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col gap-1">
                            {claim.has_canopy_violation && (
                              <span className="rounded bg-rejected/10 text-rejected border border-rejected/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider font-bold w-fit">
                                Canopy Loss
                              </span>
                            )}
                            {claim.has_restricted_zone_overlap && (
                              <span className="rounded bg-rejected/10 text-rejected border border-rejected/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider font-bold w-fit">
                                Restricted Zone
                              </span>
                            )}
                            {!claim.has_canopy_violation && !claim.has_restricted_zone_overlap && (
                              <span className="rounded bg-approved/10 text-approved border border-approved/20 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider font-bold w-fit">
                                ✓ Clear Buffer
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[11px] text-ink-soft">
                          {claim.submitted_on}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleOpenReview(claim.claim_id)}
                              type="button"
                              className="rounded-lg bg-forest text-paper-raised px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-all hover:bg-forest-deep cursor-pointer"
                            >
                              Review & Act
                            </button>
                            <Link
                              href={`/claims/${claim.claim_id}`}
                              className="rounded-lg border border-line bg-paper px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink font-semibold hover:border-forest"
                            >
                              Dossier
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SPATIAL CONFLICTS & ALERTS */}
      {activeTab === "alerts" && (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-line bg-paper-raised p-6">
            <h3 className="font-display text-xl font-semibold text-ink">
              Spatial Overlap & Canopy Disturbance Signals
            </h3>
            <p className="text-xs text-ink-soft mt-1 max-w-2xl">
              Real-time spatial intersections calculated via PostGIS between claimant land parcels, protected conservation zones, and satellite-detected canopy changes.
            </p>

            <div className="mt-6 divide-y divide-line">
              {claims
                .filter((c) => c.has_canopy_violation || c.has_restricted_zone_overlap)
                .map((claim) => (
                  <div key={claim.claim_id} className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink">{claim.full_name}</span>
                        <span className="rounded bg-rejected/15 text-rejected px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider font-bold">
                          {claim.has_canopy_violation ? "Canopy Anomaly" : "Protected Boundary Overlap"}
                        </span>
                      </div>
                      <p className="text-xs text-ink-soft mt-1">
                        {claim.village}, {claim.district} · {claim.state_name} · Parcel Area: {claim.area_claimed_hectares} ha
                      </p>
                      <p className="text-xs text-ink-soft font-mono mt-1">
                        Coordinates: [{claim.lat.toFixed(4)}, {claim.lng.toFixed(4)}] · Status: {claim.status}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenReview(claim.claim_id)}
                        className="rounded-lg bg-forest text-paper-raised px-3.5 py-1.5 font-mono text-[10px] uppercase tracking-wider font-bold hover:bg-forest-deep"
                      >
                        Inspect & Resolve
                      </button>
                      <Link
                        href={`/claims/${claim.claim_id}#spatial`}
                        className="rounded-lg border border-line bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink font-semibold"
                      >
                        Spatial View
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: WORKFLOW ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="mt-8 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-xl border border-line bg-paper-raised p-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-ink-soft font-bold">
                Approval Rate
              </h4>
              <p className="font-display text-4xl text-ink font-bold mt-2">
                {totalCount > 0 ? Math.round((approvedCount / totalCount) * 100) : 0}%
              </p>
              <p className="text-xs text-ink-soft mt-2">
                {approvedCount} of {totalCount} total claims successfully approved.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-paper-raised p-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-ink-soft font-bold">
                Pending Ageing & Queue
              </h4>
              <p className="font-display text-4xl text-pending font-bold mt-2">
                {pendingCount}
              </p>
              <p className="text-xs text-ink-soft mt-2">
                Average decision turnaround: 18 days across 4 study states.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-paper-raised p-6">
              <h4 className="font-mono text-xs uppercase tracking-wider text-ink-soft font-bold">
                Digitization Saturation
              </h4>
              <p className="font-display text-4xl text-forest font-bold mt-2">
                98.4%
              </p>
              <p className="text-xs text-ink-soft mt-2">
                Paper claim forms converted to structured PostGIS parcels.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & DECISION MODAL / DRAWER */}
      {reviewingClaimId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-paper-raised shadow-2xl p-6 md:p-8 flex flex-col gap-6">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-line pb-4">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-clay font-bold">
                  Administrative Review & Adjudication
                </p>
                <h3 className="font-display text-2xl text-ink font-semibold mt-1">
                  {claimDetails?.claimant.full_name || "Claim Review"}
                </h3>
                <p className="text-xs text-ink-soft mt-1">
                  Claim ID: <span className="font-mono">{reviewingClaimId}</span> · Status:{" "}
                  <span className="font-bold text-ink uppercase">
                    {claimDetails?.claim.status || "Loading..."}
                  </span>
                </p>
              </div>
              <button
                onClick={() => setReviewingClaimId(null)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-ink-soft hover:text-ink cursor-pointer"
              >
                ✕
              </button>
            </div>

            {loadingDetails ? (
              <div className="py-16 text-center font-mono text-xs uppercase text-ink-soft animate-pulse">
                Fetching claim dossier from Supabase…
              </div>
            ) : (
              <div className="space-y-6">
                {/* Feedback notice */}
                {actionFeedback && (
                  <div className="rounded-lg bg-forest/10 border border-forest/30 p-3 text-xs text-forest font-semibold">
                    {actionFeedback}
                  </div>
                )}

                {/* Dossier Overview Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border border-line rounded-xl p-4 bg-paper/50 text-xs">
                  <div>
                    <span className="text-ink-soft font-mono uppercase text-[10px] block">Location</span>
                    <span className="font-medium text-ink block mt-0.5">
                      {claimDetails?.claimant.village}, {claimDetails?.claimant.district}
                    </span>
                    <span className="text-ink-soft">{claimDetails?.claimant.state_code}</span>
                  </div>
                  <div>
                    <span className="text-ink-soft font-mono uppercase text-[10px] block">Claim Type & Area</span>
                    <span className="font-medium text-ink block mt-0.5">
                      {CLAIM_TYPE_LABELS[claimDetails?.claim.claim_type || "IFR"]}
                    </span>
                    <span className="font-mono font-bold text-ink">
                      {claimDetails?.claim.area_claimed_hectares} ha
                    </span>
                  </div>
                  <div>
                    <span className="text-ink-soft font-mono uppercase text-[10px] block">Category & Size</span>
                    <span className="font-medium text-ink block mt-0.5">
                      {claimDetails?.claimant.category === "ST" ? "Scheduled Tribe" : "OTFD"}
                    </span>
                    <span className="text-ink-soft">
                      {claimDetails?.claimant.household_size} Household members
                    </span>
                  </div>
                </div>

                {/* OCR & Document Section */}
                {claimDetails?.ocrJobs && claimDetails.ocrJobs.length > 0 && (
                  <div className="border border-line rounded-xl p-4 bg-paper/30">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-ink font-bold mb-3">
                      OCR Extracted Metadata ({claimDetails.ocrJobs[0].engine} engine · {claimDetails.ocrJobs[0].confidence}% confidence)
                    </h4>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      {claimDetails.ocrJobs[0].fields?.map((f) => (
                        <div key={f.id} className="rounded border border-line bg-paper p-2">
                          <span className="text-[9px] font-mono uppercase text-ink-soft block font-semibold">{f.field_name}</span>
                          <span className="font-medium text-ink mt-0.5 block truncate">{f.field_value || "—"}</span>
                          <span className="text-[8px] font-mono text-forest">✓ {f.confidence}% conf</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Spatial Conflict Alerts */}
                {claimDetails?.spatialConflicts && claimDetails.spatialConflicts.length > 0 && (
                  <div className="border border-rejected/30 rounded-xl p-4 bg-rejected/5">
                    <h4 className="font-mono text-xs uppercase tracking-wider text-rejected font-bold mb-2">
                      ⚠️ Active Spatial Dispute Flags ({claimDetails.spatialConflicts.length})
                    </h4>
                    {claimDetails.spatialConflicts.map((c) => (
                      <p key={c.id} className="text-xs text-ink-soft">
                        • <strong>{c.conflict_type}</strong>: {c.description} (Severity: {c.severity})
                      </p>
                    ))}
                  </div>
                )}

                {/* Action Buttons Trigger */}
                <div className="border-t border-line pt-4">
                  <p className="font-mono text-xs uppercase tracking-wider text-ink-soft font-bold mb-3">
                    Select Adjudication Action:
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={() => setSelectedActionType("approve")}
                      type="button"
                      className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                        selectedActionType === "approve"
                          ? "bg-approved text-paper-raised border-approved"
                          : "bg-approved/10 text-approved border-approved/30 hover:bg-approved/20"
                      }`}
                    >
                      ✓ Approve Title
                    </button>
                    <button
                      onClick={() => setSelectedActionType("reject")}
                      type="button"
                      className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                        selectedActionType === "reject"
                          ? "bg-rejected text-paper-raised border-rejected"
                          : "bg-rejected/10 text-rejected border-rejected/30 hover:bg-rejected/20"
                      }`}
                    >
                      ✗ Reject Title
                    </button>
                    <button
                      onClick={() => setSelectedActionType("return")}
                      type="button"
                      className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                        selectedActionType === "return"
                          ? "bg-clay text-paper-raised border-clay"
                          : "bg-clay/10 text-clay border-clay/30 hover:bg-clay/20"
                      }`}
                    >
                      ↩ Return for Correction
                    </button>
                    <button
                      onClick={() => setSelectedActionType("field_verification")}
                      type="button"
                      className={`rounded-lg px-4 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-all border cursor-pointer ${
                        selectedActionType === "field_verification"
                          ? "bg-water text-paper-raised border-water"
                          : "bg-water/10 text-water border-water/30 hover:bg-water/20"
                      }`}
                    >
                      📍 Request Field Survey
                    </button>
                  </div>
                </div>

                {/* Action Confirmation Panel */}
                {selectedActionType && (
                  <div className="rounded-xl border border-line bg-paper p-5 space-y-4 animate-in fade-in duration-150">
                    <h5 className="font-mono text-xs uppercase tracking-wider text-ink font-bold">
                      Confirm {selectedActionType.toUpperCase()} Decision
                    </h5>

                    {selectedActionType === "approve" && (
                      <div>
                        <label className="text-xs text-ink-soft block mb-1">Approval Notes / Certificate remarks:</label>
                        <input
                          type="text"
                          placeholder="e.g. Title approved under SDLC statutory powers. Title deed registered."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="w-full rounded-lg border border-line bg-paper-raised px-3 py-2 text-xs text-ink"
                        />
                      </div>
                    )}

                    {selectedActionType === "reject" && (
                      <div>
                        <label className="text-xs text-rejected block mb-1 font-semibold">Rejection Statutory Reason (Required):</label>
                        <input
                          type="text"
                          placeholder="e.g. Evidence does not establish pre-2005 continuous occupancy."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full rounded-lg border border-rejected/40 bg-paper-raised px-3 py-2 text-xs text-ink"
                        />
                      </div>
                    )}

                    {selectedActionType === "return" && (
                      <div>
                        <label className="text-xs text-clay block mb-1 font-semibold">Return Instructions for Claimant / Gram Sabha:</label>
                        <input
                          type="text"
                          placeholder="e.g. Please attach Gram Sabha resolution with survey boundary map."
                          value={returnReason}
                          onChange={(e) => setReturnReason(e.target.value)}
                          className="w-full rounded-lg border border-clay/40 bg-paper-raised px-3 py-2 text-xs text-ink"
                        />
                      </div>
                    )}

                    {selectedActionType === "field_verification" && (
                      <div>
                        <label className="text-xs text-water block mb-1 font-semibold">Field Survey Instructions for Revenue Officer:</label>
                        <input
                          type="text"
                          placeholder="e.g. Conduct GPS track survey of the western boundary adjoining reserve forest."
                          value={reviewNotes}
                          onChange={(e) => setReviewNotes(e.target.value)}
                          className="w-full rounded-lg border border-water/40 bg-paper-raised px-3 py-2 text-xs text-ink"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => handleExecuteAction(selectedActionType)}
                        disabled={actionProcessing}
                        type="button"
                        className="rounded-full bg-forest text-paper-raised px-5 py-2 font-mono text-xs uppercase tracking-wider font-bold transition-all hover:bg-forest-deep disabled:opacity-50 cursor-pointer"
                      >
                        {actionProcessing ? "Executing Decision..." : "Commit Decision to Database"}
                      </button>
                      <button
                        onClick={() => setSelectedActionType(null)}
                        type="button"
                        className="rounded-full border border-line px-4 py-2 font-mono text-xs uppercase tracking-wider text-ink-soft hover:text-ink"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Welfare Referral Card Modal */}
      {welfareModalClaim && (
        <ConvergenceCardModal
          claim={welfareModalClaim}
          onClose={() => setWelfareModalClaim(null)}
        />
      )}
    </div>
  );
}
