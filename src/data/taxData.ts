import type { Bracket, FilingStatus } from "../types";

export const BRACKETS_2026: Record<FilingStatus, Bracket[]> = {
  married_joint: [
    { rate: 0.1, upTo: 24800 },
    { rate: 0.12, upTo: 100800 },
    { rate: 0.22, upTo: 211400 },
    { rate: 0.24, upTo: 403550 },
    { rate: 0.32, upTo: 512450 },
    { rate: 0.35, upTo: 768700 },
    { rate: 0.37, upTo: null },
  ],
  single: [
    { rate: 0.1, upTo: 12400 },
    { rate: 0.12, upTo: 50400 },
    { rate: 0.22, upTo: 105700 },
    { rate: 0.24, upTo: 201775 },
    { rate: 0.32, upTo: 256225 },
    { rate: 0.35, upTo: 640600 },
    { rate: 0.37, upTo: null },
  ],
  head: [
    { rate: 0.1, upTo: 17700 },
    { rate: 0.12, upTo: 67450 },
    { rate: 0.22, upTo: 105700 },
    { rate: 0.24, upTo: 201750 },
    { rate: 0.32, upTo: 256200 },
    { rate: 0.35, upTo: 640600 },
    { rate: 0.37, upTo: null },
  ],
  married_separate: [
    { rate: 0.1, upTo: 12400 },
    { rate: 0.12, upTo: 50400 },
    { rate: 0.22, upTo: 105700 },
    { rate: 0.24, upTo: 201775 },
    { rate: 0.32, upTo: 256225 },
    { rate: 0.35, upTo: 384350 },
    { rate: 0.37, upTo: null },
  ],
};

export const STANDARD_DEDUCTION_2026: Record<FilingStatus, number> = {
  married_joint: 32200,
  single: 16100,
  head: 24150,
  married_separate: 16100,
};

export const CAPITAL_GAINS_THRESHOLDS_2026: Record<
  FilingStatus,
  { zeroRateMax: number; fifteenRateMax: number }
> = {
  married_joint: { zeroRateMax: 98900, fifteenRateMax: 613700 },
  single: { zeroRateMax: 49450, fifteenRateMax: 545500 },
  head: { zeroRateMax: 66200, fifteenRateMax: 579600 },
  married_separate: { zeroRateMax: 49450, fifteenRateMax: 306850 },
};

export const NIIT_THRESHOLDS: Record<FilingStatus, number> = {
  married_joint: 250000,
  single: 200000,
  head: 200000,
  married_separate: 125000,
};

export const ADDITIONAL_MEDICARE_THRESHOLDS: Record<FilingStatus, number> = {
  married_joint: 250000,
  single: 200000,
  head: 200000,
  married_separate: 125000,
};

export const CHILD_TAX_CREDIT_2026 = 2200;
export const ADDITIONAL_CHILD_TAX_CREDIT_MAX_2026 = 1700;
export const OTHER_DEPENDENT_CREDIT = 500;

export const SELF_EMPLOYMENT_TAX = {
  socialSecurityRate: 0.124,
  medicareRate: 0.029,
  netEarningsFactor: 0.9235,
  wageBase: 184500,
};

export const filingStatusLabel: Record<FilingStatus, string> = {
  married_joint: "Married Filing Jointly",
  single: "Single",
  head: "Head of Household",
  married_separate: "Married Filing Separately",
};
