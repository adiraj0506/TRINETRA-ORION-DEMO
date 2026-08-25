"use client";

import { useMemo, useState } from "react";
import type { ClaimMapRow } from "@/lib/types";
import { STATUS_COLORS } from "@/lib/types";

export function ClaimantPicker({
  claims,
  selectedClaimId,
  onSelect,
}: {
  claims: ClaimMapRow[];
  selectedClaimId: string | null;
  onSelect: (claimId: string) => void;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return claims.slice(0, 40);
    return claims
      .filter(
        (c) =>
          c.full_name.toLowerCase().includes(q) ||
          c.village.toLowerCase().includes(q) ||
          c.district.toLowerCase().includes(q)
      )
      .slice(0, 40);
  }, [claims, query]);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-line p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-clay">
          Decision Support
        </p>
        <h1 className="mt-2 font-display text-2xl text-ink">
          Pick a claimant
        </h1>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, village, district…"
          className="mt-4 w-full rounded-md border border-line bg-paper-raised px-3 py-2 text-sm text-ink placeholder:text-ink-soft/60 focus:border-forest focus:outline-none"
        />
        <p className="mt-2 font-mono text-[11px] text-ink-soft">
          Showing {filtered.length} of {claims.length}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filtered.map((c) => {
          const isSelected = c.claim_id === selectedClaimId;
          return (
            <button
              key={c.claim_id}
              onClick={() => onSelect(c.claim_id)}
              className={`flex w-full items-center gap-3 border-b border-line px-6 py-3 text-left transition-colors ${
                isSelected ? "bg-forest/10" : "hover:bg-paper-raised"
              }`}
            >
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: STATUS_COLORS[c.status] }}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm text-ink">
                  {c.full_name}
                </span>
                <span className="block truncate text-xs text-ink-soft">
                  {c.village}, {c.district} — {c.state_code}
                </span>
              </span>
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="p-6 text-sm text-ink-soft">
            No claimants match that search.
          </p>
        )}
      </div>
    </div>
  );
}
