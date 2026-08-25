export interface ExtractedFields {
  fullName: string;
  village: string;
  district: string;
  state: string;
  category: string;
  claimType: string;
  areaClaimedHectares: string;
  householdSize: string;
}

export const EMPTY_FIELDS: ExtractedFields = {
  fullName: "",
  village: "",
  district: "",
  state: "",
  category: "",
  claimType: "",
  areaClaimedHectares: "",
  householdSize: "",
};

export type FieldConfidences = Record<keyof ExtractedFields, number>;

export const EMPTY_CONFIDENCES: FieldConfidences = {
  fullName: 0,
  village: 0,
  district: 0,
  state: 0,
  category: 0,
  claimType: 0,
  areaClaimedHectares: 0,
  householdSize: 0,
};

const FIELD_LABEL_PATTERNS: Record<keyof ExtractedFields, RegExp> = {
  fullName: /name|नाम|ନାମ/i,
  village: /village|ग्राम|ଗ୍ରାମ/i,
  district: /district|जिला|ଜିଲ୍ଲା/i,
  state: /state|राज्य|ରାଜ୍ୟ/i,
  category: /category|वर्ग|ଶ୍ରେଣୀ/i,
  claimType: /claim\s*type|दावा\s*प्रकार|ଦାବି\s*ପ୍ରକାର/i,
  areaClaimedHectares: /area\s*claimed|claimed\s*area|दावा\s*क्षेत्र|ଦାବି\s*କ୍ଷେତ୍ର/i,
  householdSize: /household\s*size|परिवार\s*संख्या|ପରିବାର\s*ସଂଖ୍ୟା/i,
};

function matchLine(text: string, label: RegExp): string {
  const match = text.match(label);
  return match?.[1]?.trim() ?? "";
}

/**
 * Rule-based NER over raw OCR text. Looks for "Label: value" patterns —
 * supports English, Hindi, and Odia forms.
 */
export function extractFields(rawText: string): ExtractedFields {
  return {
    fullName: matchLine(rawText, /(?:name|नाम|ନାମ)\s*[:\-]\s*([^\n\r]+)/i),
    village: matchLine(rawText, /(?:village|ग्राम|ଗ୍ରାମ)\s*[:\-]\s*([^\n\r]+)/i),
    district: matchLine(rawText, /(?:district|जिला|ଜିଲ୍ଲା)\s*[:\-]\s*([^\n\r]+)/i),
    state: matchLine(rawText, /(?:state|राज्य|ରାଜ୍ୟ)\s*[:\-]\s*([^\n\r]+)/i),
    category: matchLine(rawText, /(?:category|वर्ग|ଶ୍ରେଣୀ)\s*[:\-]\s*(ST|OTFD|[^\n\r]+)/i),
    claimType: matchLine(rawText, /(?:claim\s*type|दावा\s*प्रकार|ଦାବି\s*ପ୍ରକାର)\s*[:\-]\s*(IFR|CR|CFR|[^\n\r]+)/i),
    areaClaimedHectares: matchLine(
      rawText,
      /(?:area\s*claimed|claimed\s*area|दावा\s*क्षेत्र|ଦାବି\s*କ୍ଷେତ୍ର)\s*[:\-]\s*([\d.]+)/i
    ),
    householdSize: matchLine(
      rawText,
      /(?:household\s*size|परिवार\s*संख्या|ପରିବାର\s*ସଂଖ୍ୟା)\s*[:\-]\s*(\d+)/i
    ),
  };
}

/**
 * Extracts fields and computes word-level confidence metrics for each field from Tesseract output data.
 */
export function extractFieldsWithConfidence(
  rawText: string,
  ocrLines: any[] = [],
  ocrWords: any[] = []
): { fields: ExtractedFields; confidences: FieldConfidences } {
  const fields = extractFields(rawText);
  const confidences = { ...EMPTY_CONFIDENCES };

  (Object.keys(fields) as (keyof ExtractedFields)[]).forEach((key) => {
    const val = fields[key];
    if (!val) {
      confidences[key] = 0;
      return;
    }

    const labelRegex = FIELD_LABEL_PATTERNS[key];
    
    // Find the line that matches both the label regex and contains the value
    const matchedLine = ocrLines.find((line) => {
      const text = (line.text || "").toLowerCase();
      return labelRegex.test(text) && text.includes(val.toLowerCase());
    });

    const valTerms = val
      .toLowerCase()
      .split(/\s+/)
      .map((t) => t.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""))
      .filter(Boolean);

    if (matchedLine && matchedLine.words && matchedLine.words.length > 0) {
      const matchedWords = matchedLine.words.filter((w: any) => {
        const wordText = (w.text || "").toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        return valTerms.includes(wordText);
      });

      if (matchedWords.length > 0) {
        const sum = matchedWords.reduce((acc: number, w: any) => acc + (w.confidence || 0), 0);
        confidences[key] = Math.round(sum / matchedWords.length);
        return;
      }

      confidences[key] = Math.round(matchedLine.confidence || 0);
      return;
    }

    if (ocrWords && ocrWords.length > 0) {
      const matchedWords = ocrWords.filter((w: any) => {
        const wordText = (w.text || "").toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        return valTerms.includes(wordText);
      });

      if (matchedWords.length > 0) {
        const sum = matchedWords.reduce((acc: number, w: any) => acc + (w.confidence || 0), 0);
        confidences[key] = Math.round(sum / matchedWords.length);
        return;
      }
    }

    // Default fallback
    confidences[key] = 75;
  });

  return { fields, confidences };
}

