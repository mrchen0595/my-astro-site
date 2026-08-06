import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blog = defineCollection({
  loader: glob({
    base: "./src/content/blog",
    pattern: "**/*.md",
  }),

  schema: ({ image }) =>
    z.object({
      title: z.string().min(1, "文章标题不能为空"),

      description: z.string().min(1, "文章简介不能为空"),

      pubDate: z.coerce.date(),

      updatedDate: z.coerce.date().optional(),

      tags: z.array(z.string()).default([]),

      draft: z.boolean().default(false),

      cover: image(),

      coverAlt: z.string().min(1, "封面图片说明不能为空"),
    }),
});

export const collections = {
  blog,
};
