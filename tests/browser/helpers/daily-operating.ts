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
  await expect(page.getByRole("heading", { level: 1, name: "Today" })).toBeVisible({
    timeout: 30_000,
  });
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
 * Current natural Production control-org empty semantics.
 * Distinguishes honest empty from fatal error / infinite loading.
 */
export async function expectNaturalEmptyOperatingState(page: Page) {
  await expect(page.getByText("Unable to load today’s brief")).toHaveCount(0);
  await expect(page.getByRole("alert")).toHaveCount(0);
  await expect(page.getByText("Loading today’s brief…")).toHaveCount(0);

  // Section empty copy (stable semantics)
  await expect(
    page.getByText("No Attention is assigned to you."),
  ).toBeVisible();
  await expect(
    page.getByText("No assigned work is overdue."),
  ).toBeVisible();
  await expect(page.getByText("No work is due today.")).toBeVisible();

  // Calm banner when nothing actionable
  await expect(page.getByText("You are clear for now.")).toBeVisible();
  await expect(
    page.getByText(
      "Nothing urgent needs your attention and no assigned work is due today.",
    ),
  ).toBeVisible();
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
