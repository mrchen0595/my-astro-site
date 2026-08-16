import type { APIRoute } from "astro";

import { getSearchIndex } from "../lib/search";

export const prerender = true;

export const GET: APIRoute = async () => {
  const searchIndex = await getSearchIndex();

  return new Response(JSON.stringify(searchIndex), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
    },
  });
};
