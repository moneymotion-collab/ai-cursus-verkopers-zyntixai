import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingSections,
  expectDailyOperatingShell,
  expectNaturalEmptyOperatingState,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);

test.describe("B1-C1 Production daily operating — desktop", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("authenticated Owner empty-state composition loads, reloads, and stays healthy", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectDailyOperatingSections(page);
    await expectNaturalEmptyOperatingState(page);

    // Hard reload
    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await expectDailyOperatingShell(page);
    await expectNaturalEmptyOperatingState(page);

    // Org context remains authoritative in URL
    expect(page.url()).toContain(`org=${browserQaOrgId()}`);

    // Back/forward sanity: visit Attention list then return via history
    await page.getByRole("link", { name: "View all Attention" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/attention\\?org=${browserQaOrgId()}`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/home\\?org=${browserQaOrgId()}`));
    await expectDailyOperatingShell(page);

    health.assertHealthy();
  });
});
