import React from "react";
import { Button } from "./button";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-paper-raised/50 p-10 text-center ${className}`}
    >
      {icon && <div className="mb-3 text-ink-soft opacity-80 text-3xl">{icon}</div>}
      <h4 className="font-display text-base font-semibold text-ink">{title}</h4>
      <p className="mt-1 max-w-sm text-xs text-ink-soft leading-relaxed">
        {description}
      </p>
      {(actionLabel && (onAction || actionHref)) && (
        <div className="mt-5">
          {actionHref ? (
            <Button href={actionHref} size="sm" variant="secondary">
              {actionLabel}
            </Button>
          ) : (
            <Button onClick={onAction} size="sm" variant="secondary">
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
