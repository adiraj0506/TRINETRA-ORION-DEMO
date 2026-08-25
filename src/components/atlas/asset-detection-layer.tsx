"use client";

import { GeoJSON } from "react-leaflet";
import type { Layer } from "leaflet";
import assetData from "@/data/asset-detection-demo.json";

import { LAND_USE_COLORS, LAND_USE_LABELS } from "@/components/atlas/asset-layer-toggle";

function styleFeature(feature: GeoJSON.Feature | undefined) {
  const cls = (feature?.properties as { class?: string } | undefined)?.class;
  return {
    fillColor: cls ? LAND_USE_COLORS[cls] : "var(--color-line)",
    fillOpacity: 0.55,
    color: "var(--color-paper)",
    weight: 0.5,
  };
}

function onEachFeature(feature: GeoJSON.Feature, layer: Layer) {
  const cls = (feature.properties as { class?: string } | undefined)?.class;
  if (cls) {
    layer.bindTooltip(LAND_USE_LABELS[cls] ?? cls, { sticky: true });
  }
}

export function AssetDetectionLayer() {
  return (
    <GeoJSON
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data={assetData as any}
      style={styleFeature}
      onEachFeature={onEachFeature}
    />
  );
}
