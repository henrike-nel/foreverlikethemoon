import { getEntry } from "astro:content";

/** Founder copy lives once, in src/content/pages/home.md, verbatim. */
export async function founderCopy() {
  const home = await getEntry("pages", "home");
  if (!home) {
    throw new Error(
      "Missing src/content/pages/home.md — home copy is required.",
    );
  }
  const { founder, verse } = home.data;
  const name = "Henrike";
  const named = founder.heading.endsWith(name);
  return {
    lead: named
      ? founder.heading.slice(0, -name.length).trimEnd()
      : founder.heading,
    name: named ? name : undefined,
    paragraphs: founder.paragraphs,
    verse,
  };
}
