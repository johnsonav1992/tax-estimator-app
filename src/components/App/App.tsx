import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BracketsEditor } from "~/components/BracketsEditor/BracketsEditor";
import { Hero } from "~/components/Hero/Hero";
import { InlineSummary } from "~/components/InlineSummary/InlineSummary";
import { JobIncomeForm } from "~/components/JobIncomeForm/JobIncomeForm";
import { NumberField } from "~/components/NumberField/NumberField";
import { Section } from "~/components/Section/Section";
import { SummaryCard } from "~/components/SummaryCard/SummaryCard";
import { Toggle } from "~/components/Toggle/Toggle";
import { BRACKETS_2026, STANDARD_DEDUCTION_2026 } from "~/data/taxData";
import { calcSummary, normalizeBrackets } from "~/lib/calculations";
import { formatMoney } from "~/lib/format";
import { initialState } from "~/lib/state";
import { incomeTaxBracketsQueryOptions } from "~/queries/incomeTaxQuery";
import type { BracketRow, FormState } from "~/types";

export function App() {
  const [form, setForm] = useState<FormState>(() => initialState("married_joint"));

  const {
    data: apiBrackets,
    isLoading: bracketsLoading,
    isError: bracketsError,
  } = useQuery(
    incomeTaxBracketsQueryOptions({
      year: 2026,
      country: "US",
      regions: "federal",
    }),
  );

  const bracketsByStatus = apiBrackets ?? BRACKETS_2026;

  const defaultStandardDeduction = useMemo(
    () => STANDARD_DEDUCTION_2026[form.filingStatus],
    [form.filingStatus],
  );

  const defaultBrackets = useMemo(
    () => bracketsByStatus[form.filingStatus],
    [bracketsByStatus, form.filingStatus],
  );

  const bracketsToUse = form.useCustomBrackets ? form.customBrackets : defaultBrackets;
  const normalizedBrackets = useMemo(() => normalizeBrackets(bracketsToUse), [bracketsToUse]);

  const summary = useMemo(() => calcSummary(form, normalizedBrackets), [form, normalizedBrackets]);

  const summaryCards = [
    {
      label: "Projected Gross Income",
      value: formatMoney(summary.grossIncome),
      detail: `W-2: ${formatMoney(summary.projectedWages)} · Other: ${formatMoney(
        summary.otherIncomeTotal,
      )}`,
    },
    {
      label: "Adjusted Gross Income",
      value: formatMoney(summary.adjustedGrossIncome),
      detail: `Adjustments: ${formatMoney(summary.totalAdjustments)}`,
    },
    {
      label: "Taxable Income",
      value: formatMoney(summary.taxableIncome),
      detail: `Deductions: ${formatMoney(summary.deductionAmount)} · QBI: ${formatMoney(
        form.deductions.qbiDeduction,
      )}`,
    },
    {
      label: "Estimated Federal Tax",
      value: formatMoney(Math.max(0, summary.totalTax)),
      detail: `Income tax: ${formatMoney(
        summary.incomeTaxAfterNonRefundable,
      )} · SE: ${formatMoney(summary.selfEmploymentTax)} · NIIT: ${formatMoney(
        summary.netInvestmentIncomeTax,
      )} · Addl Medicare: ${formatMoney(summary.additionalMedicareTax)}`,
    },
    {
      label: "Total Paid/Withheld",
      value: formatMoney(summary.totalPayments),
      detail: `YTD + remaining: ${formatMoney(summary.projectedWithholding)}`,
    },
  ];

  const estimatedBalance = summary.estimatedBalance;
  const balanceEmphasis = estimatedBalance >= 0 ? "positive" : "negative";

  const updateBracket = (index: number, updated: BracketRow) => {
    setForm((prev) => ({
      ...prev,
      customBrackets: prev.customBrackets.map((item, itemIndex) =>
        itemIndex === index ? updated : item,
      ),
    }));
  };

  const addJob = (key: "spouseAJobs" | "spouseBJobs") => {
    setForm((prev) => ({
      ...prev,
      [key]: [
        ...prev[key],
        {
          id: `${key}-${prev[key].length + 1}-${Date.now()}`,
          label: "",
          ytdWages: 0,
          ytdWithholding: 0,
          ytdPreTax: 0,
          perPaycheckWages: 0,
          perPaycheckWithholding: 0,
          perPaycheckPreTax: 0,
          paychecksRemaining: 0,
        },
      ],
    }));
  };

  const updateJob = (
    key: "spouseAJobs" | "spouseBJobs",
    index: number,
    updatedJob: FormState["spouseAJobs"][number],
  ) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((job, jobIndex) => (jobIndex === index ? updatedJob : job)),
    }));
  };

  const removeJob = (key: "spouseAJobs" | "spouseBJobs", index: number) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((_, jobIndex) => jobIndex !== index),
    }));
  };

  return (
    <div className="app">
      <Hero
        filingStatus={form.filingStatus}
        onFilingStatusChange={(value) =>
          setForm((prev) => ({
            ...prev,
            filingStatus: value,
            customStandardDeduction: STANDARD_DEDUCTION_2026[value],
            customBrackets: bracketsByStatus[value].map((bracket, index) => ({
              ...bracket,
              id: `bracket-${index + 1}`,
            })),
          }))
        }
        useCustomBrackets={form.useCustomBrackets}
        onCustomBracketsChange={(value) => {
          if (value) {
            setForm((prev) => ({
              ...prev,
              useCustomBrackets: true,
              customStandardDeduction: STANDARD_DEDUCTION_2026[prev.filingStatus],
              customBrackets: bracketsByStatus[prev.filingStatus].map((bracket, index) => ({
                ...bracket,
                id: `bracket-${index + 1}`,
              })),
            }));
            return;
          }
          setForm((prev) => ({ ...prev, useCustomBrackets: false }));
        }}
      />

      <div className="summary">
        {summaryCards.map((card) => (
          <SummaryCard
            key={card.label}
            label={card.label}
            value={card.value}
            detail={card.detail}
          />
        ))}
        <SummaryCard
          label="Estimated Balance"
          value={
            estimatedBalance >= 0
              ? formatMoney(estimatedBalance)
              : formatMoney(Math.abs(estimatedBalance))
          }
          detail={estimatedBalance >= 0 ? "Projected refund" : "Projected amount due"}
          emphasis={balanceEmphasis}
        />
      </div>

      <main className="grid">
        <Section title="Dependents">
          <div className="grid__two">
            <NumberField
              label="Qualifying children"
              value={form.dependents.qualifyingChildren}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  dependents: { ...prev.dependents, qualifyingChildren: value },
                }))
              }
              min={0}
              step={1}
              hint="For your records. Add credits below if applicable."
            />
            <NumberField
              label="Other dependents"
              value={form.dependents.otherDependents}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  dependents: { ...prev.dependents, otherDependents: value },
                }))
              }
              min={0}
              step={1}
            />
          </div>
        </Section>

        <Section title="Spouse A Jobs">
          {form.spouseAJobs.map((job, index) => (
            <JobIncomeForm
              key={job.id}
              job={job}
              index={index}
              labelPrefix="Job"
              onChange={(updatedJob) => updateJob("spouseAJobs", index, updatedJob)}
              onRemove={
                form.spouseAJobs.length > 1 ? () => removeJob("spouseAJobs", index) : undefined
              }
            />
          ))}
          <button
            type="button"
            className="button button--ghost"
            onClick={() => addJob("spouseAJobs")}
          >
            Add job
          </button>
          <InlineSummary
            items={[
              `Projected wages: ${formatMoney(summary.spouseASummary.projectedWages)}`,
              `Projected withholding: ${formatMoney(summary.spouseASummary.projectedWithholding)}`,
            ]}
          />
        </Section>

        <Section title="Spouse B Jobs">
          {form.spouseBJobs.map((job, index) => (
            <JobIncomeForm
              key={job.id}
              job={job}
              index={index}
              labelPrefix="Job"
              onChange={(updatedJob) => updateJob("spouseBJobs", index, updatedJob)}
              onRemove={
                form.spouseBJobs.length > 1 ? () => removeJob("spouseBJobs", index) : undefined
              }
            />
          ))}
          <button
            type="button"
            className="button button--ghost"
            onClick={() => addJob("spouseBJobs")}
          >
            Add job
          </button>
          <InlineSummary
            items={[
              `Projected wages: ${formatMoney(summary.spouseBSummary.projectedWages)}`,
              `Projected withholding: ${formatMoney(summary.spouseBSummary.projectedWithholding)}`,
            ]}
          />
        </Section>

        <Section title="Other Income">
          <div className="grid__two">
            <NumberField
              label="Interest (HYSA, savings)"
              value={form.otherIncome.interest}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, interest: value },
                }))
              }
            />
            <NumberField
              label="Ordinary dividends"
              value={form.otherIncome.ordinaryDividends}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, ordinaryDividends: value },
                }))
              }
            />
            <NumberField
              label="Qualified dividends"
              value={form.otherIncome.qualifiedDividends}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, qualifiedDividends: value },
                }))
              }
            />
            <NumberField
              label="Short-term capital gains"
              value={form.otherIncome.shortTermCapitalGains}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, shortTermCapitalGains: value },
                }))
              }
            />
            <NumberField
              label="Long-term capital gains"
              value={form.otherIncome.longTermCapitalGains}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, longTermCapitalGains: value },
                }))
              }
            />
            <NumberField
              label="Self-employment net"
              value={form.otherIncome.selfEmployment}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, selfEmployment: value },
                }))
              }
              hint="Schedule C net income"
            />
            <NumberField
              label="Rental income"
              value={form.otherIncome.rental}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, rental: value },
                }))
              }
            />
            <NumberField
              label="Other income"
              value={form.otherIncome.other}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  otherIncome: { ...prev.otherIncome, other: value },
                }))
              }
            />
          </div>
        </Section>

        <Section title="Adjustments & Deductions">
          <div className="grid__three">
            <NumberField
              label="Other adjustments"
              value={form.deductions.otherAdjustments}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  deductions: { ...prev.deductions, otherAdjustments: value },
                }))
              }
              hint="IRA, HSA (non-payroll), student loan interest"
            />
            <NumberField
              label="QBI deduction"
              value={form.deductions.qbiDeduction}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  deductions: { ...prev.deductions, qbiDeduction: value },
                }))
              }
            />
            <div className="field">
              <Toggle
                label="Use standard deduction"
                checked={form.deductions.useStandardDeduction}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    deductions: { ...prev.deductions, useStandardDeduction: value },
                  }))
                }
              />
              <span className="field__hint">
                Standard deduction: {formatMoney(defaultStandardDeduction)}
              </span>
            </div>
            {!form.deductions.useStandardDeduction && (
              <NumberField
                label="Itemized deductions"
                value={form.deductions.itemizedDeductions}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    deductions: { ...prev.deductions, itemizedDeductions: value },
                  }))
                }
              />
            )}
          </div>
        </Section>

        <Section title="Credits">
          <div className="grid__three">
            <div className="field field--full">
              <Toggle
                label="Auto-calc child/dependent credits"
                checked={form.useAutoCredits}
                onChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    useAutoCredits: value,
                  }))
                }
              />
              <span className="field__hint">Uses dependents and MAGI for CTC/ODC.</span>
            </div>
            <NumberField
              label="Child tax credit"
              value={
                form.useAutoCredits
                  ? summary.autoCredits.childCreditTotal ?? 0
                  : form.credits.childTaxCredit
              }
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  credits: { ...prev.credits, childTaxCredit: value },
                }))
              }
              disabled={form.useAutoCredits}
              hint={form.useAutoCredits ? "Auto-calculated from dependents." : undefined}
            />
            <NumberField
              label="Other dependent credit"
              value={
                form.useAutoCredits
                  ? summary.autoCredits.otherDependentCredit
                  : form.credits.otherDependentCredit
              }
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  credits: { ...prev.credits, otherDependentCredit: value },
                }))
              }
              disabled={form.useAutoCredits}
              hint={form.useAutoCredits ? "Auto-calculated from dependents." : undefined}
            />
            <NumberField
              label="Childcare expenses"
              value={form.credits.dependentCareExpenses}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  credits: { ...prev.credits, dependentCareExpenses: value },
                }))
              }
              hint={`Estimated dependent care credit: ${formatMoney(
                summary.dependentCareCredit,
              )}. Uses qualifying children count and assumes no DCFSA benefits.`}
            />
            <NumberField
              label="Education credits"
              value={form.credits.educationCredits}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  credits: { ...prev.credits, educationCredits: value },
                }))
              }
            />
            <NumberField
              label="Energy credits"
              value={form.credits.energyCredits}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  credits: { ...prev.credits, energyCredits: value },
                }))
              }
            />
            <NumberField
              label="Other non-refundable credits"
              value={form.credits.otherNonRefundableCredits}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  credits: { ...prev.credits, otherNonRefundableCredits: value },
                }))
              }
            />
            <NumberField
              label="Refundable credits"
              value={form.credits.refundableCredits}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  credits: { ...prev.credits, refundableCredits: value },
                }))
              }
              hint={
                form.useAutoCredits
                  ? `Auto ACTC: ${formatMoney(summary.refundableChildCredit)}`
                  : "Additional child tax credit, other refundable"
              }
            />
          </div>
        </Section>

        <Section title="Tax Payments">
          <div className="grid__two">
            <NumberField
              label="Estimated tax payments"
              value={form.payments.estimatedPayments}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  payments: { ...prev.payments, estimatedPayments: value },
                }))
              }
            />
            <NumberField
              label="Other payments/credits"
              value={form.payments.otherPayments}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  payments: { ...prev.payments, otherPayments: value },
                }))
              }
              hint="Prior-year refund applied, other credits"
            />
          </div>
        </Section>

        <Section title="Advanced Overrides">
          <BracketsEditor
            brackets={form.customBrackets}
            filingStatus={form.filingStatus}
            standardDeduction={
              form.useCustomBrackets ? form.customStandardDeduction : defaultStandardDeduction
            }
            onStandardDeductionChange={(value) =>
              setForm((prev) => ({
                ...prev,
                customStandardDeduction: value,
              }))
            }
            onReset={() =>
              setForm((prev) => ({
                ...prev,
                customStandardDeduction: STANDARD_DEDUCTION_2026[prev.filingStatus],
                customBrackets: bracketsByStatus[prev.filingStatus].map((bracket, index) => ({
                  ...bracket,
                  id: `bracket-${index + 1}`,
                })),
              }))
            }
            onBracketChange={updateBracket}
          />
        </Section>
      </main>

      <div className="notice">
        {bracketsLoading ? "Loading tax brackets..." : null}
        {bracketsError
          ? "Using fallback brackets. Add VITE_TAX_API_KEY to enable live data."
          : null}
      </div>

      <footer className="footer">
        <p>
          This estimator focuses on federal income tax and includes self-employment tax, NIIT, and
          Additional Medicare tax where applicable. It does not calculate AMT or state taxes. Enter
          known credits and deductions for the most accurate projection.
        </p>
        <p>
          Values shown are estimates. For filing decisions, consult IRS guidance or a qualified tax
          professional.
        </p>
      </footer>
    </div>
  );
}
