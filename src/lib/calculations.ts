import type { Bracket, BracketRow, FormState, JobIncome } from "../types";

export const clampToZero = (value: number): number =>
  Number.isNaN(value) ? 0 : Math.max(0, value);

export const calcBracketTax = (taxableIncome: number, brackets: Bracket[]): number => {
  let remaining = Math.max(0, taxableIncome);
  let lowerBound = 0;
  let tax = 0;

  for (const bracket of brackets) {
    const upperBound = bracket.upTo ?? Number.POSITIVE_INFINITY;
    const taxableAtRate = Math.min(remaining, upperBound - lowerBound);
    if (taxableAtRate > 0) {
      tax += taxableAtRate * bracket.rate;
      remaining -= taxableAtRate;
      lowerBound = upperBound;
    }
    if (remaining <= 0) {
      break;
    }
  }

  return tax;
};

export const buildAnnualJob = (job: JobIncome) => {
  const projectedWages = job.ytdWages + job.perPaycheckWages * job.paychecksRemaining;
  const projectedWithholding =
    job.ytdWithholding + job.perPaycheckWithholding * job.paychecksRemaining;
  const projectedPreTax = job.ytdPreTax + job.perPaycheckPreTax * job.paychecksRemaining;

  return {
    projectedWages,
    projectedWithholding,
    projectedPreTax,
  };
};

const sumAnnualJobs = (jobs: JobIncome[]) =>
  jobs.reduce(
    (totals, job) => {
      const annual = buildAnnualJob(job);
      return {
        projectedWages: totals.projectedWages + annual.projectedWages,
        projectedWithholding: totals.projectedWithholding + annual.projectedWithholding,
        projectedPreTax: totals.projectedPreTax + annual.projectedPreTax,
      };
    },
    { projectedWages: 0, projectedWithholding: 0, projectedPreTax: 0 },
  );

export const sumObjectValues = (values: Record<string, number>): number =>
  Object.values(values).reduce((total, value) => total + value, 0);

export const normalizeBrackets = (brackets: Bracket[] | BracketRow[]): Bracket[] =>
  brackets.map((bracket, index) => ({
    rate: bracket.rate,
    upTo:
      index === brackets.length - 1 && (!bracket.upTo || bracket.upTo <= 0) ? null : bracket.upTo,
  }));

export const calcSummary = (form: FormState, brackets: Bracket[]) => {
  const spouseASummary = sumAnnualJobs(form.spouseAJobs);
  const spouseBSummary = sumAnnualJobs(form.spouseBJobs);

  const projectedWages = spouseASummary.projectedWages + spouseBSummary.projectedWages;
  const projectedWithholding =
    spouseASummary.projectedWithholding + spouseBSummary.projectedWithholding;
  const projectedPreTax = spouseASummary.projectedPreTax + spouseBSummary.projectedPreTax;

  const otherIncomeTotal = sumObjectValues(form.otherIncome);
  const grossIncome = projectedWages + otherIncomeTotal;

  const totalAdjustments = form.deductions.otherAdjustments + projectedPreTax;
  const adjustedGrossIncome = Math.max(0, grossIncome - totalAdjustments);

  const deductionAmount = form.deductions.useStandardDeduction
    ? form.customStandardDeduction
    : form.deductions.itemizedDeductions;

  const taxableIncome = Math.max(
    0,
    adjustedGrossIncome - deductionAmount - form.deductions.qbiDeduction,
  );

  const incomeTaxBeforeCredits = calcBracketTax(taxableIncome, brackets);

  const nonRefundableCredits =
    form.credits.childTaxCredit +
    form.credits.otherDependentCredit +
    form.credits.dependentCareCredit +
    form.credits.educationCredits +
    form.credits.energyCredits +
    form.credits.otherNonRefundableCredits;

  const taxAfterNonRefundable = Math.max(0, incomeTaxBeforeCredits - nonRefundableCredits);
  const taxAfterCredits = taxAfterNonRefundable - form.credits.refundableCredits;

  const totalPayments =
    projectedWithholding + form.payments.estimatedPayments + form.payments.otherPayments;

  const estimatedBalance = totalPayments - taxAfterCredits;

  return {
    spouseASummary,
    spouseBSummary,
    projectedWages,
    projectedWithholding,
    otherIncomeTotal,
    grossIncome,
    totalAdjustments,
    adjustedGrossIncome,
    deductionAmount,
    taxableIncome,
    incomeTaxBeforeCredits,
    nonRefundableCredits,
    taxAfterCredits,
    totalPayments,
    estimatedBalance,
  };
};
