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

const findLineAmountsByPrefix = (lines: string[], prefixRegex: RegExp) => {
  for (const line of lines) {
    const upper = line.toUpperCase();
    if (!prefixRegex.test(upper)) {
      continue;
    }
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
  }
  return { current: null, ytd: null };
};

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

class JustworksParser extends PaystubParserBase {
  id = "justworks";

  matches(text: string) {
    return text.toUpperCase().includes("JUSTWORKS EMPLOYMENT GROUP LLC");
  }

  parse(text: string): PaystubExtraction {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const grossTotals = findLineAmountsByPrefix(lines, /^GROSS EARNINGS TOTALS/i);
    const salary = findLineAmountsByPrefix(lines, /^SALARY/i);
    const federal = findLineAmountsByPrefix(lines, /^FEDERAL INCOME TAX/i);
    const pretaxTotals = findLineAmountsByPrefix(lines, /^PRE[-\s]?TAX DEDUCTIONS TOTALS/i);

    return paystubExtractionSchema.parse({
      currentGross: grossTotals.current ?? salary.current ?? undefined,
      ytdWages: grossTotals.ytd ?? salary.ytd ?? undefined,
      currentWithholding: federal.current ?? undefined,
      ytdWithholding: federal.ytd ?? undefined,
      currentPreTax: pretaxTotals.current ?? undefined,
      ytdPreTax: pretaxTotals.ytd ?? undefined,
      payFrequency: detectPayFrequency(text),
    });
  }
}

export const justworksParser = new JustworksParser();
