import { filingStatusLabel } from "../../data/taxData";
import type { FilingStatus } from "../../types";
import { SelectField } from "../SelectField/SelectField";
import { Toggle } from "../Toggle/Toggle";

type HeroProps = {
  filingStatus: FilingStatus;
  onFilingStatusChange: (value: FilingStatus) => void;
  useCustomBrackets: boolean;
  onCustomBracketsChange: (value: boolean) => void;
};

export const Hero = ({
  filingStatus,
  onFilingStatusChange,
  useCustomBrackets,
  onCustomBracketsChange,
}: HeroProps) => (
  <header className="hero">
    <div>
      <h1>Federal Income Tax Estimator</h1>
      <p className="subhead">Enter your numbers and see an estimated balance.</p>
    </div>
    <div className="hero__meta">
      <SelectField
        label="Filing Status"
        value={filingStatus}
        onChange={(value) => onFilingStatusChange(value as FilingStatus)}
        options={Object.entries(filingStatusLabel).map(([value, label]) => ({
          value,
          label,
        }))}
      />
      <SelectField
        label="Tax Year"
        value="2026"
        onChange={() => undefined}
        options={[{ label: "2026", value: "2026" }]}
      />
      <Toggle
        label="Customize tax brackets and standard deduction"
        checked={useCustomBrackets}
        onChange={onCustomBracketsChange}
      />
    </div>
  </header>
);
