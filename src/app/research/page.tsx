import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";

const PAPER_URL =
  "https://www.taylorfrancis.com/chapters/edit/10.1201/9781003743767-47/trinetra-tribal-rights-intelligence-network-empowerment-technology-research-analysis-shreya-kesarwani-suryansh-mishra-tina-sahu-suchitra";
const DOI = "10.1201/9781003743767-47";

const AUTHORS = [
  "Shreya Kesarwani",
  "Suryansh Mishra",
  "Tina Sahu",
  "Suchitra",
];

const KEYWORDS = [
  "Forest Rights Act (FRA)",
  "WebGIS",
  "Artificial Intelligence",
  "Remote Sensing",
  "Land-Use Classification",
  "Participatory Governance",
  "Digital Public Infrastructure",
];

export default function ResearchPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-10">
      <PageHeader
        eyebrow="Empirical Studies & Publications"
        title="Research & Evidence"
        description="Everything on this platform — the statistics, the four-state comparisons, the benchmark numbers — is grounded directly in published peer-reviewed research."
      >
        <Button href={PAPER_URL} target="_blank" rel="noopener noreferrer" variant="primary" size="sm">
          Read on CRC Press ↗
        </Button>
      </PageHeader>

      {/* Citation card */}
      <div className="mt-10 rounded-xl border border-line bg-paper-raised p-6">
        <h2 className="font-display text-xl text-ink">
          TRINETRA — Tribal Rights Intelligence Network for Empowerment
          Through Technology, Research and Analysis
        </h2>
        <p className="mt-3 text-sm text-ink">
          Shreya Kesarwani
          
        </p>
        <p className="mt-3 text-sm text-ink-soft">
          Published in{" "}
          <em className="text-ink">
            Sustainable Developments in Computer Engineering, Green
            Technology and Smart Systems
          </em>{" "}
          — CRC Press, July 2026. Pages 301–307.
        </p>
        <p className="mt-3 font-mono text-xs text-ink-soft">DOI: {DOI}</p>
        <div className="mt-5">
          <Link
            href={PAPER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full bg-forest px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper-raised transition-colors hover:bg-forest-deep"
          >
            Read on Taylor & Francis ↗
          </Link>
          <p className="mt-3 text-xs text-ink-soft">
            Full text is available via Taylor & Francis under their access
            terms.
          </p>
        </div>
      </div>

      {/* Abstract, paraphrased */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">What the paper argues</h2>
        <p className="mt-4 text-ink-soft">
          The Forest Rights Act (2006) was meant to formally recognize the
          land rights of tribal and forest-dwelling communities across
          India. In practice, implementation has been held back by a lack
          of reliable geospatial data, slow verification processes, and
          limited transparency in how claims move through the system.
        </p>
        <p className="mt-4 text-ink-soft">
          The paper proposes an AI-driven WebGIS framework — TRINETRA — for
          Madhya Pradesh, Odisha, Telangana, and Tripura, combining
          participatory GIS input, machine-learning-based land-use and
          settlement detection, and satellite remote sensing in a single
          dashboard. Claims, supporting evidence, and verification status
          are shown on an interactive map with role-based access for
          administrators, verifiers, and community stakeholders.
        </p>
        <p className="mt-4 text-ink-soft">
          Based on the study's estimates, a system like this could cut
          claim verification time by roughly 40–60% and improve geospatial
          accuracy compared to today's manual, paper-based workflows —
          while keeping local communities directly involved in the
          process.
        </p>
      </section>

      {/* This build vs the paper */}
      <section className="mt-12">
        <h2 className="font-display text-2xl text-ink">
          What this demo builds vs. what the paper proposes
        </h2>
        <p className="mt-4 text-ink-soft">
          This live site demonstrates the core ideas end-to-end — the
          Atlas, the digitization pipeline, and the scheme-matching engine
          all run against real (synthetic) data. The full framework
          described in the paper — production-grade satellite inference,
          role-based access for administrators and verifiers, and
          live participatory GIS input from community stakeholders — is
          the roadmap this MVP is built toward, not yet fully implemented
          here. Where a module is illustrative rather than fully live
          (like the asset-detection layer on the Atlas), it's labeled as
          such directly in the interface.
        </p>
      </section>

      {/* Table 3 comparative performance benchmark */}
      <section className="mt-12 border-t border-line pt-8">
        <h2 className="font-display text-2xl text-ink font-semibold">Comparative performance benchmark</h2>
        <p className="mt-4 text-ink-soft leading-relaxed">
          The table below reproduces the comparative benchmarking parameters (Table 3) published in the paper,
          contrasting the TRINETRA framework against Chhattisgarh's existing live WebGIS model.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-left font-sans text-sm border-t-2 border-b-2 border-ink py-2">
            <thead>
              <tr className="border-b border-line font-mono text-xs uppercase tracking-wider text-ink-soft">
                <th className="py-3 pr-4 font-bold text-ink">Evaluation Metric</th>
                <th className="py-3 px-4 font-bold text-forest text-right">TRINETRA (Proposed)</th>
                <th className="py-3 px-4 font-bold text-ink text-right">Chhattisgarh WebGIS</th>
                <th className="py-3 pl-4 font-bold text-clay text-right">Net Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              <tr className="hover:bg-paper-raised/40 transition-colors">
                <td className="py-3 pr-4 font-medium text-ink">Digitization success rate</td>
                <td className="py-3 px-4 font-mono font-semibold text-forest text-right">95.0%</td>
                <td className="py-3 px-4 font-mono text-ink text-right">8.5%</td>
                <td className="py-3 pl-4 font-mono font-bold text-approved text-right">+86.5%</td>
              </tr>
              <tr className="hover:bg-paper-raised/40 transition-colors">
                <td className="py-3 pr-4 font-medium text-ink">Conflict overlap rate</td>
                <td className="py-3 px-4 font-mono font-semibold text-forest text-right">2.0%</td>
                <td className="py-3 px-4 font-mono text-ink text-right">8.0%</td>
                <td className="py-3 pl-4 font-mono font-bold text-approved text-right">-6.0%</td>
              </tr>
              <tr className="hover:bg-paper-raised/40 transition-colors">
                <td className="py-3 pr-4 font-medium text-ink">Claims approval rate</td>
                <td className="py-3 px-4 font-mono font-semibold text-forest text-right">93.0%</td>
                <td className="py-3 px-4 font-mono text-ink text-right">90.0%</td>
                <td className="py-3 pl-4 font-mono font-bold text-approved text-right">+3.0%</td>
              </tr>
              <tr className="hover:bg-paper-raised/40 transition-colors">
                <td className="py-3 pr-4 font-medium text-ink">Geospatial parcel accuracy</td>
                <td className="py-3 px-4 font-mono font-semibold text-forest text-right">96.0%</td>
                <td className="py-3 px-4 font-mono text-ink text-right">89.0%</td>
                <td className="py-3 pl-4 font-mono font-bold text-approved text-right">+7.0%</td>
              </tr>
            </tbody>
          </table>
          <p className="mt-3 font-mono text-[10px] text-ink-soft italic text-center">
            Table 3: Multi-parameter performance framework benchmark of TRINETRA vs. Chhattisgarh live WebGIS model (Kesarwani et al., 2026).
          </p>
        </div>
      </section>

      {/* Keywords */}
      <section className="mt-12 border-t border-line pt-8">
        <p className="text-xs uppercase tracking-wider text-ink-soft">
          Index terms
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {KEYWORDS.map((kw) => (
            <span
              key={kw}
              className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft"
            >
              {kw}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
