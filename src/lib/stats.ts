import type { ClaimMapRow, StateCode } from "@/lib/types";

export interface StateStats {
  code: StateCode | "ALL";
  name: string;
  total: number;
  approved: number;
  pending: number;
  rejected: number;
  digitized: number;
  approvalRate: number; // approved / total * 100
  conflictRate: number; // rejected / (approved + rejected) * 100
  digitizedPct: number; // digitized / total * 100
}

const STATE_NAMES: Record<StateCode, string> = {
  MP: "Madhya Pradesh",
  OD: "Odisha",
  TS: "Telangana",
  TR: "Tripura",
};

function aggregate(
  code: StateCode | "ALL",
  name: string,
  claims: ClaimMapRow[]
): StateStats {
  const total = claims.length;
  const approved = claims.filter((c) => c.status === "approved").length;
  const pending = claims.filter((c) => c.status === "pending").length;
  const rejected = claims.filter((c) => c.status === "rejected").length;
  const digitized = claims.filter((c) => c.digitized).length;
  const disposed = approved + rejected;

  return {
    code,
    name,
    total,
    approved,
    pending,
    rejected,
    digitized,
    approvalRate: total ? Number(((approved / total) * 100).toFixed(1)) : 0,
    conflictRate: disposed
      ? Number(((rejected / disposed) * 100).toFixed(1))
      : 0,
    digitizedPct: total
      ? Number(((digitized / total) * 100).toFixed(1))
      : 0,
  };
}

/** Computes national + per-state stats from the full claim set. */
export function computeStats(claims: ClaimMapRow[]): {
  national: StateStats;
  byState: StateStats[];
} {
  const national = aggregate("ALL", "All states", claims);

  const codes = Array.from(new Set(claims.map((c) => c.state_code))) as StateCode[];
  const byState = codes
    .map((code) =>
      aggregate(
        code,
        STATE_NAMES[code] ?? code,
        claims.filter((c) => c.state_code === code)
      )
    )
    .sort((a, b) => b.total - a.total);

  return { national, byState };
}
