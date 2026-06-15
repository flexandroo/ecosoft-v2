const uahFormatter = new Intl.NumberFormat("uk-UA", {
  maximumFractionDigits: 0,
});

export function formatUah(value: number): string {
  return `${uahFormatter.format(value)} ₴`;
}
