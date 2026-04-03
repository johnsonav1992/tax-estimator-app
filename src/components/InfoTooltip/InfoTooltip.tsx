type InfoTooltipProps = {
  text: string;
  label?: string;
};

export const InfoTooltip = ({ text, label = "More info" }: InfoTooltipProps) => (
  <span className="info">
    <button type="button" className="info__button" aria-label={label}>
      i
    </button>
    <span className="info__tooltip" role="tooltip">
      {text}
    </span>
  </span>
);
