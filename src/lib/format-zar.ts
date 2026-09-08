const ZAR = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
});

/** The only way to print a currency string. Input is integer cents. */
export function formatZAR(cents: number): string {
  if (!Number.isInteger(cents)) {
    throw new Error("formatZAR expects integer cents, never a float");
  }

  return ZAR.format(cents / 100);
}
