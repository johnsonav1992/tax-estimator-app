import { useEffect, useState } from "react";
import { clampToZero } from "../../lib/calculations";
import { InfoTooltip } from "../InfoTooltip/InfoTooltip";

type NumberFieldProps = {
  label: string;
  value: number;
  onChange: (value: number) => void;
  hint?: string;
  min?: number;
  step?: number;
  disabled?: boolean;
};

export const NumberField = ({
  label,
  value,
  onChange,
  hint,
  min,
  step,
  disabled,
}: NumberFieldProps) => {
  const [displayValue, setDisplayValue] = useState<string>(() =>
    Number.isFinite(value) ? String(value) : "",
  );
  const [isFocused, setIsFocused] = useState(false);

  const normalizeInput = (rawValue: string): string => {
    const cleaned = rawValue.replace(/[^\d.]/g, "");
    if (cleaned === "") {
      return "";
    }
    const [whole, ...rest] = cleaned.split(".");
    const fractional = rest.join("");
    return rest.length > 0 ? `${whole}.${fractional}` : whole;
  };

  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(Number.isFinite(value) ? String(value) : "");
    }
  }, [isFocused, value]);

  return (
    <label className="field">
      <span className="field__label field__label-row">
        {label}
        {hint ? <InfoTooltip text={hint} label={`${label} info`} /> : null}
      </span>
      <input
        className="field__input"
        type="text"
        inputMode="decimal"
        pattern="^\\d*\\.?\\d*$"
        min={min}
        step={step ?? 1}
        value={displayValue}
        disabled={disabled}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          if (displayValue === "") {
            setDisplayValue("0");
          }
        }}
        onChange={(event) => {
          const rawValue = event.target.value;
          const normalized = normalizeInput(rawValue);
          setDisplayValue(normalized);
          if (normalized === "") {
            onChange(0);
            return;
          }

          const parsed = Number(normalized);
          if (!Number.isNaN(parsed)) {
            onChange(clampToZero(parsed));
          }
        }}
      />
    </label>
  );
};
