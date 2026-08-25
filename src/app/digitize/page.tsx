"use client";

import { useState } from "react";
import { UploadPanel } from "@/components/digitize/upload-panel";
import { useRole } from "@/lib/role-store";
import { OcrProgress } from "@/components/digitize/ocr-progress";
import { ReviewForm } from "@/components/digitize/review-form";
import {
  extractFields,
  extractFieldsWithConfidence,
  EMPTY_FIELDS,
  EMPTY_CONFIDENCES,
  type ExtractedFields,
  type FieldConfidences,
} from "@/lib/ner";

type Stage = "idle" | "recognizing" | "done";

/** Rasterizes the sample SVG onto a canvas and returns a PNG data URL —
 * guarantees Tesseract receives a proper raster image regardless of its
 * SVG support. */
async function rasterizeSvg(url: string): Promise<string> {
  const img = new Image();
  img.src = url;
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });
  const scale = 1.5;
  const canvas = document.createElement("canvas");
  canvas.width = img.width * scale;
  canvas.height = img.height * scale;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/png");
}

const LANGUAGES = [
  { code: "eng", name: "English", supported: true },
  { code: "hin", name: "Hindi (हिन्दी)", supported: true },
  { code: "ori", name: "Odia (ଓଡ଼ିଆ)", supported: true },
  { code: "gon", name: "Gondi (गोंडी)", supported: false },
  { code: "kor", name: "Korku (कोर्कू)", supported: false },
];

export default function DigitizePage() {
  const { isCommunity } = useRole();
  const [stage, setStage] = useState<Stage>("idle");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [ocrStatus, setOcrStatus] = useState("");
  const [rawText, setRawText] = useState("");
  const [fields, setFields] = useState<ExtractedFields>(EMPTY_FIELDS);
  const [confidences, setConfidences] = useState<FieldConfidences>(EMPTY_CONFIDENCES);
  const [error, setError] = useState<string | null>(null);
  const [selectedLang, setSelectedLang] = useState("eng");
  const [langWarning, setLangWarning] = useState<string | null>(null);
  const [supplementaryDocs, setSupplementaryDocs] = useState<any[]>([]);

  const handleAddSupplementaryDoc = (doc: any) => {
    setSupplementaryDocs((prev) => [...prev, doc]);
  };

  const handleRemoveSupplementaryDoc = (docId: string) => {
    setSupplementaryDocs((prev) => prev.filter((d) => d.id !== docId));
  };

  async function runOcr(imageSource: string | File, langCode: string) {
    setError(null);
    setStage("recognizing");
    setProgress(0);
    setOcrStatus("initializing");

    try {
      const { createWorker } = await import("tesseract.js");
      
      const langConfig = LANGUAGES.find((l) => l.code === langCode);
      const ocrLang = langConfig?.supported ? langConfig.code : "eng";

      const worker = await createWorker(ocrLang, 1, {
        logger: (m) => {
          if (m.status) setOcrStatus(m.status);
          if (typeof m.progress === "number") setProgress(m.progress);
        },
      });
      const { data } = await worker.recognize(imageSource);
      await worker.terminate();

      setRawText(data.text);
      const dataAny = data as any;
      const result = extractFieldsWithConfidence(
        data.text,
        dataAny.lines || [],
        dataAny.words || []
      );
      setFields(result.fields);
      setConfidences(result.confidences);
      setStage("done");
    } catch (err) {
      console.error(err);
      setError(
        "OCR failed to run. This can happen on a slow connection the first time (it downloads a language model) — try again in a moment."
      );
      setStage("idle");
    }
  }

  async function handleFileSelected(file: File) {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    await runOcr(file, selectedLang);
  }

  async function handleUseSample() {
    try {
      const dataUrl = await rasterizeSvg("/sample-claim-form.svg");
      setPreviewUrl(dataUrl);
      await runOcr(dataUrl, selectedLang);
    } catch (err) {
      console.error(err);
      setError("Couldn't load the sample form.");
    }
  }

  function handleLangChange(code: string) {
    setSelectedLang(code);
    const lang = LANGUAGES.find((l) => l.code === code);
    if (lang && !lang.supported) {
      setLangWarning(
        `⚠️ Tesseract.js does not officially support language pack for ${lang.name}. Falling back to English OCR engine with multilingual rule-based extraction.`
      );
    } else {
      setLangWarning(null);
    }
  }

  function reset() {
    setStage("idle");
    setPreviewUrl(null);
    setProgress(0);
    setRawText("");
    setFields(EMPTY_FIELDS);
    setConfidences(EMPTY_CONFIDENCES);
    setError(null);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <p className="font-mono text-xs uppercase tracking-wider text-clay">
        Digitization Pipeline
      </p>
      <h1 className="mt-3 font-display text-4xl text-ink md:text-5xl">
        From scanned form to structured record
      </h1>
      <p className="mt-4 max-w-2xl text-ink-soft">
        OCR reads the document, rule-based extraction pulls out the fields
        that matter, and a human confirms every value before it counts as
        digitized — this is the pipeline behind the digitization numbers on
        the Dashboard.
      </p>

      {/* Language Selector Card */}
      <div className="mt-8 rounded-xl border border-line bg-paper-raised p-6">
        <h2 className="font-display text-lg text-ink font-semibold">1. Document Language Selection</h2>
        <p className="text-sm text-ink-soft mb-4">
          Select the language of the scanned document. Non-supported tribal languages will gracefully fall back to English OCR with custom parser logic.
        </p>
        <div className="flex flex-wrap gap-2.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              disabled={stage === "recognizing" || isCommunity}
              onClick={() => handleLangChange(lang.code)}
              className={`rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider transition-all border cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                selectedLang === lang.code
                  ? "bg-forest text-paper-raised border-forest font-bold shadow-sm"
                  : "bg-paper text-ink border-line hover:border-forest"
              }`}
            >
              {lang.name}
            </button>
          ))}
        </div>
        {langWarning && (
          <div className="mt-4 rounded-lg bg-pending/10 border border-pending/20 p-3 text-xs text-ink-soft">
            {langWarning}
          </div>
        )}
      </div>

      {isCommunity && (
        <div className="mt-6 rounded-lg border border-pending/30 bg-pending/5 p-4 text-sm text-pending flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <span>
            <strong>Read-only Access:</strong> Community stakeholders cannot digitize or verify new claim records. Switch role to <strong>Verifier</strong> or <strong>Administrator</strong> in the header to unlock upload privileges.
          </span>
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-lg border border-rejected/30 bg-rejected/5 p-4 text-sm text-rejected">
          {error}
        </div>
      )}

      {/* Side-by-Side OCR Workspace */}
      <div className="mt-8 grid gap-8 md:grid-cols-12 items-start">
        {/* Left column: Upload / Preview */}
        <div className="md:col-span-5 md:sticky md:top-6 space-y-4">
          <UploadPanel
            onFileSelected={handleFileSelected}
            onUseSample={handleUseSample}
            previewUrl={previewUrl}
            disabled={stage === "recognizing" || isCommunity}
            supplementaryDocs={supplementaryDocs}
            onAddSupplementaryDoc={handleAddSupplementaryDoc}
            onRemoveSupplementaryDoc={handleRemoveSupplementaryDoc}
          />
        </div>

        {/* Right column: Results / Form */}
        <div className="md:col-span-7 space-y-6">
          {stage === "recognizing" && (
            <OcrProgress status={ocrStatus} progress={progress} />
          )}

          {stage === "done" && (
            <ReviewForm
              initialFields={fields}
              confidences={confidences}
              rawText={rawText}
              previewUrl={previewUrl}
              supplementaryDocs={supplementaryDocs}
            />
          )}

          {stage === "idle" && !previewUrl && (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-paper-raised p-12 text-center min-h-[300px]">
              <p className="text-sm text-ink-soft max-w-sm">
                Select a document language and upload a form (or click "Use sample claim form") to view live OCR and human-in-the-loop validation side-by-side.
              </p>
            </div>
          )}
        </div>
      </div>

      {stage === "done" && (
        <button
          onClick={reset}
          className="mt-8 rounded-full border border-line px-5 py-2.5 font-mono text-xs uppercase tracking-wider text-ink transition-colors hover:border-forest hover:text-forest cursor-pointer"
        >
          Try another document
        </button>
      )}
    </div>
  );
}
