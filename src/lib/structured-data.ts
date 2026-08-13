import { siteConfig } from "../config/site";

export type StructuredData = Record<string, unknown>;

/**
 * 安全地把结构化数据转换成
 * 可以写入 <script type="application/ld+json">
 * 的 JSON 字符串。
 */
export function serializeStructuredData(data: StructuredData): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

/**
 * 创建首页 WebSite JSON-LD。
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
