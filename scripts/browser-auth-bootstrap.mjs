/**
 * One-time interactive Owner login bootstrap for Production browser QA.
 *
 * - Does NOT accept passwords via CLI args.
 * - Saves Playwright storageState to a gitignored path.
 * - Owner completes login in the opened browser window.
 *
 * Usage:
 *   npm run browser:auth:bootstrap
 */

import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const baseURL =
  process.env.BROWSER_QA_BASE_URL?.trim() || "https://www.zyntixai.com";
const orgId =
  process.env.BROWSER_QA_ORG_ID?.trim() ||
  "2fc07699-ece5-44b9-bbb3-abbc23e9fffb";
const homePath = `/home?org=${encodeURIComponent(orgId)}`;
const authPath = path.join(
  root,
  "playwright",
  ".auth",
  "production-owner.json",
);

async function main() {
  mkdirSync(path.dirname(authPath), { recursive: true });

  console.log("");
  console.log("B1-C1-R1 authenticated browser session bootstrap");
  console.log("================================================");
  console.log(`Base URL: ${baseURL}`);
  console.log(`Target:   ${homePath}`);
  console.log(`Auth out: playwright/.auth/production-owner.json (gitignored)`);
  console.log("");
  console.log("Owner steps (do not paste credentials into Cursor chat):");
  console.log("1. A Chromium window will open to the Production login page.");
  console.log("2. Sign in with the legitimate Owner account in that window.");
  console.log("3. Wait until the Daily Operating /home page is visible.");
  console.log("4. Return here; the script saves local auth state and exits.");
  console.log("");

  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.goto(`/login?next=${encodeURIComponent(homePath)}`, {
    waitUntil: "domcontentloaded",
  });

  await page.waitForURL(
    (url) =>
      url.pathname === "/home" && url.searchParams.get("org") === orgId,
    { timeout: 10 * 60 * 1000 },
  );

  await page.getByRole("heading", { level: 1, name: "Today" }).waitFor({
    state: "visible",
    timeout: 60_000,
  });

  await context.storageState({ path: authPath });
  await browser.close();

  console.log("Auth storage state saved locally (not committed).");
  console.log("Next: npm run test:browser:b1-c1");
}

main().catch((error) => {
  console.error(
    "Bootstrap failed:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
