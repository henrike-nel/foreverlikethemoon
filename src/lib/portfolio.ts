import type { ImageMetadata } from "astro";
import craftMenuBatch from "../assets/craft-menu-batch-brads.jpg";
import craftPlaceCard from "../assets/craft-place-card-monogram.jpg";
import craftWaxSeal from "../assets/craft-wax-seal-invitation.jpg";
import heroPlacecardSilver from "../assets/hero-placecard-silver.jpg";
import heroRings from "../assets/hero-rings-detail.jpg";
import heroSage from "../assets/hero-tablescape-sage.jpg";
import archSage from "../assets/stationery-arch-menu-sage.jpg";
import archTiles from "../assets/stationery-arch-menu-tiles.jpg";
import menuLemons from "../assets/stationery-menu-lemons.jpg";
import menuTerracotta from "../assets/stationery-menu-terracotta-tag.jpg";
import scallopedBlush from "../assets/stationery-scalloped-blush.jpg";
import seatingChart from "../assets/stationery-seating-chart-timber.jpg";
import settingCandlelight from "../assets/stationery-setting-candlelight.jpg";
import welcomeHydrangea from "../assets/stationery-welcome-card-hydrangea.jpg";
import welcomeKruger from "../assets/stationery-welcome-sign-kruger.jpg";
import welcomeVincer from "../assets/stationery-welcome-sign-vincer.jpg";
import textureEmbossed from "../assets/texture-embossed-tassel.jpg";
import textureVellumTassel from "../assets/texture-vellum-tassel.jpg";

export interface GalleryItem {
  src: ImageMetadata;
  alt: string;
}

// Alt text says what each photograph shows (ASSETS.md). These are finished
// pieces, not process shots — never caption them as production.

/** Printed stationery, on-palette first; the two off-palette pieces last. */
export const STATIONERY: GalleryItem[] = [
  {
    src: craftWaxSeal,
    alt: "An invitation for Lila and Jarryd, closed with a bronze wax seal, on dark oak.",
  },
  {
    src: menuTerracotta,
    alt: "A menu card finished with a terracotta tag, on oak parquet.",
  },
  {
    src: archTiles,
    alt: "Arched menu cards beside letter tiles spelling MENU, on oak.",
  },
  {
    src: archSage,
    alt: "A sage envelope with an arched menu suite, on oak.",
  },
  {
    src: settingCandlelight,
    alt: "A place setting by candlelight: crystal, gold cutlery, green ribbon and a round place card reading Jane.",
  },
  {
    src: craftPlaceCard,
    alt: "A place card for Mieke held by a small heart clip, beside large M and N letterforms.",
  },
  {
    src: welcomeVincer,
    alt: "A welcome sign for the Vincer wedding on an easel, with a willow tree behind.",
  },
  {
    src: welcomeKruger,
    alt: "A sign reading Welcome to the Kruger wedding, between white florals on fluted plinths.",
  },
  {
    src: welcomeHydrangea,
    alt: "The Kruger welcome card among white and blue hydrangeas.",
  },
  {
    src: seatingChart,
    alt: "A Find your seat chart on an easel against a timber wall.",
  },
  {
    src: craftMenuBatch,
    alt: "A batch of finished menu cards laid out with scattered gold brads.",
  },
  {
    src: menuLemons,
    alt: "A menu on a plate with lemons and a cream napkin.",
  },
  {
    src: scallopedBlush,
    alt: "A scalloped blush place setting with tulips on marble.",
  },
];

/** Atmosphere and detail, for the lookbook only. */
export const DETAILS: GalleryItem[] = [
  {
    src: heroSage,
    alt: "A warm wooden table set with a sage napkin, an amber glass charger, gold cutlery and a menu.",
  },
  {
    src: heroRings,
    alt: "Two gold rings resting on a place card that reads hello.",
  },
  {
    src: textureVellumTassel,
    alt: "A vellum menu titled The Night on linen, with a tassel and monogram.",
  },
  {
    src: heroPlacecardSilver,
    alt: "A single place card on a silver charger with a white napkin.",
  },
  {
    src: textureEmbossed,
    alt: "An embossed translucent menu with a tassel, beside glassware on linen.",
  },
];
