"use client";

import { useState } from "react";
import Link from "next/link";
import type { ExtractedFields, FieldConfidences } from "@/lib/ner";
import { submitClaimToDatabase } from "@/lib/queries";
import { useOffline } from "@/lib/offline-store";
import { saveClaimOffline } from "@/lib/offline-db";

const FIELD_LABELS: Record<keyof ExtractedFields, string> = {
  fullName: "1. Name(s) of Holder(s) of Forest rights",
  guardianName: "2. Name of Father/Mother",
  dependents: "3. Name of Dependents",
  address: "4. Address",
  village: "5. Village/Gram Sabha",
  gramPanchayat: "6. Gram Panchayat",
  block: "7. Tehsil/Taluka",
  district: "8. District",
  category: "9. Whether Scheduled Tribe or OTFD",
  areaClaimedHectares: "10. Area",
  plotNumber: "11. Khasra/compartment No.",
};

interface ReviewFormProps {
  initialFields: ExtractedFields;
  confidences: FieldConfidences;
  rawText: string;
  previewUrl?: string | null;
  supplementaryDocs?: any[];
}

export function ReviewForm({
  initialFields,
  confidences,
  rawText,
  previewUrl,
  supplementaryDocs = [],
}: ReviewFormProps) {
  const [fields, setFields] = useState(initialFields);
  const [edited, setEdited] = useState<Record<keyof ExtractedFields, boolean>>({} as any);
  const [showRaw, setShowRaw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedResult, setSubmittedResult] = useState<{
    claimId: string;
    claimantId: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isOffline, addClaim } = useOffline();

  const handleChange = (key: keyof ExtractedFields, val: string) => {
    setFields((prev) => ({ ...prev, [key]: val }));
    setEdited((prev) => ({ ...prev, [key]: true }));
  };

  const handleConfirmAndSubmit = async () => {
    setError(null);

    // Clean and normalize state code from address or district, defaulting to "OD"
    let stateCode = "OD";
    const fullSearch = `${fields.address} ${fields.district} ${fields.village}`.toUpperCase();
    if (fullSearch.includes("MP") || fullSearch.includes("MADHYA")) stateCode = "MP";
    else if (fullSearch.includes("TS") || fullSearch.includes("TELANGANA")) stateCode = "TS";
    else if (fullSearch.includes("TR") || fullSearch.includes("TRIPURA")) stateCode = "TR";

    const extractedFieldsMap: Record<string, { value: string; confidence: number }> = {};
    (Object.keys(fields) as (keyof ExtractedFields)[]).forEach((k) => {
      extractedFieldsMap[k] = {
        value: fields[k],
        confidence: confidences[k] || 85,
      };
    });

    const avgConfidence =
      Object.values(confidences).reduce((a, b) => a + b, 0) /
      (Object.keys(confidences).length || 1);

    // Parse Area Bighas if specified, otherwise fallback to parsing float
    let areaVal = 1.45;
    const rawArea = fields.areaClaimedHectares || "";
    if (rawArea.toLowerCase().includes("bigha")) {
      const match = rawArea.match(/(\d+)[-\s]+(\d+)[-\s]+(\d+)/) || rawArea.match(/(\d+(\.\d+)?)/);
      if (match) {
        const valNum = parseFloat(match[1]);
        areaVal = valNum * 0.08; // conversion
      }
    } else {
      areaVal = parseFloat(rawArea) || 1.45;
    }

    const payload = {
      fullName: fields.fullName || "Claimant Candidate",
      guardianName: fields.guardianName || null,
      dependents: fields.dependents || null,
      address: fields.address || null,
      village: fields.village || "Village Center",
      gramPanchayat: fields.gramPanchayat || null,
      block: fields.block || null,
      district: fields.district || "District Center",
      stateCode,
      category: fields.category?.toUpperCase().includes("OTFD") || fields.category?.toUpperCase().includes("OTHER") ? "OTFD" : "ST",
      claimType: "IFR", // Defaulting to Individual Forest Rights
      areaClaimedHectares: areaVal,
      householdSize: fields.dependents ? fields.dependents.split(/[,;]+/).length + 1 : 4,
      plotNumber: fields.plotNumber || null,
      rawOcrText: rawText,
      ocrConfidence: Math.round(avgConfidence),
      extractedFields: extractedFieldsMap,
      documentName: "scanned_claim_form.png",
      supplementaryDocuments: supplementaryDocs.map((d) => ({
        documentType: d.documentType,
        documentName: d.documentName,
        documentRefNumber: d.documentRefNumber,
        mimeType: d.mimeType,
        fileSize: d.fileSize,
      })),
    };

    // If offline mode toggle or physically offline, save locally to IndexedDB queue
    if (isOffline || (typeof navigator !== "undefined" && !navigator.onLine)) {
      setSubmitting(true);
      try {
        await saveClaimOffline(payload);
        setSubmittedResult({
          claimId: "offline-queued",
          claimantId: "offline-pending",
        });
      } catch (err: any) {
        console.error(err);
        setError("Failed to queue claim offline: " + (err.message || err.toString()));
      } finally {
        setSubmitting(false);
      }
      return;
    }

    setSubmitting(true);
    try {
      const res = await submitClaimToDatabase(payload);
      setSubmittedResult({
        claimId: res.claimId,
        claimantId: res.claimantId,
      });
    } catch (err: any) {
      console.error(err);
      console.log("[TRINETRA] Network submission failed, falling back to local IndexedDB queue...");
      try {
        await saveClaimOffline(payload);
        setSubmittedResult({
          claimId: "offline-queued",
          claimantId: "offline-pending",
        });
      } catch (saveErr: any) {
        setError(`Submission failed: ${err.message || err.toString()}. (Local queue save also failed: ${saveErr.message})`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const filledCount = Object.values(fields).filter((v) => v.trim()).length;
  const totalFields = Object.keys(fields).length;

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-6 shadow-sm">
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-clay">
            Stage 5: Human-in-the-Loop Validation
          </p>
          <h2 className="mt-1 font-display text-xl text-ink font-semibold">
            Field Review & Confirmation
          </h2>
        </div>
        <span className="rounded-full bg-forest/10 px-3 py-1 font-mono text-xs text-forest font-semibold">
          {filledCount}/{totalFields} fields extracted
        </span>
      </div>

      <p className="mt-4 text-sm text-ink-soft leading-relaxed">
        Verify auto-extracted values against the scanned document. Edited values are marked as{" "}
        <span className="text-water font-semibold">Human Verified</span>.
      </p>

      {error && (
        <div className="mt-4 rounded-lg bg-rejected/10 border border-rejected/30 p-3 text-xs text-rejected font-medium">
          {error}
        </div>
      )}

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

      {/* Supplementary Documents Verification Section */}
      {supplementaryDocs && supplementaryDocs.length > 0 && (
        <div className="mt-6 rounded-lg border border-line bg-paper p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-ink-soft font-bold">
              Attached Identification & Verification Documents ({supplementaryDocs.length})
            </span>
            <span className="text-[10px] font-mono text-approved font-semibold">✓ Ready for linking</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            {supplementaryDocs.map((doc, idx) => (
              <div key={idx} className="rounded border border-line bg-paper-raised p-2.5 flex items-center justify-between text-xs">
                <div className="truncate mr-2">
                  <span className="font-semibold text-ink block truncate">{doc.documentName}</span>
                  <span className="text-[10px] text-ink-soft font-mono">
                    {doc.documentType === "identity_document"
                      ? "Aadhaar / ID"
                      : doc.documentType === "gram_sabha_resolution"
                      ? "Gram Sabha Letter"
                      : doc.documentType === "patta"
                      ? "Patta Deed"
                      : "Supporting Doc"}
                    {doc.documentRefNumber ? ` · Ref: ${doc.documentRefNumber}` : ""}
                  </span>
                </div>
                <span className="text-approved text-xs">✓</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 border-t border-line pt-5">
        {submittedResult ? (
          <div className="space-y-4">
            {submittedResult.claimId === "offline-queued" ? (
              <div className="rounded-xl bg-clay/10 border border-clay/30 p-5 text-clay">
                <div className="flex items-center gap-2 font-display text-base font-semibold">
                  <span>💾</span> Claim Saved Offline Successfully
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  You are currently offline. The digitized claim has been securely stored locally in **IndexedDB**. It will automatically upload to the central database once internet connection is restored.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <button
                    onClick={() => window.location.reload()}
                    className="rounded-full bg-clay text-paper-raised px-4 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all hover:bg-clay-deep"
                  >
                    Digitize Another Form
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl bg-approved/10 border border-approved/30 p-5 text-approved">
                <div className="flex items-center gap-2 font-display text-base font-semibold">
                  <span>✓</span> Claim Registered Successfully
                </div>
                <p className="mt-1 text-xs text-ink-soft">
                  Claim has been registered with ID{" "}
                  <span className="font-mono font-bold text-ink">{submittedResult.claimId}</span>. It is now active in the Admin Verification Queue and FRA Atlas.
                </p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  <Link
                    href={`/claims/${submittedResult.claimId}`}
                    className="rounded-full bg-forest text-paper-raised px-4 py-2 font-mono text-[10px] uppercase tracking-wider font-bold transition-all hover:bg-forest-deep"
                  >
                    View Claim Dossier →
                  </Link>
                  <Link
                    href="/admin"
                    className="rounded-full border border-forest/30 bg-paper px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-forest font-bold hover:bg-forest/5"
                  >
                    Open Admin Queue
                  </Link>
                  <Link
                    href="/atlas"
                    className="rounded-full border border-line bg-paper px-4 py-2 font-mono text-[10px] uppercase tracking-wider text-ink font-bold hover:border-forest"
                  >
                    View in Atlas
                  </Link>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <button
              type="button"
              disabled={submitting}
              onClick={handleConfirmAndSubmit}
              className={`rounded-full px-6 py-3 font-mono text-xs uppercase tracking-wider text-paper-raised transition-all cursor-pointer font-bold disabled:opacity-50 ${
                isOffline ? "bg-clay hover:bg-clay-deep" : "bg-forest hover:bg-forest-deep shadow-md"
              }`}
            >
              {submitting
                ? "Submitting Claim..."
                : isOffline
                ? "Confirm & Save Offline"
                : "Confirm & Submit Claim For Verification"}
            </button>

            <span className="text-[11px] text-ink-soft italic">
              Generates PostGIS centroid, OCR audit trail, and verification queue task.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
