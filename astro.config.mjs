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
        "default-src 'self'",
        "img-src 'self' data:",
        "font-src 'self' https://fonts.gstatic.com",
        "connect-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
      ],

      styleDirective: {
        resources: ["'self'", "https://fonts.googleapis.com"],
      },
    },
  },
  integrations: [sitemap()],
});
