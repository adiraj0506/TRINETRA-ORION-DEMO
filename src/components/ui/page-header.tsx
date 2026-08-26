import React from "react";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  badge?: React.ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  children,
  className = "",
  badge,
}: PageHeaderProps) {
  return (
    <div className={`border-b border-line/80 pb-6 mb-8 ${className}`}>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="max-w-3xl">
          {eyebrow && (
            <p className="font-mono text-xs uppercase tracking-widest text-clay font-bold mb-1.5">
              {eyebrow}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl text-ink font-semibold tracking-tight sm:text-4xl">
              {title}
            </h1>
            {badge && <div className="inline-block">{badge}</div>}
          </div>
          {description && (
            <p className="mt-2 text-sm text-ink-soft leading-relaxed max-w-2xl">
              {description}
            </p>
          )}
        </div>
        {children && <div className="flex items-center gap-2.5 shrink-0">{children}</div>}
      </div>
    </div>
  );
}
