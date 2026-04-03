import { paystubExtractionSchema } from "./types";
import { PaystubParserBase } from "./PaystubParserBase";
import type { PaystubExtraction } from "./types";

const moneyRegex = /\$[\d,]+(?:\.\d{2})?/g;
const numberRegex = /\d{1,3}(?:,\d{3})*(?:\.\d{2})?|\d+(?:\.\d{2})?/g;

const parseMoney = (value: string): number | null => {
  const cleaned = value.replace(/[$,]/g, "");
  const parsed = Number(cleaned);
  return Number.isNaN(parsed) ? null : parsed;
};

const extractMoneyValues = (line: string): number[] => {
  const matches = line.match(moneyRegex);
  if (!matches) {
    return [];
  }
  return matches.map(parseMoney).filter((value): value is number => value !== null);
};

const extractNumbers = (line: string): number[] => {
  const matches = line.match(numberRegex);
  if (!matches) {
    return [];
  }
  return matches.map(parseMoney).filter((value): value is number => value !== null);
};

const pickPairFromLine = (line: string) => {
  const moneyValues = extractMoneyValues(line);
  const numbers = moneyValues.length ? moneyValues : extractNumbers(line);
  if (numbers.length === 0) {
    return { current: null, ytd: null };
  }
  if (numbers.length === 1) {
    return { current: numbers[0], ytd: numbers[0] };
  }
  const lastTwo = numbers.slice(-2);
  return { current: lastTwo[0], ytd: lastTwo[1] ?? lastTwo[0] };
};

const findLine = (lines: string[], pattern: RegExp) =>
  lines.find((line) => pattern.test(line.toUpperCase())) ?? null;

const detectPayFrequency = (text: string): PaystubExtraction["payFrequency"] => {
  const upper = text.toUpperCase();
  if (upper.includes("BI-WEEKLY") || upper.includes("BIWEEKLY")) {
    return "biweekly";
  }
  if (upper.includes("SEMI-MONTHLY") || upper.includes("SEMIMONTHLY")) {
    return "semimonthly";
  }
  if (upper.includes("WEEKLY")) {
    return "weekly";
  }
  if (upper.includes("MONTHLY")) {
    return "monthly";
  }
  return undefined;
};

class GenericParser extends PaystubParserBase {
  id = "generic";

  matches(_text: string) {
    return true;
  }

  parse(text: string): PaystubExtraction {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const grossLine = findLine(lines, /^GROSS|^EARNINGS/);
    const fedLine = findLine(lines, /^FEDERAL INCOME TAX|^FED W\/H|^FED WH/);
    const pretaxLine = findLine(lines, /^PRE[-\s]?TAX DEDUCTIONS/);

    const gross = grossLine ? pickPairFromLine(grossLine) : { current: null, ytd: null };
    const fed = fedLine ? pickPairFromLine(fedLine) : { current: null, ytd: null };
    const pretax = pretaxLine ? pickPairFromLine(pretaxLine) : { current: null, ytd: null };

    return paystubExtractionSchema.parse({
      currentGross: gross.current ?? undefined,
      ytdWages: gross.ytd ?? undefined,
      currentWithholding: fed.current ?? undefined,
      ytdWithholding: fed.ytd ?? undefined,
      currentPreTax: pretax.current ?? undefined,
      ytdPreTax: pretax.ytd ?? undefined,
      payFrequency: detectPayFrequency(text),
    });
  }
}

export const genericParser = new GenericParser();
