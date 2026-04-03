import { z } from "zod";
import type { Bracket, FilingStatus } from "../types";

const API_URL = "https://api.api-ninjas.com/v2/incometax";

export type IncomeTaxParams = {
  year: number;
  country: string;
  regions: string;
};

const rawBracketSchema = z.object({
  rate: z.number(),
  min: z.number(),
  max: z.union([z.number(), z.string()]),
});

const rawBracketGroupSchema = z.object({
  brackets: z.array(rawBracketSchema),
});

const rawFederalResponseSchema = z.object({
  federal: z.object({
    single: rawBracketGroupSchema,
    married: rawBracketGroupSchema,
    married_separate: rawBracketGroupSchema,
    head_of_household: rawBracketGroupSchema,
  }),
});

const parseMax = (value: number | string): number | null => {
  if (typeof value === "number") {
    return value;
  }
  if (value.toLowerCase() === "infinity") {
    return null;
  }
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const toBrackets = (raw: z.infer<typeof rawBracketSchema>[]): Bracket[] =>
  raw.map((bracket) => ({
    rate: bracket.rate,
    upTo: parseMax(bracket.max),
  }));

const ensureBracketResponse = (data: unknown) => rawFederalResponseSchema.parse(data);

export const fetchIncomeTaxBrackets = async (
  params: IncomeTaxParams,
): Promise<Record<FilingStatus, Bracket[]>> => {
  const apiKey =
    (import.meta.env.VITE_TAX_API_KEY as string | undefined) ??
    (import.meta.env.VITE_API_NINJAS_KEY as string | undefined);
  if (!apiKey) {
    throw new Error("Missing VITE_TAX_API_KEY (or VITE_API_NINJAS_KEY) in env");
  }

  const url = new URL(API_URL);
  url.searchParams.set("year", String(params.year));
  url.searchParams.set("country", params.country);
  url.searchParams.set("regions", params.regions);

  const response = await fetch(url.toString(), {
    headers: {
      "X-Api-Key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Income tax API error: ${response.status}`);
  }

  const data = (await response.json()) as unknown;
  const parsed = ensureBracketResponse(data);

  return {
    single: toBrackets(parsed.federal.single.brackets),
    married_joint: toBrackets(parsed.federal.married.brackets),
    married_separate: toBrackets(parsed.federal.married_separate.brackets),
    head: toBrackets(parsed.federal.head_of_household.brackets),
  };
};
