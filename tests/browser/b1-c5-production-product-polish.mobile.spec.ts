import { existsSync } from "node:fs";
import { test, expect, type Page } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectNoHorizontalOverflow,
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
  await page.goto(`${path}?org=${orgId()}`, {
    waitUntil: "domcontentloaded",
  });
  await expect(page).not.toHaveURL(/\/login/);
}

test.describe("B1-C5 Production product polish — mobile", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("critical routes remain usable without horizontal overflow", async ({ page }) => {
    const health = await collectPageHealth(page);

    for (const route of CRITICAL_ROUTES) {
      await openRoute(page, route.path);
      await expect(page.getByRole("heading", { level: 1, name: route.heading })).toBeVisible({
        timeout: 30_000,
      });
      await expectNoHorizontalOverflow(page);
      await expect(page.getByRole("navigation").or(page.locator("header")).first()).toBeVisible();
    }

    health.assertHealthy();
  });
});
