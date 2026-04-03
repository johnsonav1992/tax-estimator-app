import { useState } from "react";
import { formatMoney } from "../../lib/format";
import { parsePaystubWithIntegrations } from "../../integrations/paystubIntegrations";
import type { PaystubExtraction } from "../../integrations/types";
import { extractPdfText } from "../../lib/paystub";
import type { JobIncome } from "../../types";
import { NumberField } from "../NumberField/NumberField";

type JobIncomeFormProps = {
  job: JobIncome;
  index: number;
  onChange: (job: JobIncome) => void;
  onRemove?: () => void;
  labelPrefix: string;
};

export const JobIncomeForm = ({
  job,
  index,
  onChange,
  onRemove,
  labelPrefix,
}: JobIncomeFormProps) => {
  const [isParsing, setIsParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [extraction, setExtraction] = useState<PaystubExtraction | null>(null);

  const handleFile = async (file: File) => {
    setIsParsing(true);
    setError(null);
    try {
      const text = await extractPdfText(file);
      const parsed = parsePaystubWithIntegrations(text);
      setExtraction(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to parse paystub.");
    } finally {
      setIsParsing(false);
    }
  };

  const applyExtraction = () => {
    if (!extraction) {
      return;
    }
    onChange({
      ...job,
      ytdWages: extraction.ytdWages ?? job.ytdWages,
      ytdWithholding: extraction.ytdWithholding ?? job.ytdWithholding,
      ytdPreTax: extraction.ytdPreTax ?? job.ytdPreTax,
      perPaycheckWages: extraction.currentGross ?? job.perPaycheckWages,
      perPaycheckWithholding: extraction.currentWithholding ?? job.perPaycheckWithholding,
      perPaycheckPreTax: extraction.currentPreTax ?? job.perPaycheckPreTax,
    });
    setExtraction(null);
  };

  return (
    <div className="job-card">
      <div className="job-card__header">
        <div className="job-card__title">
          {labelPrefix} {index + 1}
        </div>
        {onRemove ? (
          <button type="button" className="button button--ghost" onClick={onRemove}>
            Remove job
          </button>
        ) : null}
      </div>
      <label className="field">
        <span className="field__label">Job label</span>
        <input
          className="field__input"
          type="text"
          value={job.label}
          onChange={(event) => onChange({ ...job, label: event.target.value })}
          placeholder="Employer or role"
        />
      </label>
      <div className="upload">
        <span className="field__label">Upload paystub (PDF)</span>
        <input
          className="field__input"
          type="file"
          accept="application/pdf"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              void handleFile(file);
            }
          }}
        />
        {isParsing ? <span className="upload__status">Parsing paystub...</span> : null}
        {error ? <span className="upload__error">{error}</span> : null}
      </div>
      {extraction ? (
        <div className="paystub-preview">
          <div className="paystub-preview__title">Found on paystub</div>
          <div className="paystub-preview__grid">
            <span>YTD wages</span>
            <span>{extraction.ytdWages ? formatMoney(extraction.ytdWages) : "—"}</span>
            <span>YTD federal withholding</span>
            <span>{extraction.ytdWithholding ? formatMoney(extraction.ytdWithholding) : "—"}</span>
            <span>YTD pre-tax</span>
            <span>{extraction.ytdPreTax ? formatMoney(extraction.ytdPreTax) : "—"}</span>
            <span>Current gross</span>
            <span>{extraction.currentGross ? formatMoney(extraction.currentGross) : "—"}</span>
            <span>Current federal withholding</span>
            <span>
              {extraction.currentWithholding ? formatMoney(extraction.currentWithholding) : "—"}
            </span>
            <span>Current pre-tax</span>
            <span>{extraction.currentPreTax ? formatMoney(extraction.currentPreTax) : "—"}</span>
            <span>Pay frequency</span>
            <span>{extraction.payFrequency ?? "—"}</span>
          </div>
          <div className="paystub-preview__actions">
            <button type="button" className="button" onClick={applyExtraction}>
              Apply to job
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={() => setExtraction(null)}
            >
              Dismiss
            </button>
          </div>
        </div>
      ) : null}
      <div className="grid__three">
        <NumberField
          label="YTD gross wages"
          value={job.ytdWages}
          onChange={(value) => onChange({ ...job, ytdWages: value })}
        />
        <NumberField
          label="YTD federal withholding"
          value={job.ytdWithholding}
          onChange={(value) => onChange({ ...job, ytdWithholding: value })}
        />
        <NumberField
          label="YTD pre-tax deductions"
          value={job.ytdPreTax}
          onChange={(value) => onChange({ ...job, ytdPreTax: value })}
          hint="401(k), HSA, pre-tax health"
        />
      </div>
      <div className="grid__three">
        <NumberField
          label="Gross per paycheck"
          value={job.perPaycheckWages}
          onChange={(value) => onChange({ ...job, perPaycheckWages: value })}
        />
        <NumberField
          label="Federal withholding per paycheck"
          value={job.perPaycheckWithholding}
          onChange={(value) => onChange({ ...job, perPaycheckWithholding: value })}
        />
        <NumberField
          label="Pre-tax per paycheck"
          value={job.perPaycheckPreTax}
          onChange={(value) => onChange({ ...job, perPaycheckPreTax: value })}
        />
      </div>
      <NumberField
        label="Paychecks remaining"
        value={job.paychecksRemaining}
        onChange={(value) => onChange({ ...job, paychecksRemaining: value })}
        step={1}
      />
    </div>
  );
};
