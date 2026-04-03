import { filingStatusLabel } from "../../data/taxData";
import type { BracketRow, FilingStatus } from "../../types";
import { NumberField } from "../NumberField/NumberField";

type BracketsEditorProps = {
  brackets: BracketRow[];
  filingStatus: FilingStatus;
  standardDeduction: number;
  onStandardDeductionChange: (value: number) => void;
  onReset: () => void;
  onBracketChange: (index: number, bracket: BracketRow) => void;
};

export const BracketsEditor = ({
  brackets,
  filingStatus,
  standardDeduction,
  onStandardDeductionChange,
  onReset,
  onBracketChange,
}: BracketsEditorProps) => (
  <>
    <div className="grid__two">
      <NumberField
        label="Standard deduction override"
        value={standardDeduction}
        onChange={onStandardDeductionChange}
        hint="Used only when customization is enabled"
      />
      <div className="field">
        <button type="button" className="button" onClick={onReset}>
          Reset to 2026 defaults
        </button>
        <span className="field__hint">Applies to {filingStatusLabel[filingStatus]}</span>
      </div>
    </div>
    <div className="brackets">
      {brackets.map((bracket, index) => (
        <div key={bracket.id} className="brackets__row">
          <div className="brackets__cell">
            <NumberField
              label={`Rate ${index + 1} (%)`}
              value={bracket.rate * 100}
              onChange={(value) =>
                onBracketChange(index, {
                  ...bracket,
                  rate: value / 100,
                })
              }
              step={0.01}
            />
          </div>
          <div className="brackets__cell">
            <NumberField
              label={`Upper bound ${index + 1}`}
              value={bracket.upTo ?? 0}
              onChange={(value) =>
                onBracketChange(index, {
                  ...bracket,
                  upTo: value,
                })
              }
              hint={index === brackets.length - 1 ? "Leave 0 for top bracket" : undefined}
            />
          </div>
        </div>
      ))}
      <p className="note">
        If you leave the last upper bound at 0, it will be treated as no cap. Brackets are applied
        in order.
      </p>
    </div>
  </>
);
