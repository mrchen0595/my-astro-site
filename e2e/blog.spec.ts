import { expect, test } from "@playwright/test";

test("博客首页提供全量搜索和标签内容发现入口", async ({ page }) => {
  await page.goto("/blog");

  await expect(
    page.getByRole("heading", {
      name: "我的 Astro 学习记录",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "为什么网页需要组件化",
    }),
  ).toBeVisible();

  const tagNavigation = page.getByRole("navigation", {
    name: "博客标签",
  });

  await expect(
    tagNavigation.getByRole("link", {
      name: /^全部/,
    }),
  ).toHaveAttribute("aria-current", "page");

  await expect(
    tagNavigation.getByRole("link", {
      name: /^Astro/,
    }),
  ).toHaveAttribute("href", "/blog/tags/astro");

  await expect(
    tagNavigation.getByRole("link", {
      name: /^前端架构/,
    }),
  ).toHaveAttribute("href", "/blog/tags/前端架构");

  const searchLink = page.getByRole("link", {
    name: /搜索全部博客/,
  });

  await expect(searchLink).toHaveAttribute("href", "/search?type=blog");

  await searchLink.click();

  await expect(page).toHaveURL(/\/search\?type=blog$/);

  await expect(page.getByLabel("内容类型")).toHaveValue("blog");
});

test("博客标签拥有可以直接访问并刷新的独立 URL", async ({ page }) => {
  await page.goto("/blog/tags/astro");

  await expect(page).toHaveURL(/\/blog\/tags\/astro\/?$/);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Astro",
    }),
  ).toBeVisible();

  await expect(page.getByText("标签“Astro”下共有 2 篇文章。")).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "我的 Astro 学习记录",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "为什么网页需要组件化",
    }),
  ).toBeVisible();

  await page.reload();

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Astro",
    }),
  ).toBeVisible();

  const missingTagResponse = await page.goto("/blog/tags/react");

  expect(missingTagResponse?.status()).toBe(404);
});

test("中文博客标签 URL 可以直接访问并只显示匹配文章", async ({ page }) => {
  await page.goto("/blog/tags/前端架构");

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "前端架构",
    }),
  ).toBeVisible();

  await expect(page.getByText("标签“前端架构”下共有 1 篇文章。")).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "为什么网页需要组件化",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "我的 Astro 学习记录",
    }),
  ).toHaveCount(0);
});

test("博客详情页标签可以进入对应的独立标签页", async ({ page }) => {
  await page.goto("/blog/astro-learning-notes");

  const tagList = page.getByRole("list", {
    name: "文章标签",
  });

  const astroTagLink = tagList.getByRole("link", {
    name: "Astro",
    exact: true,
  });

  await expect(astroTagLink).toHaveAttribute("href", "/blog/tags/astro");

  await astroTagLink.click();

  await expect(page).toHaveURL(/\/blog\/tags\/astro\/?$/);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Astro",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "我的 Astro 学习记录",
    }),
  ).toBeVisible();

  await expect(
    page.getByRole("heading", {
      name: "为什么网页需要组件化",
    }),
  ).toBeVisible();
});

test("博客分页只生成实际存在的后续页面", async ({ request }) => {
  const duplicateFirstPage = await request.get("/blog/page/1");

  expect(duplicateFirstPage.status()).toBe(404);

  const missingSecondPage = await request.get("/blog/page/2");

  expect(missingSecondPage.status()).toBe(404);
});

test("博客详情页会展示相关文章并排除当前文章", async ({ page }) => {
  await page.goto("/blog/astro-learning-notes");

  const relatedPosts = page.getByRole("region", {
    name: "相关文章",
  });

  await expect(relatedPosts).toBeVisible();

  const relatedArticleLink = relatedPosts.getByRole("link", {
    name: "为什么网页需要组件化",
    exact: true,
  });

  await expect(relatedArticleLink).toBeVisible();

  await expect(
    relatedPosts.getByRole("link", {
      name: "我的 Astro 学习记录",
      exact: true,
    }),
  ).toHaveCount(0);

  await relatedArticleLink.click();

  await expect(page).toHaveURL(/\/blog\/component-thinking\/?$/);

  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "为什么网页需要组件化",
    }),
  ).toBeVisible();
});

test("另一篇博客详情页也可以推荐共享标签的文章", async ({ page }) => {
  await page.goto("/blog/component-thinking");

  const relatedPosts = page.getByRole("region", {
    name: "相关文章",
  });

  await expect(
    relatedPosts.getByRole("link", {
      name: "我的 Astro 学习记录",
      exact: true,
    }),
  ).toBeVisible();

  await expect(
    relatedPosts.getByRole("link", {
      name: "为什么网页需要组件化",
      exact: true,
    }),
  ).toHaveCount(0);
});
