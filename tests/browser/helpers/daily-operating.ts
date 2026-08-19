import { expect, type Page } from "@playwright/test";
import {
  browserQaOrgId,
  dailyOperatingHomePath,
} from "./qa-config";

/**
 * Read-only Production assertions for Daily Operating Composition.
 * Does not mutate Attention/Tasks/Social.
 */

export async function openDailyOperatingHome(page: Page) {
  const orgId = browserQaOrgId();
  const path = dailyOperatingHomePath(orgId);
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page).toHaveURL(new RegExp(`/home\\?org=${orgId}`));
}

export async function expectDailyOperatingShell(page: Page) {
  // Semantic readiness: composition shell, not the loading flash.
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible({
    timeout: 30_000,
  });
  await expect(page.getByText("Loading today’s brief…")).toHaveCount(0);
  await expect(
    page.getByText("What needs attention and what you need to do next."),
  ).toBeVisible();
}

export async function expectDailyOperatingSections(page: Page) {
  await expect(
    page.getByRole("heading", { name: "Organization attention" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Assigned to me — Attention" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overdue work" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Due today" })).toBeVisible();
}

/**
 * Assert no B1-C1 product failure UI.
 *
 * Do NOT use bare getByRole('alert'): Next.js App Router injects an invisible
 * route announcer with role="alert" (see app-router-announcer.js).
 */
export async function expectNoDailyOperatingProductFailure(page: Page) {
  await expect(page.getByText("Unable to load today’s brief")).toHaveCount(0);
  await expect(page.getByText("Unable to load Attention.")).toHaveCount(0);
  await expect(page.getByText("Unable to load Tasks.")).toHaveCount(0);
  await expect(
    page.getByText("Attention could not be loaded."),
  ).toHaveCount(0);
  await expect(page.getByText("Tasks could not be loaded.")).toHaveCount(0);
}

/**
 * Current natural Production control-org semantics (Owner observation + screenshot):
 * - Organization attention may contain actionable High Attention
 * - Assigned Attention empty
 * - Overdue empty
 * - Due today empty
 *
 * Calm “You are clear for now.” is only valid when NOTHING is actionable,
 * so it must not be required when Organization attention has items.
 */
export async function expectCurrentProductionOperatingState(page: Page) {
  await expectNoDailyOperatingProductFailure(page);
  await expect(page.getByText("Loading today’s brief…")).toHaveCount(0);

  await expect(
    page.getByText("No Attention is assigned to you."),
  ).toBeVisible();
  await expect(page.getByText("No assigned work is overdue.")).toBeVisible();
  await expect(page.getByText("No work is due today.")).toBeVisible();

  // Organization attention is a real section; current Production may be populated.
  const orgSection = page.getByRole("region", {
    name: "Organization attention",
  });
  await expect(orgSection).toBeVisible();
  await expect(
    orgSection.getByText("Nothing urgent needs organization attention."),
  ).toHaveCount(0);
  await expect(orgSection.getByRole("link").first()).toBeVisible();
}

export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
    };
  });
  expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
}

export async function collectPageHealth(page: Page) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const failedResponses: { url: string; status: number }[] = [];

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      consoleErrors.push(msg.text());
    }
  });
  page.on("pageerror", (err) => {
    pageErrors.push(err.message);
  });
  page.on("response", (response) => {
    const status = response.status();
    if (status >= 500 || status === 401 || status === 403) {
      failedResponses.push({ url: response.url(), status });
    }
  });

  return {
    consoleErrors,
    pageErrors,
    failedResponses,
    assertHealthy() {
      const relevantConsole = consoleErrors.filter(
        (text) =>
          !/extension/i.test(text) &&
          !/favicon/i.test(text) &&
          !/Download the React DevTools/i.test(text),
      );
      expect(pageErrors, `pageerrors: ${pageErrors.join(" | ")}`).toEqual([]);
      expect(
        relevantConsole,
        `console errors: ${relevantConsole.join(" | ")}`,
      ).toEqual([]);
      const relevantFailed = failedResponses.filter(
        (item) => !/favicon/i.test(item.url),
      );
      expect(
        relevantFailed,
        `failed responses: ${JSON.stringify(relevantFailed)}`,
      ).toEqual([]);
    },
  };
}
