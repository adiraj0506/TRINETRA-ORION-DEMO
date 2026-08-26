"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";

export interface AttachedDoc {
  id: string;
  documentType:
    | "claim_form"
    | "patta"
    | "gram_sabha_resolution"
    | "identity_document"
    | "land_record"
    | "supporting_evidence"
    | "field_photo"
    | "other";
  documentName: string;
  documentRefNumber?: string;
  mimeType: string;
  fileSize: number;
  previewUrl?: string;
}

const DOC_TYPE_OPTIONS = [
  { value: "identity_document", label: "Claimant ID (Aadhaar / Voter / Ration Card)" },
  { value: "gram_sabha_resolution", label: "Gram Sabha Resolution / Recommendation Letter" },
  { value: "patta", label: "Land Title / Patta / Revenue Deed" },
  { value: "land_record", label: "Legacy Land / Tax Record" },
  { value: "field_photo", label: "Field Survey / Ground Evidence Photo" },
  { value: "supporting_evidence", label: "Other Supporting Evidence" },
];

export function UploadPanel({
  onFileSelected,
  onUseSample,
  previewUrl,
  disabled,
  supplementaryDocs = [],
  onAddSupplementaryDoc,
  onRemoveSupplementaryDoc,
}: {
  onFileSelected: (file: File) => void;
  onUseSample: () => void;
  previewUrl: string | null;
  disabled: boolean;
  supplementaryDocs?: AttachedDoc[];
  onAddSupplementaryDoc?: (doc: AttachedDoc) => void;
  onRemoveSupplementaryDoc?: (docId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const suppInputRef = useRef<HTMLInputElement>(null);

  // Supplementary document form state
  const [selectedType, setSelectedType] = useState<AttachedDoc["documentType"]>("identity_document");
  const [refNumber, setRefNumber] = useState("");
  const [showSuppModal, setShowSuppModal] = useState(false);
  const [tempFile, setTempFile] = useState<File | null>(null);

  const handleSuppFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTempFile(file);
      setShowSuppModal(true);
    }
  };

  const handleConfirmSupplementaryDoc = () => {
    if (!tempFile || !onAddSupplementaryDoc) return;
    const url = URL.createObjectURL(tempFile);
    const newDoc: AttachedDoc = {
      id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      documentType: selectedType,
      documentName: tempFile.name,
      documentRefNumber: refNumber.trim() || undefined,
      mimeType: tempFile.type || "application/pdf",
      fileSize: tempFile.size,
      previewUrl: url,
    };
    onAddSupplementaryDoc(newDoc);
    setTempFile(null);
    setRefNumber("");
    setShowSuppModal(false);
  };

  return (
    <div className="space-y-6">
      {/* 1. Primary Scanned Claim Form (Undergoes OCR) */}
      <div className="rounded-xl border border-line bg-paper-raised p-6 shadow-sm">
        <p className="font-mono text-xs uppercase tracking-wider text-clay font-bold">
          Primary Document (OCR Pipeline)
        </p>
        <h2 className="mt-2 font-display text-xl text-ink font-semibold">
          2. Upload Scanned Claim Form
        </h2>
        <p className="mt-1 text-xs text-ink-soft">
          Upload the physical FRA Form A/B/C for automated optical character recognition.
        </p>

        <div
          onClick={() => !disabled && inputRef.current?.click()}
          className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line px-6 py-8 text-center transition-colors ${
            disabled ? "opacity-50" : "hover:border-forest"
          }`}
        >
          <span className="text-2xl mb-1">📄</span>
          <p className="text-xs text-ink font-semibold">
            Click to upload primary claim form (JPG, PNG)
          </p>
          <p className="text-[10px] text-ink-soft mt-0.5">Scanned resolution or Form A</p>
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            disabled={disabled}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onFileSelected(file);
            }}
          />
        </div>

        <Button
          onClick={onUseSample}
          disabled={disabled}
          variant="clay"
          size="sm"
          className="mt-3 w-full"
        >
          Use sample claim form
        </Button>

        {previewUrl && (
          <div className="mt-4 overflow-hidden rounded-lg border border-line">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Uploaded claim form preview"
              className="w-full max-h-72 object-contain bg-paper"
            />
          </div>
        )}
      </div>

      {/* 2. Supplementary Claimant Identification & Verification Documents */}
      <div className="rounded-xl border border-line bg-paper-raised p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-clay font-bold">
              Verification & KYC
            </p>
            <h3 className="font-display text-lg text-ink font-semibold">
              3. Claimant ID & Verification Documents
            </h3>
          </div>
          <span className="rounded-full bg-forest/10 px-2.5 py-0.5 font-mono text-[10px] font-bold text-forest">
            {supplementaryDocs.length} attached
          </span>
        </div>

        <p className="mt-2 text-xs text-ink-soft">
          Attach claimant identification (Aadhaar, Voter ID), Gram Sabha recommendation letter, legacy Patta deed, or ground evidence.
        </p>

        {/* Attached Documents List */}
        {supplementaryDocs.length > 0 && (
          <div className="mt-4 space-y-2.5">
            {supplementaryDocs.map((doc) => {
              const typeLabel = DOC_TYPE_OPTIONS.find((t) => t.value === doc.documentType)?.label || doc.documentType;
              return (
                <div
                  key={doc.id}
                  className="rounded-lg border border-line bg-paper p-3 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-ink truncate">{doc.documentName}</span>
                      <span className="rounded bg-forest/10 text-forest px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wider font-bold shrink-0">
                        {doc.documentType === "identity_document"
                          ? "Aadhaar / ID"
                          : doc.documentType === "gram_sabha_resolution"
                          ? "Gram Sabha Letter"
                          : doc.documentType === "patta"
                          ? "Patta Deed"
                          : "Supporting Evidence"}
                      </span>
                    </div>
                    <p className="text-[10px] text-ink-soft mt-0.5 truncate">
                      {doc.documentRefNumber ? `Ref: ${doc.documentRefNumber} · ` : ""}
                      {(doc.fileSize / 1024).toFixed(1)} KB
                    </p>
                  </div>

                  {onRemoveSupplementaryDoc && (
                    <button
                      onClick={() => onRemoveSupplementaryDoc(doc.id)}
                      type="button"
                      className="text-rejected hover:text-rejected/80 text-xs px-2 py-1 cursor-pointer"
                      title="Remove document"
                    >
                      ✕
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Add Supplementary Document Trigger Button */}
        <div className="mt-4">
          <input
            ref={suppInputRef}
            type="file"
            accept="image/*,application/pdf"
            disabled={disabled}
            className="hidden"
            onChange={handleSuppFileChange}
          />
          <button
            onClick={() => !disabled && suppInputRef.current?.click()}
            disabled={disabled}
            type="button"
            className="w-full rounded-lg border border-dashed border-line hover:border-forest bg-paper py-3 px-4 text-xs font-mono uppercase tracking-wider text-ink font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <span>+</span> Attach ID, Gram Sabha Letter, or Patta
          </button>
        </div>
      </div>

      {/* Upload Supplementary Document Detail Modal */}
      {showSuppModal && tempFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-xl border border-line bg-paper-raised p-6 shadow-xl space-y-4">
            <h4 className="font-display text-lg font-semibold text-ink">
              Configure Attached Document
            </h4>
            <p className="text-xs text-ink-soft">
              File selected: <strong className="text-ink">{tempFile.name}</strong> ({(tempFile.size / 1024).toFixed(1)} KB)
            </p>

            <div>
              <label className="text-xs font-semibold uppercase font-mono text-ink-soft block mb-1.5">
                Document Category:
              </label>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-forest focus:outline-none cursor-pointer"
              >
                {DOC_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase font-mono text-ink-soft block mb-1.5">
                Document Reference Number / Identifier (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Aadhaar: XXXX-1234, Resolution: GS-2024-42, Patta No: 8891"
                value={refNumber}
                onChange={(e) => setRefNumber(e.target.value)}
                className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-xs text-ink focus:border-forest focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setTempFile(null);
                  setShowSuppModal(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleConfirmSupplementaryDoc}
              >
                Attach Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
