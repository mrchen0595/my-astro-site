import { expect, test, type Locator, type Page } from "@playwright/test";

type Theme = "light" | "dark";

interface ContrastResult {
  ratio: number;

  color: string;

  backgroundColor: string;
}

async function setTheme(page: Page, theme: Theme) {
  /*
   * Contrast Test 只检查最终静态颜色。
   *
   * 页面本身存在主题切换 transition，
   * 如果刚修改 data-theme 就立即读取
   * getComputedStyle()，可能读到动画中间帧，
   * 从而产生错误的 contrast ratio。
   *
   * 因此 Contrast Test 中关闭 transition /
   * animation，再切换主题。
   */
  await page.addStyleTag({
    content: `
      *,
      *::before,
      *::after {
        transition: none !important;
        animation: none !important;
      }
    `,
  });

  await page.evaluate((value) => {
    document.documentElement.dataset.theme = value;

    document.documentElement.dataset.themePreference = value;
  }, theme);

  await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
}

async function getTextContrast(locator: Locator): Promise<ContrastResult> {
  return locator.evaluate((element) => {
    interface Rgba {
      r: number;
      g: number;
      b: number;
      a: number;
    }

    function parseColor(value: string): Rgba {
      if (value === "transparent") {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
        };
      }

      const values = value.match(/[\d.]+/g)?.map(Number);

      if (!values || values.length < 3) {
        throw new Error(`无法解析颜色：${value}`);
      }

      return {
        r: values[0] ?? 0,

        g: values[1] ?? 0,

        b: values[2] ?? 0,

        a: values[3] ?? 1,
      };
    }

    function composite(foreground: Rgba, background: Rgba): Rgba {
      const alpha = foreground.a + background.a * (1 - foreground.a);

      if (alpha === 0) {
        return {
          r: 0,
          g: 0,
          b: 0,
          a: 0,
        };
      }

      return {
        r:
          (foreground.r * foreground.a +
            background.r * background.a * (1 - foreground.a)) /
          alpha,

        g:
          (foreground.g * foreground.a +
            background.g * background.a * (1 - foreground.a)) /
          alpha,

        b:
          (foreground.b * foreground.a +
            background.b * background.a * (1 - foreground.a)) /
          alpha,

        a: alpha,
      };
    }

    function linearize(channel: number): number {
      const value = channel / 255;

      return value <= 0.04045
        ? value / 12.92
        : Math.pow((value + 0.055) / 1.055, 2.4);
    }

    function luminance(color: Rgba): number {
      return (
        0.2126 * linearize(color.r) +
        0.7152 * linearize(color.g) +
        0.0722 * linearize(color.b)
      );
    }

    const ancestors: Element[] = [];

    let current: Element | null = element;

    while (current) {
      ancestors.unshift(current);

      current = current.parentElement;
    }

    /*
     * 浏览器默认画布按白色作为
     * 最终回退背景。
     */
    let background: Rgba = {
      r: 255,
      g: 255,
      b: 255,
      a: 1,
    };

    for (const ancestor of ancestors) {
      const style = window.getComputedStyle(ancestor);

      background = composite(parseColor(style.backgroundColor), background);
    }

    const elementStyle = window.getComputedStyle(element);

    const textColor = composite(parseColor(elementStyle.color), background);

    const textLuminance = luminance(textColor);

    const backgroundLuminance = luminance(background);

    const lighter = Math.max(textLuminance, backgroundLuminance);

    const darker = Math.min(textLuminance, backgroundLuminance);

    const ratio = (lighter + 0.05) / (darker + 0.05);

    const rounded = (color: Rgba) =>
      `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(
        color.b,
      )})`;

    return {
      ratio,

      color: rounded(textColor),

      backgroundColor: rounded(background),
    };
  });
}

async function expectTextContrast(
  locator: Locator,
  label: string,
  minimum = 4.5,
) {
  await expect(locator).toBeVisible();

  const result = await getTextContrast(locator);

  expect(
    result.ratio,
    [
      `${label} 对比度不足。`,
      `实际：${result.ratio.toFixed(2)}:1`,
      `要求：${minimum}:1`,
      `文字：${result.color}`,
      `背景：${result.backgroundColor}`,
    ].join(" "),
  ).toBeGreaterThanOrEqual(minimum);
}

for (const theme of ["light", "dark"] as const) {
  test.describe(`${theme} 主题颜色对比度`, () => {
    test("当前导航状态具有足够对比度", async ({ page }) => {
      await page.goto("/");

      await setTheme(page, theme);

      const mainNavigation = page.getByRole("navigation", {
        name: "主导航",
      });

      const activeLink = mainNavigation.locator('[aria-current="page"]');

      await expectTextContrast(activeLink, `${theme} 主题当前导航`);
    });

    test("项目状态文字具有足够对比度", async ({ page }) => {
      await page.goto("/projects/astro-site");

      await setTheme(page, theme);

      await expectTextContrast(
        page.locator(".status"),
        `${theme} 主题项目状态`,
      );
    });

    test("搜索结果类型具有足够对比度", async ({ page }) => {
      await page.goto("/search?q=Astro");

      await setTheme(page, theme);

      const firstResult = page.locator("[data-search-result]").first();

      await expect(firstResult).toBeVisible();

      await expectTextContrast(
        firstResult.locator(".result-type"),
        `${theme} 主题搜索结果类型`,
      );
    });

    test("表单错误文字具有足够对比度", async ({ page }) => {
      await page.goto("/contact");

      await setTheme(page, theme);

      await page
        .getByRole("button", {
          name: "提交表单",
        })
        .click();

      const error = page.getByText("请输入姓名。", {
        exact: true,
      });

      await expectTextContrast(error, `${theme} 主题表单错误`);
    });
  });
}

test.describe("状态信息不能只依赖颜色", () => {
  test("当前导航同时具有 aria-current", async ({ page }) => {
    await page.goto("/projects");

    const mainNavigation = page.getByRole("navigation", {
      name: "主导航",
    });

    await expect(
      mainNavigation.getByRole("link", {
        name: "项目",
        exact: true,
      }),
    ).toHaveAttribute("aria-current", "page");
  });

  test("表单错误同时使用文字和 aria-invalid", async ({ page }) => {
    await page.goto("/contact");

    await page
      .getByRole("button", {
        name: "提交表单",
      })
      .click();

    const nameField = page.getByLabel(/^姓名/);

    await expect(nameField).toHaveAttribute("aria-invalid", "true");

    await expect(
      page.getByText("请输入姓名。", {
        exact: true,
      }),
    ).toBeVisible();
  });

  test("项目状态使用可见文字表达", async ({ page }) => {
    await page.goto("/projects/astro-site");

    const status = page.locator(".status");

    await expect(status).toBeVisible();

    await expect(status).not.toHaveText("");
  });

  test("搜索结果类型使用文字和数据属性表达", async ({ page }) => {
    await page.goto("/search?q=Astro");

    const firstResult = page.locator("[data-search-result]").first();

    await expect(firstResult).toBeVisible();

    const type = await firstResult.getAttribute("data-type");

    expect(["blog", "project"]).toContain(type);

    await expect(firstResult.locator(".result-type")).toHaveText(/博客|项目/);
  });
});
