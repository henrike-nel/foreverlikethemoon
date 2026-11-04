// @ts-check
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";

// Staging until phase 04: the apex still serves the live Ecwid store.
// site = https://new.foreverlikethemoon.com
// base stays unset (a path like /new would prefix every link we'd later unpick)
// Custom domain: repo Settings → Pages, not public/CNAME (Actions ignores that file)
// public/robots.txt disallows all crawlers; Seo.astro emits noindex while site ≠ apex
//
// CUTOVER (when the new store can take an order):
// 1. Set `site` to 'https://foreverlikethemoon.com'. Leave `base` unset.
// 2. Settings → Pages: change the custom domain from new.foreverlikethemoon.com
//    to foreverlikethemoon.com. Do not add public/CNAME.
// 3. Registrar DNS: point the apex at GitHub Pages (A / AAAA). Remove or
//    retarget the `new` CNAME once you no longer need the staging host.
// 4. Delete public/robots.txt so the live site can be indexed.
// 5. Seo.astro stops emitting noindex on its own once `site` is the apex.

// https://astro.build/config
export default defineConfig({
  site: "https://new.foreverlikethemoon.com",
  integrations: [
    sitemap({
      filter: (page) =>
        !new URL(page).pathname.replace(/\/$/, "").endsWith("/styleguide"),
    }),
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
