"use client";

import { useState } from "react";
import type { ExtractedFields, FieldConfidences } from "@/lib/ner";
import { useOffline } from "@/lib/offline-store";

const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  fullName: "Full name",
  village: "Village",
  district: "District",
  state: "State",
  category: "Category (ST / OTFD)",
  claimType: "Claim type (IFR / CR / CFR)",
  areaClaimedHectares: "Area claimed (ha)",
  householdSize: "Household size",
};

export function ReviewForm({
  initialFields,
  confidences,
  rawText,
}: {
  initialFields: ExtractedFields;
  confidences: FieldConfidences;
  rawText: string;
}) {
  const [fields, setFields] = useState(initialFields);
  const [edited, setEdited] = useState<Record<keyof ExtractedFields, boolean>>({} as any);
  const [showRaw, setShowRaw] = useState(false);
  const [saved, setSaved] = useState(false);

  const { isOffline, addClaim } = useOffline();

  const handleChange = (key: keyof ExtractedFields, val: string) => {
    setFields((prev) => ({ ...prev, [key]: val }));
    setEdited((prev) => ({ ...prev, [key]: true }));
  };

  const handleConfirm = () => {
    setSaved(true);
    if (isOffline) {
      addClaim(fields);
    }
  };

  const filledCount = Object.values(fields).filter((v) => v.trim()).length;
  const totalFields = Object.keys(fields).length;

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-clay">
            Verification Step
          </p>
          <h2 className="mt-1 font-display text-xl text-ink font-semibold">
            Human-in-the-Loop Review
          </h2>
        </div>
        <span className="rounded-full bg-forest/10 px-3 py-1 font-mono text-xs text-forest font-semibold">
          {filledCount}/{totalFields} fields extracted
        </span>
      </div>
      
      <p className="mt-4 text-sm text-ink-soft leading-relaxed">
        Verify the auto-extracted values against the scanned image. Fields edited by you are marked as <span className="text-water font-semibold">Human Verified</span>.
      </p>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {(Object.keys(fields) as (keyof ExtractedFields)[]).map((key) => {
          const isEdited = edited[key];
          const conf = confidences[key];
          const val = fields[key];
          const hasValue = !!val && val.trim().length > 0;

          return (
            <div key={key} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  {FIELD_LABELS[key]}
                </label>
                {hasValue ? (
                  isEdited ? (
                    <span className="inline-flex items-center rounded-full bg-water/10 px-2 py-0.5 font-mono text-[9px] font-bold text-water border border-water/20">
                      ✓ Human Verified
                    </span>
                  ) : (
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 font-mono text-[9px] font-bold border ${
                        conf > 85
                          ? "bg-approved/10 text-approved border-approved/20"
                          : conf >= 60
                          ? "bg-pending/10 text-pending border-pending/20"
                          : "bg-rejected/10 text-rejected border-rejected/20"
                      }`}
                    >
                      {conf}% CONF {conf > 85 ? "HIGH" : conf >= 60 ? "REVIEW" : "LOW"}
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center rounded-full bg-rejected/10 px-2 py-0.5 font-mono text-[9px] font-bold text-rejected border border-rejected/20">
                    NOT DETECTED
                  </span>
                )}
              </div>
              <input
                type="text"
                value={val}
                onChange={(e) => handleChange(key, e.target.value)}
                placeholder="Not detected — enter manually"
                className={`w-full rounded-md border bg-paper px-3 py-2 text-sm text-ink placeholder:text-ink-soft/40 focus:outline-none transition-all ${
                  isEdited
                    ? "border-water ring-1 ring-water/20 focus:border-water-deep"
                    : "border-line focus:border-forest"
                }`}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-2">
        <button
          type="button"
          onClick={() => setShowRaw((s) => !s)}
          className="font-mono text-xs uppercase tracking-wider text-ink-soft underline decoration-line underline-offset-4 hover:text-forest cursor-pointer"
        >
          {showRaw ? "Hide" : "Show"} raw OCR text
        </button>
        {showRaw && (
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg border border-line bg-paper p-3 font-mono text-xs text-ink-soft leading-relaxed">
            {rawText || "(no text detected)"}
          </pre>
        )}
      </div>

      <div className="mt-6 border-t border-line pt-5">
        {saved ? (
          <div className="rounded-lg bg-approved/10 border border-approved/20 p-3 text-sm text-approved font-semibold flex items-center gap-2">
            <span>✓</span>{" "}
            {isOffline
              ? "Record confirmed and saved offline locally."
              : "Record confirmed and queued for digitization."}
          </div>
        ) : (
          <button
            type="button"
            onClick={handleConfirm}
            className={`rounded-full px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-paper-raised transition-colors cursor-pointer ${
              isOffline
                ? "bg-clay hover:bg-clay-deep"
                : "bg-forest hover:bg-forest-deep"
            }`}
          >
            {isOffline ? "Confirm & Save Offline" : "Confirm record"}
          </button>
        )}
        <p className="mt-3 text-[11px] text-ink-soft italic leading-relaxed">
          Demo note: this confirms locally in your browser only. The public
          demo doesn't write new records to the database — the Atlas and
          Dashboard reflect the seeded dataset, not submissions from here.
        </p>
      </div>
    </div>
  );
}
