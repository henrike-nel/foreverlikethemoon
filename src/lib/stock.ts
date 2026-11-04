export const STOCK = ["in-stock", "out-of-stock", "sold-out"] as const;
export type Stock = (typeof STOCK)[number];

export function stockLabel(stock: Stock): string {
  switch (stock) {
    case "in-stock":
      return "In stock";
    case "out-of-stock":
      return "Out of stock";
    case "sold-out":
      return "Sold out";
  }
}

export function stockSentence(stock: Stock): string | undefined {
  switch (stock) {
    case "in-stock":
      return undefined;
    case "out-of-stock":
      return "Not available to order right now.";
    case "sold-out":
      return "This edition has sold out.";
  }
}

export function stockAvailabilityUrl(stock: Stock): string {
  switch (stock) {
    case "in-stock":
      return "https://schema.org/InStock";
    case "out-of-stock":
      return "https://schema.org/OutOfStock";
    case "sold-out":
      return "https://schema.org/SoldOut";
  }
}
