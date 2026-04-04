const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export const formatMoney = (value: number): string => {
  if (!Number.isFinite(value)) {
    return currency.format(0);
  }
  return currency.format(Math.round(value));
};
