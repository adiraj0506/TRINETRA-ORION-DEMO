import { getStatusConfig } from "@/lib/design-tokens";

interface StatusBadgeProps {
  status: string;
  className?: string;
  showDot?: boolean;
  size?: "sm" | "md" | "lg";
}

export function StatusBadge({
  status,
  className = "",
  showDot = true,
  size = "md",
}: StatusBadgeProps) {
  const config = getStatusConfig(status);

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[9px]",
    md: "px-2.5 py-1 text-[10px]",
    lg: "px-3 py-1.5 text-xs",
  }[size];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-mono uppercase tracking-wider font-bold transition-colors ${config.badgeBg} ${config.badgeText} ${config.badgeBorder} ${sizeClasses} ${className}`}
    >
      {showDot && (
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${config.dotColor}`} />
      )}
      <span>{config.label}</span>
    </span>
  );
}
