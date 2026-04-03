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

const pickPairFromLine = (line: string, prefer: "first" | "last" = "last") => {
  const moneyValues = extractMoneyValues(line);
  const numbers = moneyValues.length ? moneyValues : extractNumbers(line);
  if (numbers.length === 0) {
    return { current: null, ytd: null };
  }
  if (numbers.length === 1) {
    return { current: numbers[0], ytd: numbers[0] };
  }
  if (prefer === "first") {
    return { current: numbers[0], ytd: numbers[1] ?? numbers[0] };
  }
  const lastTwo = numbers.slice(-2);
  return { current: lastTwo[0], ytd: lastTwo[1] ?? lastTwo[0] };
};

const findLine = (lines: string[], pattern: RegExp) =>
  lines.find((line) => pattern.test(line.toUpperCase())) ?? null;

const findAmountPairAfterLabel = (
  lines: string[],
  labelRegex: RegExp,
  options?: { maxLookahead?: number },
) => {
  const maxLookahead = options?.maxLookahead ?? 6;
  const labelIndex = lines.findIndex((line) => labelRegex.test(line.toUpperCase()));
  if (labelIndex < 0) {
    return { current: null, ytd: null };
  }

  const collected: number[] = [];
  for (let offset = 0; offset <= maxLookahead; offset += 1) {
    const line = lines[labelIndex + offset];
    if (!line) {
      break;
    }
    const moneyValues = extractMoneyValues(line);
    if (moneyValues.length > 0) {
      collected.push(...moneyValues);
      if (collected.length >= 2) {
        break;
      }
    }
  }

  if (collected.length >= 2) {
    return { current: collected[0], ytd: collected[1] ?? collected[0] };
  }
  if (collected.length === 1) {
    return { current: collected[0], ytd: collected[0] };
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

class DayforceParser extends PaystubParserBase {
  id = "dayforce";

  matches(text: string) {
    const normalized = text.toUpperCase();
    const compact = normalized.replace(/[^A-Z0-9]/g, "");
    if (compact.includes("DAYFORCE")) {
      return true;
    }

    const hasDepositAdvice = normalized.includes("DEPOSIT ADVICE #");
    const hasFederalExtra = normalized.includes("FEDERAL 2C/EXTRA");
    const hasPayFrequency = normalized.includes("PAY FREQUENCY");
    const hasMemoInfo = normalized.includes("MEMO INFORMATION");
    return (hasDepositAdvice && hasFederalExtra) || (hasDepositAdvice && hasPayFrequency) || hasMemoInfo;
  }

  parse(text: string): PaystubExtraction {
    const lines = text
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);

    const earnings = findAmountPairAfterLabel(lines, /^EARNINGS\b/);
    const fed = findAmountPairAfterLabel(lines, /^FED W\/H|^FED WH|^FEDERAL W\/H/);
    const pretax = findAmountPairAfterLabel(lines, /^PRE[-\s]?TAX DEDUCTIONS\b/);

    return paystubExtractionSchema.parse({
      currentGross: earnings.current ?? undefined,
      ytdWages: earnings.ytd ?? undefined,
      currentWithholding: fed.current ?? undefined,
      ytdWithholding: fed.ytd ?? undefined,
      currentPreTax: pretax.current ?? undefined,
      ytdPreTax: pretax.ytd ?? undefined,
      payFrequency: detectPayFrequency(text),
    });
  }
}

export const dayforceParser = new DayforceParser();
