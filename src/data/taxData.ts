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

export const filingStatusLabel: Record<FilingStatus, string> = {
  married_joint: "Married Filing Jointly",
  single: "Single",
  head: "Head of Household",
  married_separate: "Married Filing Separately",
};
