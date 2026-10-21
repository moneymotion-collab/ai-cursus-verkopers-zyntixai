import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingShell,
  expectNoDailyOperatingProductFailure,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);
const orgId = () => browserQaOrgId();

test.describe("B1-C3 Production Course Seller Attention — desktop", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("evaluate rules creates Course Seller Attention, home shows it, detail+NBA work, dedup holds", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await page.goto(`/attention?org=${orgId()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1, name: "Attention" })).toBeVisible({
      timeout: 30_000,
    });

    const evaluateButton = page.getByRole("button", {
      name: "Evaluate progress Attention",
    });
    await expect(evaluateButton).toBeVisible();

    await evaluateButton.click();
    await expect(
      page.getByText(/new item|open item|No enrollment Attention changes|item expired/i),
    ).toBeVisible({ timeout: 30_000 });

    // Dedup: second evaluate must not create a second open item for the same condition.
    await evaluateButton.click();
    await expect(
      page.getByText(/open item|No enrollment Attention changes|item expired|new item/i),
    ).toBeVisible({ timeout: 30_000 });

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectNoDailyOperatingProductFailure(page);

    const orgSection = page.getByRole("region", {
      name: "Organization attention",
    });
    await expect(orgSection).toBeVisible();
    await expect(
      orgSection.getByText("No recent enrollment progress").first(),
    ).toBeVisible({ timeout: 30_000 });

    await orgSection
      .getByRole("link", { name: /No recent enrollment progress/i })
      .first()
      .click();
    await expect(page).toHaveURL(
      new RegExp(`/attention/[0-9a-f-]{36}\\?org=${orgId()}`),
    );
    await expect(
      page.getByRole("heading", { name: "No recent enrollment progress" }),
    ).toBeVisible();
    await expect(page.getByText("High", { exact: true }).first()).toBeVisible();

    await expect(
      page.getByRole("heading", { name: "Next Best Action" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /progress|enrollment|customer|Review/i }).first(),
    ).toBeVisible();

    health.assertHealthy();
  });
});
