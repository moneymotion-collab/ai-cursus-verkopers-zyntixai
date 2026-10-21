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

/** Natural B1-C3 stale enrollments in Production QA org (read-only). */
const STALE_ENROLLMENT_IDS = [
  "e405c5c8-8b26-4768-bc74-67c7d52224e0",
  "aca64f96-8c62-4494-9698-6eee3f19df02",
] as const;

test.describe("B1-C4 Production enrollment operational metadata — desktop", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("home → stale Attention → enrollment detail operational metadata", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);

    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectNoDailyOperatingProductFailure(page);

    const orgSection = page.getByRole("region", {
      name: "Organization attention",
    });
    await expect(
      orgSection.getByRole("link", { name: /No recent enrollment progress/i }).first(),
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
    await expect(page.getByRole("heading", { name: "Next Best Action" })).toBeVisible();

    // Authoritative enrollment context from Attention → known natural stale enrollment.
    await page.goto(
      `/enrollments/${STALE_ENROLLMENT_IDS[0]}?org=${orgId()}`,
      { waitUntil: "domcontentloaded" },
    );
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { name: "Progress", exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/Last meaningful progress/i)).toBeVisible();
    await expect(page.getByText(/No recent progress/i).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "Attention", exact: true })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /No recent enrollment progress/i }).first(),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Next action", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Open Attention", exact: true })).toBeVisible();

    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/attention/`));

    health.assertHealthy();
  });

  test("enrollment list shows progress and attention operational columns", async ({
    page,
  }) => {
    const health = await collectPageHealth(page);
    await page.goto(`/enrollments?org=${orgId()}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole("heading", { level: 1, name: "Enrollments" })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole("columnheader", { name: "Progress", exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Last progress", exact: true })).toBeVisible();
    await expect(page.getByRole("columnheader", { name: "Attention", exact: true })).toBeVisible();
    await expect(page.getByText("No recent progress").first()).toBeVisible();
    health.assertHealthy();
  });
});
