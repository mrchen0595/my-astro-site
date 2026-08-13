import { siteConfig } from "../config/site";

/**
 * 生成统一的网页标题。
 *
 * createPageTitle()
 * → William Chan 的个人网站
 *
 * createPageTitle("项目")
 * → 项目 | William Chan 的个人网站
 */
export function createPageTitle(pageTitle?: string): string {
  if (!pageTitle) {
    return siteConfig.name;
  }

  return `${pageTitle} | ${siteConfig.name}`;
}
