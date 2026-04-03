type ToggleProps = {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
};

export const Toggle = ({ label, checked, onChange }: ToggleProps) => (
  <label className="toggle">
    <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
    <span>{label}</span>
  </label>
);
