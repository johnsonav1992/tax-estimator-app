import { z } from "zod";

export const filingStatusSchema = z.enum(["married_joint", "single", "head", "married_separate"]);

export const bracketSchema = z.object({
  rate: z.number(),
  upTo: z.number().nullable(),
});

export const bracketRowSchema = bracketSchema.extend({
  id: z.string(),
});

export const jobIncomeSchema = z.object({
  id: z.string(),
  label: z.string(),
  ytdWages: z.number(),
  ytdWithholding: z.number(),
  ytdPreTax: z.number(),
  perPaycheckWages: z.number(),
  perPaycheckWithholding: z.number(),
  perPaycheckPreTax: z.number(),
  paychecksRemaining: z.number(),
});

export const otherIncomeSchema = z.object({
  interest: z.number(),
  dividends: z.number(),
  capitalGains: z.number(),
  selfEmployment: z.number(),
  rental: z.number(),
  other: z.number(),
});

export const creditsSchema = z.object({
  childTaxCredit: z.number(),
  otherDependentCredit: z.number(),
  dependentCareCredit: z.number(),
  educationCredits: z.number(),
  energyCredits: z.number(),
  otherNonRefundableCredits: z.number(),
  refundableCredits: z.number(),
});

export const deductionsSchema = z.object({
  useStandardDeduction: z.boolean(),
  itemizedDeductions: z.number(),
  qbiDeduction: z.number(),
  otherAdjustments: z.number(),
});

export const paymentsSchema = z.object({
  estimatedPayments: z.number(),
  otherPayments: z.number(),
});

export const dependentsSchema = z.object({
  qualifyingChildren: z.number(),
  otherDependents: z.number(),
});

export const formStateSchema = z.object({
  taxYear: z.literal("2026"),
  filingStatus: filingStatusSchema,
  spouseAJobs: z.array(jobIncomeSchema),
  spouseBJobs: z.array(jobIncomeSchema),
  dependents: dependentsSchema,
  otherIncome: otherIncomeSchema,
  deductions: deductionsSchema,
  credits: creditsSchema,
  payments: paymentsSchema,
  useCustomBrackets: z.boolean(),
  customStandardDeduction: z.number(),
  customBrackets: z.array(bracketRowSchema),
});

export type FilingStatus = z.infer<typeof filingStatusSchema>;
export type Bracket = z.infer<typeof bracketSchema>;
export type BracketRow = z.infer<typeof bracketRowSchema>;
export type JobIncome = z.infer<typeof jobIncomeSchema>;
export type OtherIncome = z.infer<typeof otherIncomeSchema>;
export type Credits = z.infer<typeof creditsSchema>;
export type Deductions = z.infer<typeof deductionsSchema>;
export type Payments = z.infer<typeof paymentsSchema>;
export type Dependents = z.infer<typeof dependentsSchema>;
export type FormState = z.infer<typeof formStateSchema>;
