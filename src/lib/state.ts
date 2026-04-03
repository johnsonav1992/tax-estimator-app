import { BRACKETS_2026, STANDARD_DEDUCTION_2026 } from "../data/taxData";
import type { FilingStatus, FormState, JobIncome } from "../types";

const createEmptyJob = (id: string): JobIncome => ({
  id,
  label: "",
  ytdWages: 0,
  ytdWithholding: 0,
  ytdPreTax: 0,
  perPaycheckWages: 0,
  perPaycheckWithholding: 0,
  perPaycheckPreTax: 0,
  paychecksRemaining: 0,
});

export const initialState = (filingStatus: FilingStatus): FormState => ({
  taxYear: "2026",
  filingStatus,
  spouseAJobs: [createEmptyJob("spouse-a-job-1")],
  spouseBJobs: [createEmptyJob("spouse-b-job-1")],
  dependents: {
    qualifyingChildren: 0,
    otherDependents: 0,
  },
  otherIncome: {
    interest: 0,
    dividends: 0,
    capitalGains: 0,
    selfEmployment: 0,
    rental: 0,
    other: 0,
  },
  deductions: {
    useStandardDeduction: true,
    itemizedDeductions: 0,
    qbiDeduction: 0,
    otherAdjustments: 0,
  },
  credits: {
    childTaxCredit: 0,
    otherDependentCredit: 0,
    dependentCareCredit: 0,
    educationCredits: 0,
    energyCredits: 0,
    otherNonRefundableCredits: 0,
    refundableCredits: 0,
  },
  payments: {
    estimatedPayments: 0,
    otherPayments: 0,
  },
  useCustomBrackets: false,
  customStandardDeduction: STANDARD_DEDUCTION_2026[filingStatus],
  customBrackets: BRACKETS_2026[filingStatus].map((bracket, index) => ({
    ...bracket,
    id: `bracket-${index + 1}`,
  })),
});
