import { expect, test, type Locator, type Page } from "@playwright/test";

interface ReflowPage {
  path: string;
  name: string;
}

interface ViewportCase {
  width: number;
  height: number;
  name: string;
}

const reflowPages: ReflowPage[] = [
  {
    path: "/",
    name: "首页",
  },

  {
    path: "/about",
    name: "关于",
  },

  {
    path: "/contact",
    name: "联系",
  },

  {
    path: "/projects",
    name: "项目列表",
  },

  {
    path: "/blog",
    name: "博客列表",
  },

  {
    path: "/search",
    name: "搜索",
  },

  {
    path: "/projects/astro-site",
    name: "项目详情",
  },
];

const viewportCases: ViewportCase[] = [
  {
    width: 640,
    height: 900,
    name: "200% Zoom 等效布局",
  },

  {
    width: 320,
    height: 900,
    name: "400% Zoom / 320px Reflow",
  },
];

async function hideAstroDevToolbar(page: Page) {
  /*
   * Astro Dev Toolbar 只存在于开发环境，
   * 不属于网站生产页面。
   *
   * 之前 Semantic Test 已经证明
   * Dev Toolbar 可能干扰 Accessibility
   * 自动测试，所以 Reflow Test 也将它
   * 从测量对象中排除。
   */
  await page.addStyleTag({
    content: `
      astro-dev-toolbar {
        display: none !important;
      }
    `,
  });
}

async function expectNoPageHorizontalOverflow(page: Page, label: string) {
  const metrics = await page.evaluate(() => {
    const root = document.documentElement;

    const body = document.body;

    return {
      viewportWidth: root.clientWidth,

      documentWidth: Math.max(
        root.scrollWidth,

        body?.scrollWidth ?? 0,
      ),
    };
  });

  expect(
    metrics.documentWidth,
    [
      `${label} 出现页面级横向溢出。`,

      `viewport: ${metrics.viewportWidth}px`,

      `document: ${metrics.documentWidth}px`,
    ].join(" "),
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

async function expectMainFitsViewport(page: Page, label: string) {
  const main = page.locator("main#main-content");

  await expect(main, `${label} 应该存在主要内容`).toBeVisible();

  const metrics = await main.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    return {
      left: rect.left,

      right: rect.right,

      width: rect.width,

      viewportWidth: document.documentElement.clientWidth,
    };
  });

  expect(
    metrics.left,
    `${label} main 左侧超出 viewport`,
  ).toBeGreaterThanOrEqual(-1);

  expect(
    metrics.right,
    [
      `${label} main 右侧超出 viewport。`,

      `right: ${metrics.right.toFixed(1)}px`,

      `viewport: ${metrics.viewportWidth}px`,
    ].join(" "),
  ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
}

async function expectElementInsideViewport(locator: Locator, label: string) {
  await expect(locator, `${label} 应该可见`).toBeVisible();

  const result = await locator.evaluate((element) => {
    const rect = element.getBoundingClientRect();

    const viewportWidth = document.documentElement.clientWidth;

    return {
      left: rect.left,

      right: rect.right,

      width: rect.width,

      viewportWidth,
    };
  });

  expect(result.left, `${label} 左侧被裁切`).toBeGreaterThanOrEqual(-1);

  expect(
    result.right,
    [
      `${label} 右侧被裁切。`,

      `right: ${result.right.toFixed(1)}px`,

      `viewport: ${result.viewportWidth}px`,
    ].join(" "),
  ).toBeLessThanOrEqual(result.viewportWidth + 1);
}

async function preparePage(page: Page, path: string) {
  await page.goto(path);

  await hideAstroDevToolbar(page);
}

async function expectPageReflows(page: Page, name: string) {
  await expectNoPageHorizontalOverflow(page, name);

  await expectMainFitsViewport(page, name);

  const main = page.locator("main#main-content");

  await expect(
    main.locator("h1"),
    `${name} 的页面主标题应该可见`,
  ).toBeVisible();
}

for (const viewport of viewportCases) {
  test.describe(viewport.name, () => {
    test.use({
      viewport: {
        width: viewport.width,

        height: viewport.height,
      },
    });

    for (const reflowPage of reflowPages) {
      test(`${reflowPage.name}不会产生页面级横向滚动`, async ({ page }) => {
        await preparePage(page, reflowPage.path);

        await expectPageReflows(page, `${viewport.name} - ${reflowPage.name}`);
      });
    }

    test("博客详情页可以正常 Reflow", async ({ page }) => {
      await preparePage(page, "/blog");

      const articleLink = page.getByRole("link", {
        name: "我的 Astro 学习记录",
        exact: true,
      });

      const href = await articleLink.getAttribute("href");

      expect(href).toBeTruthy();

      await preparePage(page, href!);

      await expect(page).toHaveURL(/\/blog\/[^/]+\/?$/);

      await expectPageReflows(page, `${viewport.name} - 博客详情`);
    });
  });
}

test.describe("320px 关键控件 Reflow", () => {
  test.use({
    viewport: {
      width: 320,
      height: 900,
    },
  });

  test("搜索控件不会被横向裁切", async ({ page }) => {
    await preparePage(page, "/search");

    await expectElementInsideViewport(
      page.getByRole("searchbox", {
        name: "搜索内容",
      }),
      "搜索输入框",
    );

    await expectElementInsideViewport(
      page.getByRole("combobox", {
        name: "内容类型",
      }),
      "内容类型选择框",
    );
  });

  test("联系表单不会被横向裁切", async ({ page }) => {
    await preparePage(page, "/contact");

    const controls = [
      {
        locator: page.getByLabel(/^姓名/),

        name: "姓名输入框",
      },

      {
        locator: page.getByLabel(/^邮箱/),

        name: "邮箱输入框",
      },

      {
        locator: page.getByLabel("主题", {
          exact: true,
        }),

        name: "主题输入框",
      },

      {
        locator: page.getByLabel(/^留言/),

        name: "留言输入框",
      },

      {
        locator: page.getByRole("button", {
          name: "提交表单",
        }),

        name: "提交表单按钮",
      },
    ];

    for (const control of controls) {
      await expectElementInsideViewport(control.locator, control.name);
    }
  });

  test("项目卡片不会被横向裁切", async ({ page }) => {
    await preparePage(page, "/projects");

    const firstCard = page.locator(".project-card").first();

    await expectElementInsideViewport(firstCard, "第一个项目卡片");

    await expectElementInsideViewport(
      firstCard.getByRole("link", {
        name: "查看详情",
        exact: true,
      }),
      "项目查看详情",
    );
  });

  test("博客卡片不会被横向裁切", async ({ page }) => {
    await preparePage(page, "/blog");

    const firstCard = page.locator("article.blog-card").first();

    await expectElementInsideViewport(firstCard, "第一篇博客卡片");

    await expectElementInsideViewport(
      firstCard.getByRole("link", {
        name: "我的 Astro 学习记录",
        exact: true,
      }),
      "博客标题链接",
    );
  });
});
