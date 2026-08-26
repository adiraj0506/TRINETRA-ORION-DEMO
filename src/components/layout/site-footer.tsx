import Link from "next/link";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-paper-raised/80 mt-16 transition-colors">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          {/* Column 1: Brand & Purpose */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-md bg-forest text-paper-raised font-display text-sm font-bold">
                त्र
              </span>
              <p className="font-display text-lg font-bold text-ink tracking-tight">
                TRINETRA
              </p>
            </div>
            <p className="font-mono text-xs text-clay font-bold uppercase tracking-wider">
              Tribal Rights Intelligent Network for Empowerment through Technology, Research & Analysis
            </p>
            <p className="text-xs text-ink-soft leading-relaxed max-w-md">
              A unified WebGIS Atlas, claim digitization engine, and deterministic Decision Support System bridging Forest Rights Act title recognition across Madhya Pradesh, Odisha, Telangana, and Tripura.
            </p>
            <div className="inline-block rounded-md border border-line bg-paper px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft">
              📌 <strong>Data Transparency:</strong> Demonstration benchmark data — not official government records.
            </div>
          </div>

          {/* Column 2: Quick Platform Modules */}
          <div className="md:col-span-3 space-y-2.5">
            <p className="font-mono text-xs uppercase tracking-widest text-ink font-bold border-b border-line pb-1.5">
              Platform Modules
            </p>
            <ul className="space-y-1.5 font-mono text-xs text-ink-soft">
              {MAIN_NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="hover:text-forest transition-colors flex items-center gap-1.5"
                  >
                    <span>›</span>
                    <span>{item.pageTitle}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Research Reference & DOI */}
          <div className="md:col-span-4 space-y-2.5">
            <p className="font-mono text-xs uppercase tracking-widest text-ink font-bold border-b border-line pb-1.5">
              Published Research
            </p>
            <p className="text-xs text-ink-soft leading-relaxed">
              Published in <em className="text-ink font-medium">Sustainable Developments in Computer Engineering, Green Technology and Smart Systems</em> — CRC Press (Taylor & Francis), 2026.
            </p>
            <p className="font-mono text-[11px] text-ink">
              DOI:{" "}
              <a
                href="https://doi.org/10.1201/9781003743767-47"
                target="_blank"
                rel="noopener noreferrer"
                className="text-forest underline decoration-forest/40 underline-offset-2 hover:text-forest-deep font-semibold"
              >
                10.1201/9781003743767-47 ↗
              </a>
            </p>
            <div className="pt-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft">
                Study Jurisdictions: MP · OD · TS · TR
              </span>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-line/80 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink-soft">
          <p className="font-mono text-[11px]">
            © {new Date().getFullYear()} TRINETRA Project. SIH Demonstration Prototype.
          </p>
          <div className="flex items-center gap-4 font-mono text-[11px]">
            <Link href="/research" className="hover:text-forest underline">
              Research Evidence
            </Link>
            <span>·</span>
            <Link href="/atlas" className="hover:text-forest underline">
              FRA Atlas
            </Link>
            <span>·</span>
            <Link href="/dss" className="hover:text-forest underline">
              Decision Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
