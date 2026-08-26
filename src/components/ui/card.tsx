import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "raised" | "flat";
  padded?: boolean;
}

export function Card({
  children,
  className = "",
  variant = "default",
  padded = true,
  ...props
}: CardProps) {
  const bgStyles = {
    default: "bg-paper-raised border-line",
    raised: "bg-paper-raised border-line shadow-xs",
    flat: "bg-paper border-line",
  }[variant];

  return (
    <div
      className={`rounded-xl border ${bgStyles} ${padded ? "p-6" : ""} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  title,
  eyebrow,
  subtitle,
  action,
  className = "",
}: {
  title: string;
  eyebrow?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex items-start justify-between gap-4 border-b border-line pb-4 mb-4 ${className}`}>
      <div>
        {eyebrow && (
          <p className="font-mono text-[10px] uppercase tracking-wider text-clay font-bold mb-0.5">
            {eyebrow}
          </p>
        )}
        <h3 className="font-display text-lg text-ink font-semibold">{title}</h3>
        {subtitle && <p className="text-xs text-ink-soft mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
