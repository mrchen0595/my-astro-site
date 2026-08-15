import { expect, test, type Locator } from "@playwright/test";

async function getTransitionDurationSeconds(
  locator: Locator,
): Promise<number[]> {
  return locator.evaluate((element) => {
    const style = window.getComputedStyle(element);

    return style.transitionDuration
      .split(",")
      .map((value) => value.trim())
      .map((value) => {
        if (value.endsWith("ms")) {
          return Number.parseFloat(value) / 1000;
        }

        if (value.endsWith("s")) {
          return Number.parseFloat(value);
        }

        return 0;
      });
  });
}

async function expectReducedTransition(locator: Locator) {
  const durations = await getTransitionDurationSeconds(locator);

  expect(durations.length).toBeGreaterThan(0);

  for (const duration of durations) {
    expect(duration).toBeLessThanOrEqual(0.001);
  }
}

test.describe("Reduced Motion", () => {
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({
      reducedMotion: "reduce",
    });
  });

  test("浏览器可以识别减少动态效果偏好", async ({ page }) => {
    await page.goto("/");

    const prefersReducedMotion = await page.evaluate(
      () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    );

    expect(prefersReducedMotion).toBe(true);
  });

  test("Skip Link 在减少动态效果模式下不会使用明显过渡", async ({ page }) => {
    await page.goto("/");

    const skipLink = page.getByRole("link", {
      name: "跳到主要内容",
    });

    await expectReducedTransition(skipLink);
  });

  test("Header 导航在减少动态效果模式下不会使用明显过渡", async ({ page }) => {
    await page.goto("/");

    const mainNavigation = page.getByRole("navigation", {
      name: "主导航",
    });

    const searchLink = mainNavigation.getByRole("link", {
      name: "搜索",
      exact: true,
    });

    await expect(searchLink).toHaveCount(1);

    await expectReducedTransition(searchLink);
  });

  test("首页按钮在减少动态效果模式下不会使用明显过渡", async ({ page }) => {
    await page.goto("/");

    const primaryButton = page.getByRole("link", {
      name: "查看关于页面",
    });

    const demoButton = page.getByRole("button", {
      name: "测试 JavaScript",
    });

    await expectReducedTransition(primaryButton);

    await expectReducedTransition(demoButton);
  });

  test("减少动态效果不会破坏按钮功能", async ({ page }) => {
    await page.goto("/");

    await page
      .getByRole("button", {
        name: "测试 JavaScript",
      })
      .click();

    await expect(
      page.getByText("运行成功：浏览器端 JavaScript 正常工作。", {
        exact: true,
      }),
    ).toBeVisible();
  });
});
