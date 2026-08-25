import type { StateStats } from "@/lib/stats";

export function DigitizationProgress({ data }: { data: StateStats[] }) {
  return (
    <div className="space-y-5">
      {data.map((s) => (
        <div key={s.code}>
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-ink">{s.name}</span>
            <span className="font-mono text-sm text-forest">
              {s.digitizedPct}%
            </span>
          </div>
          <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-line">
            <div
              className="h-full rounded-full bg-forest transition-all"
              style={{ width: `${s.digitizedPct}%` }}
            />
          </div>
          <p className="mt-1 font-mono text-[11px] text-ink-soft">
            {s.digitized} of {s.total} records digitized
          </p>
        </div>
      ))}
    </div>
  );
}
