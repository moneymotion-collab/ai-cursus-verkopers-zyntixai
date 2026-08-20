import { existsSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingSections,
  expectDailyOperatingShell,
  expectNoDailyOperatingProductFailure,
  expectNoHorizontalOverflow,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);
const orgId = () => browserQaOrgId();
const STALE_ENROLLMENT_ID = "e405c5c8-8b26-4768-bc74-67c7d52224e0";
const FOREIGN_ORG = "00000000-0000-4000-8000-000000000099";

async function openOrgRoute(page: Page, path: string) {
  await page.goto(`${path}?org=${orgId()}`, { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("B1-FV Course Sellers Beta-1 release — desktop", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("Owner master journey preserves org across critical modules", async ({ page }) => {
    const health = await collectPageHealth(page);
    const nav = page.getByRole("navigation", { name: "Primary" });

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectDailyOperatingSections(page);
    await expectNoDailyOperatingProductFailure(page);

    await nav.getByRole("link", { name: "Leads", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/leads\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Leads" })).toBeVisible({
      timeout: 30_000,
    });

    await nav.getByRole("link", { name: "Customers", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/customers\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Customers" })).toBeVisible();

    await nav.getByRole("link", { name: "Tasks", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/tasks\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Tasks" })).toBeVisible();

    await nav.getByRole("link", { name: "Programs", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/programs\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Programs" })).toBeVisible();

    await nav.getByRole("link", { name: "Enrollments", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/enrollments\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Enrollments" })).toBeVisible();

    await page.goto(`/enrollments/${STALE_ENROLLMENT_ID}?org=${orgId()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: "Progress", exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: "Attention", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Next action", exact: true })).toBeVisible();

    await nav.getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/progress\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Progress" })).toBeVisible();

    await nav.getByRole("link", { name: "Attention", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/attention\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Attention" })).toBeVisible();

    await openDailyOperatingHome(page);
    const orgSection = page.getByRole("region", { name: "Organization attention" });
    await expect(orgSection).toBeVisible();
    await orgSection
      .getByRole("link", { name: /No recent enrollment progress/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/attention/[0-9a-f-]{36}\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { name: "Next Best Action" })).toBeVisible({
      timeout: 30_000,
    });
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/home\\?org=${orgId()}`));

    await nav.getByRole("link", { name: "Members", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/settings/members\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Members" })).toBeVisible();
    await expect(page.getByText(/restricted rollout|Invitations/i).first()).toBeVisible();

    await nav.getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/home\\?org=${orgId()}`));
    await expectDailyOperatingShell(page);

    health.assertHealthy();
  });

  test("critical deep-link, hard refresh, and back preserve org/auth", async ({ page }) => {
    const health = await collectPageHealth(page);
    const routes = [
      "/home",
      "/programs",
      `/enrollments/${STALE_ENROLLMENT_ID}`,
      "/attention",
      "/settings/members",
    ];

    for (const route of routes) {
      await openOrgRoute(page, route);
      await expect(page).not.toHaveURL(/\/login/);
      expect(page.url()).toContain(`org=${orgId()}`);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/login/);
      expect(page.url()).toContain(`org=${orgId()}`);
    }

    await openOrgRoute(page, "/attention");
    await expect(page.getByRole("heading", { level: 1, name: "Attention" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/home\\?org=${orgId()}`));
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/attention\\?org=${orgId()}`));
    await page.goForward();
    await expect(page).toHaveURL(new RegExp(`/home\\?org=${orgId()}`));

    health.assertHealthy();
  });

  test("wrong-org query does not expose foreign tenant workspace", async ({ page }) => {
    const health = await collectPageHealth(page);
    await page.goto(`/home?org=${FOREIGN_ORG}`, { waitUntil: "domcontentloaded" });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(
      page.getByRole("heading", { name: /Organization selection required|Organization required/i }),
    ).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("No recent enrollment progress")).toHaveCount(0);
    health.assertHealthy();
  });
});
