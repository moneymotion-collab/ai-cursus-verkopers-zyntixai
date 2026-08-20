import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingShell,
  expectNoDailyOperatingProductFailure,
  expectNoHorizontalOverflow,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);

test.describe("B1-C3 Production Course Seller Attention — mobile", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("home Course Seller Attention remains readable and actionable on mobile", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectNoDailyOperatingProductFailure(page);
    await expectNoHorizontalOverflow(page);

    const orgSection = page.getByRole("region", {
      name: "Organization attention",
    });
    await expect(orgSection).toBeVisible();

    const staleLink = orgSection.getByRole("link", {
      name: /No recent enrollment progress/i,
    });
    await expect(staleLink.first()).toBeVisible({ timeout: 30_000 });
    await staleLink.first().click();
    await expect(page).toHaveURL(
      new RegExp(`/attention/[0-9a-f-]{36}\\?org=${browserQaOrgId()}`),
    );
    await expect(
      page.getByRole("heading", { name: "No recent enrollment progress" }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    health.assertHealthy();
  });
});
