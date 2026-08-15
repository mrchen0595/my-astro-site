import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabUntilFocused(page: Page, target: Locator, maxTabs = 20) {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");

    const focused = await target.evaluate(
      (element) => element === document.activeElement,
    );

    if (focused) {
      return;
    }
  }

  throw new Error(`在 ${maxTabs} 次 Tab 内没有到达目标元素。`);
}

async function expectVisibleFocusRing(target: Locator) {
  const styles = await target.evaluate((element) => {
    const computed = window.getComputedStyle(element);

    return {
      outlineStyle: computed.outlineStyle,

      outlineWidth: computed.outlineWidth,

      outlineOffset: computed.outlineOffset,
    };
  });

  expect(styles.outlineStyle).not.toBe("none");

  expect(Number.parseFloat(styles.outlineWidth)).toBeGreaterThanOrEqual(2);

  expect(Number.parseFloat(styles.outlineOffset)).toBeGreaterThanOrEqual(2);
}

test.describe("键盘焦点样式", () => {
  test("Header 导航链接具有清晰的键盘焦点", async ({ page }) => {
    await page.goto("/");

    const header = page.locator("header");

    const searchLink = header.getByRole("link", {
      name: "搜索",
      exact: true,
    });

    await expect(searchLink).toHaveCount(1);

    await tabUntilFocused(page, searchLink);

    await expect(searchLink).toBeFocused();

    await expectVisibleFocusRing(searchLink);
  });

  test("搜索输入框具有清晰的键盘焦点", async ({ page }) => {
    await page.goto("/search");

    const input = page.getByRole("searchbox", {
      name: "搜索内容",
    });

    await tabUntilFocused(page, input);

    await expect(input).toBeFocused();

    await expectVisibleFocusRing(input);
  });

  test("搜索类型选择框具有清晰的键盘焦点", async ({ page }) => {
    await page.goto("/search");

    const select = page.getByRole("combobox", {
      name: "内容类型",
    });

    await tabUntilFocused(page, select);

    await expect(select).toBeFocused();

    await expectVisibleFocusRing(select);
  });

  test("main-content 不进入正常 Tab 顺序", async ({ page }) => {
    await page.goto("/");

    const main = page.locator("#main-content");

    await expect(main).toHaveAttribute("tabindex", "-1");

    await page.keyboard.press("Tab");

    await expect(main).not.toBeFocused();
  });
});
