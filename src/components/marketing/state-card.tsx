type StateCardProps = {
  name: string;
  context: string;
  metricLabel: string;
  metricValue: string;
  tone: "approved" | "pending" | "rejected";
};

const TONE_CLASSES: Record<StateCardProps["tone"], string> = {
  approved: "text-approved",
  pending: "text-pending",
  rejected: "text-rejected",
};

export function StateCard({
  name,
  context,
  metricLabel,
  metricValue,
  tone,
}: StateCardProps) {
  return (
    <div className="rounded-lg border border-line bg-paper-raised p-6">
      <h3 className="font-display text-xl text-ink">{name}</h3>
      <p className="mt-2 text-sm text-ink-soft">{context}</p>
      <div className="mt-4 border-t border-line pt-4">
        <p className={`font-mono text-2xl ${TONE_CLASSES[tone]}`}>
          {metricValue}
        </p>
        <p className="mt-1 text-xs uppercase tracking-wider text-ink-soft">
          {metricLabel}
        </p>
      </div>
    </div>
  );
}
