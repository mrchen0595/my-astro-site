// @ts-check
import { defineConfig } from "astro/config";

import vercel from "@astrojs/vercel";

import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://my-astro-site-rose.vercel.app",
  adapter: vercel({
    staticHeaders: true,
  }),
  security: {
    csp: {
      directives: [
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],
    },
  },
  integrations: [sitemap()],
});
