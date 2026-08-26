import React from "react";

export function LoadingState({
  message = "Loading records…",
  className = "",
}: {
  message?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-12 text-center rounded-xl border border-line bg-paper-raised/40 ${className}`}
    >
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-line border-t-forest" />
      <p className="mt-3 font-mono text-xs uppercase tracking-wider text-ink-soft animate-pulse">
        {message}
      </p>
    </div>
  );
}
