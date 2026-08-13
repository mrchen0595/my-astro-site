import { siteConfig } from "../config/site";

export type StructuredData = Record<string, unknown>;

export interface BlogPostingStructuredDataInput {
  title: string;

  description: string;

  pageUrl: string;

  imageUrl: string;

  datePublished: Date;

  dateModified?: Date;

  authorUrl: string;
}

export interface ProjectStructuredDataInput {
  title: string;

  description: string;

  pageUrl: string;

  technologies: string[];

  status: string;

  authorUrl: string;
}

/**
 * 安全地把结构化数据转换成
 * 可以写入 JSON-LD script 的字符串。
 */
export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * 首页 WebSite JSON-LD。
 */
export function createWebsiteStructuredData(siteUrl: string): StructuredData {
  return {
    "@context": "https://schema.org",

    "@type": "WebSite",

    name: siteConfig.name,

    url: siteUrl,

    description: siteConfig.description,

    inLanguage: siteConfig.language,
  };
}

/**
 * 博客详情页 BlogPosting JSON-LD。
 */
export function createBlogPostingStructuredData(
  input: BlogPostingStructuredDataInput,
): StructuredData {
  return {
    "@context": "https://schema.org",

    "@type": "BlogPosting",

    headline: input.title,

    description: input.description,

    url: input.pageUrl,

    image: [input.imageUrl],

    datePublished: input.datePublished.toISOString(),

    ...(input.dateModified
      ? {
          dateModified: input.dateModified.toISOString(),
        }
      : {}),

    author: {
      "@type": "Person",

      name: siteConfig.author,

      url: input.authorUrl,
    },

    inLanguage: siteConfig.language,
  };
}

/**
 * 项目案例页 CreativeWork JSON-LD。
 */
export function createProjectStructuredData(
  input: ProjectStructuredDataInput,
): StructuredData {
  return {
    "@context": "https://schema.org",

    "@type": "CreativeWork",

    name: input.title,

    description: input.description,

    url: input.pageUrl,

    mainEntityOfPage: input.pageUrl,

    keywords: input.technologies,

    creativeWorkStatus: input.status,

    author: {
      "@type": "Person",

      name: siteConfig.author,

      url: input.authorUrl,
    },

    inLanguage: siteConfig.language,
  };
}
