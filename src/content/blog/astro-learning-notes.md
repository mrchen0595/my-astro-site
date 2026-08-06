---
title: "我的 Astro 学习记录"
description: "记录我从创建第一个页面，到组件化、部署和服务端接口的学习过程。"
pubDate: 2026-08-06
tags:
  - Astro
  - 前端入门
  - 学习记录
draft: false
cover: "./astro-learning-cover.jpg"
coverAlt: "带有 Astro 学习主题的博客文章封面"
---

我最初只是想制作一个简单网页，但很快发现，一个真正的网站不仅包含 HTML 和 CSS，还需要理解路由、组件、构建和部署。

## 我已经完成的内容

目前这个网站已经包含：

- 首页
- 项目展示页
- 关于页面
- 联系表单
- 公共导航组件
- 公共页面布局
- GitHub 版本管理
- Vercel 自动部署

## Astro 给我的第一印象

Astro 最明显的特点是，它允许我直接编写接近 HTML 的页面，同时又能使用组件、变量和数据循环。

例如，一个组件可以这样使用：

```astro
<ProjectCard
  title="Astro 网站"
  description="我的第一个 Astro 项目"
  technologies={["Astro", "CSS", "JavaScript"]}
/>