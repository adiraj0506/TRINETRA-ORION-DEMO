"use client";

import { useEffect, useState } from "react";
import { fetchClaimsForMap } from "@/lib/queries";
import { useRole } from "@/lib/role-store";
import { computeStats, type StateStats } from "@/lib/stats";
import type { ClaimMapRow } from "@/lib/types";
import { Stat } from "@/components/marketing/stat";
import { RateComparisonChart } from "@/components/dashboard/rate-comparison-chart";
import { StatusBreakdownChart } from "@/components/dashboard/status-breakdown-chart";
import { DigitizationProgress } from "@/components/dashboard/digitization-progress";

export default function DashboardPage() {
  const { role, isAdmin } = useRole();
  const [claims, setClaims] = useState<ClaimMapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchClaimsForMap()
      .then(setClaims)
      .catch((err) => {
        console.error(err);
        setError(
          "Couldn't load claims. Make sure the database is set up — see supabase/README.md."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
          Loading dashboard…
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="rounded-lg border border-rejected/30 bg-rejected/5 p-4 text-sm text-rejected">
          {error}
        </div>
      </div>
    );
  }

  const { national, byState } = computeStats(claims);

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <div className="mx-auto max-w-md rounded-xl border border-line bg-paper-raised p-8 shadow-sm">
          <span className="text-3.5xl">🔒</span>
          <h2 className="mt-4 font-display text-xl text-ink font-semibold">Administrator Access Required</h2>
          <p className="mt-2 text-sm text-ink-soft leading-relaxed">
            The full stats dashboard breakdown, charts, and digitization audit logs are restricted to the 
            <strong className="text-ink"> Administrator</strong> role under the role-based stakeholder access model.
          </p>
          <div className="mt-6 font-mono text-[10px] text-ink-soft bg-paper p-2.5 rounded border border-line select-none">
            Current Role: <span className="text-clay uppercase font-bold">{role}</span>
          </div>
          <p className="mt-4 text-xs text-ink-soft italic">
            Hint: Use the role switcher in the header above to change your role to "Administrator" to unlock this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-wider text-clay">
        Live from the Atlas dataset
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
        The numbers, by state
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        Every figure here is computed live from the same claim records shown
        on the Atlas — not a static export.
      </p>

      {/* National headline stats */}
      <div className="mt-12 grid grid-cols-2 gap-8 border-y border-line py-10 md:grid-cols-4">
        <Stat value={`${national.total}`} label="Total claims in this demo" />
        <Stat value={`${national.approvalRate}%`} label="National approval rate" />
        <Stat value={`${national.conflictRate}%`} label="National conflict rate" />
        <Stat value={`${national.digitizedPct}%`} label="Records digitized" />
      </div>

      {/* Rate comparison */}
      <section className="mt-16">
        <h2 className="font-display text-2xl text-ink">
          Approval vs. conflict rate, by state
        </h2>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          The same divide seen nationally — Tripura resolves cleanly, while
          Telangana and Odisha carry a heavier share of disputed claims.
        </p>
        <div className="mt-6 rounded-xl border border-line bg-paper-raised p-6">
          <RateComparisonChart data={byState} />
        </div>
      </section>

      {/* Status breakdown */}
      <section className="mt-16">
        <h2 className="font-display text-2xl text-ink">
          Claim status breakdown
        </h2>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Raw counts of approved, pending, and rejected claims per state in
          this dataset.
        </p>
        <div className="mt-6 rounded-xl border border-line bg-paper-raised p-6">
          <StatusBreakdownChart data={byState} />
        </div>
      </section>

      {/* Digitization progress */}
      <section className="mt-16 pb-8">
        <h2 className="font-display text-2xl text-ink">
          Digitization progress
        </h2>
        <p className="mt-2 max-w-xl text-sm text-ink-soft">
          Share of legacy claim records converted into structured digital
          data — the foundation everything else here depends on.
        </p>
        <div className="mt-6 max-w-2xl rounded-xl border border-line bg-paper-raised p-6">
          <DigitizationProgress data={byState} />
        </div>
      </section>
    </div>
  );
}
