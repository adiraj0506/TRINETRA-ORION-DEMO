import type { ClaimStatus, StateCode } from "@/lib/types";
import { STATUS_LABELS } from "@/lib/types";

const STATES: { code: StateCode | "ALL"; label: string }[] = [
  { code: "ALL", label: "All states" },
  { code: "MP", label: "Madhya Pradesh" },
  { code: "OD", label: "Odisha" },
  { code: "TS", label: "Telangana" },
  { code: "TR", label: "Tripura" },
];

const STATUSES: ClaimStatus[] = ["approved", "pending", "rejected"];

export function AtlasFilters({
  selectedState,
  onStateChange,
  activeStatuses,
  onToggleStatus,
  total,
  visibleCount,
}: {
  selectedState: StateCode | "ALL";
  onStateChange: (s: StateCode | "ALL") => void;
  activeStatuses: Set<ClaimStatus>;
  onToggleStatus: (s: ClaimStatus) => void;
  total: number;
  visibleCount: number;
}) {
  return (
    <div className="border-b border-line p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-clay">
        FRA Atlas
      </p>
      <h1 className="mt-2 font-display text-2xl text-ink">Filter claims</h1>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wider text-ink-soft">
          State
        </label>
        <select
          value={selectedState}
          onChange={(e) => onStateChange(e.target.value as StateCode | "ALL")}
          className="mt-2 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm text-ink focus:border-forest focus:outline-none"
        >
          {STATES.map((s) => (
            <option key={s.code} value={s.code}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5">
        <label className="text-xs uppercase tracking-wider text-ink-soft">
          Status
        </label>
        <div className="mt-2 space-y-2">
          {STATUSES.map((status) => (
            <label
              key={status}
              className="flex cursor-pointer items-center gap-2 text-sm text-ink"
            >
              <input
                type="checkbox"
                checked={activeStatuses.has(status)}
                onChange={() => onToggleStatus(status)}
                className="h-4 w-4 rounded border-line accent-forest"
              />
              {STATUS_LABELS[status]}
            </label>
          ))}
        </div>
      </div>

      <p className="mt-6 font-mono text-xs text-ink-soft">
        Showing {visibleCount} of {total} claims
      </p>
    </div>
  );
}
