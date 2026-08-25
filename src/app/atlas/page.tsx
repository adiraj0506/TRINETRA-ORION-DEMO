"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { fetchClaimsForMap, fetchDisputeZones } from "@/lib/queries";
import type { ClaimMapRow, ClaimStatus, StateCode } from "@/lib/types";
import { AtlasFilters } from "@/components/atlas/atlas-filters";
import { ClaimDetailPanel } from "@/components/atlas/claim-detail-panel";
import { AssetLayerToggle } from "@/components/atlas/asset-layer-toggle";

// Leaflet touches `window`, so it can only render on the client.
const MapView = dynamic(
  () => import("@/components/atlas/map-view").then((m) => m.MapView),
  { ssr: false }
);

export default function AtlasPage() {
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

  const filtered = useMemo(() => {
    return claims.filter((c) => {
      if (selectedState !== "ALL" && c.state_code !== selectedState)
        return false;
      if (!activeStatuses.has(c.status)) return false;
      return true;
    });
  }, [claims, selectedState, activeStatuses]);

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
      {error && (
        <div className="mb-4 rounded-lg border border-rejected/30 bg-rejected/5 p-4 text-sm text-rejected">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-0 overflow-hidden rounded-xl border border-line lg:grid-cols-[280px_1fr_320px]">
        <div className="border-b border-line lg:border-b-0 lg:border-r">
          <AtlasFilters
            selectedState={selectedState}
            onStateChange={setSelectedState}
            activeStatuses={activeStatuses}
            onToggleStatus={toggleStatus}
            total={claims.length}
            visibleCount={filtered.length}
          />
          <div className="border-t border-line">
            <AssetLayerToggle
              active={showAssetLayer}
              onToggle={() => setShowAssetLayer((s) => !s)}
            />
          </div>
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
              showAssetLayer={showAssetLayer}
              disputeZones={disputeZones}
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
