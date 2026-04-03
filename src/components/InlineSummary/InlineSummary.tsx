type InlineSummaryProps = {
  items: string[];
};

export const InlineSummary = ({ items }: InlineSummaryProps) => (
  <div className="inline-summary">
    {items.map((item) => (
      <span key={item}>{item}</span>
    ))}
  </div>
);
