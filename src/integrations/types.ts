import { z } from "zod";
import type { PaystubParserBase } from "./PaystubParserBase";

export const paystubExtractionSchema = z
  .object({
    ytdWages: z.number().optional(),
    ytdWithholding: z.number().optional(),
    ytdPreTax: z.number().optional(),
    currentGross: z.number().optional(),
    currentWithholding: z.number().optional(),
    currentPreTax: z.number().optional(),
    payFrequency: z.enum(["weekly", "biweekly", "semimonthly", "monthly"]).optional(),
  })
  .strict();

export type PaystubExtraction = z.infer<typeof paystubExtractionSchema>;

export type PaystubParser = InstanceType<typeof PaystubParserBase>;