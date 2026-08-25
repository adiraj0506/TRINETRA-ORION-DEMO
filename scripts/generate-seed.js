// Deterministic synthetic FRA claim dataset generator.
// Produces supabase/seed.sql — proportions tuned so state-wise approval
// rates and national average match the published paper's figures.

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = mulberry32(20250608);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const weightedPick = (weights) => {
  const r = rand();
  let acc = 0;
  for (const [key, w] of Object.entries(weights)) {
    acc += w;
    if (r <= acc) return key;
  }
  return Object.keys(weights)[0];
};
const randInt = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const randFloat = (min, max, decimals = 2) =>
  Number((rand() * (max - min) + min).toFixed(decimals));
const randDate = (startYear, endYear) => {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  const d = new Date(start + rand() * (end - start));
  return d.toISOString().slice(0, 10);
};
const addDays = (dateStr, days) => {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + Math.floor(days));
  return d.toISOString().slice(0, 10);
};
const esc = (s) => s.replace(/'/g, "''");

const FIRST_NAMES = [
  "Ramesh","Sita","Mangal","Kamla","Budhram","Sukhdei","Somnath","Phoolmati",
  "Dilip","Rukmani","Chaitu","Lakshmi","Birsa","Sarita","Dasru","Manjari",
  "Ganpat","Kunti","Hari","Radhika","Sukhram","Anita","Bhola","Sunita",
  "Mangru","Draupadi","Ratan","Kamla Bai","Sona","Parvati","Tulsi","Meena",
];
const LAST_NAMES = [
  "Munda","Oraon","Bhil","Gond","Kondh","Baiga","Halba","Korku",
  "Bhumij","Santhal","Tripura","Reang","Jamatia","Marma","Halam","Debbarma",
];

const STATES = {
  MP: {
    name: "Madhya Pradesh",
    forest_cover_pct: 25.0,
    tribal_population_pct: 21.1,
    districts: ["Betul", "Mandla", "Dindori", "Balaghat", "Chhindwara"],
    bbox: { latMin: 21.5, latMax: 23.8, lonMin: 78.5, lonMax: 81.5 },
    claims: 150,
    statusWeights: { approved: 0.60, pending: 0.15, rejected: 0.25 },
    digitizedRate: 0.47,
  },
  OD: {
    name: "Odisha",
    forest_cover_pct: 32.9,
    tribal_population_pct: 22.8,
    districts: ["Kandhamal", "Koraput", "Mayurbhanj", "Rayagada", "Malkangiri"],
    bbox: { latMin: 19.2, latMax: 21.8, lonMin: 82.5, lonMax: 84.8 },
    claims: 130,
    statusWeights: { approved: 0.35, pending: 0.40, rejected: 0.25 },
    digitizedRate: 0.58,
  },
  TS: {
    name: "Telangana",
    forest_cover_pct: 24.0,
    tribal_population_pct: 9.3,
    districts: ["Adilabad", "Bhadradri Kothagudem", "Mulugu", "Nirmal"],
    bbox: { latMin: 17.8, latMax: 19.3, lonMin: 79.0, lonMax: 80.6 },
    claims: 90,
    statusWeights: { approved: 0.43, pending: 0.40, rejected: 0.17 },
    digitizedRate: 0.66,
  },
  TR: {
    name: "Tripura",
    forest_cover_pct: 60.0,
    tribal_population_pct: 31.0,
    districts: ["Dhalai", "Khowai", "Gomati", "North Tripura"],
    bbox: { latMin: 23.2, latMax: 24.3, lonMin: 91.3, lonMax: 92.1 },
    claims: 60,
    statusWeights: { approved: 0.65, pending: 0.15, rejected: 0.20 },
    digitizedRate: 0.74,
  },
};

const VILLAGE_PREFIXES = ["Ram","Shiv","Chandra","Bagh","Gopal","Kishan","Naya","Purana","Kot","Devi","Van","Ban"];
const VILLAGE_SUFFIXES = ["pur","gaon","talab","khera","nagar","tola","basti","gudem","palli"];
const randVillage = () => pick(VILLAGE_PREFIXES) + pick(VILLAGE_SUFFIXES);

const claimTypeWeights = { IFR: 0.68, CR: 0.20, CFR: 0.12 };

let claimantRows = [];
let claimRows = [];
let parcelRows = [];

for (const [code, s] of Object.entries(STATES)) {
  for (let i = 0; i < s.claims; i++) {
    const claimantId = crypto.randomUUID();
    const fullName = `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`;
    const village = randVillage();
    const district = pick(s.districts);
    const category = rand() < 0.82 ? "ST" : "OTFD";
    const householdSize = randInt(2, 7);

    claimantRows.push(
      `('${claimantId}', '${esc(fullName)}', '${esc(village)}', '${esc(district)}', '${code}', '${category}', ${householdSize})`
    );

    const status = weightedPick(s.statusWeights);
    const claimType = weightedPick(claimTypeWeights);
    const area =
      claimType === "IFR"
        ? randFloat(0.4, 4, 2)
        : claimType === "CR"
        ? randFloat(5, 40, 1)
        : randFloat(20, 150, 1);

    const submittedOn = randDate(2010, 2023);
    const decidedOn =
      status === "pending" ? null : addDays(submittedOn, randInt(120, 900));
    const rejectionReason =
      status === "rejected"
        ? pick([
            "Incomplete documentation",
            "Boundary dispute unresolved",
            "Insufficient evidence of occupation",
            "Overlapping claim",
            "Verification pending beyond deadline",
          ])
        : null;
    const digitized = rand() < s.digitizedRate;

    const claimId = crypto.randomUUID();
    claimRows.push(
      `('${claimId}', '${claimantId}', '${code}', '${claimType}', ${area}, '${status}', '${submittedOn}', ${
        decidedOn ? `'${decidedOn}'` : "null"
      }, ${rejectionReason ? `'${esc(rejectionReason)}'` : "null"}, ${digitized})`
    );

    // Generate ULPIN code deterministically
    const distPart = district.replace(/\s+/g, "").substring(0, 4).toUpperCase().padEnd(4, "X");
    const year = submittedOn.substring(0, 4);
    const hashInput = `${code}-${district}-${submittedOn}-${fullName}`;
    let hashCode = 0;
    for (let charIndex = 0; charIndex < hashInput.length; charIndex++) {
      hashCode = (hashCode << 5) - hashCode + hashInput.charCodeAt(charIndex);
      hashCode |= 0;
    }
    const seqVal = Math.abs(hashCode) % 10000;
    const seqStr = String(seqVal).padStart(4, "0");
    const ulpin = `${code}-${distPart}-${year}-${seqStr}`;

    // parcel: small square polygon around a random point in the state bbox
    const lat = randFloat(s.bbox.latMin, s.bbox.latMax, 5);
    const lon = randFloat(s.bbox.lonMin, s.bbox.lonMax, 5);
    const d = 0.004; // ~400m half-width
    const poly = `ST_GeomFromText('POLYGON((${lon - d} ${lat - d}, ${lon + d} ${lat - d}, ${lon + d} ${lat + d}, ${lon - d} ${lat + d}, ${lon - d} ${lat - d}))', 4326)`;
    const point = `ST_SetSRID(ST_MakePoint(${lon}, ${lat}), 4326)`;
    parcelRows.push(`('${crypto.randomUUID()}', '${claimId}', '${ulpin}', ${poly}, ${point})`);
  }
}

const statesSql = Object.entries(STATES)
  .map(
    ([code, s]) =>
      `('${code}', '${esc(s.name)}', ${s.forest_cover_pct}, ${s.tribal_population_pct})`
  )
  .join(",\n  ");

const schemesSql = [
  [
    "PM_KISAN",
    "PM-KISAN",
    "Income support of Rs 6,000/year for landholding farmer families.",
    { min_land_hectares: 0.01, requires_title: true },
  ],
  [
    "MGNREGA",
    "MGNREGA",
    "Guaranteed 100 days of wage employment per year to rural households.",
    { requires_title: false, category: ["ST", "OTFD"] },
  ],
  [
    "JJM",
    "Jal Jeevan Mission",
    "Functional household tap water connection for every rural household.",
    { requires_title: false },
  ],
  [
    "DAJGUA",
    "Dharti Aaba Janjatiya Gram Utkarsh Abhiyan",
    "Saturation of infrastructure and livelihood schemes in tribal-majority villages.",
    { requires_title: true, category: ["ST"] },
  ],
  [
    "PM_JANMAN",
    "PM-JANMAN",
    "Housing, clean water, sanitation, and livelihood support for Particularly Vulnerable Tribal Groups (PVTGs).",
    { requires_title: false, category: ["ST"] },
  ],
]
  .map(
    ([code, name, desc, elig]) =>
      `('${code}', '${esc(name)}', '${esc(desc)}', '${JSON.stringify(elig)}'::jsonb)`
  )
  .join(",\n  ");

const sql = `-- TRINETRA synthetic seed data
-- Generated deterministically — statistically matched to the published
-- paper's national (49.02% approval) and state-wise figures.
-- Run schema.sql FIRST, then this file, in the Supabase SQL Editor.

truncate table scheme_matches, land_parcels, claims, claimants, schemes, states cascade;

insert into states (code, name, forest_cover_pct, tribal_population_pct) values
  ${statesSql};

insert into schemes (code, name, description, eligibility_json) values
  ${schemesSql};

insert into claimants (id, full_name, village, district, state_code, category, household_size) values
  ${claimantRows.join(",\n  ")};

insert into claims (id, claimant_id, state_code, claim_type, area_claimed_hectares, status, submitted_on, decided_on, rejection_reason, digitized) values
  ${claimRows.join(",\n  ")};

insert into land_parcels (id, claim_id, ulpin, geom, centroid) values
  ${parcelRows.join(",\n  ")};
`;

const path = require("path");
require("fs").writeFileSync(
  path.join(__dirname, "..", "supabase", "seed.sql"),
  sql
);

// Print a quick summary for sanity-checking proportions
for (const [code, s] of Object.entries(STATES)) {
  console.log(code, s.claims, s.statusWeights);
}
console.log("Total claims:", Object.values(STATES).reduce((a, s) => a + s.claims, 0));
