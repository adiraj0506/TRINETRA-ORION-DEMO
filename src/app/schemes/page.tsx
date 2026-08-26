"use client";

import Link from "next/link";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ArrowRight, ShieldCheck, Sprout, Droplets, HardHat, Home } from "lucide-react";

const SCHEME_DETAILS = [
  {
    id: "pm-kisan",
    name: "PM-KISAN",
    fullName: "Pradhan Mantri Kisan Samman Nidhi",
    ministry: "Ministry of Agriculture & Farmers Welfare",
    icon: Sprout,
    benefit: "₹6,000 / year direct benefit transfer in 3 four-monthly installments",
    fraLinkage: "Recognized IFR (Individual Forest Rights) titleholders qualify as landholding farmers.",
    eligibility: [
      "Must hold a valid, approved IFR or CR land title under FRA Section 3(1)(a)",
      "Claim area >= 0.01 hectares",
      "Active bank account linked with Aadhaar for DBT transfer",
      "Not an institutional landholder or income tax payee",
    ],
    status: "Active Convergence",
  },
  {
    id: "mgnrega",
    name: "MGNREGA",
    fullName: "Mahatma Gandhi National Rural Employment Guarantee Act",
    ministry: "Ministry of Rural Development",
    icon: HardHat,
    benefit: "Up to 150 days of guaranteed wage employment (vs 100 general days) + on-farm land leveling & bunding",
    fraLinkage: "Schedule 1, Category IV mandates individual land development works on FRA patta plots.",
    eligibility: [
      "Any rural household with an approved FRA land title (IFR/CR)",
      "Job Card issued by Gram Panchayat",
      "Priority inclusion for land leveling, farm ponds, and plantation works on FRA parcels",
    ],
    status: "Active Convergence",
  },
  {
    id: "jjm",
    name: "Jal Jeevan Mission (JJM)",
    fullName: "Har Ghar Jal — Jal Jeevan Mission",
    ministry: "Ministry of Jal Shakti",
    icon: Droplets,
    benefit: "Functional Household Tap Connection (FHTC) providing 55 LPCD potable water",
    fraLinkage: "Mandatory saturation coverage for habitations on forest land and unsurveyed forest villages.",
    eligibility: [
      "Resident household in a revenue or forest village within FRA mapped boundaries",
      "Gram Sabha verification of habitation coordinates",
    ],
    status: "Active Convergence",
  },
  {
    id: "dajgua",
    name: "DAJGUA / PM-JANMAN",
    fullName: "Dharti Aaba Janjatiya Gram Utkarsh Abhiyan & PM-JANMAN",
    ministry: "Ministry of Tribal Affairs",
    icon: Home,
    benefit: "Multi-sectoral critical gap filling: Pucca housing (PMAY-G), solar micro-grids, all-weather roads, and VDVK centres",
    fraLinkage: "Direct saturation mission targeting 63,000+ tribal majority villages and PVTG habitations.",
    eligibility: [
      "Households belonging to Particularly Vulnerable Tribal Groups (PVTG) or ST category",
      "Villages with >50% tribal population or notified forest villages under FRA",
    ],
    status: "Active Convergence",
  },
];

export default function SchemesPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-12">
      <PageHeader
        eyebrow="Cross-Ministerial Welfare Convergence"
        title="Scheme Convergence"
        description="A statutory title under the Forest Rights Act is the gateway to post-title welfare. TRINETRA deterministically matches verified titleholders with central & state development schemes."
      >
        <Button href="/dss" variant="clay" icon={<ArrowRight size={14} />}>
          Launch DSS Engine
        </Button>
      </PageHeader>

      {/* 4-Step Convergence Workflow */}
      <div className="mb-12 rounded-xl border border-line bg-paper-raised p-6">
        <p className="font-mono text-xs uppercase tracking-wider text-clay font-bold mb-4">
          Convergence Architecture
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {[
            {
              step: "01",
              title: "FRA Rights Title",
              desc: "Gram Sabha, SDLC & DLC verify and approve individual (IFR) or community (CFR) title.",
            },
            {
              step: "02",
              title: "PostGIS Land Binding",
              desc: "Plot parcel is assigned a unique ULPIN and spatial polygon boundary.",
            },
            {
              step: "03",
              title: "Deterministic Matching",
              desc: "DSS rule engine evaluates land area, category (ST/OTFD), and household demographics.",
            },
            {
              step: "04",
              title: "Welfare Delivery",
              desc: "Verified Referral Packages are generated for direct department sanctioning.",
            },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="rounded-lg border border-line bg-paper p-4 relative flex flex-col justify-between"
            >
              <div>
                <span className="font-mono text-2xl font-bold text-forest/40 block mb-1">
                  {item.step}
                </span>
                <h4 className="font-display text-base font-semibold text-ink">
                  {item.title}
                </h4>
                <p className="mt-1.5 text-xs text-ink-soft leading-relaxed">
                  {item.desc}
                </p>
              </div>
              {idx < 3 && (
                <div className="hidden md:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-line font-mono text-xs">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Scheme Cards Grid */}
      <div className="space-y-8">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <h2 className="font-display text-2xl text-ink font-semibold">
              Supported Central Sector Schemes
            </h2>
            <p className="text-xs text-ink-soft mt-0.5">
              Targeted welfare programmes integrated into TRINETRA's automated Decision Support System.
            </p>
          </div>
          <span className="rounded-full bg-forest/10 px-3 py-1 font-mono text-xs font-bold text-forest">
            4 Schemes Active
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {SCHEME_DETAILS.map((scheme) => {
            const IconComp = scheme.icon;
            return (
              <Card key={scheme.id} className="flex flex-col justify-between" variant="raised">
                <div>
                  <div className="flex items-start justify-between gap-4 border-b border-line pb-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-forest/10 text-forest shrink-0">
                        <IconComp size={20} />
                      </div>
                      <div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-clay font-bold">
                          {scheme.name}
                        </span>
                        <h3 className="font-display text-lg text-ink font-semibold">
                          {scheme.fullName}
                        </h3>
                        <p className="font-mono text-[10px] text-ink-soft mt-0.5">
                          {scheme.ministry}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5 text-xs">
                    <div className="rounded-lg bg-paper p-3 border border-line">
                      <strong className="text-ink font-semibold block font-mono text-[10px] uppercase tracking-wider text-forest mb-1">
                        Core Welfare Benefit:
                      </strong>
                      <p className="text-ink-soft leading-relaxed">{scheme.benefit}</p>
                    </div>

                    <div>
                      <strong className="text-ink font-semibold block font-mono text-[10px] uppercase tracking-wider text-clay mb-1">
                        FRA Statutory Linkage:
                      </strong>
                      <p className="text-ink-soft leading-relaxed">{scheme.fraLinkage}</p>
                    </div>

                    <div>
                      <strong className="text-ink font-semibold block font-mono text-[10px] uppercase tracking-wider text-ink-soft mb-1.5">
                        Mandatory Eligibility Rules:
                      </strong>
                      <ul className="space-y-1.5">
                        {scheme.eligibility.map((rule, rIdx) => (
                          <li key={rIdx} className="flex items-start gap-2 text-ink-soft">
                            <CheckCircle2 size={13} className="text-approved shrink-0 mt-0.5" />
                            <span>{rule}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-line flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-approved flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-approved" />
                    {scheme.status}
                  </span>
                  <Button href="/dss" size="sm" variant="secondary">
                    Match Claimants →
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Call to Action Banner */}
      <div className="mt-12 rounded-xl bg-forest p-8 text-center text-paper-raised">
        <h3 className="font-display text-2xl font-semibold">
          Ready to evaluate scheme convergence for titleholders?
        </h3>
        <p className="mt-2 text-sm text-paper-raised/80 max-w-xl mx-auto">
          Open the Decision Support System to run the explainable rule engine on any claimant profile and generate certified welfare convergence cards.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button href="/dss" variant="clay">
            Open Decision Support System
          </Button>
          <Button href="/dashboard" variant="outline" className="border-paper-raised/30 text-paper-raised hover:bg-forest-light">
            View Welfare Telemetry
          </Button>
        </div>
      </div>
    </div>
  );
}
