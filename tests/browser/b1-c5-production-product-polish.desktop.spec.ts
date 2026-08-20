import { existsSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingShell,
  expectNoDailyOperatingProductFailure,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);
const orgId = () => browserQaOrgId();

const CRITICAL_ROUTES = [
  { path: "/home", heading: /Today/i },
  { path: "/leads", heading: /Leads/i },
  { path: "/customers", heading: /Customers/i },
  { path: "/programs", heading: /Programs/i },
  { path: "/enrollments", heading: /Enrollments/i },
  { path: "/progress", heading: /Progress/i },
  { path: "/attention", heading: /Attention/i },
  { path: "/tasks", heading: /Tasks/i },
  { path: "/settings/members", heading: /Members/i },
] as const;

async function openRoute(page: Page, path: string) {
  const url = path.includes("?")
    ? path
    : `${path}?org=${orgId()}`;
  await page.goto(url.startsWith("/") ? url : `/${url}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("B1-C5 Production product polish — desktop", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("critical Course Sellers routes load with org context and healthy network", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    for (const route of CRITICAL_ROUTES) {
      await openRoute(page, route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByRole("navigation").or(page.locator("header")).first()).toBeVisible();
      expect(page.url()).toContain(`org=${orgId()}`);
      await page.reload({ waitUntil: "domcontentloaded" });
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible({
        timeout: 30_000,
      });
    }

    health.assertHealthy();
  });

  test("Owner cross-module journey preserves org and returns home", async ({ page }) => {
    const health = await collectPageHealth(page);

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectNoDailyOperatingProductFailure(page);

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Attention", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/attention\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Attention" })).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Enrollments", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/enrollments\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Enrollments" })).toBeVisible();

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Progress", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/progress\\?org=${orgId()}`));

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Programs", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/programs\\?org=${orgId()}`));

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Customers", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/customers\\?org=${orgId()}`));

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Tasks", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/tasks\\?org=${orgId()}`));

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Members", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/settings/members\\?org=${orgId()}`));
    await expect(page.getByRole("heading", { level: 1, name: "Members" })).toBeVisible();
    await expect(page.getByText(/restricted rollout|Invitations/i).first()).toBeVisible();

    await page.getByRole("navigation", { name: "Primary" }).getByRole("link", { name: "Home", exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/home\\?org=${orgId()}`));
    await expectDailyOperatingShell(page);

    health.assertHealthy();
  });

  test("home loading chrome includes Today shell markers after navigation", async ({
    page,
  }) => {
    await openRoute(page, "/leads");
    await expect(page.getByRole("heading", { level: 1, name: "Leads" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("link", { name: "Home", exact: true }).first().click();
    await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByText("What needs attention and what you need to do next."),
    ).toBeVisible();
  });
});
