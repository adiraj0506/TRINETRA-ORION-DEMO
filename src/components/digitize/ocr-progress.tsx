export function OcrProgress({
  status,
  progress,
}: {
  status: string;
  progress: number;
}) {
  return (
    <div className="rounded-xl border border-line bg-paper-raised p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-clay">
        Step 2
      </p>
      <h2 className="mt-2 font-display text-xl text-ink">
        Reading the document
      </h2>
      <p className="mt-1 text-sm capitalize text-ink-soft">{status}…</p>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-forest transition-all duration-200"
          style={{ width: `${Math.round(progress * 100)}%` }}
        />
      </div>
      <p className="mt-2 font-mono text-[11px] text-ink-soft">
        {Math.round(progress * 100)}%
      </p>
    </div>
  );
}
