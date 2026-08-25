"use client";

import type { ClaimMapRow } from "@/lib/types";
import { evaluateSchemes, STATIC_SCHEMES } from "@/lib/dss";

interface ConvergenceCardModalProps {
  claim: ClaimMapRow;
  onClose: () => void;
}

// Map scheme codes to standard Indian citizen next-steps documents
const SCHEME_ACTION_STEPS: Record<string, string> = {
  PM_KISAN: "Submit copy of FRA Title Deed (Patta), Aadhaar Card, and bank passbook to the local Patwari / Revenue Office.",
  MGNREGA: "Register FRA Title Deed copy at Gram Panchayat to claim prioritized wage employment & job card allocation.",
  JJM: "Submit tap connection application to GP Water & Sanitation Committee (VWSC) referencing ULPIN.",
  DAJGUA: "Submit ST Certificate and land title registry documents to the block development officer (BDO).",
  PM_JANMAN: "Submit PVTG/ST household certificate and FRA registry details for emergency housing and solar micro-grid benefit.",
};

export function ConvergenceCardModal({ claim, onClose }: ConvergenceCardModalProps) {
  const results = evaluateSchemes(claim, STATIC_SCHEMES);
  const eligibleSchemes = results.filter((r) => r.eligible);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const currentDate = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      {/* Backdrop Close click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Styled Print stylesheet injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-card-overlay, .print-card-overlay * {
            visibility: visible;
          }
          .print-card-overlay {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Modal Box */}
      <div className="print-card-overlay relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-paper-raised p-6 shadow-2xl border border-line animate-in zoom-in-95 duration-250 flex flex-col no-print-shadow">
        
        {/* Modal Controls (No Print) */}
        <div className="no-print flex items-center justify-between border-b border-line pb-3 mb-5">
          <h3 className="font-mono text-xs uppercase tracking-wider text-clay font-bold">Welfare Convergence</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              type="button"
              className="rounded-full bg-forest px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider text-paper-raised hover:bg-forest-deep transition-all cursor-pointer flex items-center gap-1"
            >
              🖨️ Print Card
            </button>
            <button
              onClick={onClose}
              type="button"
              className="rounded-full border border-line px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-ink-soft hover:text-ink hover:border-forest transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>

        {/* Printable Card Frame */}
        <div className="border-[4px] border-double border-forest/60 p-6 rounded-lg bg-paper/50 flex-1 relative overflow-hidden print:border-[6px]">
          
          {/* Card Watermark */}
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
            <span className="font-display text-[150px] font-bold">त्र</span>
          </div>

          {/* Card Top Header */}
          <div className="flex items-start justify-between border-b border-line pb-4 mb-4">
            <div>
              <p className="font-mono text-[9px] uppercase tracking-widest text-forest font-bold leading-none">Government of India</p>
              <h2 className="font-display text-xl text-ink font-bold mt-1 tracking-tight">WELFARE CONVERGENCE CARD</h2>
              <p className="text-[10px] text-ink-soft mt-0.5 uppercase tracking-wider font-mono">Forest Rights Act (FRA) Integrated Ledger</p>
            </div>
            <div className="text-right">
              <span className="inline-block rounded bg-forest text-paper-raised px-2 py-0.5 font-mono text-[8px] font-bold tracking-wider">
                ACTIVE REFERRAL
              </span>
              <p className="font-mono text-[9px] text-ink-soft mt-1">Generated: {currentDate}</p>
            </div>
          </div>

          {/* Claimant Profile Info Grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs bg-paper p-4 rounded-lg border border-line shadow-xs mb-6">
            <div>
              <span className="text-[9px] uppercase tracking-wider font-mono text-ink-soft block font-bold">Claimant Name</span>
              <span className="text-sm font-semibold text-ink">{claim.full_name}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-mono text-ink-soft block font-bold">ULPIN Code</span>
              <span className="font-mono text-sm font-semibold text-ink tracking-wider">{claim.ulpin || "N/A"}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-mono text-ink-soft block font-bold">Location</span>
              <span className="text-ink font-medium">{claim.village}, {claim.district}, {claim.state_name}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-mono text-ink-soft block font-bold">Demographics</span>
              <span className="text-ink font-medium">Category: {claim.category} | HH Size: {claim.household_size}</span>
            </div>
            <div>
              <span className="text-[9px] uppercase tracking-wider font-mono text-ink-soft block font-bold">Land Parcel Claimed</span>
              <span className="text-ink font-mono font-semibold">{claim.area_claimed_hectares} ha | Status: {claim.status.toUpperCase()}</span>
            </div>
            <div className="flex items-center justify-end">
              <div className="border border-approved/50 bg-approved/5 text-approved rounded-full px-2.5 py-1 text-[9px] font-mono font-bold tracking-wider uppercase scale-95 border-dashed">
                ✓ Verified Referral
              </div>
            </div>
          </div>

          {/* Schemes Referral Ledger */}
          <div>
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-ink-soft border-b border-line pb-1.5 mb-3">
              Matched Scheme Referrals ({eligibleSchemes.length})
            </h3>
            
            {eligibleSchemes.length === 0 ? (
              <p className="text-xs text-ink-soft italic text-center py-4 bg-paper rounded border border-line">
                No eligible welfare scheme matches found based on the current title & category profile.
              </p>
            ) : (
              <div className="space-y-4">
                {eligibleSchemes.map((s) => (
                  <div key={s.schemeCode} className="border-b border-line/60 pb-3 last:border-b-0 last:pb-0">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-semibold text-xs text-ink">{s.schemeName}</p>
                      <span className="rounded-full bg-approved/10 text-approved border border-approved/20 px-2 py-0.5 font-mono text-[8px] font-bold uppercase tracking-wider">
                        Qualifies (Not Enrolled)
                      </span>
                    </div>
                    {s.schemeDescription && (
                      <p className="text-[10px] text-ink-soft leading-tight mt-0.5">{s.schemeDescription}</p>
                    )}
                    <div className="mt-1.5 bg-paper-raised/70 border border-line/65 rounded p-2 text-[10px] text-ink flex items-start gap-1.5">
                      <span className="text-forest font-bold select-none">👉</span>
                      <p className="leading-normal font-sans text-ink-soft"><strong className="text-ink font-semibold">Action Required:</strong> {SCHEME_ACTION_STEPS[s.schemeCode] || "Submit details to block program officer."}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Barcode & Ledger Seal */}
          <div className="mt-8 border-t border-line/80 pt-5 flex items-center justify-between">
            <div className="text-[8px] text-ink-soft font-mono uppercase leading-tight">
              <p>System Ref: TRINETRA-DSS-v1.4</p>
              <p>Security Code: SEC-{claim.claim_id.substring(0, 8).toUpperCase()}</p>
            </div>
            
            {/* Real styled CSS barcode */}
            <div className="flex flex-col items-center gap-0.5 select-none">
              <div className="h-7 w-40 flex items-stretch border-x border-ink bg-white">
                <div className="w-[1px] bg-ink mr-[2px]" />
                <div className="w-[3px] bg-ink mr-[1px]" />
                <div className="w-[1px] bg-ink mr-[3px]" />
                <div className="w-[2px] bg-ink mr-[1px]" />
                <div className="w-[4px] bg-ink mr-[2px]" />
                <div className="w-[1px] bg-ink mr-[1px]" />
                <div className="w-[3px] bg-ink mr-[3px]" />
                <div className="w-[2px] bg-ink mr-[2px]" />
                <div className="w-[1px] bg-ink mr-[1px]" />
                <div className="w-[3px] bg-ink" />
              </div>
              <span className="font-mono text-[7px] text-ink-soft tracking-[3px] uppercase">*{claim.ulpin || "AWAITING"}*</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
