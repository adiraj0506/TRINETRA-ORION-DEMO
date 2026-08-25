# TRINETRA — Execution Roadmap
**Tribal Rights Intelligent Network for Empowerment through Technology, Research & Analysis**

> **Build status: Days 0–10 complete.** Live at
> https://trinetra-one-bice.vercel.app — landing narrative, FRA Atlas,
> stats dashboard, DSS scheme-matching, OCR/NER digitization, and the
> asset-detection demo layer are all live against real (synthetic) data.
> Verified end-to-end on desktop and mobile. See git commit history for
> the day-by-day build log.

---

## 1. What we are actually building

Not a full production government system. We are building **one deployed, public link** that:

1. Opens with the **problem**, backed by your published research (51L+ claims, 49% approval rate, 42% rejection due to poor documentation, state-wise disparity across MP/Odisha/Telangana/Tripura).
2. Walks the visitor into the **solution** — live, clickable, working modules, not screenshots.
3. Leaves them with the feeling: *"this team actually solved a real problem, this isn't a mockup."*

Success criterion: **a stranger with zero context, in under 3 minutes on the link, understands the problem and sees a working solution.**

Everything below is designed around that single goal — so if a task doesn't serve "credible live demo," we cut it or fake it convincingly with sample data. We are not chasing production-grade government infrastructure.

---

## 2. Final Tech Stack (optimized for solo/small-team speed + zero-cost deploy)

| Layer | Choice | Why |
|---|---|---|
| Frontend | **Next.js 14 (App Router) + Tailwind + shadcn/ui** | Fast to build, deploys to Vercel in one click, great for a narrative landing + app hybrid |
| Map / GIS | **Mapbox GL JS or Leaflet + React-Leaflet** | Free tier, handles GeoJSON claim points + polygon overlays easily |
| Charts | **Recharts** | State-wise stats, heatmaps, approval/conflict rate visuals from your paper |
| Backend/API | **Next.js API routes / serverless functions** | No separate backend to host — one deploy, no infra management |
| Database | **Supabase (Postgres + PostGIS + Auth + Storage)** | Free tier, PostGIS out of the box for geospatial queries, instant REST/JS client |
| OCR | **Tesseract.js (client-side)** | Runs in-browser, no server cost, good enough for MVP demo |
| NER | **Lightweight regex + rule-based extractor (JS)**; upgrade path to spaCy microservice later | Fast to ship, transparent, works for structured FRA form fields |
| DSS | **TypeScript rule engine (plain functions)** | No ML needed — eligibility logic is deterministic and easy to demo |
| Asset Detection (CV) | **Pre-computed demo layer** (one classified raster from Sentinel-2 via Google Earth Engine, exported once, served as a static tile overlay) | Full live CV pipeline is out of MVP scope — we show the *result*, convincingly, not build live inference |
| Deployment | **Vercel (frontend+API) + Supabase (DB)** | Both free, both give you a real public HTTPS link within minutes |
| Version control | **GitHub**, daily commits, project board | Tracks the "we built this" story — visible progress is part of the credibility |

This stack means: **one repo, one Vercel deploy, one live link.** No Docker, no server ops, nothing that can go down before a demo.

---

## 3. Site / Product Structure (the "story" the link tells)

```
/                → Landing: The Problem (stats, map teaser, "See it in action" CTA)
/atlas           → FRA Atlas: live map of claims, filters, click-to-inspect
/dashboard       → State-wise stats: approval %, rejection %, digitization %, conflict rate
/digitize        → OCR/NER demo: upload a sample scanned claim → see it extracted → review
/dss             → Decision Support: pick a titleholder → see matched government schemes
/research        → Link to your published paper, methodology, references, team
```

Each page = one "wow, this actually works" moment. The landing page is the sales pitch; every other page is proof.

---

## 4. Data Strategy

You almost certainly don't have real government claim records to legally use in a public demo — and you shouldn't put real tribal claimant data on a public link anyway. So:

- **Synthetic but realistic dataset**: ~300–500 generated claim records across MP, Odisha, Telangana, Tripura, with real district/village names, plausible coordinates inside real forest-cover boundaries, and status distributions matching your paper's actual stats (49% approval overall, Tripura ~65%, Telangana ~29%, etc.) — so the dashboard numbers **match your published research**, which is a big credibility anchor.
- One real public layer for forest boundaries (Bhuvan/OSM extract) so the map isn't floating on nothing.
- One pre-classified Sentinel-2 tile for the CV demo layer (computed once offline, not live).

This keeps everything legal, fast, and — critically — **consistent with the numbers in your paper**, which is what makes the demo feel credible rather than arbitrary.

---

## 5. Day-by-Day Plan (for GitHub tracking)

Use this as your GitHub Project board (`To Do → In Progress → Done`) and commit at the end of each day with a message referencing the day number, e.g. `Day 3: Atlas map + claim filters`.

| Day | Focus | Deliverable | Commit checkpoint |
|---|---|---|---|
| **0** | Setup | Repo, Next.js + Tailwind scaffold, Supabase project, Vercel deploy of blank page (get the live link working on Day 0) | `Day 0: project scaffold + live blank deploy` |
| **1** | Landing narrative | Problem section with real stats from paper, hero framing, CTA into demo | `Day 1: landing page — the problem` |
| **2** | Data layer | Supabase schema (claims, claimants, land_parcels w/ PostGIS geometry, schemes), seed synthetic dataset matching paper stats | `Day 2: DB schema + seed data` |
| **3** | FRA Atlas | Map view, claim markers colored by status, state/status filters | `Day 3: Atlas map + filters` |
| **4** | Atlas detail + Dashboard | Click-claim side panel, state-wise stats dashboard (approval/conflict/digitization rate charts) | `Day 4: claim detail panel + stats dashboard` |
| **5** | DSS | Rule engine (eligibility logic for PM-KISAN/MGNREGA/JJM/DAJGUA), UI to select claimant → see matches | `Day 5: DSS scheme-matching demo` |
| **6** | OCR/NER | Upload sample scanned form → Tesseract.js extraction → regex NER → editable review form | `Day 6: OCR/NER digitization flow` |
| **7** | CV asset layer | Static classified raster overlay toggle on Atlas ("land-use detection" demo) | `Day 7: asset detection demo layer` |
| **8** | Research page + polish narrative | Link to published paper, methodology summary, team, references | `Day 8: research page + copy polish` |
| **9** | Mobile responsiveness + perf pass | All pages usable on phone, image/tile optimization | `Day 9: responsive + performance` |
| **10** | Production deploy + custom domain (optional) | Final Vercel prod deploy, env vars locked, error boundaries | `Day 10: production deploy` |
| **11** | QA + bug bash | Click through every page as a stranger would, fix breakage | `Day 11: QA pass` |
| **12** | Demo packaging | README with problem/solution framing, short walkthrough script/video, final polish | `Day 12: README + demo readiness` |

~12 focused days to a live, credible, story-driven MVP. Days 3–7 are the core "proof" modules and can be reordered based on what you want working first.

---

## 6. GitHub Workflow (so progress is visible, not just felt)

- `main` branch always deployable (auto-deploys to Vercel on push).
- One commit per day minimum, prefixed `Day N:`.
- GitHub Project board with columns `Backlog / In Progress / Done`, one card per roadmap row above.
- `README.md` from Day 0 with: problem statement (2–3 lines), live link, tech stack, "how to run locally" — update as modules go live so the README itself shows progress over time.
- Optional: a `CHANGELOG.md` or the GitHub commit history itself becomes your "build log" if anyone checks the repo for credibility.

---

## 7. What's explicitly OUT of MVP scope (so we don't drift)

- Real OCR/NER accuracy tuning on messy handwritten scans (demo-grade only)
- Live satellite inference pipeline (pre-computed demo layer instead)
- Auth/roles, government-grade security, offline-first mobile app
- Multi-tenant admin panels, real Gram Sabha workflows
- Integration with actual PM-KISAN/MGNREGA/JJM government APIs (schemes are static reference data)

If any of these come up mid-build, the answer is: **note it in the Research/Roadmap page as "future scope"** (your paper already says this), don't build it now.

---

## 8. Immediate next step

Day 0 setup: repo + Supabase + Vercel + a live (even if blank) URL, so you have a shareable link from hour one. Ready to start whenever you are — tell me and I'll scaffold it.
