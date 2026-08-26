import Link from "next/link";
import { ClaimsLedgerGrid } from "@/components/marketing/claims-ledger-grid";
import { Stat } from "@/components/marketing/stat";
import { StateCard } from "@/components/marketing/state-card";
import { BenchmarkTable } from "@/components/marketing/benchmark-table";
import { AcronymBreakdown } from "@/components/marketing/acronym-breakdown";

const PILLARS = [
  {
    href: "/atlas",
    title: "FRA Atlas",
    eyebrow: "Spatial WebGIS Engine",
    body: "Every claim, mapped by status, across all four states — a single source of truth instead of disconnected paper files.",
  },
  {
    href: "/digitize",
    title: "Claim Digitization",
    eyebrow: "OCR & Document Processing",
    body: "OCR and NER turn scanned legacy claim forms into structured, searchable records — with human-in-the-loop validation.",
  },
  {
    href: "/dss",
    title: "Decision Support System",
    eyebrow: "Scheme Convergence Engine",
    body: "Titleholders matched deterministically to PM-KISAN, MGNREGA, JJM, and DAJGUA post-title welfare programmes.",
  },
  {
    href: "/dashboard",
    title: "Analytics Dashboard",
    eyebrow: "State & National Telemetry",
    body: "Live telemetry computed directly from registered claims — track digitization pace, approval rates, and spatial disputes.",
  },
];

export default function Home() {
  return (
    <div>
      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="grid gap-12 md:grid-cols-2 md:items-center md:gap-8">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-clay font-bold">
              Tribal Rights Intelligent Network
            </p>
            <h1 className="mt-3 font-display text-4xl leading-[1.08] text-ink sm:text-5xl sm:leading-[1.05] md:text-6xl font-semibold">
              Nearly 51 lakh forest rights claims. Only 49% became titles.
            </h1>
            <p className="mt-6 max-w-xl text-base text-ink-soft leading-relaxed">
              Across Madhya Pradesh, Odisha, Telangana, and Tripura, the
              Forest Rights Act promises statutory land titles to tribal and
              forest-dwelling communities. TRINETRA provides an integrated WebGIS Atlas, OCR digitization pipeline, and Decision Support System built on published research.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/atlas"
                className="rounded-full bg-forest px-6 py-3 font-mono text-xs uppercase tracking-wider text-paper-raised font-bold transition-all hover:bg-forest-deep shadow-xs"
              >
                Open FRA Atlas
              </Link>
              <Link
                href="/research"
                className="rounded-full border border-line bg-paper px-6 py-3 font-mono text-xs uppercase tracking-wider text-ink font-semibold transition-all hover:border-forest hover:text-forest"
              >
                View Research
              </Link>
            </div>
          </div>

          <div className="rounded-xl border border-line bg-paper-raised p-6">
            <div className="aspect-square max-w-sm mx-auto">
              <ClaimsLedgerGrid />
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-approved" />
                <span className="text-xs text-ink-soft">
                  Recognized as titles
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full border border-ink-soft/40 bg-line" />
                <span className="text-xs text-ink-soft">
                  Pending or rejected
                </span>
              </div>
            </div>
            <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft/70">
              Each dot = 1% of ~51.23 lakh claims nationally, as of Jun 2025
            </p>
          </div>
        </div>
      </section>

      <AcronymBreakdown />

      {/* National headline stats */}
      <section className="border-y border-line bg-paper-raised/60">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 md:grid-cols-4">
          <Stat
            value="51.23L"
            label="Claims filed nationally"
            source="Ministry data, Jun 2025"
          />
          <Stat
            value="49.02%"
            label="Recognized as land titles"
            source="Ministry data, Jun 2025"
          />
          <Stat value="4" label="States in this study" />
          <Stat
            value="47.0%"
            label="MP digitization baseline"
            source="627,513 total claims"
          />
        </div>
      </section>

      {/* State-wise disparity */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">
          The disparity
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink md:text-4xl">
          The same law, four very different outcomes
        </h2>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Approval rates vary sharply by state — driven less by eligibility
          and more by how well documentation, verification, and digital
          infrastructure hold up at the local level.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StateCard
            name="Madhya Pradesh"
            context="Largest forest-bearing state — 25% forest cover, 21.1% tribal population."
            metricLabel="Claims digitized"
            metricValue="47.0%"
            tone="pending"
          />
          <StateCard
            name="Odisha"
            context="Dense sal forests, including Kandhamal — rich ecosystem, slower claim resolution."
            metricLabel="Approval pace"
            metricValue="Slow"
            tone="rejected"
          />
          <StateCard
            name="Telangana"
            context="Semi-arid deciduous forest paired with e-governance infrastructure like the Dharni portal."
            metricLabel="Conflict rate"
            metricValue="28.98%"
            tone="rejected"
          />
          <StateCard
            name="Tripura"
            context="60% forest cover, 31% tribal communities — highest approval rate in the study."
            metricLabel="Approval rate"
            metricValue="65.1%"
            tone="approved"
          />
        </div>
      </section>

      {/* Solution pillars */}
      <section className="border-t border-line bg-paper-raised/60">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <p className="font-mono text-xs uppercase tracking-wider text-clay">
            The solution
          </p>
          <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink md:text-4xl">
            One system, four working parts
          </h2>
          <p className="mt-4 max-w-2xl text-ink-soft">
            Each module below is live in this demo — not a mockup. Click
            through to see it working.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {PILLARS.map((pillar) => (
              <Link
                key={pillar.href}
                href={pillar.href}
                className="group rounded-lg border border-line bg-paper p-6 transition-colors hover:border-forest"
              >
                <h3 className="font-display text-xl text-ink group-hover:text-forest">
                  {pillar.title}
                </h3>
                <p className="mt-2 text-sm text-ink-soft">{pillar.body}</p>
                <span className="mt-4 inline-block font-mono text-xs uppercase tracking-wider text-clay">
                  Explore →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benchmark */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">
          How this compares
        </p>
        <h2 className="mt-3 max-w-2xl font-display text-3xl text-ink md:text-4xl">
          Measured against an existing system
        </h2>
        <p className="mt-4 max-w-2xl text-ink-soft">
          Chhattisgarh runs the only comparable WebGIS-based FRA system live
          today. Our published study benchmarks TRINETRA against it directly.
        </p>
        <div className="mt-10 max-w-2xl">
          <BenchmarkTable />
        </div>
      </section>

      {/* Verification Efficiency Stats (from the paper) */}
      <section className="border-t border-line bg-paper-raised/30">
        <div className="mx-auto max-w-6xl px-6 py-20">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-clay font-bold">
                Workflow Efficiency
              </p>
              <h2 className="mt-3 font-display text-3xl text-ink md:text-4xl font-semibold">
                40–60% faster claim verification
              </h2>
              <p className="mt-4 text-sm text-ink-soft leading-relaxed">
                By replacing legacy physical document processing and manual GPS overlap checks with digitized OCR extraction and PostGIS spatial queries, TRINETRA reduces processing cycle times significantly.
              </p>
              <div className="mt-6 rounded-lg border border-line bg-paper p-4 text-[11px] text-ink-soft italic leading-relaxed shadow-sm">
                📢 <strong className="text-ink">Note on Data:</strong> These figures are based on the comparative time-motion workflow estimates published in the peer-reviewed research paper (DOI: <a href="https://doi.org/10.1201/9781003743767-47" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline font-semibold">10.1201/9781003743767-47</a>), not live transaction telemetry measured from this local demonstration website.
              </div>
            </div>

            <div className="rounded-xl border border-line bg-paper p-6 shadow-sm">
              <h3 className="font-display text-sm font-semibold text-ink uppercase tracking-wider mb-6">
                Verification Cycle Time Comparison
              </h3>

              <div className="space-y-6">
                {/* Manual Workflow */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-ink-soft uppercase font-bold">Manual Verification (Baseline)</span>
                    <span className="text-ink font-semibold">~180 Days</span>
                  </div>
                  <div className="h-6 w-full rounded bg-line relative overflow-hidden">
                    <div className="h-full bg-rejected/25 rounded" style={{ width: "100%" }} />
                  </div>
                </div>

                {/* TRINETRA Workflow */}
                <div>
                  <div className="flex justify-between text-xs font-mono mb-1.5">
                    <span className="text-forest uppercase font-bold">TRINETRA Workflow (Optimized)</span>
                    <span className="text-forest font-bold">~72 Days (-60%)</span>
                  </div>
                  <div className="h-6 w-full rounded bg-line relative overflow-hidden">
                    <div className="h-full bg-approved rounded" style={{ width: "40%" }} />
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-line pt-6 flex items-center gap-4">
                <span className="font-display text-5xl text-forest font-bold tracking-tight">60%</span>
                <div>
                  <p className="text-xs font-mono uppercase tracking-wider text-ink-soft font-bold leading-none">Maximum reduction</p>
                  <p className="text-[11px] text-ink-soft mt-1 leading-snug">In administrative delays & joint forest survey validation cycles.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-line bg-forest">
        <div className="mx-auto max-w-6xl px-6 py-16 text-center">
          <h2 className="font-display text-3xl text-paper-raised md:text-4xl">
            See where the claims actually stand.
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link
              href="/atlas"
              className="rounded-full bg-clay px-6 py-3 font-mono text-xs uppercase tracking-wider text-paper-raised font-bold transition-all hover:bg-clay-deep shadow-xs"
            >
              Open FRA Atlas
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full border border-paper-raised/40 bg-transparent px-6 py-3 font-mono text-xs uppercase tracking-wider text-paper-raised font-semibold transition-all hover:border-paper-raised hover:bg-paper-raised/10"
            >
              View Analytics Dashboard
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
