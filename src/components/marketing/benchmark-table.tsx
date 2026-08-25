const ROWS = [
  { label: "Digitization success", ours: "95%", other: "8.5%" },
  { label: "Conflict rate", ours: "2%", other: "8%", lowerIsBetter: true },
  { label: "Approval rate", ours: "93%", other: "90%" },
  { label: "Accuracy", ours: "96%", other: "89%" },
];

export function BenchmarkTable() {
  return (
    <div className="overflow-x-auto rounded-lg border border-line">
      <table className="w-full min-w-[480px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line bg-paper-raised">
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-soft">
              Metric
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-forest">
              TRINETRA
            </th>
            <th className="px-5 py-3 text-xs font-medium uppercase tracking-wider text-ink-soft">
              Chhattisgarh WebGIS
            </th>
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row, i) => (
            <tr
              key={row.label}
              className={i !== ROWS.length - 1 ? "border-b border-line" : ""}
            >
              <td className="px-5 py-3 text-sm text-ink">{row.label}</td>
              <td className="px-5 py-3 font-mono text-sm text-forest">
                {row.ours}
              </td>
              <td className="px-5 py-3 font-mono text-sm text-ink-soft">
                {row.other}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
