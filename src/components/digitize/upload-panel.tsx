"use client";

import { useRef } from "react";

export function UploadPanel({
  onFileSelected,
  onUseSample,
  previewUrl,
  disabled,
}: {
  onFileSelected: (file: File) => void;
  onUseSample: () => void;
  previewUrl: string | null;
  disabled: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="rounded-xl border border-line bg-paper-raised p-6 shadow-sm">
      <p className="font-mono text-xs uppercase tracking-wider text-clay">
        Source Document
      </p>
      <h2 className="mt-2 font-display text-xl text-ink font-semibold">
        2. Upload Scanned Claim Form
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        Or try it instantly with the pre-loaded sample form.
      </p>

      <div
        onClick={() => !disabled && inputRef.current?.click()}
        className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-line px-6 py-10 text-center transition-colors ${
          disabled ? "opacity-50" : "hover:border-forest"
        }`}
      >
        <p className="text-sm text-ink-soft">
          Click to upload an image (JPG, PNG)
        </p>
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

      <button
        onClick={onUseSample}
        disabled={disabled}
        className="mt-4 w-full rounded-full bg-clay px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-paper-raised transition-colors hover:bg-clay-deep disabled:opacity-50"
      >
        Use sample claim form
      </button>

      {previewUrl && (
        <div className="mt-5 overflow-hidden rounded-lg border border-line">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt="Uploaded claim form preview"
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
