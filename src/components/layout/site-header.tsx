"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useOffline } from "@/lib/offline-store";
import { useRole } from "@/lib/role-store";

const NAV_LINKS = [
  { href: "/atlas", label: "Atlas" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/digitize", label: "Digitize" },
  { href: "/dss", label: "Schemes" },
  { href: "/research", label: "Research" },
];

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { role, setRole } = useRole();
  const { isOffline, queueCount, setOffline, clearQueue } = useOffline();
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success">("idle");
  const [syncedCount, setSyncedCount] = useState(0);

  const handleToggleOffline = () => {
    if (isOffline) {
      if (queueCount > 0) {
        setSyncedCount(queueCount);
        setSyncStatus("syncing");
        setOffline(false);
        
        // Simulate PostGIS database sync delay
        setTimeout(() => {
          setSyncStatus("success");
          clearQueue();
          
          setTimeout(() => {
            setSyncStatus("idle");
          }, 3000);
        }, 1800);
      } else {
        setOffline(false);
      }
    } else {
      setOffline(true);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line/80 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="flex items-center gap-2"
          onClick={() => setMenuOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-forest text-paper-raised font-display text-sm">
            त्र
          </span>
          <span className="font-display text-lg tracking-tight text-ink">
            TRINETRA
          </span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-mono text-xs uppercase tracking-wider text-ink-soft transition-colors hover:text-forest"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {/* Role Switcher Dropdown */}
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as any)}
            className="rounded-full border border-line bg-paper px-2.5 py-1.5 font-mono text-[10px] text-ink font-semibold tracking-wider transition-all focus:border-forest focus:outline-none cursor-pointer"
            title="Switch demo stakeholder role"
          >
            <option value="admin">Administrator</option>
            <option value="verifier">Verifier</option>
            <option value="community">Community Stakeholder</option>
          </select>

          {/* Offline Toggle Pill */}
          <button
            onClick={handleToggleOffline}
            type="button"
            disabled={syncStatus === "syncing"}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider font-bold transition-all border cursor-pointer disabled:opacity-50 ${
              isOffline
                ? "bg-pending/10 text-pending border-pending/30 hover:bg-pending/20"
                : "bg-approved/5 text-approved border-approved/15 hover:bg-approved/10"
            }`}
            title={isOffline ? "Offline mode active. Click to sync." : "Online mode active. Click to go offline."}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isOffline ? "bg-pending animate-pulse" : "bg-approved"}`} />
            <span>{isOffline ? "Offline" : "Online"}</span>
            {isOffline && queueCount > 0 && (
              <span className="ml-1 rounded-full bg-clay text-paper-raised px-1.5 py-0.5 text-[9px] font-sans font-bold">
                {queueCount} pending
              </span>
            )}
          </button>

          <Link
            href="/atlas"
            className="hidden rounded-full bg-clay px-4 py-2 font-mono text-xs uppercase tracking-wider text-paper-raised transition-colors hover:bg-clay-deep sm:inline-block"
          >
            Open Atlas
          </Link>
          <button
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink md:hidden"
          >
            {menuOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-line bg-paper md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col px-6 py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="border-b border-line/60 py-3 font-mono text-xs uppercase tracking-wider text-ink-soft last:border-b-0 hover:text-forest"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/atlas"
              onClick={() => setMenuOpen(false)}
              className="my-3 rounded-full bg-clay px-4 py-2.5 text-center font-mono text-xs uppercase tracking-wider text-paper-raised sm:hidden"
            >
              Open Atlas
            </Link>
          </div>
        </nav>
      )}

      {/* Floating Sync Toast Overlay */}
      {syncStatus !== "idle" && (
        <div className="fixed bottom-6 right-6 z-50 shadow-2xl transition-all duration-300">
          {syncStatus === "syncing" ? (
            <div className="flex items-center gap-3 rounded-lg border border-line bg-paper-raised p-4 pr-6">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-line border-t-clay" />
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-clay font-bold">Syncing Records</p>
                <p className="text-xs text-ink font-semibold">Pushing {syncedCount} claims to Supabase...</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-approved/30 bg-approved/5 p-4 pr-6 text-approved">
              <span className="text-sm">✓</span>
              <div>
                <p className="font-mono text-[9px] uppercase tracking-wider text-approved font-bold">Sync Success</p>
                <p className="text-xs text-ink font-semibold">Successfully synced {syncedCount} records!</p>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
