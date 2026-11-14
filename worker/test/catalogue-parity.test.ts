import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../../functions/_lib/catalogue";

// Vite's import.meta.glob, typed locally so the Workers tsconfig needs no
// vite/client types.
declare global {
  interface ImportMeta {
    glob(
      pattern: string,
      options: { query: "?raw"; import: "default"; eager: true },
    ): Record<string, string>;
  }
}

const files = import.meta.glob("../../src/content/products/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});

function frontmatter(source: string, key: string): string | undefined {
  const match = source.match(new RegExp(`^${key}:\\s*(.+)$`, "m"));
  return match?.[1]?.trim();
}

describe("site catalogue matches the order API", () => {
  const entries = Object.values(files).map((source) => ({
    slug: frontmatter(source, "slug") ?? "",
    price: Number(frontmatter(source, "price")),
  }));

  it("covers every product the API sells", () => {
    expect(entries.map((e) => e.slug).sort()).toEqual(
      Object.keys(PRODUCTS).sort(),
    );
  });

  it.each(Object.entries(PRODUCTS))(
    "%s shows the price the server charges",
    (slug, product) => {
      const entry = entries.find((e) => e.slug === slug);
      expect(entry?.price).toBe(product.price * 100);
    },
  );
});
