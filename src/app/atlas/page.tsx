"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { fetchClaimsForMap, fetchDisputeZones } from "@/lib/queries";
import type { ClaimMapRow, ClaimStatus, StateCode } from "@/lib/types";
import { AtlasFilters } from "@/components/atlas/atlas-filters";
import { ClaimDetailPanel } from "@/components/atlas/claim-detail-panel";
import { AssetLayerToggle } from "@/components/atlas/asset-layer-toggle";
import { useRole } from "@/lib/role-store";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";

// Leaflet touches `window`, so it can only render on the client.
const MapView = dynamic(
  () => import("@/components/atlas/map-view").then((m) => m.MapView),
  { ssr: false }
);

export default function AtlasPage() {
  const { role, isCommunity, isVerifier, isAdmin } = useRole();
  const [claims, setClaims] = useState<ClaimMapRow[]>([]);
  const [disputeZones, setDisputeZones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedState, setSelectedState] = useState<StateCode | "ALL">(
    "ALL"
  );
  const [activeStatuses, setActiveStatuses] = useState<Set<ClaimStatus>>(
    new Set(["approved", "pending", "rejected"])
  );
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(
    null
  );
  const [showAssetLayer, setShowAssetLayer] = useState(false);

  useEffect(() => {
    fetchClaimsForMap()
      .then(setClaims)
      .catch((err) => {
        console.error(err);
        setError(
          "Couldn't load claims. Make sure schema.sql, seed.sql, and day3_atlas_view.sql have all been run in Supabase, and your .env.local keys are set."
        );
      })
      .finally(() => setLoading(false));

    fetchDisputeZones()
      .then(setDisputeZones)
      .catch((err) => console.warn("Failed to load dispute zones:", err));
  }, []);

  // Filter claims based on the active role
  const roleFilteredClaims = useMemo(() => {
    if (isCommunity) {
      // Stakeholder sees only their own claims (Kunti Kondh / claimant_id: 6051fe98-5dd3-4c7c-b14a-cb140a28f7eb)
      return claims.filter((c) => c.full_name === "Kunti Kondh");
    }
    return claims; // Verifier and Admin see all claims
  }, [claims, isCommunity]);

  const filtered = useMemo(() => {
    return roleFilteredClaims.filter((c) => {
      // Stakeholder doesn't need active filters
      if (isCommunity) return true;
      if (selectedState !== "ALL" && c.state_code !== selectedState)
        return false;
      if (!activeStatuses.has(c.status)) return false;
      return true;
    });
  }, [roleFilteredClaims, selectedState, activeStatuses, isCommunity]);

  const selectedClaim = useMemo(
    () => filtered.find((c) => c.claim_id === selectedClaimId) ?? null,
    [filtered, selectedClaimId]
  );

  const toggleStatus = (status: ClaimStatus) => {
    setActiveStatuses((prev) => {
      const next = new Set(prev);
      if (next.has(status)) next.delete(status);
      else next.add(status);
      return next;
    });
  };

  const handleUpdateStatus = (claimId: string, newStatus: ClaimMapRow["status"]) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.claim_id === claimId
          ? {
              ...c,
              status: newStatus,
              rejection_reason: newStatus === "rejected" ? "Occupancy evidence does not match satellite pre-2005 imagery boundary." : null,
              decided_on: newStatus !== "pending" ? new Date().toISOString().slice(0, 10) : null
            }
          : c
      )
    );
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <PageHeader
        eyebrow="Spatial WebGIS Engine"
        title="FRA Atlas"
        description="Spatial intelligence for FRA claims, verification and monitoring across Madhya Pradesh, Odisha, Telangana, and Tripura."
        badge={
          <div className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-3 py-1 font-mono text-[10px] text-ink-soft">
            <span>Mode:</span>
            <span className="font-bold uppercase text-clay">{role}</span>
          </div>
        }
      />

      {error && (
        <div className="mb-4 rounded-lg border border-rejected/30 bg-rejected/5 p-4 text-sm text-rejected">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-xl border border-line lg:grid-cols-[280px_1fr_320px]">
        <div className="border-b border-line lg:border-b-0 lg:border-r">
          {isCommunity ? (
            <div className="border-b border-line p-6">
              <p className="font-mono text-xs uppercase tracking-wider text-clay">
                FRA Atlas
              </p>
              <h1 className="mt-2 font-display text-2xl text-ink">My Claims</h1>
              <p className="mt-4 text-xs text-ink-soft leading-relaxed">
                Viewing claims registered under your claimant profile: <strong>Kunti Kondh</strong>.
              </p>
              <p className="mt-4 font-mono text-[10px] text-ink-soft">
                Showing {filtered.length} of {filtered.length} claim
              </p>
            </div>
          ) : (
            <AtlasFilters
              selectedState={selectedState}
              onStateChange={setSelectedState}
              activeStatuses={activeStatuses}
              onToggleStatus={toggleStatus}
              total={roleFilteredClaims.length}
              visibleCount={filtered.length}
            />
          )}
          {/* Hide/Disable asset layer toggle for non-admin roles as requested */}
          {isAdmin && (
            <div className="border-t border-line">
              <AssetLayerToggle
                active={showAssetLayer}
                onToggle={() => setShowAssetLayer((s) => !s)}
              />
            </div>
          )}
        </div>

        <div className="relative h-[70vh] min-h-[420px]">
          {loading ? (
            <div className="flex h-full items-center justify-center bg-paper-raised">
              <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
                Loading claims…
              </p>
            </div>
          ) : (
            <MapView
              claims={filtered}
              selectedClaimId={selectedClaimId}
              onSelect={setSelectedClaimId}
              showAssetLayer={isAdmin ? showAssetLayer : false}
              disputeZones={isAdmin ? disputeZones : []} // Show dispute layers for admin only
            />
          )}
        </div>

        <div className="hidden border-t border-line lg:block lg:border-t-0 lg:border-l">
          <ClaimDetailPanel
            claim={selectedClaim}
            onClose={() => setSelectedClaimId(null)}
            onUpdateStatus={handleUpdateStatus}
          />
        </div>
      </div>

      {/* Mobile Drawer (visible on <lg screens) */}
      {selectedClaim && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 backdrop-blur-xs lg:hidden animate-in fade-in duration-200">
          <div className="absolute inset-0" onClick={() => setSelectedClaimId(null)} />
          <div className="relative w-full max-h-[80vh] rounded-t-2xl bg-paper-raised shadow-2xl border-t border-line animate-in slide-in-from-bottom duration-300 flex flex-col">
            <div className="mx-auto my-3 h-1 w-12 rounded-full bg-line flex-shrink-0" />
            <div className="overflow-y-auto flex-1 pb-8">
              <ClaimDetailPanel
                claim={selectedClaim}
                onClose={() => setSelectedClaimId(null)}
                onUpdateStatus={handleUpdateStatus}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
