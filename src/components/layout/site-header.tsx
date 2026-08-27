"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShieldCheck } from "lucide-react";
import { useRole } from "@/lib/role-store";
import { MAIN_NAV_ITEMS } from "@/lib/navigation";
import { syncOfflineClaims } from "@/lib/offline-db";

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLiveDb, setIsLiveDb] = useState<boolean | null>(null);
  const pathname = usePathname();
  const { role, setRole } = useRole();

  useEffect(() => {
    // Check health once on mount
    fetch("/api/health")
      .then((res) => res.json())
      .then((data) => {
        setIsLiveDb(data?.database?.status === "connected");
      })
      .catch(() => {
        setIsLiveDb(false);
      });

    // Sync offline claims
    syncOfflineClaims().then((count) => {
      if (count > 0) {
        console.log(`[TRINETRA] Synced ${count} offline claims to database on mount.`);
      }
    });
  }, []);

  const isNavActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-paper/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Left: Brand Identity */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group shrink-0"
          onClick={() => setMenuOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-forest text-paper-raised font-display text-base font-bold shadow-xs transition-transform group-hover:scale-105">
            त्र
          </span>
          <div className="flex flex-col">
            <span className="font-display text-lg font-bold tracking-tight text-ink leading-tight">
              TRINETRA
            </span>
            <span className="font-mono text-[8px] uppercase tracking-widest text-clay font-bold -mt-0.5 hidden sm:inline">
              FRA Intelligence
            </span>
          </div>
        </Link>

        {/* Center: Canonical Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
          {MAIN_NAV_ITEMS.map((item) => {
            const active = isNavActive(item.href);
            // Hide digitize/admin for community view
            if (item.href === "/digitize" && role === "community") return null;
            if (item.href === "/admin" && (role === "community" || role === "verifier")) return null;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`relative px-3 py-1.5 font-mono text-xs uppercase tracking-wider font-semibold transition-all rounded-md ${
                  active
                    ? "text-forest bg-forest/10 font-bold shadow-2xs"
                    : "text-ink-soft hover:text-ink hover:bg-paper-raised/60"
                }`}
                aria-current={active ? "page" : undefined}
              >
                {item.label}
                {active && (
                  <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-forest rounded-full -mb-1" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right Side Controls: Role Selector + Connection Status */}
        <div className="flex items-center gap-3">
          {/* Role Selector */}
          <div className="relative flex items-center">
            <label htmlFor="role-select" className="sr-only">
              Select Stakeholder Role
            </label>
            <div className="flex items-center rounded-full border border-line bg-paper-raised/80 px-2.5 py-1 text-xs text-ink shadow-2xs">
              <ShieldCheck className="h-3.5 w-3.5 text-forest mr-1.5 shrink-0" />
              <select
                id="role-select"
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="bg-transparent font-mono text-[11px] font-bold text-ink uppercase tracking-wider focus:outline-none cursor-pointer pr-1"
                title="Switch demo stakeholder role"
              >
                <option value="admin">Administrator</option>
                <option value="verifier">Field Verifier</option>
                <option value="community">Claimant Portal</option>
              </select>
            </div>
          </div>

          {/* Connection Status Indicator (Dynamic & Transparent) */}
          {isLiveDb === true ? (
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-approved/30 bg-approved/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-approved shadow-2xs"
              title="Connected to Supabase PostgreSQL & PostGIS"
            >
              <span className="h-2 w-2 rounded-full bg-approved animate-pulse" />
              <span>LIVE DB</span>
            </div>
          ) : isLiveDb === false ? (
            <div
              className="hidden sm:flex items-center gap-1.5 rounded-full border border-clay/30 bg-clay/10 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-clay shadow-2xs"
              title="Using local demo fallback dataset — Supabase disconnected"
            >
              <span className="h-2 w-2 rounded-full bg-clay" />
              <span>DEMO DATA</span>
            </div>
          ) : null}

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-paper-raised text-ink lg:hidden hover:border-forest transition-colors cursor-pointer"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {menuOpen && (
        <nav className="border-t border-line bg-paper-raised lg:hidden animate-in slide-in-from-top-2 duration-150 shadow-lg">
          <div className="mx-auto flex max-w-7xl flex-col px-4 py-3 space-y-1">
            {MAIN_NAV_ITEMS.map((item) => {
              const active = isNavActive(item.href);
              if (item.href === "/digitize" && role === "community") return null;
              if (item.href === "/admin" && (role === "community" || role === "verifier")) return null;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 font-mono text-xs uppercase tracking-wider transition-all ${
                    active
                      ? "bg-forest/10 text-forest font-bold border border-forest/20"
                      : "text-ink-soft hover:bg-paper hover:text-ink"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <span>{item.label}</span>
                  <span className="text-[10px] text-ink-soft font-normal">{item.pageTitle}</span>
                </Link>
              );
            })}

            <div className="pt-2 mt-2 border-t border-line flex items-center justify-between px-3 text-[11px] font-mono text-ink-soft">
              <span>Status:</span>
              <span className="flex items-center gap-1.5 text-approved font-bold">
                <span className="h-1.5 w-1.5 rounded-full bg-approved" />
                POSTGIS CONNECTED
              </span>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
