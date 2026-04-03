type SummaryCardProps = {
  label: string;
  value: string;
  detail: string;
  emphasis?: "positive" | "negative";
};

export const SummaryCard = ({ label, value, detail, emphasis }: SummaryCardProps) => (
  <div
    className={[
      "summary__card",
      emphasis ? "summary__card--balance" : "",
      emphasis === "positive" ? "positive" : "",
      emphasis === "negative" ? "negative" : "",
    ]
      .filter(Boolean)
      .join(" ")}
  >
    <span className="summary__label">{label}</span>
    <strong className="summary__value">{value}</strong>
    <span className="summary__detail">{detail}</span>
  </div>
);
