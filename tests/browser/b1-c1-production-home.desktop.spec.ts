import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectCurrentProductionOperatingState,
  expectDailyOperatingSections,
  expectDailyOperatingShell,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);

test.describe("B1-C1 Production daily operating — desktop", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("authenticated Owner composition loads, reloads, and stays healthy", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectDailyOperatingSections(page);
    await expectCurrentProductionOperatingState(page);

    await page.reload({ waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await expectDailyOperatingShell(page);
    await expectCurrentProductionOperatingState(page);

    expect(page.url()).toContain(`org=${browserQaOrgId()}`);

    await page.getByRole("link", { name: "View all Attention" }).first().click();
    await expect(page).toHaveURL(new RegExp(`/attention\\?org=${browserQaOrgId()}`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/home\\?org=${browserQaOrgId()}`));
    await expectDailyOperatingShell(page);

    health.assertHealthy();
  });
});
