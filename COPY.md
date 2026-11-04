# COPY.md — source of truth for words

Everything here is either **VERBATIM** (transcribed from Henrike's live site on 8 Sep 2026),
**TRUNCATED** (the site cut it off — do not publish until the full text is recovered), or
**MISSING** (Henrike must supply it).

**Nothing in this file may be invented, completed, paraphrased or "tidied".** If a string is
marked TRUNCATED or MISSING, leave it out of the build and tell Henrike. A testimonial is a
named real person's words — inventing or extending one is fabricating an endorsement.

---

## 1. Verse section

### The licensing problem, stated plainly

The brand name comes from the phrase _"established forever like the moon."_ That exact
rendering belongs to modern translations that are **copyrighted**:

- **NIV** — Biblica permits up to 500 verses without written permission, but **commercial use
  falls outside those guidelines and requires a written permission request.** This site sells
  products, so it is commercial.
- **NASB95 / ESV** — similarly copyrighted, each with its own terms.

⚠️ The wording used in the planning artifact ("It shall be established forever like the moon,
and the witness in the sky is faithful") is **NASB95**. Do not ship it without clearing it
with Lockman first. That was an oversight in the spec, not a cleared choice.

### Three usable options

**(a) Recommended — reference only, no translation.** Set the brand phrase as brand copy and
the citation beneath it. No licence needed, and it reads better as design than a full verse.

```
Established forever like the moon.
Psalm 89:37
```

**(b) King James Version — public domain, zero admin, safe forever.** VERBATIM:

> "It shall be established for ever as the moon, and as a faithful witness in heaven. Selah."
> — Psalm 89:37, KJV

Note it reads _"as the moon"_, not _"like the moon"_ — so it does not echo the brand name.

**(c) World English Bible — public domain, and believed to render "established forever like
the moon."** ⚠️ **UNVERIFIED** — I could not reach a WEB source to confirm the exact wording.
If it checks out, this is the best of both: public domain _and_ matching the brand. Verify
before use; do not transcribe from memory.

### Positioning line — VERBATIM, and complete

This is the whole sentence. It is not truncated; there is no further paragraph on the site.

> Inspired by Psalm 89:37, I design practical planners, stationery, and resources that help
> couples plan with confidence for their wedding day and build a marriage rooted in covenant
> love.

### Hero line — VERBATIM

> Welcome to Foreverlikethemoon, where wedding planning is made simple.

CTA label: **Get Inspired**

---

## 2. Founder section — VERBATIM, all three paragraphs

Heading: **Hi, I am Henrike**

> I am 27 years old and spend most of my days working as a software engineer for Bash in Cape
> Town.

> As an avid planner, I wanted to make sure I had everything I needed to organise the perfect
> wedding once I got engaged. When I couldn't find a suitable wedding planner on the market, I
> took it upon myself to create my own in October 2021. Realising that other brides might
> benefit from it, I decided to publish it and make it available it to others.

> Following the publication of the planner, I started doing freelance graphic design work for
> wedding stationery. However, when I realised how expensive printing services can be, I
> decided to try producing the stationery myself. Fast-forward, and my small side hustle has
> now become a small business, specialising in crafting wedding stationery for couples
> throughout South Africa.

**Two flags for Henrike — do not fix silently:**

1. Paragraph 2 contains a typo in the original: _"make it available it to others"_ (a stray
   "it"). Ask before correcting — it is her own copy, so correcting it is fine, but the
   decision is hers.
2. _"I am 27 years old"_ is a hard-coded age that goes stale every birthday, and the planner
   dates from October 2021. Either drop the age or replace it with something that does not
   rot. Do not silently update the number.

---

## 3. Testimonials

### ⚠️ DELETE THESE TWO IMMEDIATELY

`src/content/testimonials/annelize.md` and `src/content/testimonials/thandi.md` are
**FABRICATED**. Neither name appears anywhere on Henrike's site or in her reviews. The quotes
were invented by an earlier session and both were marked `featured: true`, so they would have
appeared on the home page as genuine customer endorsements. Delete both files. Do not use them
as a template, a tone reference, or a placeholder.

### The eight real reviewers

These are Henrike's **Google reviews**, surfaced on the Ecwid site. Ecwid truncates them for
display, which is why four are incomplete below. Google holds the full text.

#### Complete — safe to publish now

| name            | lang   | service                  | quote                                                                                                                                                                                                         |
| --------------- | ------ | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Esrané Snyman   | en     | stationery               | "I was very impressed with Foreverlikethemoon, Henrike gives great attention to detail, she is a perfectionist and will make sure your stationary is top notch. I will recommend them to anyone"              |
| Emmie Swiegers  | en     | stationery _(inferred)_  | "Henrike's work is amazing! Had such a good experience and everything on the day looked exactly as I imagined!"                                                                                               |
| Mieke Kleynhans | **af** | stationery + websites ⚠️ | "Beste wedding stationary daar buite! Een ook die mooiste trouwebsites. Henrike het 'n baie goeie oog vir mooi detail en stap die ektra myl vir haar kliënte!! Highly recommended! Xx"                        |
| Rubin Vincer    | en     | stationery               | "Could not have asked for better stationary at our wedding, the service was very professional and I recommend ForeverLikeTheMoon for any couples looking for affordable and high quality wedding stationery!" |

#### TRUNCATED — do not publish until recovered from Google

| name            | lang | service    | what the site shows                                                                                                                                                                                                                         |
| --------------- | ---- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Leney van Eeden | en   | planners   | "With all the wedding admin and aspects one has to consider, Forever like the moon simplified the process of keeping track of everything with their "My Wedding Planner" book and compiling the invitation. Also appreciated the options…"  |
| Karlien Kriel   | en   | stationery | "I had the absolute pleasure of working with Foreverlikethemoon for my wedding stationery, and I couldn't be happier with the experience. From the very beginning, Henrike went above and beyond to help me bring my vision to life. Her…"  |
| Marna Vincer    | en   | stationery | "I'm absolutely thrilled with the service I received from Forever Like The Moon stationery! They went above and beyond — I didn't have a clear idea of the theme and style I wanted, but they listened, understood my vision, and brought…" |
| Margo Reeler    | en   | websites   | "Forever Like the Moon helped us create a colorful, fun, and user-friendly website for our wedding, making it easy for our guests to access all the important details and feel part of the celebration. The design beautifully reflected…"  |

### Decisions Henrike must make

1. **Mieke Kleynhans praises two services** — stationery _and_ wedding websites. The schema's
   `service` field is singular. Either widen it to `services: string[]`, or pick one. Widening
   is the better call; more reviews will do this.
2. **"Stationary" is misspelled in several originals** (should be "stationery"), and Mieke's
   Afrikaans has "ektra" for "ekstra". **Leave them verbatim.** These are customers' own words,
   and the small imperfections are part of why they read as real. Do not silently correct a
   quotation attributed to a named person.
3. **Two service attributions are inferred, not stated** — Emmie Swiegers and, arguably,
   Karlien Kriel. Confirm before publishing.
4. **Attribution format.** Google reviews are public, but decide whether to show full surnames
   or "Esrané S." Full names are more credible; initials are more private. Henrike's call.

### Still MISSING

- Full text of the four truncated reviews. Source: Henrike's Google Business Profile.
- Whether any reviewer objects to being quoted on the site.
