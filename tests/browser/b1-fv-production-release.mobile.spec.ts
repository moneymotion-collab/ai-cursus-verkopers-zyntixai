import { existsSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectDailyOperatingShell,
  expectNoHorizontalOverflow,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);
const orgId = () => browserQaOrgId();
const STALE_ENROLLMENT_ID = "e405c5c8-8b26-4768-bc74-67c7d52224e0";

const CRITICAL_ROUTES = [
  { path: "/home", heading: /Today/i },
  { path: "/leads", heading: /Leads/i },
  { path: "/customers", heading: /Customers/i },
  { path: "/programs", heading: /Programs/i },
  { path: "/enrollments", heading: /Enrollments/i },
  { path: `/enrollments/${STALE_ENROLLMENT_ID}`, heading: /Progress/i },
  { path: "/progress", heading: /Progress/i },
  { path: "/attention", heading: /Attention/i },
  { path: "/tasks", heading: /Tasks/i },
  { path: "/settings/members", heading: /Members/i },
] as const;

async function openOrgRoute(page: Page, path: string) {
  await page.goto(`${path}?org=${orgId()}`, { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("B1-FV Course Sellers Beta-1 release — mobile", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("critical customer routes remain usable without overflow", async ({ page }) => {
    const health = await collectPageHealth(page);

    for (const route of CRITICAL_ROUTES) {
      await openOrgRoute(page, route.path);
      await expect(page.getByRole("heading", { name: route.heading }).first()).toBeVisible({
        timeout: 30_000,
      });
      await expectNoHorizontalOverflow(page);
    }

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectNoHorizontalOverflow(page);

    health.assertHealthy();
  });
});
