import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingSections,
  expectDailyOperatingShell,
  expectNaturalEmptyOperatingState,
  expectNoHorizontalOverflow,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);

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
    await expectNaturalEmptyOperatingState(page);
    await expectNoHorizontalOverflow(page);

    // Primary nav remains available (no hover-only gate)
    await expect(page.getByRole("navigation", { name: "Primary" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Home" })).toBeVisible();

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.url()).toContain(`org=${browserQaOrgId()}`);
    await expectNaturalEmptyOperatingState(page);
    await expectNoHorizontalOverflow(page);

    health.assertHealthy();
  });
});
