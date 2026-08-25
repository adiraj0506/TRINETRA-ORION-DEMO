export const LAND_USE_COLORS: Record<string, string> = {
  forest: "var(--color-forest)",
  agriculture: "var(--color-pending)",
  water: "var(--color-water)",
  homestead: "var(--color-clay)",
};

export const LAND_USE_LABELS: Record<string, string> = {
  forest: "Forest",
  agriculture: "Agricultural land",
  water: "Water body",
  homestead: "Homestead / built-up",
};

export function AssetLayerToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="p-6">
      <p className="font-mono text-xs uppercase tracking-wider text-clay">
        Day 7
      </p>
      <h2 className="mt-2 font-display text-lg text-ink">
        Asset detection layer
      </h2>
      <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={active}
          onChange={onToggle}
          className="h-4 w-4 rounded border-line accent-clay"
        />
        Show land-use classification (demo)
      </label>

      {active && (
        <div className="mt-4 space-y-2">
          {Object.entries(LAND_USE_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center gap-2 text-xs text-ink-soft">
              <span
                className="h-3 w-3 rounded-sm"
                style={{ backgroundColor: LAND_USE_COLORS[key] }}
              />
              {label}
            </div>
          ))}
        </div>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-soft">
        This layer is an <span className="text-ink">illustrative</span>{" "}
        example of what satellite-based land-use classification would show
        for a claim area — not live model inference. A production build
        would run this from Sentinel-2 imagery via Google Earth Engine, as
        described on the Research page.
      </p>
    </div>
  );
}
