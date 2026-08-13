export const siteConfig = {
  name: "William Chan 的个人网站",

  author: "William Chan",

  description: "William Chan 的个人网站和前端学习记录",

  language: "zh-CN",

  openGraphLocale: "zh_CN",

  rssTitle: "William Chan 的博客 RSS",
} as const;

export const mainNavigation = [
  {
    href: "/",
    label: "首页",
  },

  {
    href: "/projects",
    label: "项目",
  },

  {
    href: "/blog",
    label: "博客",
  },

  {
    href: "/contact",
    label: "联系",
  },

  {
    href: "/about",
    label: "关于",
  },
] as const;

export const footerNavigation = mainNavigation.filter(
  (link) => link.href !== "/contact",
);
