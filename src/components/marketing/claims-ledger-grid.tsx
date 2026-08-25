const RESOLVED: boolean[] = [
  false, false, true, false, false, true, false, false, false, true, false,
  false, false, true, true, true, false, true, true, true, false, true,
  false, true, true, false, true, false, true, false, true, false, true,
  false, true, false, false, false, false, false, true, true, true, false,
  false, false, false, true, true, false, false, false, true, true, true,
  true, true, false, false, true, true, true, true, false, true, true,
  false, true, false, true, true, false, false, true, false, true, true,
  true, true, false, true, true, false, false, false, false, true, false,
  false, true, true, false, false, true, false, true, false, false, true,
  false,
];

export function ClaimsLedgerGrid() {
  const cols = 10;
  const cell = 28;
  const size = cell * cols;

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      className="h-full w-full"
      role="img"
      aria-label="Grid of 100 dots representing forest rights claims: 49 resolved into titles, 51 unresolved"
    >
      <title>49 out of every 100 FRA claims become titles</title>
      {RESOLVED.map((resolved, i) => {
        const x = (i % cols) * cell + cell / 2;
        const y = Math.floor(i / cols) * cell + cell / 2;
        return (
          <circle
            key={i}
            cx={x}
            cy={y}
            r={resolved ? 6.5 : 5}
            fill={resolved ? "var(--color-approved)" : "var(--color-line)"}
            stroke={resolved ? "none" : "var(--color-ink-soft)"}
            strokeOpacity={resolved ? 0 : 0.25}
            strokeWidth={1}
          />
        );
      })}
    </svg>
  );
}
