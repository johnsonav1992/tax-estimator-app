import { PaystubParserBase } from "./PaystubParserBase";
import type { PaystubExtraction } from "./types";
import { paystubExtractionSchema } from "./types";

const moneyRegex = /\$[\d,]+(?:\.\d{2})?/g;

// Matches numbers in x.xx currency format (no $ sign) — excludes bare integers like account numbers
const currencyLikeRegex = /(?<![.\d])\d{1,3}(?:,\d{3})*\.\d{2}(?!\d)/g;

const parseMoney = (value: string): number | null => {
  const cleaned = value.replace(/[$,]/g, "");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const extractMoneyValues = (line: string): number[] => {
  const matches = line.match(moneyRegex);
  if (!matches) return [];
  return matches.map(parseMoney).filter((v): v is number => v !== null);
};

// Extracts currency-like bare numbers (x.xx) — ignores bare integers from account numbers
const extractCurrencyLike = (line: string): number[] => {
  const matches = line.match(currencyLikeRegex);
  if (!matches) return [];
  return matches.map(parseMoney).filter((v): v is number => v !== null);
};

// For ADP multi-column layout: left-column data is sorted before right-column data by pdfjs
// (items at same y are sorted by x ascending), so we take the FIRST two values, not the last.
const findFirstPairByPrefix = (lines: string[], prefixRegex: RegExp) => {
  for (const line of lines) {
    if (!prefixRegex.test(line.toUpperCase())) continue;

    // Try $ amounts first — right column in ADP rarely uses $ on deduction/earnings rows.
    // Bold text in ADP PDFs renders as 4 overlapping layers, so the current-period amount
    // repeats 4x and the YTD appears once at the end: take first (current) and last (ytd).
    const moneyValues = extractMoneyValues(line);
    if (moneyValues.length >= 2) {
      return { current: moneyValues[0], ytd: moneyValues[moneyValues.length - 1] };
    }
    if (moneyValues.length === 1) {
      return { current: moneyValues[0], ytd: moneyValues[0] };
    }

    // Fall back to currency-like bare numbers (e.g. "0.00 10.98") — same first/last logic
    const values = extractCurrencyLike(line);
    if (values.length >= 2) {
      return { current: values[0], ytd: values[values.length - 1] };
    }
    if (values.length === 1) {
      return { current: values[0], ytd: values[0] };
    }

    return { current: null, ytd: null };
  }
  return { current: null, ytd: null };
};

// Sums current/ytd amounts for all item lines between a section header and a stop pattern.
// Takes the first two currency-like values per line to avoid right-column contamination.
const sumSectionAmounts = (
  lines: string[],
  sectionHeaderRegex: RegExp,
  stopRegex: RegExp,
): { current: number | null; ytd: number | null } => {
  const startIdx = lines.findIndex((l) => sectionHeaderRegex.test(l.toUpperCase()));
  if (startIdx < 0) return { current: null, ytd: null };

  let currentTotal = 0;
  let ytdTotal = 0;
  let found = false;

  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (stopRegex.test(line.toUpperCase())) break;

    const moneyValues = extractMoneyValues(line);
    const values = moneyValues.length ? moneyValues : extractCurrencyLike(line);

    if (values.length >= 2) {
      currentTotal += values[0];
      ytdTotal += values[1];
      found = true;
    } else if (values.length === 1) {
      currentTotal += values[0];
      ytdTotal += values[0];
      found = true;
    }
  }

  return found ? { current: currentTotal, ytd: ytdTotal } : { current: null, ytd: null };
};

class AdpParser extends PaystubParserBase {
  id = "adp";

  matches(text: string) {
    const upper = text.toUpperCase();
    return (
      upper.includes("EARNINGS STATEMENT") &&
      (upper.includes("STATUTORY DEDUCTIONS") || upper.includes("COMPANY CODE"))
    );
  }

  parse(text: string): PaystubExtraction {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const gross = findFirstPairByPrefix(lines, /^GROSS PAY\b/i);
    const federal = findFirstPairByPrefix(lines, /^FEDERAL INCOME\b/i);
    const voluntary = sumSectionAmounts(
      lines,
      /^VOLUNTARY DEDUCTIONS\b/i,
      /^NET PAY\b/i,
    );

    return paystubExtractionSchema.parse({
      currentGross: gross.current ?? undefined,
      ytdWages: gross.ytd ?? undefined,
      currentWithholding: federal.current ?? undefined,
      ytdWithholding: federal.ytd ?? undefined,
      currentPreTax: voluntary.current ?? undefined,
      ytdPreTax: voluntary.ytd ?? undefined,
    });
  }
}

export const adpParser = new AdpParser();
