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

test("支持 Web Share API 时会使用原生分享", async ({ page }) => {
  await page.addInitScript(() => {
    const shareCalls: ShareData[] = [];

    Object.defineProperty(window, "__shareCalls", {
      configurable: true,
      value: shareCalls,
    });

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async (data: ShareData) => {
        shareCalls.push(data);
      },
    });
  });

  await page.goto("/blog/astro-learning-notes");

  const actions = page.getByRole("region", {
    name: "分享与订阅",
  });

  await actions
    .getByRole("button", {
      name: "分享文章",
    })
    .click();

  await expect(actions.getByRole("status")).toHaveText("文章已分享。");

  const shareCalls = await page.evaluate(() => {
    return (
      window as typeof window & {
        __shareCalls: ShareData[];
      }
    ).__shareCalls;
  });

  expect(shareCalls).toHaveLength(1);

  expect(shareCalls[0]?.title).toBe("我的 Astro 学习记录");

  expect(new URL(shareCalls[0]?.url ?? "").pathname).toBe(
    "/blog/astro-learning-notes",
  );
});

test("不支持 Web Share API 时会复制文章链接", async ({ page }) => {
  await page.addInitScript(() => {
    const clipboardWrites: string[] = [];

    Object.defineProperty(window, "__clipboardWrites", {
      configurable: true,
      value: clipboardWrites,
    });

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          clipboardWrites.push(text);
        },
      },
    });
  });

  await page.goto("/blog/astro-learning-notes");

  const actions = page.getByRole("region", {
    name: "分享与订阅",
  });

  await actions
    .getByRole("button", {
      name: "分享文章",
    })
    .click();

  await expect(actions.getByRole("status")).toHaveText("文章链接已复制。");

  const clipboardWrites = await page.evaluate(() => {
    return (
      window as typeof window & {
        __clipboardWrites: string[];
      }
    ).__clipboardWrites;
  });

  expect(clipboardWrites).toHaveLength(1);

  expect(new URL(clipboardWrites[0] ?? "").pathname).toBe(
    "/blog/astro-learning-notes",
  );
});

test("用户取消原生分享时不会错误回退到剪贴板", async ({ page }) => {
  await page.addInitScript(() => {
    const clipboardWrites: string[] = [];

    Object.defineProperty(window, "__clipboardWrites", {
      configurable: true,
      value: clipboardWrites,
    });

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: async () => {
        throw new DOMException("Share cancelled", "AbortError");
      },
    });

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          clipboardWrites.push(text);
        },
      },
    });
  });

  await page.goto("/blog/astro-learning-notes");

  const actions = page.getByRole("region", {
    name: "分享与订阅",
  });

  await actions
    .getByRole("button", {
      name: "分享文章",
    })
    .click();

  await expect(actions.getByRole("status")).toHaveText("");

  const clipboardWrites = await page.evaluate(() => {
    return (
      window as typeof window & {
        __clipboardWrites: string[];
      }
    ).__clipboardWrites;
  });

  expect(clipboardWrites).toHaveLength(0);

  await expect(
    actions.getByRole("button", {
      name: "分享文章",
    }),
  ).toBeEnabled();
});

test("博客详情页提供可用的 RSS 订阅入口", async ({ page, request }) => {
  await page.goto("/blog/astro-learning-notes");

  const actions = page.getByRole("region", {
    name: "分享与订阅",
  });

  const rssLink = actions.getByRole("link", {
    name: "订阅博客 RSS",
  });

  await expect(rssLink).toHaveAttribute("href", "/rss.xml");

  const rssResponse = await request.get("/rss.xml");

  expect(rssResponse.status()).toBe(200);

  const rssContentType = rssResponse.headers()["content-type"] ?? "";

  expect(rssContentType).toMatch(/application\/(?:rss\+xml|xml)/);

  const rssBody = await rssResponse.text();

  expect(rssBody).toContain("我的 Astro 学习记录");

  expect(rssBody).toContain("/blog/astro-learning-notes");
});
