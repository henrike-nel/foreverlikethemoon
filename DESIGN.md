# DESIGN.md — Foreverlikethemoon

The design system, locked. Every value here is a decision, not a suggestion. If you think one
is wrong, say so before you build on it — do not quietly substitute your own.

Visual reference: **karalayne.com** — clean, minimal, elegant, expensive. What we take from
it: the two-scale typography with the roman/italic display mix (Instrument Serif), full-bleed alternating bands,
tiny letterspaced sans eyebrows (Work Sans 500), sharp-cornered buttons with a warm solid fill, black-and-white
portraiture, and a lot of air. What we do NOT take: its cool greige ground (ours stays warm
ivory, because the photography is warm), and its personal-brand hero built around the founder's
face — see §7.

Brief: Psalm 89:37, "it shall be established forever like the moon." The brand is about
**permanence**, not romance. That gives the site a structural idea rather than a decorative
one: **the lunar cycle is the site's ordering device.** The palette is entirely warm — there
is no cool colour anywhere, because the photography is warm and a cool accent competes with it.

---

## 1. Colour

Token names are semantic. Never name a token for what it looks like (`--color-cream-2`);
name it for what it does (`--color-surface-raised`).

### Surfaces

| Token                    | Light     | Dark      | Use                                           |
| ------------------------ | --------- | --------- | --------------------------------------------- |
| `--color-surface`        | `#FBFAF6` | `#14120E` | Page ground. `body` must set this explicitly. |
| `--color-surface-card`   | `#FFFFFF` | `#1C1914` | Cards, panels, form fields                    |
| `--color-surface-raised` | `#F3F1EA` | `#24201A` | Table headers, inset blocks, hovered rows     |

### Ink

| Token                | Light     | Dark      | Contrast on surface | Use                                                                 |
| -------------------- | --------- | --------- | ------------------- | ------------------------------------------------------------------- |
| `--color-ink`        | `#191510` | `#F0EDE6` | 17.4 / 16.0 — AAA   | Body text, headings                                                 |
| `--color-ink-muted`  | `#4A4239` | `#C8C1B4` | 9.44 / 10.5 — AAA   | Secondary prose, table cells                                        |
| `--color-ink-subtle` | `#7A7166` | `#948C7E` | 4.59 / 5.62 — AA    | Eyebrows, captions, meta. **Floor — nothing lighter carries text.** |

`--color-ink-subtle` on `--color-surface-raised` is 4.24 (light) / 4.87 (dark). Still AA. Do
not put it on anything lighter than that.

### Accent — one hue, two values

The split is a contrast requirement, not a style choice.

| Token                       | Light     | Dark      | Contrast         | Use                                                                                                                                                    |
| --------------------------- | --------- | --------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `--color-accent`            | `#8A6534` | `#D9B478` | 5.04 / 9.58 — AA | **Everything readable or clickable:** links, prices, buttons, focus rings, active and selected states                                                  |
| `--color-accent-decorative` | `#A87F45` | `#D2A868` | 3.47 / 8.50      | **Ornament only.** Rules, hairline flourishes, the verse rule. Fails AA in light mode, so it must NEVER carry text, a meaningful icon, or a focus ring |

Add a stylelint rule (or a documented lint check) so `--color-accent-decorative` cannot land
on `color`, `border-color` of a focus state, or an SVG `fill` that conveys meaning.

There is no third hue. If a layout seems to need one, it needs better spacing, a different
weight, or a rule instead.

### Hairlines

| Token                   | Light     | Dark      | Ratio vs surface | Use                                                                 |
| ----------------------- | --------- | --------- | ---------------- | ------------------------------------------------------------------- |
| `--color-hairline`      | `#D9D1C0` | `#38322A` | 1.45 / 1.48      | Section dividers, card borders, table row rules                     |
| `--color-hairline-soft` | `#E8E2D6` | `#2A2520` | ~1.2             | Rules _inside_ a card, between list rows. Deliberately barely there |

Hairlines carry the structure that shadows would carry elsewhere. See §5.

### Semantic — order states only

Never decorative. These exist so stock and error states don't rely on colour alone, and they
must always be paired with text or an icon.

| Token                      | Light     | Dark      | Contrast         | Use                                               |
| -------------------------- | --------- | --------- | ---------------- | ------------------------------------------------- |
| `--color-positive`         | `#2E6A50` | `#85C4A5` | 6.10 / 9.30 — AA | In stock, payment received, delivery sent         |
| `--color-positive-surface` | `#E4EEE8` | `#18241E` | —                | Tint behind a positive pill                       |
| `--color-caution`          | `#8F4227` | `#E09A7C` | 6.76 / 8.09 — AA | Out of stock, sold out, form errors, expired link |
| `--color-caution-surface`  | `#F8E8E1` | `#241610` | —                | Tint behind a caution pill                        |

### The moon

| Token                | Light     | Dark      | Use                                                          |
| -------------------- | --------- | --------- | ------------------------------------------------------------ |
| `--color-moon-lit`   | `#8A6534` | `#D9B478` | The illuminated portion of the disc. Equals `--color-accent` |
| `--color-moon-unlit` | `#DDD8CB` | `#3A352C` | The terminator — the dark portion                            |

Lit against unlit is 3.71 (light) / 6.20 (dark). In light mode this deliberately uses the
_deep_ accent, not the decorative one: darkening the terminator instead would reduce the
contrast, because the decorative gilt is a mid-tone and moving the unlit side away from the
paper moves it toward the gilt.

### Theme structure — non-negotiable

Three states, not two. The default is neither light nor dark.

```css
:root {
  /* the COMPLETE light palette, every token */
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* redefine ONLY the tokens */
  }
}
:root[data-theme="dark"] {
  /* redefine them again */
}
```

Never declare a colour whose only definition sits inside a media query or an attribute block —
that is the classic unreadable-artifact bug. Every token must exist on bare `:root` first.

---

## 2. Typography

**Two scales that meet, not one.** Text uses **Major Third (1.250)** from a **17px** base.
Display uses **Augmented Fourth (√2 = 1.4142)**, anchored at `--text-xl` so the two scales
share a step and never disagree.

A single 1.250 ratio cannot produce the scale contrast this brand needs — the "expensive"
quality of an editorial layout comes from a very large display face sitting above very small
body text with a lot of air between them. At 1.250 the largest heading is only ~2.6× body,
which reads as a competent document, not a considered one. The display scale below reaches
~4.4× body while body stays comfortable to read.

### Text scale — Major Third 1.250, base 17px

| Token         | rem    | px    | Role                                             | Line height |
| ------------- | ------ | ----- | ------------------------------------------------ | ----------- |
| `--text-2xs`  | 0.68   | 10.88 | Legal, footnotes. Use sparingly                  | 1.4         |
| `--text-xs`   | 0.85   | 13.60 | Eyebrows, labels, stock pills, button labels     | 1.45        |
| `--text-sm`   | 0.95   | 15.20 | Captions, table cells, image credits             | 1.5         |
| `--text-base` | 1.0625 | 17.00 | Body                                             | 1.6         |
| `--text-lg`   | 1.3281 | 21.25 | Lead paragraph                                   | 1.45        |
| `--text-xl`   | 1.6602 | 26.56 | h3 — and the anchor the display scale grows from | 1.3         |

### Display scale — Augmented Fourth 1.4142, from `--text-xl`

| Token         | rem    | px     | Role                                                  | Line height | Tracking |
| ------------- | ------ | ------ | ----------------------------------------------------- | ----------- | -------- |
| `--display-1` | 2.3475 | 37.56  | h2, section headlines                                 | 1.18        | -0.01em  |
| `--display-2` | 3.3206 | 53.13  | h1                                                    | 1.10        | -0.015em |
| `--display-3` | 4.6963 | 75.14  | Hero headline                                         | 1.05        | -0.02em  |
| `--display-4` | 6.6419 | 106.27 | The wordmark only, tracked WIDE (+0.08em), weight 300 | 0.95        | +0.08em  |

Every display token is fluid: `clamp(<the step below>, <vw>, <the value here>)`. Nothing in
the text scale is fluid — fluid body text is a bug, not a feature. Note the tracking column:
large display type needs negative tracking to stop looking loose, and the wordmark is the one
exception that needs a lot of positive tracking.

### The italic move

The signature typographic gesture is **roman and italic mixed inside one display line**, with
the italic carrying the emphasis:

> Wedding planning, _made simple_

Instrument Serif 400 upright with Instrument Serif 400 _italic_ on the emphasised word. The
italic is this face's standout feature and the reason it was chosen — it is a true drawn
italic, not a slant, with different letterforms from the roman.

This is the single highest-leverage detail in the whole system, and it is now the ONLY way to
create emphasis within a heading, because there is no bolder weight to reach for. Rules:

- **One italic passage per heading. Never two.**
- Italicise the word carrying the meaning — the promise, the transformation, the feeling —
  never a preposition or an article. "Wedding planning, _made simple_" works;
  "_Wedding_ planning, made simple" does not.
- At most two headings per page use it. Every heading using it makes it a tic, not a gesture.
- It goes in the markup as `<em>`, which is semantically correct here: this is emphasis, and
  a screen reader should convey it.

### `--display-wordmark` — the one exception, and it exists for a physical reason

Credit where due: an earlier build session hit this and documented it. The hero sets the brand
name **"Foreverlikethemoon"** — a single 18-character word that **cannot be hyphenated and
cannot wrap**. At any fixed display size it overflows a phone. Instrument Serif is condensed,
which helps, but ~0.42em per character still means roughly 7.6em of line: at `--display-3`
(75.14px) that is ~570px, against ~272px of usable width on a 320px screen.

So the wordmark gets its own fluid token rather than sitting on a scale step:

```css
--display-wordmark: clamp(1.6602rem, 0.5rem + 7vw, 6.6419rem);
```

Floor is the `--text-xl` value (26.56px), which fits one line in a 320px panel. Ceiling is the
`--display-4` value (106.27px), full presence on desktop. Pair it with
`overflow-wrap: break-word` as a hard stop against horizontal scroll, and remember the
`+0.08em` tracking adds roughly 8% to the measured width — budget for it.

Used **only** for the hero brand line. Nothing else touches this token.

⚠️ The earlier session wrote this rule against `--text-2xl` and `--text-5xl`, tokens from the
single-scale system that the two-scale rewrite replaced. The reasoning was right; the token
names were stale. This is the reconciled version — do not reintroduce the old names.

### Families — two, not three

| Token            | Stack                                                   | Weights                                     | Role                                                      |
| ---------------- | ------------------------------------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `--font-display` | `"Instrument Serif", "Iowan Old Style", Georgia, serif` | **400 + italic 400 — that is all there is** | Wordmark, hero, h1, h2, h3, pull quotes                   |
| `--font-body`    | `"Work Sans", "Helvetica Neue", Arial, sans-serif`      | 400, 500, 600                               | Everything else — body, eyebrows, labels, buttons, prices |

One Google Fonts `<link>` with `display=swap`, preconnect to `fonts.gstatic.com`, subset
`latin` + `latin-ext`. **latin-ext is REQUIRED** — one testimonial is in Afrikaans. Work Sans
covers Latin Extended-A/B fully. ⚠️ **Verify Instrument Serif's latin-ext coverage before
relying on it for display type containing Afrikaans diacritics** (ë, ê, ï, ô, û). If it falls
short, no display heading may be set in Afrikaans — testimonials are body copy, so this is
very likely a non-issue, but check rather than assume.

### Instrument Serif has ONE weight. Design around it, don't fight it.

Regular 400 and Italic 400. There is no 300 and no 600, and **there never will be** — do not
attempt a faux-bold via `font-weight: 700` (the browser will synthesise a smeared version) or
a faux-light. Consequences, all deliberate:

- **Hierarchy comes from size, italic and colour — never weight.** This is a constraint that
  improves the design: a scale with four display steps and one weight is more disciplined than
  one with four steps and three weights.
- The face is **high-contrast and condensed**, which is where the "expensive" quality comes
  from. It also means long headlines set tighter than Cormorant would have — the display
  measure of 34ch still holds.
- **It is display-only.** `--text-xl` (26.56px) is its floor. Anything smaller than an h3 is
  `--font-body`, no exceptions. It has too little stroke weight in the thins to survive small
  sizes or a pale ground.
- The wordmark cannot be a hairline. `--display-4` at 400, tracked +0.08em, is the treatment;
  the high contrast reads as light without needing a light weight.

### Why two families and not the four that were on the table

Instrument Serif is the display face and the identity. Four other candidates were proposed
across three references — Cormorant Garamond, Inter, Work Sans and Figtree, plus JetBrains Mono
for figures. All but Work Sans are cut, for reasons worth recording so nobody re-adds them:

- **Cormorant Garamond is cut**, having briefly been the pick. It is more versatile — real
  weight range, holds up below h3 — but its stroke contrast is too low to produce the drama in
  the reference images, and it is very widely used on wedding sites. Instrument Serif's single
  weight is a real constraint, accepted knowingly in exchange for the contrast and the italic.

- **Inter is cut.** Inter and Work Sans are both neutral humanist/grotesque sans faces doing
  the same job. Setting eyebrows in Inter and body in Work Sans is a distinction **no reader
  can perceive** — it is the same voice at two sizes — while costing an extra family download.
  A subhead is distinguished by size, weight, tracking and case, not by swapping in a
  near-identical face. Work Sans wins over Inter because it carries slightly more character
  next to a Garamond, and because Inter is the default everyone reaches for.
- **Figtree is cut** — same argument as Inter, and Work Sans was the explicitly preferred face.
- **JetBrains Mono is cut.** It existed only to align prices and set order references. Work
  Sans has tabular figures, so `font-variant-numeric: tabular-nums` does that job with no
  third family. Order references get `letter-spacing: 0.06em` instead of a monospace face.
  Two families load faster, and the identity should rest on the serif/sans contrast rather
  than three competing voices.

### Weight — one correction to the specimen

The specimen sets body copy in **Work Sans Light (300)**, on a dark taupe ground where a light
weight reads correctly. **Body copy on this site is Work Sans 400, not 300.**

Light weight is not a contrast failure in the WCAG sense — ink on paper measures 17.4:1 either
way, because WCAG only measures colour. It is a _stroke mass_ problem: a 300 weight at 17px has
roughly a quarter less ink on the page than 400, and on a light ground that reads as grey and
tiring rather than delicate. The audience for wedding stationery includes mothers of the bride,
and this site carries long-form reading — the bio, case studies, product copy.

Where Light earns its place: **large text only.** Lead paragraphs at `--text-lg` and above, and
pale text on the deep band, may use 300. Never below `--text-base`.

### Rules

- Body measure caps at **66ch**. Display measure caps at **34ch**.
- Every heading gets `text-wrap: balance`.
- Eyebrows are **`--font-body` uppercase at `--text-xs`, `letter-spacing: 0.16em`**, in
  `--color-ink-subtle`. NOT mono. A letterspaced sans eyebrow reads as fashion and editorial;
  a mono eyebrow reads as technical documentation, which is the wrong register for this brand.
- Prices, order references and stock labels use `--font-body` with
  `font-variant-numeric: tabular-nums`. Order references additionally get
  `letter-spacing: 0.06em` so a code like FLTM-2609-014 stays unambiguous. There is no
  monospace face on this site.
- Nothing else on the site is uppercase.
- Body text is deliberately SMALL relative to display. Do not "help" by enlarging it.
- The brand name "Foreverlikethemoon" is always `--font-display`, italic, 300, when it appears
  inside running display type. Never italicise it in body copy.
- Anywhere digits align in a column: `font-variant-numeric: tabular-nums`.
- Prices render **only** through `formatZAR()`. Nothing else may print a currency string.

---

## 3. Spacing

**Unit: 4px (0.25rem).** A 4px grid, not 8px — the type scale lands on odd values (17, 21.25,
26.56) and an 8px grid forces ugly rounding against them.

| Token        | Units | rem  | px  |
| ------------ | ----- | ---- | --- |
| `--space-1`  | 1     | 0.25 | 4   |
| `--space-2`  | 2     | 0.5  | 8   |
| `--space-3`  | 3     | 0.75 | 12  |
| `--space-4`  | 4     | 1    | 16  |
| `--space-6`  | 6     | 1.5  | 24  |
| `--space-8`  | 8     | 2    | 32  |
| `--space-12` | 12    | 3    | 48  |
| `--space-16` | 16    | 4    | 64  |
| `--space-24` | 24    | 6    | 96  |
| `--space-32` | 32    | 8    | 128 |

Section rhythm: `--space-section: clamp(var(--space-16), 8vw, var(--space-32))` — vertical gap
between top-level page sections.

**Lay out sibling groups with flex or grid and `gap`.** Not per-element margins, which collapse
and double silently. Reach for a margin only to separate a heading from its own body copy.

---

## 4. Radii

**This is a stationery brand that prints on paper. Paper has sharp edges.**

| Token              | Value   | Use                                                   |
| ------------------ | ------- | ----------------------------------------------------- |
| `--radius-none`    | `0`     | Cards, images, panels, media frames. **The default.** |
| `--radius-control` | `2px`   | Inputs, buttons, select fields                        |
| `--radius-pill`    | `999px` | Stock pills and nothing else                          |

There is no `--radius-lg`. A uniform radius stamped on every block is what makes generated
layouts read as generated, and it fights the letterpress character of the actual product.

---

## 5. Shadows

**Paper does not float.** Depth is carried by hairlines and surface tiers, not by shadow.
Cards get a `--color-hairline` border and no shadow. Exactly two shadows exist:

| Token              | Value                                                                        | Use                                                                |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `--shadow-overlay` | `0 8px 32px -12px rgb(25 21 16 / 0.28), 0 2px 8px -4px rgb(25 21 16 / 0.16)` | The mobile nav sheet, and any true overlay above the page          |
| `--shadow-lift`    | `0 2px 6px -2px rgb(25 21 16 / 0.14)`                                        | The one hovered/dragged state that genuinely leaves the page plane |

Both are tinted with the warm ink, never pure black. In dark mode, raise `--color-surface-card`
a tier instead of deepening the shadow — shadows barely read on a dark ground.

---

## 6. Motion

| Token               | Value                                                        |
| ------------------- | ------------------------------------------------------------ |
| `--ease-rise`       | `cubic-bezier(0.16, 1, 0.3, 1)` — entrances, the house curve |
| `--ease-standard`   | `cubic-bezier(0.4, 0, 0.2, 1)` — state changes               |
| `--ease-exit`       | `cubic-bezier(0.4, 0, 1, 1)` — things leaving                |
| `--duration-quick`  | `140ms` — hover, focus, toggles                              |
| `--duration-base`   | `240ms` — most state changes                                 |
| `--duration-slow`   | `400ms` — sheets, overlays                                   |
| `--duration-reveal` | `600ms` — section entrances                                  |

### Primitives — `src/lib/motion.ts`

Every animation in the codebase goes through one of these. No raw `animate()` calls in
components; make it a lint rule if you can.

| Primitive             | Contract                                                                                                                                                 |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `reveal(el)`          | Translate 16px → 0, opacity 0 → 1, `--duration-reveal`, `--ease-rise`. Fires once via `inView({ once: true })` at 20% visibility. **Never on the hero.** |
| `stagger(els)`        | `reveal` with a **70ms** offset per item. Product cards, testimonials, portfolio grids.                                                                  |
| `parallax(el, depth)` | Background layers only, transform only, max 40px total travel.                                                                                           |
| `lunarProgress(el)`   | See below.                                                                                                                                               |
| `magnetic(el)`        | Max **3px** travel toward the cursor. `@media (hover: hover) and (pointer: fine)` only. Primary buttons only.                                            |

### Hard rules

- `prefers-reduced-motion: reduce` makes every primitive a **no-op that leaves the end state
  visible and in place**. Not a shortened animation — nothing.
- Nothing is parked at `opacity: 0` waiting for an observer. Resting state is visible; the
  animation runs _from_ visible. Someone landing mid-page on a slow connection must never see
  a blank section.
- Transform and opacity only. Never animate `width`, `height`, `top`, `left`. CLS stays 0.
- Home page JS budget: **under 30 kB gzipped**, total.

### `lunarProgress` — what it maps

**It maps scroll position to illuminated fraction. Nothing astronomical.**

- Input: scroll progress `p` of the current page, `0` at the top, `1` at the bottom.
- Output: the illuminated fraction of a small fixed disc — `p = 0` is a new moon (fully dark),
  `p = 1` is a full moon (fully lit). Linear, no easing; it is an instrument reading, and
  easing a progress indicator makes it lie.
- Geometry: draw the disc at radius `r`, then subtract a second circle of the same radius
  offset horizontally by `dx = 2 * r * p`. At `p = 0` the subtracting circle covers the disc
  exactly (new moon); at `p = 1` it is tangent and removes nothing (full moon). Intermediate
  values give true crescent and gibbous shapes, waxing monotonically.
- Placement: fixed, bottom-right, on the home page and long inner pages. `aria-hidden="true"`,
  purely decorative — the page must be fully navigable with no JS. Under 1 kB.

**This is a different thing from the section markers.** Section markers are static moon phases
that run in cycle order across a page's sections, encoding _reading position by section_.
`lunarProgress` is one live element encoding _continuous scroll depth_. Do not merge them, and
do not animate the section markers.

---

## 7. Layout & composition

Reference direction: clean, minimal, quietly expensive editorial — the register of a good
fashion or interiors site, not a shop template. Four mechanisms produce it, and none of them
is decoration.

### Full-bleed alternating bands

The page is a stack of **full-width bands that alternate ground colour**, not one continuous
column. `--color-surface` → `--color-surface-card` → `--color-surface` and so on. Content
inside each band is centred in a max-width container; the band itself runs edge to edge.

This is what makes a long page read as composed sections rather than an endless scroll. Bands
carry their own vertical padding from `--space-section`; they do NOT get borders between them —
the colour change is the division.

### Air is the product

Vertical rhythm is generous to the point that it feels slightly excessive in a code editor and
correct in a browser. `--space-section` between bands, and short centred intro passages held to
a **34ch** measure with a lot of space above and below. If a section feels cramped, remove an
element rather than tightening the spacing.

### Buttons

Small, **sharp-cornered** (`--radius-control`, 2px), label in `--font-body` uppercase at
`--text-xs` with `0.12em` tracking. Two variants only:

- **Solid:** `--color-accent-decorative` fill with `--color-surface` text. The fill is how the
  warm accent appears at scale — a coloured _fill_ with pale text sidesteps the decorative
  token's text-contrast limit entirely, so the gilt can be as warm as it likes here.
- **Ghost on image:** 1px `--color-surface` border, transparent fill, `--color-surface` text,
  placed over a photograph.

No third variant. No pill buttons. No shadows on buttons, ever.

### Photography

- **Portraits of Henrike: black and white.** This one treatment does more for the editorial
  register than any amount of CSS, and it stops the portraits competing with the work.
- **Product, stationery and craft photography: full colour, always.** The colour of the paper
  stock, the wax, the ribbon _is_ the product. Never desaturate these.
- Text over a photograph needs a real scrim or a layout that does not overlap. Never a
  `text-shadow`.
- Ground stays **warm ivory**, not the cooler greige of the reference. Her photography is warm
  oak, linen and gold; a cool grey ground fights it. This is a deliberate divergence.

### One thing NOT to copy

The reference is a **personal brand** — the founder's face at hero scale, her name as the
wordmark. This is a **product and craft brand**. The hero belongs to the work, not to
Henrike's portrait: the tablescape with the brand line over it. Her portrait earns its place
in the About band, at reasonable size, in black and white. Putting her face at hero scale
would misrepresent what the business sells.

---

## 8. Changing this document

`DESIGN.md` is the contract, and the standing rule is that where code and this file disagree,
**this file wins — change the code.** There is one legitimate exception, and it has already
happened once: a build session discovers a real constraint the document got wrong (the
wordmark overflow above).

When that happens:

1. **Say so, in the PR body and to Henrike.** A silent edit to this file is the worst outcome
   available — it makes the contract untrustworthy and the next session inherits a document
   nobody vouched for.
2. Propose the change in the document's own vocabulary. The wordmark fix was correct reasoning
   expressed in token names a rewrite had already deleted, which made it look like a conflict
   when it was actually a contribution.
3. Never edit a _value_ here to make failing code pass. Fix the code. Only edit this file when
   the document describes something physically impossible or genuinely wrong.

---

## 9. What "done" looks like

`/styleguide` (noindex, excluded from the sitemap) renders every token as a labelled swatch,
the full type scale in real sentences, every button and form state including focus and
disabled, and a replayable demo of each motion primitive. It must be correct in light, dark,
and system themes, and with reduced motion on nothing moves while everything stays readable.
