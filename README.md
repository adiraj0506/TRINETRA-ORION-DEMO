# TRINETRA
**Tribal Rights Intelligent Network for Empowerment through Technology, Research & Analysis**

## The problem
51 lakh+ Forest Rights Act claims across India sit in fragmented, paper-based
systems. Roughly 49% get approved nationally — with huge variance by state
(Tripura ~65%, Telangana ~29%) — largely driven by poor documentation and no
shared way to track a claim from filing to resolution.

## The solution
TRINETRA is a live demonstration (built on our published research) of:
- **FRA Atlas** — an interactive map of claims by status across MP, Odisha, Telangana, Tripura
- **Digitization** — OCR + NER to turn scanned claim forms into structured records
- **DSS** — a rule engine matching titleholders to eligible government schemes
- **Asset Detection** — satellite-based land-use classification (demo layer)

## What's new (Days 11–18 Enhancements)
TRINETRA has been extended with the following major features directly reproducing the research paper's specifications:
- **Multilingual OCR & Review Flow (Day 11):** Side-by-side digitize workspace supporting English, Hindi, and Odia OCR, with field confidence indicators and human-in-the-loop override validation.
- **Layers & Spatial Dispute Checks (Day 12):** Leaflet LayersControl overlays including Admin boundaries, pre/post-2005 canopy loss, and tiger reserve zones. Integrated PostGIS `ST_Intersects` queries to flag canopy violations and restricted zone overlaps on map markers and detail sheets.
- **Offline Caching Simulation (Day 13):** Toggleable "Offline Mode" caching submissions locally in a `localStorage` queue with simulated batch sync loaders and checkmark success toasts.
- **ULPIN & Parcel Polygons (Day 14):** Deterministic ULPIN code generator (`STATE-DISTRICT-YEAR-HASH`) and rendering of actual parcel boundary polygons on the map using status-consistent color-coding (green/yellow/red).
- **Welfare Referral & Convergence (Day 15):** A "Generate Welfare Referral Package" tool evaluating claimants against the DSS engine (including PM-JANMAN) to produce a highly detailed, printable Welfare Convergence Card (complete with custom document submission actions and a CSS barcode).
- **Role-Based Access (Day 16):** Header stakeholder switcher simulating:
  - *Community:* Read-only views, disabled digitization uploads.
  - *Verifier:* Title approval/rejection button panel mapped reactively to update map points in real time.
  - *Administrator:* Full stats dashboard breakdown and welfare convergence card generator tools.
- **Verification Time Comparison Widget (Day 17):** Landing page time-motion workflow widget illustrating the paper's claimed 40–60% reduction in verification delay with direct DOI citations.
- **Research Table 3 Benchmark (Day 18):** Styled booktabs academic table on the Research page reproducing Table 3 comparative benchmarks against the Chhattisgarh WebGIS model.

## The paper
Kesarwani, S., Mishra, S., Sahu, T., Suchitra. "TRINETRA — Tribal Rights
Intelligence Network for Empowerment Through Technology, Research and
Analysis." In *Sustainable Developments in Computer Engineering, Green
Technology and Smart Systems*. CRC Press, 2026.
DOI: [10.1201/9781003743767-47](https://www.taylorfrancis.com/chapters/edit/10.1201/9781003743767-47/trinetra-tribal-rights-intelligence-network-empowerment-technology-research-analysis-shreya-kesarwani-suryansh-mishra-tina-sahu-suchitra)

## Live link
**https://trinetra-orion.vercel.app** — verified end-to-end (desktop +
mobile) as of Day 19.

## Tech stack
Next.js 14 (App Router) · Tailwind CSS v4 · Supabase (Postgres + PostGIS) ·
Leaflet · Recharts · Tesseract.js · TypeScript

## Running locally
```bash
npm install
cp .env.local.example .env.local   # fill in your Supabase project keys
npm run dev
```

## Roadmap
See [ROADMAP.md](./ROADMAP.md) for the full day-by-day execution plan and
scope boundaries.

## Data
This demo uses a synthetic dataset statistically matched to the figures in
our published research — no real claimant data is used, since that cannot
legally be published on a public link.
