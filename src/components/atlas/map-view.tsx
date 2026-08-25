"use client";

import { useEffect, useMemo } from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap, LayersControl, GeoJSON } from "react-leaflet";
import type { ClaimMapRow } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";
import { AssetDetectionLayer } from "@/components/atlas/asset-detection-layer";
import assetData from "@/data/asset-detection-demo.json";
import { useRole } from "@/lib/role-store";

import adminBoundariesData from "@/data/admin-boundaries-demo.json";
import canopyLossFallback from "@/data/canopy-loss-demo.json";

// Rough center of the four-state study area (central-eastern India)
const DEFAULT_CENTER: [number, number] = [21.0, 84.0];
const DEFAULT_ZOOM = 5;

// Bounds of the demo land-use grid (see scripts/generate-asset-layer.js),
// used to fly the map there when the layer is toggled on.
const ASSET_LAYER_BOUNDS: [[number, number], [number, number]] = (() => {
  const bbox = (assetData as { properties: { bbox: { latMin: number; latMax: number; lonMin: number; lonMax: number } } })
    .properties.bbox;
  return [
    [bbox.latMin, bbox.lonMin],
    [bbox.latMax, bbox.lonMax],
  ];
})();

function FlyToAssetLayer({ active }: { active: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (active) {
      map.flyToBounds(ASSET_LAYER_BOUNDS, { padding: [40, 40], duration: 1.2 });
    }
  }, [active, map]);
  return null;
}

function styleCanopyLoss(feature: any) {
  const era = feature?.properties?.era;
  return {
    fillColor: era === "post-2005" ? "var(--color-rejected)" : "var(--color-pending)",
    fillOpacity: 0.45,
    color: era === "post-2005" ? "var(--color-rejected)" : "var(--color-pending)",
    weight: 1.5,
  };
}

function styleRestrictedZone() {
  return {
    fillColor: "#7a2a1e",
    fillOpacity: 0.35,
    color: "#7a2a1e",
    weight: 2,
    dashArray: "3, 6",
  };
}

function onEachCanopyLoss(feature: any, layer: any) {
  const name = feature.properties?.name || "Canopy Loss Zone";
  const year = feature.properties?.year ? ` (Year: ${feature.properties.year})` : "";
  const era = feature.properties?.era || "";
  layer.bindTooltip(`🌳 ${name}${year} - Era: ${era}`, { sticky: true });
}

function onEachRestrictedZone(feature: any, layer: any) {
  const name = feature.properties?.name || "Restricted Wildlife Zone";
  layer.bindTooltip(`⚠️ Restricted: ${name}`, { sticky: true });
}

export function MapView({
  claims,
  selectedClaimId,
  onSelect,
  showAssetLayer,
  disputeZones = [],
}: {
  claims: ClaimMapRow[];
  selectedClaimId: string | null;
  onSelect: (claimId: string) => void;
  showAssetLayer: boolean;
  disputeZones?: any[];
}) {
  const { role } = useRole();
  const selectedClaim = useMemo(
    () => claims.find((c) => c.claim_id === selectedClaimId),
    [claims, selectedClaimId]
  );

  // Convert database dispute zones to GeoJSON or use fallbacks
  const canopyLossGeoJSON = useMemo(() => {
    const dbZones = disputeZones.filter((z) => z.zone_type === "canopy_loss");
    if (dbZones.length > 0) {
      return {
        type: "FeatureCollection",
        features: dbZones.map((z) => ({
          type: "Feature",
          id: z.id,
          properties: { name: z.name, era: z.name.toLowerCase().includes("post") ? "post-2005" : "pre-2005" },
          geometry: typeof z.geojson === "string" ? JSON.parse(z.geojson) : z.geojson,
        })),
      };
    }
    return canopyLossFallback;
  }, [disputeZones]);

  const restrictedZonesGeoJSON = useMemo(() => {
    const dbZones = disputeZones.filter((z) => z.zone_type === "restricted_zone");
    if (dbZones.length > 0) {
      return {
        type: "FeatureCollection",
        features: dbZones.map((z) => ({
          type: "Feature",
          id: z.id,
          properties: { name: z.name },
          geometry: typeof z.geojson === "string" ? JSON.parse(z.geojson) : z.geojson,
        })),
      };
    }
    // Hardcoded realistic fallback zones for Tiger Reserves
    return {
      type: "FeatureCollection",
      features: [
        {
          type: "Feature",
          properties: { name: "Kanha Tiger Reserve Buffer Zone (Restricted)" },
          geometry: {
            type: "Polygon",
            coordinates: [[[80.5, 22.0], [80.7, 22.0], [80.7, 22.2], [80.5, 22.2], [80.5, 22.0]]],
          },
        },
        {
          type: "Feature",
          properties: { name: "Similipal National Park Buffer Zone (Restricted)" },
          geometry: {
            type: "Polygon",
            coordinates: [[[86.2, 21.8], [86.45, 21.8], [86.45, 22.05], [86.2, 22.05], [86.2, 21.8]]],
          },
        },
      ],
    };
  }, [disputeZones]);

  return (
    <MapContainer
      center={DEFAULT_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom
      className="h-full w-full"
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer checked name="Street Map (OpenStreetMap)">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
        </LayersControl.BaseLayer>

        <LayersControl.Overlay checked name="Baseline / Admin Boundaries">
          <GeoJSON
            data={adminBoundariesData as any}
            style={{
              color: "var(--color-ink-soft)",
              weight: 1.5,
              dashArray: "5, 5",
              fillColor: "transparent",
              fillOpacity: 0,
            }}
            onEachFeature={(feature: any, layer: any) => {
              if (feature.properties?.name) {
                layer.bindTooltip(feature.properties.name, { sticky: true });
              }
            }}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Canopy Loss (pre/post 2005)">
          <GeoJSON
            data={canopyLossGeoJSON as any}
            style={styleCanopyLoss}
            onEachFeature={onEachCanopyLoss}
          />
        </LayersControl.Overlay>

        <LayersControl.Overlay name="Restricted Protected Zones">
          <GeoJSON
            data={restrictedZonesGeoJSON as any}
            style={styleRestrictedZone}
            onEachFeature={onEachRestrictedZone}
          />
        </LayersControl.Overlay>
      </LayersControl>

      {showAssetLayer && <AssetDetectionLayer />}
      <FlyToAssetLayer active={showAssetLayer} />

      {/* Render the full polygon footprint of the selected claim */}
      {selectedClaim && selectedClaim.geom_geojson && (
        <GeoJSON
          key={selectedClaim.claim_id + "_poly"}
          data={selectedClaim.geom_geojson}
          style={{
            fillColor: STATUS_COLORS[selectedClaim.status],
            fillOpacity: 0.3,
            color: STATUS_COLORS[selectedClaim.status],
            weight: 2.5,
          }}
        />
      )}

      {claims.map((claim) => {
        const isSelected = claim.claim_id === selectedClaimId;
        const hasDispute = !!(claim.has_canopy_violation || claim.has_restricted_zone_overlap);
        const isPendingAndVerifier = claim.status === "pending" && role === "verifier";

        return (
          <CircleMarker
            key={claim.claim_id}
            center={[claim.lat, claim.lng]}
            radius={isSelected ? 9 : (isPendingAndVerifier ? 9 : 6)}
            pathOptions={{
              color: isSelected ? "#1b2420" : (isPendingAndVerifier ? "#d97706" : STATUS_COLORS[claim.status]),
              weight: isSelected ? 2 : (isPendingAndVerifier ? 3 : 1),
              fillColor: STATUS_COLORS[claim.status],
              fillOpacity: 0.85,
            }}
            eventHandlers={{
              click: () => onSelect(claim.claim_id),
            }}
          >
            <Tooltip direction="top" offset={[0, -6]} opacity={1}>
              <div className="font-sans text-xs flex flex-col gap-0.5 bg-paper p-1 rounded border border-line shadow-sm">
                <span className="font-bold text-ink">
                  {isPendingAndVerifier ? "⚠️ [REVIEW QUEUE] " : ""}{claim.village}, {claim.district} — {claim.status}
                </span>
                {hasDispute && (
                  <span className="text-rejected font-semibold flex items-center gap-1 text-[10px]">
                    ⚠️ Spatial Dispute Detected
                  </span>
                )}
              </div>
            </Tooltip>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
