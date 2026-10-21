import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingShell,
  expectNoHorizontalOverflow,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);
const orgId = () => browserQaOrgId();

test.describe("B1-C5 Production product polish — tablet", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("intermediate viewport keeps critical navigation and home usable", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Enrollments", exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`/enrollments\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Enrollments" })).toBeVisible({
      timeout: 30_000,
    });
    await expectNoHorizontalOverflow(page);

    await page.getByRole("link", { name: "Members", exact: true }).first().click();
    await expect(page).toHaveURL(new RegExp(`/settings/members\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Members" })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    health.assertHealthy();
  });
});
