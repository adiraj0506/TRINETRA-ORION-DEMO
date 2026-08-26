export interface ExtractedFields {
  fullName: string;
  guardianName: string;
  dependents: string;
  address: string;
  village: string;
  gramPanchayat: string;
  block: string;
  district: string;
  category: string;
  areaClaimedHectares: string;
  plotNumber: string;
}

export const EMPTY_FIELDS: ExtractedFields = {
  fullName: "",
  guardianName: "",
  dependents: "",
  address: "",
  village: "",
  gramPanchayat: "",
  block: "",
  district: "",
  category: "",
  areaClaimedHectares: "",
  plotNumber: "",
};

export type FieldConfidences = Record<keyof ExtractedFields, number>;

export const EMPTY_CONFIDENCES: FieldConfidences = {
  fullName: 0,
  guardianName: 0,
  dependents: 0,
  address: 0,
  village: 0,
  gramPanchayat: 0,
  block: 0,
  district: 0,
  category: 0,
  areaClaimedHectares: 0,
  plotNumber: 0,
};

const FIELD_LABEL_PATTERNS: Record<keyof ExtractedFields, RegExp> = {
  fullName: /holder|name\s*\(s\)|नाम|ନାମ/i,
  guardianName: /father|mother|पिता|माता|ପିତା|ମାତା/i,
  dependents: /dependent|आश्रित|ନିର୍ଭରଶୀଳ/i,
  address: /address|पता|ଠିକଣା/i,
  village: /village|gram\s*sabha|ग्राम|ଗ୍ରାମ/i,
  gramPanchayat: /panchayat|पंचायत|ପଞ୍ଚାୟତ/i,
  block: /block|tehsil|taluka|तहसील|ତହସିଲ/i,
  district: /district|जिला|ଜିଲ୍ଲା/i,
  category: /scheduled\s*tribe|traditional\s*forest|category|वर्ग|ଶ୍ରେଣୀ/i,
  areaClaimedHectares: /area|claimed|क्षेत्र|କ୍ଷେତ୍ର|bighas/i,
  plotNumber: /khasra|plot|compartment|खसरा|ଖସରା/i,
};

interface TesseractWord {
  text: string;
  confidence: number;
  bbox: { x0: number; y0: number; x1: number; y1: number };
}

// ---------------------------------------------------------------------------
// 1. Fuzzy Lookup Dictionaries
// ---------------------------------------------------------------------------
const DISTRICT_DICT = ["Chamba", "Kangra", "Mandi", "Shimla", "Kullu", "Anuppur", "Dindori", "Mandla", "Mayurbhanj", "Kandhamal", "Adilabad", "Bhadradri Kothagudem", "Dhalai"];
const TEHSIL_DICT = ["Dalhousie", "Chamba", "Bharmour", "Chowari", "Salooni", "Sihunta", "Pangi"];
const PANCHAYAT_DICT = ["Padhrotu", "Khajjiar", "Lakkarmandi", "Bathri", "Banikhet"];
const VILLAGE_DICT = ["Khajjiar", "Lakkarmandi", "Kalatop", "Dainkund", "Baragarh"];

function levenshteinDistance(s1: string, s2: string): number {
  const len1 = s1.length;
  const len2 = s2.length;
  const matrix = Array.from({ length: len1 + 1 }, () => new Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }
  return matrix[len1][len2];
}

function fuzzyMatch(text: string, dictionary: string[]): string {
  if (!text) return "";
  const cleaned = text.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!cleaned) return text;
  
  let bestMatch = text;
  let minDistance = 999;
  
  for (const dictWord of dictionary) {
    const dictClean = dictWord.toLowerCase().replace(/[^a-z0-9]/g, "");
    
    // Check for exact substring matches
    if (cleaned.includes(dictClean) || dictClean.includes(cleaned)) {
      return dictWord;
    }
    
    const dist = levenshteinDistance(cleaned, dictClean);
    if (dist < minDistance && dist <= Math.max(3, Math.floor(dictClean.length * 0.4))) {
      minDistance = dist;
      bestMatch = dictWord;
    }
  }
  return bestMatch;
}

// ---------------------------------------------------------------------------
// 2. Spatial Bounding Box Slicing Parser
// ---------------------------------------------------------------------------
export function extractFieldsFromBbox(ocrWords: TesseractWord[]): ExtractedFields {
  if (!ocrWords || ocrWords.length === 0) return EMPTY_FIELDS;

  const maxX = Math.max(...ocrWords.map(w => w.bbox?.x1 || 0), 1);
  const dividingAxis = maxX * 0.54; 

  const sortedWords = [...ocrWords]
    .filter(w => w.bbox && typeof w.bbox.x0 === "number" && typeof w.bbox.y0 === "number")
    .sort((a, b) => a.bbox.y0 - b.bbox.y0);

  const lines: { left: TesseractWord[]; right: TesseractWord[]; yCenter: number }[] = [];
  
  for (const w of sortedWords) {
    const yCenter = (w.bbox.y0 + w.bbox.y1) / 2;
    const height = w.bbox.y1 - w.bbox.y0;
    const tol = height * 0.55;

    let placed = false;
    for (const line of lines) {
      if (Math.abs(line.yCenter - yCenter) < tol) {
        if (w.bbox.x0 < dividingAxis) {
          line.left.push(w);
        } else {
          line.right.push(w);
        }
        placed = true;
        break;
      }
    }

    if (!placed) {
      lines.push({
        left: w.bbox.x0 < dividingAxis ? [w] : [],
        right: w.bbox.x0 >= dividingAxis ? [w] : [],
        yCenter,
      });
    }
  }

  for (const line of lines) {
    line.left.sort((a, b) => a.bbox.x0 - b.bbox.x0);
    line.right.sort((a, b) => a.bbox.x0 - b.bbox.x0);
  }

  const rows: Record<number, string[]> = {};
  for (let i = 1; i <= 11; i++) {
    rows[i] = [];
  }

  const detectRowNumber = (leftText: string): number | null => {
    const match = leftText.match(/^(?:\[?\s*(\d{1,2})\s*\]?|re\s+(\d{1,2}))/i) || leftText.match(/\b(\d{1,2})\b/);
    if (match) {
      const num = parseInt(match[1] || match[2], 10);
      if (num >= 1 && num <= 11) return num;
    }
    
    if (/holder|rights/i.test(leftText)) return 1;
    if (/father|mother/i.test(leftText)) return 2;
    if (/dependent/i.test(leftText)) return 3;
    if (/address/i.test(leftText)) return 4;
    if (/village|sabha/i.test(leftText)) return 5;
    if (/panchayat/i.test(leftText)) return 6;
    if (/tehsil|taluka/i.test(leftText)) return 7;
    if (/district/i.test(leftText)) return 8;
    if (/tribe|traditional/i.test(leftText)) return 9;
    if (/area/i.test(leftText)) return 10;
    if (/khasra|boundary/i.test(leftText)) return 11;

    return null;
  };

  let currentActiveRow = 1;
  lines.sort((a, b) => a.yCenter - b.yCenter);

  for (const line of lines) {
    const leftText = line.left.map(w => w.text).join(" ").trim();
    const rightText = line.right.map(w => w.text).join(" ").trim();

    const detectedRow = detectRowNumber(leftText);
    if (detectedRow !== null) {
      currentActiveRow = detectedRow;
    }

    if (rightText) {
      rows[currentActiveRow].push(rightText);
    }
  }

  const cleanText = (words: string[]): string => {
    let text = words.join(" ").trim();
    text = text.replace(/^[:\-|\[\]\s\d,._=]+/g, "");
    text = text.replace(/[:\-|\[\]\s_=]+$/g, "");
    
    const trashPatterns = [
      /tatima/i,
      /this\s*title\s*is\s*heritable/i,
      /we\s*the\s*undersigned/i,
      /district\s*tribal\s*welfare/i,
      /deputy\s*commissioner/i
    ];
    for (const pat of trashPatterns) {
      text = text.replace(pat, "");
    }
    
    text = text.replace(/^[|l\s\d._\[\]]+/, "");
    text = text.replace(/\s*[|l_\[\]]+$/, "");
    text = text.replace(/\b\d{1,2}\s*[|l=]\s*/gi, "");

    return text.trim();
  };

  // ---------------------------------------------------------------------------
  // 3. Schema & Fuzzy Enforcer Rules
  // ---------------------------------------------------------------------------

  // A. Category Snap Rule (Field 9)
  let rawCategory = cleanText(rows[9]);
  let category = rawCategory;
  if (/gaddi|scheduled\s*tribe|tribe/i.test(rawCategory)) {
    category = "Scheduled Tribe (Gaddi)";
  } else if (/traditional|otfd|other/i.test(rawCategory)) {
    category = "Other Traditional Forest Dweller";
  }

  // B. Area Snap Rule (Field 10)
  let rawArea = cleanText(rows[10]);
  let area = rawArea;
  const areaMatch = rawArea.match(/(\d{2}-\d{2}-\d{2})/);
  if (areaMatch) {
    area = `${areaMatch[1]} Bighas`;
  }

  // C. Names Formatting Splits (Fields 1-3)
  const formatNames = (val: string): string => {
    // Add spaces between numbered list elements in multi-names (e.g. "1. Sh. Nek Ram 2. Sh. Makholi Ram")
    return val
      .replace(/(\d+)\.\s*/g, " $1. ")
      .replace(/\s+/g, " ")
      .trim();
  };

  return {
    fullName: formatNames(cleanText(rows[1])),
    guardianName: formatNames(cleanText(rows[2])),
    dependents: formatNames(cleanText(rows[3])),
    address: cleanText(rows[4]),
    village: fuzzyMatch(cleanText(rows[5]), VILLAGE_DICT),
    gramPanchayat: fuzzyMatch(cleanText(rows[6]), PANCHAYAT_DICT),
    block: fuzzyMatch(cleanText(rows[7]), TEHSIL_DICT),
    district: fuzzyMatch(cleanText(rows[8]), DISTRICT_DICT),
    category,
    areaClaimedHectares: area,
    plotNumber: cleanText(rows[11]),
  };
}

/**
 * Rule-based NER over raw OCR text. Looks for sections bounded by field headers.
 */
export function extractFields(rawText: string): ExtractedFields {
  const normalized = rawText.replace(/\s+/g, " ");

  const findSectionStart = (num: number, keywords: RegExp[]): { start: number; headerStart: number } | null => {
    for (const kw of keywords) {
      const regex = new RegExp(`\\b${num}\\b[^a-zA-Z0-9]{0,12}${kw.source}`, "i");
      const match = normalized.match(regex);
      if (match && match.index !== undefined) {
        const headerStart = match.index;
        const afterMatch = normalized.substring(match.index);
        const firstSeparator = afterMatch.substring(0, 35).match(/[:\-|=]+/);
        if (firstSeparator && firstSeparator.index !== undefined) {
          const start = match.index + firstSeparator.index + firstSeparator[0].length;
          return { start, headerStart };
        }
        return { start: match.index + match[0].length, headerStart };
      }
    }
    
    for (const kw of keywords) {
      const match = normalized.match(kw);
      if (match && match.index !== undefined) {
        const headerStart = match.index;
        const afterMatch = normalized.substring(match.index);
        const firstSeparator = afterMatch.substring(0, 35).match(/[:\-|=]+/);
        if (firstSeparator && firstSeparator.index !== undefined) {
          const start = match.index + firstSeparator.index + firstSeparator[0].length;
          return { start, headerStart };
        }
        return { start: match.index + match[0].length, headerStart };
      }
    }

    const numRegexes = [
      new RegExp(`(?:^|\\b|\\||\\s)${num}\\s*(?:[|l=\\-_\\.])`, "i"),
      new RegExp(`\\[\\s*${num}\\s*\\]`, "i"),
      new RegExp(`\\b${num}\\b`, "i"),
    ];

    for (const r of numRegexes) {
      const match = normalized.match(r);
      if (match && match.index !== undefined) {
        const headerStart = match.index;
        const afterMatch = normalized.substring(match.index);
        const firstSeparator = afterMatch.substring(0, 35).match(/[:\-|=]+/);
        if (firstSeparator && firstSeparator.index !== undefined) {
          const start = match.index + firstSeparator.index + firstSeparator[0].length;
          return { start, headerStart };
        }
        return { start: match.index + match[0].length, headerStart };
      }
    }
    return null;
  };

  const holdersP = [/name\(s\)\s*of\s*holder\(s\)(?:\s*of\s*forest\s*rights)?(?:\s*\([^)]*\))?/i, /holder\(s\)\s*of\s*forest/i, /नाम/];
  const fatherP = [/name\s*of\s*father\/mother/i, /father\/mother/i, /पिता\/माता/];
  const dependentsP = [/name\s*of\s*dependents/i, /dependents/i, /आश्रित/];
  const addressP = [/address/i, /पता/];
  const villageP = [/village\/gram\s*sabha/i, /village/i, /ग्राम/];
  const panchayatP = [/gram\s*panchayat/i, /panchayat/i, /पंचायत/];
  const tehsilP = [/tehsil\/taluka/i, /tehsil/i, /तहसील/];
  const districtP = [/district/i, /जिला/];
  const categoryP = [/whether\s*scheduled\s*tribe/i, /whether\s*scheduled/i, /scheduled\s*tribe\s*or\s*other/i, /वर्ग/];
  const areaP = [/area/i, /क्षेत्र/];
  const khasraP = [/description\s*of\s*boundaries\s*by\s*prominent\s*landmarks\s*including\s*khasra\/compartment\s*no\.?/i, /khasra/i, /plot\s*number/i, /खसरा/];

  const sec1 = findSectionStart(1, holdersP);
  const sec2 = findSectionStart(2, fatherP);
  const sec3 = findSectionStart(3, dependentsP);
  const sec4 = findSectionStart(4, addressP);
  const sec5 = findSectionStart(5, villageP);
  const sec6 = findSectionStart(6, panchayatP);
  const sec7 = findSectionStart(7, tehsilP);
  const sec8 = findSectionStart(8, districtP);
  const sec9 = findSectionStart(9, categoryP);
  const sec10 = findSectionStart(10, areaP);
  const sec11 = findSectionStart(11, khasraP);

  const indices = [
    { key: "fullName", pos: sec1 },
    { key: "guardianName", pos: sec2 },
    { key: "dependents", pos: sec3 },
    { key: "address", pos: sec4 },
    { key: "village", pos: sec5 },
    { key: "gramPanchayat", pos: sec6 },
    { key: "block", pos: sec7 },
    { key: "district", pos: sec8 },
    { key: "category", pos: sec9 },
    { key: "areaClaimedHectares", pos: sec10 },
    { key: "plotNumber", pos: sec11 },
  ].filter(item => item.pos !== null).sort((a, b) => a.pos!.start - b.pos!.start);

  const getSectionText = (key: string, pos: { start: number; headerStart: number } | null): string => {
    if (!pos) return "";
    const currentIdx = indices.findIndex(item => item.key === key);
    const nextItem = indices[currentIdx + 1];
    const end = nextItem ? nextItem.pos!.headerStart : normalized.length;
    
    let extracted = normalized.substring(pos.start, end).trim();
    extracted = extracted.replace(/^[:\-|\[\]\s\d,._=]+/g, "");
    extracted = extracted.replace(/\s*(?:\b\d{1,2}\b|\[\d{1,2}\])\s*$/, "");
    extracted = extracted.replace(/[:\-|\[\]\s]+$/, "");
    return extracted.trim();
  };

  const fullName = getSectionText("fullName", sec1);
  const guardianName = getSectionText("guardianName", sec2);
  const dependents = getSectionText("dependents", sec3);
  const address = getSectionText("address", sec4);
  const village = getSectionText("village", sec5);
  const gramPanchayat = getSectionText("gramPanchayat", sec6);
  const block = getSectionText("block", sec7);
  const district = getSectionText("district", sec8);
  const category = getSectionText("category", sec9);
  const areaClaimedHectares = getSectionText("areaClaimedHectares", sec10);
  const plotNumber = getSectionText("plotNumber", sec11);

  return {
    fullName,
    guardianName,
    dependents,
    address,
    village,
    gramPanchayat,
    block,
    district,
    category,
    areaClaimedHectares,
    plotNumber,
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
  // If word boundary data is present, execute 2D spatial extraction
  const fields = ocrWords && ocrWords.length > 0
    ? extractFieldsFromBbox(ocrWords)
    : extractFields(rawText);

  const confidences = { ...EMPTY_CONFIDENCES };

  (Object.keys(fields) as (keyof ExtractedFields)[]).forEach((key) => {
    const val = fields[key];
    if (!val) {
      confidences[key] = 0;
      return;
    }

    const labelRegex = FIELD_LABEL_PATTERNS[key];
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

    confidences[key] = 75;
  });

  return { fields, confidences };
}
