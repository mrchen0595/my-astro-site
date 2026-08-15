export const siteConfig = {
  name: "William Chan 的个人网站",

  author: "William Chan",

  description: "William Chan 的个人网站和前端学习记录",

  language: "zh-CN",

  openGraphLocale: "zh_CN",

  rssTitle: "William Chan 的博客 RSS",
} as const;

export const pageDescriptions = {
  home: "我的第一个本地 Astro 网站",

  about: "关于 William 的 Astro 学习过程、前端技能和个人网站项目。",

  contact: "通过联系表单向 William 留言。",

  projects: "William 的前端学习项目、技术实践和项目案例展示。",

  blog: "William 的 Astro、前端开发和 Web 技术学习记录。",

  search: "搜索 William 的博客文章、项目案例、技术标签和前端学习内容。",
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
    href: "/search",
    label: "搜索",
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
