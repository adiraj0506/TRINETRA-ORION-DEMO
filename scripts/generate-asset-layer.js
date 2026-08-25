// Generates a synthetic land-use classification grid for the Atlas's
// "asset detection" demo layer — a stand-in for what a real satellite
// classification pipeline (Sentinel-2 + a CV model) would output.
// This is explicitly a demo/illustrative layer, labeled as such in the UI.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(77);

// Small bounding box near Betul, Madhya Pradesh — inside the real claim
// cluster seeded on Day 2, so this overlay feels geographically grounded.
const BBOX = { latMin: 21.85, latMax: 22.15, lonMin: 77.75, lonMax: 78.05 };
const GRID = 18; // 18x18 cells

const cellLat = (BBOX.latMax - BBOX.latMin) / GRID;
const cellLon = (BBOX.lonMax - BBOX.lonMin) / GRID;

// Homestead cluster centers (seeded, small settlements)
const settlements = Array.from({ length: 3 }, () => ({
  row: Math.floor(rand() * GRID),
  col: Math.floor(rand() * GRID),
}));

function classify(row, col) {
  // River: a winding band across the grid
  const riverCol = GRID / 2 + Math.sin(row * 0.5) * 3.5;
  if (Math.abs(col - riverCol) < 0.9) return "water";

  // Settlement clusters
  for (const s of settlements) {
    const dist = Math.hypot(row - s.row, col - s.col);
    if (dist < 1.4 && rand() < 0.85) return "homestead";
  }

  // Smooth terrain-like value for forest vs agriculture
  const base =
    Math.sin(col * 0.35) * Math.cos(row * 0.42) +
    Math.sin(col * 0.15 + row * 0.2) * 0.6 +
    (rand() - 0.5) * 0.35;

  return base > 0.15 ? "forest" : "agriculture";
}

const features = [];
for (let row = 0; row < GRID; row++) {
  for (let col = 0; col < GRID; col++) {
    const landClass = classify(row, col);
    const lat0 = BBOX.latMin + row * cellLat;
    const lon0 = BBOX.lonMin + col * cellLon;
    const lat1 = lat0 + cellLat;
    const lon1 = lon0 + cellLon;

    features.push({
      type: "Feature",
      properties: { class: landClass },
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [lon0, lat0],
            [lon1, lat0],
            [lon1, lat1],
            [lon0, lat1],
            [lon0, lat0],
          ],
        ],
      },
    });
  }
}

const featureCollection = {
  type: "FeatureCollection",
  properties: {
    label: "Illustrative land-use classification (demo)",
    bbox: BBOX,
  },
  features,
};

const path = require("path");
require("fs").writeFileSync(
  path.join(__dirname, "..", "src", "data", "asset-detection-demo.json"),
  JSON.stringify(featureCollection)
);

const counts = features.reduce((acc, f) => {
  acc[f.properties.class] = (acc[f.properties.class] || 0) + 1;
  return acc;
}, {});
console.log("Cells:", features.length, counts);
console.log("Bounds:", BBOX);
