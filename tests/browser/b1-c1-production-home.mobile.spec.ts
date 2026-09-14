import { existsSync } from "node:fs";
import { test, expect, type Locator, type Page } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectCurrentProductionOperatingState,
  expectDailyOperatingSections,
  expectDailyOperatingShell,
  expectNoHorizontalOverflow,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);

const AUTHORIZED_PRIMARY_ORDER = [
  "Home",
  "Leads",
  "Customers",
  "Programs",
  "Enrollments",
  "Progress",
  "Attention",
  "Tasks",
  "Members",
] as const;

const UNAUTHORIZED_PRIMARY_NAMES = [
  "Projects",
  "Sites",
  "Work orders",
  "Orders",
  "Social",
] as const;

function menuSummary(page: Page): Locator {
  return page.locator("summary").filter({ hasText: /^Menu$/ });
}

function menuDisclosure(page: Page): Locator {
  return page.locator("details").filter({ has: menuSummary(page) });
}

function primaryNavCopies(page: Page): Locator {
  return page.locator('nav[aria-label="Primary"]');
}

async function expectClosedMobilePrimary(page: Page) {
  const copies = primaryNavCopies(page);
  await expect(copies).toHaveCount(2);
  for (let index = 0; index < 2; index += 1) {
    await expect(copies.nth(index)).toBeHidden();
  }
  await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
}

test.describe("B1-C1 Production daily operating — mobile", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("authenticated Owner mobile composition stacks without overflow", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectDailyOperatingSections(page);
    await expectCurrentProductionOperatingState(page);
    await expectNoHorizontalOverflow(page);

    await expect(
      page.locator("header").getByText("ZyntixAI", { exact: true }),
    ).toBeVisible();

    const menu = menuSummary(page);
    const disclosure = menuDisclosure(page);
    await expect(menu).toBeVisible();
    await expect(disclosure).toHaveJSProperty("open", false);
    await expectClosedMobilePrimary(page);

    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
    });

    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("link", { name: "Skip to main content" }),
    ).toBeFocused();

    await page.keyboard.press("Tab");
    await expect(menu).toBeFocused();
    await expect(disclosure).toHaveJSProperty("open", false);
    await expectClosedMobilePrimary(page);

    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveJSProperty("open", true);
    await expect(menu).toBeFocused();

    const visiblePrimary = page.getByRole("navigation", { name: "Primary" });
    await expect(visiblePrimary).toHaveCount(1);
    await expect(visiblePrimary).toBeVisible();
    await expect(primaryNavCopies(page).nth(0)).toBeHidden();
    await expect(primaryNavCopies(page).nth(1)).toBeVisible();

    const homeLink = visiblePrimary.getByRole("link", { name: "Home", exact: true });
    await expect(homeLink).toBeVisible();
    await expect(homeLink).toHaveAttribute("aria-current", "page");

    const itemNames = await visiblePrimary.getByRole("link").evaluateAll((links) =>
      links.map((link) => (link.textContent ?? "").trim()),
    );
    expect(itemNames).toEqual([...AUTHORIZED_PRIMARY_ORDER]);
    expect(new Set(itemNames).size).toBe(AUTHORIZED_PRIMARY_ORDER.length);

    const logout = disclosure.getByRole("button", { name: "Log out" });
    await expect(logout).toBeVisible();
    const navBox = await visiblePrimary.boundingBox();
    const logoutBox = await logout.boundingBox();
    expect(navBox).not.toBeNull();
    expect(logoutBox).not.toBeNull();
    if (!navBox || !logoutBox) {
      throw new Error("Expected bounding boxes for visible Primary nav and Log out");
    }
    expect(logoutBox.y).toBeGreaterThan(navBox.y);

    for (const name of UNAUTHORIZED_PRIMARY_NAMES) {
      await expect(
        disclosure.getByRole("link", { name, exact: true }),
      ).toHaveCount(0);
      await expect(
        visiblePrimary.getByRole("link", { name, exact: true }),
      ).toHaveCount(0);
    }

    await expect(menu).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(disclosure).toHaveJSProperty("open", false);
    await expectClosedMobilePrimary(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.url()).toContain(`org=${browserQaOrgId()}`);
    await expectCurrentProductionOperatingState(page);
    await expectNoHorizontalOverflow(page);

    health.assertHealthy();
  });
});
