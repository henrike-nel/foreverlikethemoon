const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

/** The only way to print a currency string. */
export function formatZAR(amount: number): string {
  return ZAR.format(amount);
}
