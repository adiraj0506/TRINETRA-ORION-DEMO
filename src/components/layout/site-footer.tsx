export function SiteFooter() {
  return (
    <footer className="border-t border-line/80 bg-paper">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-display text-base text-ink">TRINETRA</p>
            <p className="mt-1 max-w-md text-sm text-ink-soft">
              A working demonstration of FRA claim mapping, digitization,
              and scheme-matching across Madhya Pradesh, Odisha, Telangana,
              and Tripura, built on the author's published research.
            </p>
          </div>
          <p className="font-mono text-xs uppercase tracking-wider text-ink-soft">
            Demo data — not government records
          </p>
        </div>
      </div>
    </footer>
  );
}
