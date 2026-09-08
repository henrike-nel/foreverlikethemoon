# DESIGN.md — Foreverlikethemoon

The design system, locked. Every value here is a decision, not a suggestion. If you think one
is wrong, say so before you build on it — do not quietly substitute your own.

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

**Ratio: Major Third, 1.250. Base: 17px (1.0625rem).** 17px because this site has long-form
prose — the bio, case studies, product copy — and 16px is a touch tight for a humanist sans at
reading length.

| Token         | rem    | px    | Role                               | Line height |
| ------------- | ------ | ----- | ---------------------------------- | ----------- |
| `--text-2xs`  | 0.68   | 10.88 | Legal, footnotes. Use sparingly    | 1.4         |
| `--text-xs`   | 0.85   | 13.60 | Mono eyebrows, labels, stock pills | 1.45        |
| `--text-base` | 1.0625 | 17.00 | Body                               | 1.6         |
| `--text-lg`   | 1.3281 | 21.25 | Lead paragraph, h4                 | 1.45        |
| `--text-xl`   | 1.6602 | 26.56 | h3                                 | 1.3         |
| `--text-2xl`  | 2.0752 | 33.20 | h2                                 | 1.22        |
| `--text-3xl`  | 2.5940 | 41.50 | h1 on inner pages                  | 1.14        |
| `--text-4xl`  | 3.2425 | 51.88 | Display                            | 1.10        |
| `--text-5xl`  | 4.0531 | 64.85 | Hero display                       | 1.06        |

`--text-3xl` and above are fluid: `clamp(<one step down>, <vw>, <the value above>)`. Nothing
below `--text-2xl` is fluid — fluid body text is a bug, not a feature.

### Families

| Token            | Stack                                                         | Weights            | Role                                             |
| ---------------- | ------------------------------------------------------------- | ------------------ | ------------------------------------------------ |
| `--font-display` | `"Cormorant Garamond", "Iowan Old Style", Georgia, serif`     | 300, 600 + italics | Headings, the brand name, pull quotes            |
| `--font-body`    | `"Figtree", "Helvetica Neue", Arial, sans-serif`              | 400, 600, 700      | Everything read at length                        |
| `--font-mono`    | `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace` | 400, 500           | Prices, order references, stock labels, eyebrows |

One Google Fonts `<link>` with `display=swap`, preconnect to `fonts.gstatic.com`, subset
`latin` + `latin-ext` — **latin-ext is required**, one testimonial is in Afrikaans.

### Rules

- Body measure caps at **66ch**. Display measure caps at **34ch**.
- Every heading gets `text-wrap: balance`.
- Uppercase mono eyebrows get `letter-spacing: 0.16em`. Nothing else is uppercase.
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

## 7. What "done" looks like

`/styleguide` (noindex, excluded from the sitemap) renders every token as a labelled swatch,
the full type scale in real sentences, every button and form state including focus and
disabled, and a replayable demo of each motion primitive. It must be correct in light, dark,
and system themes, and with reduced motion on nothing moves while everything stays readable.
