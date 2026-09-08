# ASSETS.md — image inventory

Every file in `src/assets/` with what it actually shows and where it belongs. Written so the
content collections can be populated without guessing. All masters are 2400px on the long
edge, `-auto-orient`ed, metadata stripped. Camera originals stay in `images/` and
`~/Pictures/Photos` (both outside the repo).

**Alt text is not written yet.** Each row says what the image shows; turn that into alt text
in the voice of the page, don't paste these descriptions verbatim.

## Hero candidates — landscape, 2400×1600

| File | Shows | Note |
|---|---|---|
| `hero-tablescape-linen.jpg` | White linen, gold-rimmed glass charger, gold cutlery, a menu card | **Recommended hero.** Quiet, wide, real negative space, and the gold agrees with the gilt accent |
| `hero-tablescape-sage.jpg` | Warm wood table, sage napkin, amber glass charger, gold cutlery, menu | Second choice — warmer, busier |
| `hero-rings-detail.jpg` | Two gold rings on a "hello" place card, beige ground | Tight detail. Good for a section opener, weak as a full-bleed hero |
| `hero-placecard-silver.jpg` | Single place card on a silver charger with white napkin | Very minimal. Best as a quiet band between sections |

## Verse / texture — portrait, 1600×2400. Still, no faces

| File | Shows |
|---|---|
| `texture-vellum-candlelight.jpg` | Sheer vellum menu behind gauze, candlelight |
| `texture-vellum-tassel.jpg` | "The Night" vellum menu on linen with tassel and monogram |
| `texture-embossed-tassel.jpg` | Embossed translucent menu, tassel, glassware, linen |

Any of the three suits the Psalm 89:37 section. `texture-vellum-candlelight.jpg` is the
calmest and the best match for a pause.

## Stationery portfolio — portrait, 1600×2400

| File | Shows | Palette |
|---|---|---|
| `stationery-menu-terracotta-tag.jpg` | Menu card with a terracotta tag on oak parquet | Warm — on-palette |
| `stationery-arch-menu-tiles.jpg` | Arched menu cards with M/E/N/U letter tiles on oak | Warm — on-palette |
| `stationery-arch-menu-sage.jpg` | Sage envelope with arched menu suite on oak | Warm — on-palette |
| `stationery-setting-candlelight.jpg` | Candles, crystal, green ribbon, round "Jane" place card, gold cutlery | Warm — on-palette |
| `stationery-welcome-sign-vincer.jpg` | "Vincer" welcome sign on an easel, willow tree behind | Neutral, outdoor |
| `stationery-welcome-sign-kruger.jpg` | "Welcome to the Kruger wedding" sign, white florals on fluted plinths | Neutral |
| `stationery-welcome-card-hydrangea.jpg` | Kruger welcome card among white and blue hydrangeas | Cool florals |
| `stationery-seating-chart-timber.jpg` | "Find your seat" chart on an easel against timber | Neutral |
| `stationery-menu-lemons.jpg` | Menu on a plate with lemons and cream napkin | **Off-palette** — citrus yellow |
| `stationery-scalloped-blush.jpg` | Scalloped blush place setting, tulips, marble | **Off-palette** — pink |

The two off-palette images belong in the portfolio — range is a selling point — but keep them
off the home page, where they fight the gilt accent.

## Craft detail — portrait, 1600×2400

| File | Shows |
|---|---|
| `craft-wax-seal-invitation.jpg` | "Lila & Jarryd" invitation closed with a bronze wax seal, dark oak |
| `craft-place-card-monogram.jpg` | "Mieke" place card with a heart clip, large M/N letterforms |
| `craft-menu-batch-brads.jpg` | A batch of menu cards laid out with scattered gold brads |

**These are finished-product photographs, not process photographs.** Only
`craft-menu-batch-brads.jpg` hints at assembly. Do NOT caption any of them as if they show
production — there is currently no image of anything being printed, trimmed, sealed or
assembled by hand. See "Still missing" below.

## Products — portrait, from `images/`

| File | Shows |
|---|---|
| `digital-planner-1.jpg` `-2` `-3` | Digital Wedding Planner |
| `wedding-planner-1.jpg` `-2` | Printed Wedding Planner |
| `emergency-kit-1.jpg` | Wedding Emergency Kit |
| `emergency-kit-2-landscape.jpg` | Emergency Kit, landscape — the only landscape product shot |
| `digital-planner-reel-poster.jpg` | Poster frame for the planner reel (900×1600) |

## Founder / about

| File | Shows |
|---|---|
| `founder-portrait.jpg` | Formal portrait |
| `founder-candid.jpg` | Candid |
| `about-me-1.jpg` `about-me-2.jpg` | About-section portraits |
| `about-holding-laptop.jpg` | Holding a laptop — natural fit for the Wedding Websites service page |

## Video — R2, never the repo

In `media-out/`, awaiting upload to `video.foreverlikethemoon.com`:

| File | Use |
|---|---|
| `digital-planner-reel.mp4` | 4.1 MB, 1080×1920, 30fps, silent — the ambient autoplay loop |
| `digital-planner-reel-audio.mp4` | 4.1 MB, same with a 96k AAC track — swapped in when the viewer unmutes |

Encoded from an 82 MB 50fps original with:
`ffmpeg -i IN -vf "fps=30,scale=1080:-2" -c:v libx264 -preset slow -crf 28 -maxrate 1800k -bufsize 3600k -pix_fmt yuv420p -movflags +faststart OUT`

## Still missing

1. **Real process photography.** The printer running, the trimmer, wax being poured, ink on
   hands. That Henrike physically produces the stationery is the strongest differentiator and
   nothing in the library evidences it.
2. **Wedding-website screen recordings** — nothing yet, and phase 05's case studies need them.
   Consent required from each couple before publishing.
3. **Open Graph card**, 1200×630.
4. **Higher-resolution originals** of four atmospheric dappled-light tablescapes that were
   excluded for being ~1170px wide (`hero_image.jpg`, `hero_image_portrait.jpg`,
   `IMG_4173.jpg`, `stationery_3.JPG` in `~/Pictures/Photos`). They are the closest match to
   the brand mood of anything in the library — if the originals exist, they beat every current
   hero candidate.
