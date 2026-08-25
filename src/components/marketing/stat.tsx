export function Stat({
  value,
  label,
  source,
}: {
  value: string;
  label: string;
  source?: string;
}) {
  return (
    <div className="border-l-2 border-line pl-4">
      <p className="font-mono text-3xl text-forest md:text-4xl">{value}</p>
      <p className="mt-1 text-sm text-ink-soft">{label}</p>
      {source && (
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-soft/70">
          {source}
        </p>
      )}
    </div>
  );
}
