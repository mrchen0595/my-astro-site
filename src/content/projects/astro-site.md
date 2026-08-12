---
title: "Astro 个人网站"
description: "我的第一个 Astro 项目，包含首页、公共布局、导航组件和响应式页面样式。"
technologies:
  - "Astro"
  - "HTML"
  - "CSS"
  - "JavaScript"
status: "已上线"
href: "/"
order: 1
---

## 项目目标

这个项目的目标不是单纯制作一个静态首页，而是通过一个真实的网站项目学习完整的前端开发流程。

从最初的 Astro 页面开始，逐步增加公共布局、导航、响应式设计、博客、项目展示、联系页面、主题切换、SEO、自动化测试和部署流程。

## 我做了什么

项目从一个简单的 Astro 页面逐渐拆分成多个可以复用的页面和组件。

目前网站包含首页、关于页面、项目页面、博客、联系页面以及自定义错误页面，并使用统一的 Layout 和 Header 等组件管理公共结构。

项目内容也逐步从页面中的硬编码数据迁移到 Astro Content Collections。

## 关键功能

- 多页面 Astro 文件路由
- 公共 Layout 和组件复用
- 响应式桌面端与移动端布局
- Light / Dark 主题切换
- Blog Content Collection
- Projects Content Collection
- 动态项目详情页
- SEO、Sitemap 和 RSS
- Playwright E2E 自动化测试
- Lighthouse 性能检查
- GitHub Actions CI
- Vercel 自动部署

## 遇到的问题

随着项目功能增加，最大的挑战之一是不同功能之间会产生相互影响。

例如在增加 CSP 安全策略时，本地开发环境的样式曾经出现异常；项目页面从硬编码数据迁移到 Content Collection 时，也需要保证原有 UI 和自动化测试不会被破坏。

## 如何解决

处理这些问题时，我逐渐采用更小粒度的开发方式。

每次只修改一个功能层级，在独立 Git 分支中完成开发，然后依次进行本地测试、Playwright 测试、GitHub CI 和 Vercel Preview 验证。

确认稳定以后再合并到 main。

这种方式比同时修改多个页面、组件和配置文件更加容易定位问题。

## 学到了什么

通过这个项目，我开始理解一个网站不仅由 HTML 和 CSS 组成。

一个完整的前端项目还包括：

- 内容架构
- 组件设计
- 路由
- 数据模型
- 自动化测试
- Git 版本控制
- CI/CD
- 性能优化
- 安全配置
- 部署环境

这个项目也成为后续学习其他 Web 技术的基础。
