import { expect, test } from "@playwright/test";

test.describe("站内搜索", () => {
  test("搜索页面可以正常打开", async ({ page }) => {
    await page.goto("/search");

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "站内搜索",
      }),
    ).toBeVisible();

    await expect(
      page.getByRole("searchbox", {
        name: "搜索内容",
      }),
    ).toBeVisible();
  });

  test("可以搜索 Astro 内容", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("searchbox", {
      name: "搜索内容",
    });

    await input.fill("Astro");

    const results = page.locator("[data-search-result]");

    await expect(results.first()).toBeVisible();

    await expect(results).not.toHaveCount(0);
  });

  test("可以找到 Astro 个人网站项目", async ({ page }) => {
    await page.goto("/search");

    await page
      .getByRole("searchbox", {
        name: "搜索内容",
      })
      .fill("Astro 个人网站");

    const project = page
      .locator('[data-search-result][data-type="project"]')
      .filter({
        hasText: "Astro 个人网站",
      });

    await expect(project).toHaveCount(1);
  });

  test("可以按项目类型过滤", async ({ page }) => {
    await page.goto("/search");

    await page
      .getByRole("searchbox", {
        name: "搜索内容",
      })
      .fill("Astro");

    await page
      .getByRole("combobox", {
        name: "内容类型",
      })
      .selectOption("project");

    await expect(
      page.locator('[data-search-result]:not([data-type="project"])'),
    ).toHaveCount(0);

    await expect(
      page.locator('[data-search-result][data-type="project"]'),
    ).not.toHaveCount(0);
  });

  test("没有匹配内容时显示空状态", async ({ page }) => {
    await page.goto("/search");

    await page
      .getByRole("searchbox", {
        name: "搜索内容",
      })
      .fill("zzzz-no-result-12345");

    await expect(page.getByText("没有找到结果")).toBeVisible();

    await expect(page.locator("[data-search-result]")).toHaveCount(0);
  });

  test("URL 查询参数可以恢复搜索状态", async ({ page }) => {
    await page.goto("/search?q=Astro&type=project");

    await expect(
      page.getByRole("searchbox", {
        name: "搜索内容",
      }),
    ).toHaveValue("Astro");

    await expect(
      page.getByRole("combobox", {
        name: "内容类型",
      }),
    ).toHaveValue("project");

    await expect(
      page.locator('[data-search-result]:not([data-type="project"])'),
    ).toHaveCount(0);
  });
});

test("没有搜索关键词时不会加载搜索索引", async ({ page }) => {
  const searchIndexRequests: string[] = [];

  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/search-index.json") {
      searchIndexRequests.push(request.url());
    }
  });

  await page.goto("/search");

  await expect(
    page.getByRole("searchbox", {
      name: "搜索内容",
    }),
  ).toBeVisible();

  await expect(page.getByText("输入关键词开始搜索。")).toBeVisible();

  expect(searchIndexRequests).toHaveLength(0);
});

test("首次搜索加载一次索引并在后续搜索中复用", async ({ page }) => {
  const searchIndexRequests: string[] = [];

  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/search-index.json") {
      searchIndexRequests.push(request.url());
    }
  });

  await page.goto("/search");

  const input = page.getByRole("searchbox", {
    name: "搜索内容",
  });

  await input.fill("Astro");

  await expect(page.locator("[data-search-result]").first()).toBeVisible();

  expect(searchIndexRequests).toHaveLength(1);

  await input.fill("Astro 个人网站");

  await expect(
    page.locator('[data-search-result][data-type="project"]').filter({
      hasText: "Astro 个人网站",
    }),
  ).toHaveCount(1);

  expect(searchIndexRequests).toHaveLength(1);

  await page
    .getByRole("combobox", {
      name: "内容类型",
    })
    .selectOption("project");

  await expect(
    page.locator('[data-search-result]:not([data-type="project"])'),
  ).toHaveCount(0);

  expect(searchIndexRequests).toHaveLength(1);
});

test("带查询参数直接打开搜索页会自动加载索引", async ({ page }) => {
  const searchIndexRequests: string[] = [];

  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/search-index.json") {
      searchIndexRequests.push(request.url());
    }
  });

  await page.goto("/search?q=Astro&type=blog");

  await expect(
    page.getByRole("searchbox", {
      name: "搜索内容",
    }),
  ).toHaveValue("Astro");

  await expect(
    page.getByRole("combobox", {
      name: "内容类型",
    }),
  ).toHaveValue("blog");

  await expect(
    page.locator('[data-search-result][data-type="blog"]').first(),
  ).toBeVisible();

  await expect(
    page.locator('[data-search-result]:not([data-type="blog"])'),
  ).toHaveCount(0);

  expect(searchIndexRequests).toHaveLength(1);
});

test("搜索索引加载失败后可以在下一次搜索时重试", async ({ page }) => {
  let searchIndexRequestCount = 0;

  await page.route("**/search-index.json", async (route) => {
    searchIndexRequestCount += 1;

    if (searchIndexRequestCount === 1) {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Search index temporarily unavailable",
        }),
      });

      return;
    }

    await route.continue();
  });

  await page.goto("/search");

  const input = page.getByRole("searchbox", {
    name: "搜索内容",
  });

  await input.fill("Astro");

  await expect(page.getByText("搜索暂时不可用")).toBeVisible();

  await expect(page.getByText("无法加载搜索索引")).toBeVisible();

  await expect(page.getByText("请稍后重试，或重新加载页面。")).toBeVisible();

  expect(searchIndexRequestCount).toBe(1);

  await input.fill("Astro 个人网站");

  await expect(
    page.locator('[data-search-result][data-type="project"]').filter({
      hasText: "Astro 个人网站",
    }),
  ).toHaveCount(1);

  await expect(page.getByText("搜索暂时不可用")).toHaveCount(0);

  expect(searchIndexRequestCount).toBe(2);
});
test("索引加载期间清空查询不会渲染过期搜索结果", async ({ page }) => {
  let markIndexRequestStarted!: () => void;

  const indexRequestStarted = new Promise<void>((resolve) => {
    markIndexRequestStarted = resolve;
  });

  let releaseIndexRequest!: () => void;

  const indexRequestRelease = new Promise<void>((resolve) => {
    releaseIndexRequest = resolve;
  });

  await page.route("**/search-index.json", async (route) => {
    markIndexRequestStarted();

    await indexRequestRelease;

    await route.continue();
  });

  await page.goto("/search");

  const input = page.getByRole("searchbox", {
    name: "搜索内容",
  });

  await input.fill("Astro");

  await indexRequestStarted;

  await input.clear();

  await expect(page.locator("[data-search-summary]")).toHaveText(
    "输入关键词开始搜索。",
  );

  await expect(page.locator("[data-search-result]")).toHaveCount(0);

  const indexResponse = page.waitForResponse(
    (response) => new URL(response.url()).pathname === "/search-index.json",
  );

  releaseIndexRequest();

  await indexResponse;

  await expect(page.locator("[data-search-summary]")).toHaveText(
    "输入关键词开始搜索。",
  );

  await expect(page.locator("[data-search-result]")).toHaveCount(0);

  await expect(input).toHaveValue("");

  await expect(page).toHaveURL(/\/search\/?$/);
});
