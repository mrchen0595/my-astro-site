import rss from "@astrojs/rss";

import { getPublishedBlogPosts } from "../lib/blog";

export async function GET(context) {
  const posts = await getPublishedBlogPosts();

  return rss({
    title: "William Chan 的博客",

    description: "William Chan 的 Astro 和前端开发学习记录",

    site: context.site,

    trailingSlash: false,

    items: posts.map((post) => ({
      title: post.data.title,

      description: post.data.description,

      pubDate: post.data.pubDate,

      link: `/blog/${post.id}`,
    })),

    customData: "<language>zh-CN</language>",
  });
}
