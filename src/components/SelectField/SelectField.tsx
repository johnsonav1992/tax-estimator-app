import { useEffect, useMemo, useRef, useState } from "react";

type SelectFieldOption = { label: string; value: string };

type SelectFieldProps = {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectFieldOption[];
};

export const SelectField = ({ label, value, onChange, options }: SelectFieldProps) => {
  const [open, setOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(
    () => options.find((option) => option.value === value) ?? options[0],
    [options, value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) {
        return;
      }
      if (!containerRef.current.contains(event.target as Node)) {
        setIsClosing(true);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  useEffect(() => {
    if (!isClosing) {
      return;
    }
    const timer = window.setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 160);
    return () => window.clearTimeout(timer);
  }, [isClosing]);

  return (
    <div
      className={`select${open ? " select--open" : ""}${isClosing ? " select--closing" : ""}`}
      ref={containerRef}
    >
      <span className="field__label">{label}</span>
      <button
        type="button"
        className="select__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            setIsClosing(true);
            return;
          }
          setOpen(true);
        }}
      >
        {selected?.label}
      </button>
      {open ? (
        <div className={`select__menu${isClosing ? " select__menu--closing" : ""}`} role="listbox">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={option.value === value}
              className="select__option"
              onClick={() => {
                onChange(option.value);
                setIsClosing(true);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
};
