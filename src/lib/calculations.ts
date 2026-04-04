import {
  ADDITIONAL_CHILD_TAX_CREDIT_MAX_2026,
  ADDITIONAL_MEDICARE_THRESHOLDS,
  CAPITAL_GAINS_THRESHOLDS_2026,
  CHILD_TAX_CREDIT_2026,
  NIIT_THRESHOLDS,
  OTHER_DEPENDENT_CREDIT,
  SELF_EMPLOYMENT_TAX,
} from "../data/taxData";
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

const calcCapitalGainsTax = (
  taxableIncome: number,
  ordinaryTaxableIncome: number,
  netCapitalGains: number,
  filingStatus: FormState["filingStatus"],
): number => {
  if (netCapitalGains <= 0 || taxableIncome <= 0) {
    return 0;
  }

  const thresholds = CAPITAL_GAINS_THRESHOLDS_2026[filingStatus];
  const zeroCap = Math.min(taxableIncome, thresholds.zeroRateMax);
  const fifteenCap = Math.min(taxableIncome, thresholds.fifteenRateMax);

  const amountAtZero = Math.max(0, zeroCap - ordinaryTaxableIncome);
  const amountAtFifteen = Math.max(
    0,
    fifteenCap - Math.max(ordinaryTaxableIncome, thresholds.zeroRateMax),
  );
  const amountAtTwenty = Math.max(0, netCapitalGains - amountAtZero - amountAtFifteen);

  return amountAtFifteen * 0.15 + amountAtTwenty * 0.2;
};

const calcSelfEmploymentTax = (netSelfEmployment: number, wages: number) => {
  if (netSelfEmployment <= 0) {
    return { tax: 0, deduction: 0, netEarnings: 0 };
  }

  const netEarnings = netSelfEmployment * SELF_EMPLOYMENT_TAX.netEarningsFactor;
  const remainingSocialSecurityBase = Math.max(0, SELF_EMPLOYMENT_TAX.wageBase - wages);
  const socialSecurityTaxable = Math.min(netEarnings, remainingSocialSecurityBase);

  const socialSecurityTax = socialSecurityTaxable * SELF_EMPLOYMENT_TAX.socialSecurityRate;
  const medicareTax = netEarnings * SELF_EMPLOYMENT_TAX.medicareRate;
  const tax = socialSecurityTax + medicareTax;

  return {
    tax,
    deduction: tax * 0.5,
    netEarnings,
  };
};

const calcAdditionalMedicareTax = (
  wages: number,
  netSelfEmploymentEarnings: number,
  filingStatus: FormState["filingStatus"],
) => {
  const threshold = ADDITIONAL_MEDICARE_THRESHOLDS[filingStatus];
  const wageExcess = Math.max(0, wages - threshold);
  const remainingThreshold = Math.max(0, threshold - wages);
  const selfEmploymentExcess = Math.max(0, netSelfEmploymentEarnings - remainingThreshold);
  return (wageExcess + selfEmploymentExcess) * 0.009;
};

const calcNetInvestmentIncomeTax = (
  investmentIncome: number,
  modifiedAgi: number,
  filingStatus: FormState["filingStatus"],
) => {
  if (investmentIncome <= 0) {
    return 0;
  }
  const threshold = NIIT_THRESHOLDS[filingStatus];
  const excess = Math.max(0, modifiedAgi - threshold);
  const niitBase = Math.min(investmentIncome, excess);
  return niitBase * 0.038;
};

const calcChildCredits = (
  qualifyingChildren: number,
  otherDependents: number,
  modifiedAgi: number,
  filingStatus: FormState["filingStatus"],
) => {
  const baseChildCredit = qualifyingChildren * CHILD_TAX_CREDIT_2026;
  const baseOtherCredit = otherDependents * OTHER_DEPENDENT_CREDIT;
  const baseTotal = baseChildCredit + baseOtherCredit;

  if (baseTotal <= 0) {
    return {
      childCredit: 0,
      otherDependentCredit: 0,
      refundableChildCredit: 0,
    };
  }

  const phaseoutThreshold = filingStatus === "married_joint" ? 400000 : 200000;
  const phaseoutExcess = Math.max(0, modifiedAgi - phaseoutThreshold);
  const reductionUnits = Math.ceil(phaseoutExcess / 1000);
  const reduction = reductionUnits * 50;

  const childCreditAfter = Math.max(0, baseChildCredit - reduction);
  const remainingReduction = Math.max(0, reduction - baseChildCredit);
  const otherCreditAfter = Math.max(0, baseOtherCredit - remainingReduction);

  return {
    childCreditTotal: childCreditAfter,
    otherDependentCredit: otherCreditAfter,
  };
};

const calcDependentCareCredit = (
  expenses: number,
  adjustedGrossIncome: number,
  qualifyingPersons: number,
  earnedIncome: number,
) => {
  if (expenses <= 0 || qualifyingPersons <= 0) {
    return 0;
  }

  const expenseLimit = qualifyingPersons >= 2 ? 6000 : 3000;
  const eligibleExpenses = Math.min(expenses, expenseLimit, Math.max(0, earnedIncome));

  if (eligibleExpenses <= 0) {
    return 0;
  }

  const excess = Math.max(0, adjustedGrossIncome - 15000);
  const reductions = Math.ceil(excess / 2000);
  const rate = Math.max(0.2, 0.35 - reductions * 0.01);

  return eligibleExpenses * rate;
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

  const investmentIncome =
    form.otherIncome.interest +
    form.otherIncome.ordinaryDividends +
    form.otherIncome.qualifiedDividends +
    form.otherIncome.shortTermCapitalGains +
    form.otherIncome.longTermCapitalGains +
    form.otherIncome.rental;

  const otherIncomeTotal = sumObjectValues(form.otherIncome);
  const grossIncome = projectedWages + otherIncomeTotal;

  const selfEmploymentTax = calcSelfEmploymentTax(form.otherIncome.selfEmployment, projectedWages);
  const totalAdjustments =
    form.deductions.otherAdjustments + projectedPreTax + selfEmploymentTax.deduction;
  const adjustedGrossIncome = Math.max(0, grossIncome - totalAdjustments);
  const modifiedAgi = adjustedGrossIncome;
  const earnedIncome = projectedWages + Math.max(0, form.otherIncome.selfEmployment);

  const deductionAmount = form.deductions.useStandardDeduction
    ? form.customStandardDeduction
    : form.deductions.itemizedDeductions;

  const taxableIncome = Math.max(
    0,
    adjustedGrossIncome - deductionAmount - form.deductions.qbiDeduction,
  );

  const netCapitalGains =
    form.otherIncome.qualifiedDividends + form.otherIncome.longTermCapitalGains;
  const adjustedNetCapitalGains = Math.max(0, Math.min(netCapitalGains, taxableIncome));
  const ordinaryTaxableIncome = Math.max(0, taxableIncome - adjustedNetCapitalGains);

  const ordinaryIncomeTax = calcBracketTax(ordinaryTaxableIncome, brackets);
  const capitalGainsTax = calcCapitalGainsTax(
    taxableIncome,
    ordinaryTaxableIncome,
    adjustedNetCapitalGains,
    form.filingStatus,
  );
  const incomeTaxBeforeCredits = ordinaryIncomeTax + capitalGainsTax;

  const autoCredits = calcChildCredits(
    form.dependents.qualifyingChildren,
    form.dependents.otherDependents,
    modifiedAgi,
    form.filingStatus,
  );

  const childCreditTotal = form.useAutoCredits
    ? autoCredits.childCreditTotal
    : form.credits.childTaxCredit;
  const otherDependentCredit = form.useAutoCredits
    ? autoCredits.otherDependentCredit
    : form.credits.otherDependentCredit;

  const maxRefundableChildCredit =
    form.useAutoCredits && form.dependents.qualifyingChildren > 0
      ? Math.min(
          form.dependents.qualifyingChildren * ADDITIONAL_CHILD_TAX_CREDIT_MAX_2026,
          Math.max(0, earnedIncome - 2500) * 0.15,
        )
      : 0;

  const dependentCareCredit = calcDependentCareCredit(
    form.credits.dependentCareExpenses,
    adjustedGrossIncome,
    form.dependents.qualifyingChildren,
    earnedIncome,
  );

  const otherNonRefundableCredits =
    dependentCareCredit +
    form.credits.educationCredits +
    form.credits.energyCredits +
    form.credits.otherNonRefundableCredits;

  const taxAfterOtherNonRefundable = Math.max(
    0,
    incomeTaxBeforeCredits - otherNonRefundableCredits,
  );
  const maxNonRefundableChildDependentCredit = childCreditTotal + otherDependentCredit;
  const nonRefundableChildDependentCredit = Math.min(
    taxAfterOtherNonRefundable,
    maxNonRefundableChildDependentCredit,
  );
  const incomeTaxAfterNonRefundable = Math.max(
    0,
    taxAfterOtherNonRefundable - nonRefundableChildDependentCredit,
  );
  const remainingChildCredit = Math.max(0, childCreditTotal - nonRefundableChildDependentCredit);
  const refundableChildCredit = Math.min(maxRefundableChildCredit, remainingChildCredit);

  const additionalMedicareTax = calcAdditionalMedicareTax(
    projectedWages,
    selfEmploymentTax.netEarnings,
    form.filingStatus,
  );
  const netInvestmentIncomeTax = calcNetInvestmentIncomeTax(
    investmentIncome,
    modifiedAgi,
    form.filingStatus,
  );

  const totalTax =
    incomeTaxAfterNonRefundable +
    selfEmploymentTax.tax +
    additionalMedicareTax +
    netInvestmentIncomeTax;

  const totalPayments =
    projectedWithholding +
    form.payments.estimatedPayments +
    form.payments.otherPayments +
    form.credits.refundableCredits +
    refundableChildCredit;

  const estimatedBalance = totalPayments - totalTax;

  return {
    spouseASummary,
    spouseBSummary,
    projectedWages,
    projectedWithholding,
    otherIncomeTotal,
    grossIncome,
    totalAdjustments,
    adjustedGrossIncome,
    modifiedAgi,
    deductionAmount,
    taxableIncome,
    incomeTaxBeforeCredits,
    ordinaryIncomeTax,
    capitalGainsTax,
    incomeTaxAfterNonRefundable,
    selfEmploymentTax: selfEmploymentTax.tax,
    selfEmploymentTaxDeduction: selfEmploymentTax.deduction,
    netInvestmentIncomeTax,
    additionalMedicareTax,
    totalTax,
    refundableChildCredit,
    dependentCareCredit,
    totalPayments,
    estimatedBalance,
    autoCredits,
    childCreditTotal,
    otherDependentCredit,
    otherNonRefundableCredits,
    nonRefundableChildDependentCredit,
  };
};
