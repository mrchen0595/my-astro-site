import rss from "@astrojs/rss";

import { getPublishedBlogPosts } from "../lib/blog";

import { siteConfig } from "../config/site";

export async function GET(context) {
  const posts = await getPublishedBlogPosts();

  return rss({
    title: siteConfig.rssTitle,

    description: siteConfig.description,

    site: context.site,

    trailingSlash: false,

    items: posts.map((post) => ({
      title: post.data.title,

      description: post.data.description,

      pubDate: post.data.pubDate,

      link: `/blog/${post.id}`,
    })),

    customData: `<language>${siteConfig.language}</language>`,
  });
}
