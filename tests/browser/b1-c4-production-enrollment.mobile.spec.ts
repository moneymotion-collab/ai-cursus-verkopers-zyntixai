import { existsSync } from "node:fs";
import { test, expect } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH, browserQaOrgId } from "./helpers/qa-config";
import {
  collectPageHealth,
  expectNoHorizontalOverflow,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);
const orgId = () => browserQaOrgId();
const STALE_ENROLLMENT_ID = "e405c5c8-8b26-4768-bc74-67c7d52224e0";

test.describe("B1-C4 Production enrollment operational metadata — mobile", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("enrollment list and stale detail remain readable on mobile", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await page.goto(`/enrollments?org=${orgId()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { level: 1, name: "Enrollments" })).toBeVisible({
      timeout: 30_000,
    });
    await expectNoHorizontalOverflow(page);
    await expect(
      page.getByRole("list", { name: "Enrollment list" }).getByText("No recent progress").first(),
    ).toBeVisible();

    await page.goto(`/enrollments/${STALE_ENROLLMENT_ID}?org=${orgId()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page.getByRole("heading", { name: "Progress", exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("heading", { name: "Attention", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Next action", exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);

    health.assertHealthy();
  });
});
