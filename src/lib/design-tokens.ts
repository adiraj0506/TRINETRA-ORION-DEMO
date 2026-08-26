export type CanonicalStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "field_verification"
  | "conflict"
  | "returned_for_correction"
  | "submitted"
  | "draft";

export interface StatusConfig {
  label: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  dotColor: string;
  hex: string;
}

export const STATUS_TOKENS: Record<string, StatusConfig> = {
  approved: {
    label: "APPROVED",
    badgeBg: "bg-[#2f6f4e]/10",
    badgeText: "text-[#2f6f4e]",
    badgeBorder: "border-[#2f6f4e]/25",
    dotColor: "bg-[#2f6f4e]",
    hex: "#2f6f4e",
  },
  pending: {
    label: "PENDING REVIEW",
    badgeBg: "bg-[#c89b3c]/15",
    badgeText: "text-[#976d1e]",
    badgeBorder: "border-[#c89b3c]/30",
    dotColor: "bg-[#c89b3c]",
    hex: "#c89b3c",
  },
  submitted: {
    label: "SUBMITTED",
    badgeBg: "bg-[#3d6e8c]/15",
    badgeText: "text-[#28516d]",
    badgeBorder: "border-[#3d6e8c]/30",
    dotColor: "bg-[#3d6e8c]",
    hex: "#3d6e8c",
  },
  review_pending: {
    label: "IN REVIEW",
    badgeBg: "bg-[#c89b3c]/15",
    badgeText: "text-[#976d1e]",
    badgeBorder: "border-[#c89b3c]/30",
    dotColor: "bg-[#c89b3c]",
    hex: "#c89b3c",
  },
  field_verification: {
    label: "FIELD SURVEY",
    badgeBg: "bg-[#3d6e8c]/15",
    badgeText: "text-[#28516d]",
    badgeBorder: "border-[#3d6e8c]/30",
    dotColor: "bg-[#3d6e8c]",
    hex: "#3d6e8c",
  },
  conflict: {
    label: "SPATIAL CONFLICT",
    badgeBg: "bg-[#7e3b6e]/15",
    badgeText: "text-[#7e3b6e]",
    badgeBorder: "border-[#7e3b6e]/30",
    dotColor: "bg-[#7e3b6e]",
    hex: "#7e3b6e",
  },
  rejected: {
    label: "REJECTED",
    badgeBg: "bg-[#a13d2b]/15",
    badgeText: "text-[#a13d2b]",
    badgeBorder: "border-[#a13d2b]/30",
    dotColor: "bg-[#a13d2b]",
    hex: "#a13d2b",
  },
  returned_for_correction: {
    label: "RETURNED FOR CORRECTION",
    badgeBg: "bg-[#b5622b]/15",
    badgeText: "text-[#8f4a1f]",
    badgeBorder: "border-[#b5622b]/30",
    dotColor: "bg-[#b5622b]",
    hex: "#b5622b",
  },
  draft: {
    label: "DRAFT",
    badgeBg: "bg-[#4a5650]/10",
    badgeText: "text-[#4a5650]",
    badgeBorder: "border-[#4a5650]/20",
    dotColor: "bg-[#4a5650]",
    hex: "#4a5650",
  },
};

export function getStatusConfig(status: string): StatusConfig {
  const norm = (status || "").toLowerCase().trim();
  return (
    STATUS_TOKENS[norm] || {
      label: norm ? norm.toUpperCase() : "UNKNOWN",
      badgeBg: "bg-[#4a5650]/10",
      badgeText: "text-[#4a5650]",
      badgeBorder: "border-[#4a5650]/20",
      dotColor: "bg-[#4a5650]",
      hex: "#4a5650",
    }
  );
}
