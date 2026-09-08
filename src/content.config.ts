import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const seo = z
  .object({
    title: z.string().optional(),
    description: z.string().optional(),
  })
  .optional();

const dimensions = z.object({
  width: z.number().positive(),
  height: z.number().positive(),
  depth: z.number().positive(),
  unit: z.literal("mm"),
});

const products = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/products" }),
  schema: ({ image }) =>
    z
      .object({
        slug: z.string().regex(/^[a-z0-9-]+$/),
        title: z.string(),
        price: z
          .number({
            error: "price is required integer cents (never a float, never omit)",
          })
          .int("price must be integer cents, never a float")
          .nonnegative(),
        currency: z.literal("ZAR"),
        kind: z.enum(["digital", "physical"]),
        stock: z.enum(["in-stock", "out-of-stock", "sold-out"]),
        summary: z.string(),
        gallery: z.array(image()).min(1),
        weightGrams: z.number().int().positive().optional(),
        dimensions: dimensions.optional(),
        fileKey: z.string().min(1).optional(),
        order: z.number().int(),
        seo,
      })
      .superRefine((value, ctx) => {
        if (value.kind === "physical") {
          if (value.weightGrams === undefined) {
            ctx.addIssue({
              code: "custom",
              message: "physical products require weightGrams",
              path: ["weightGrams"],
            });
          }
          if (value.dimensions === undefined) {
            ctx.addIssue({
              code: "custom",
              message: "physical products require dimensions",
              path: ["dimensions"],
            });
          }
        }

        if (value.kind === "digital" && value.fileKey === undefined) {
          ctx.addIssue({
            code: "custom",
            message: "digital products require fileKey (private R2 object key)",
            path: ["fileKey"],
          });
        }
      }),
});

const testimonials = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/testimonials" }),
  schema: z.object({
    name: z.string(),
    quote: z.string(),
    lang: z.enum(["en", "af"]),
    // Plural: a real reviewer (Mieke Kleynhans) praises two services at once.
    // Attribution is metadata for future filtering, not a claim rendered on the
    // card — several source attributions are inferred, not stated by the reviewer.
    services: z.array(z.enum(["stationery", "websites", "planners"])).min(1),
    featured: z.boolean(),
  }),
});

const services = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/services" }),
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    icon: z.enum(["paper", "globe", "planner"]),
    order: z.number().int(),
  }),
});

// Long-form page copy transcribed verbatim in COPY.md. Kept in content, never
// inlined in a component, so nothing here can be quietly invented or "tidied".
const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/pages" }),
  schema: z.object({
    hero: z.object({
      heading: z.string(),
      brand: z.string(),
      cta: z.string(),
      ctaHref: z.string(),
    }),
    verse: z.object({
      brandPhrase: z.string(),
      citation: z.string(),
      positioning: z.string(),
    }),
    founder: z.object({
      heading: z.string(),
      paragraphs: z.array(z.string()).min(1),
    }),
  }),
});

export const collections = { products, testimonials, services, pages };
