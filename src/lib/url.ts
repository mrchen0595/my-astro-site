export type BaseUrl = string | URL;

/**
 * 获取当前站点的基础 URL。
 *
 * 生产环境优先使用 Astro.site。
 * 本地开发时回退到 Astro.url.origin。
 */
export function getBaseUrl(site: URL | undefined, origin: string): URL {
  return site ? new URL(site) : new URL(origin);
}

/**
 * 把站内路径转换成绝对 URL。
 *
 * 例如：
 *
 * /about
 * →
 * https://example.com/about
 *
 * /_astro/image.jpg
 * →
 * https://example.com/_astro/image.jpg
 */
export function createSiteUrl(path: string, baseUrl: BaseUrl): string {
  return new URL(path, baseUrl).href;
}

/**
 * 创建页面 canonical URL。
 *
 * Canonical 不应该包含 query string
 * 或 hash fragment。
 */
export function createCanonicalUrl(path: string, baseUrl: BaseUrl): string {
  const url = new URL(path, baseUrl);

  url.search = "";
  url.hash = "";

  return url.href;
}
