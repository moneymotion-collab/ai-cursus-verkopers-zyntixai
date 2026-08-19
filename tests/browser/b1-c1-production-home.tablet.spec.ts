import { existsSync } from "node:fs";
import { test } from "@playwright/test";
import { BROWSER_QA_AUTH_STATE_PATH } from "./helpers/qa-config";
import {
  expectDailyOperatingShell,
  expectNaturalEmptyOperatingState,
  expectNoHorizontalOverflow,
  openDailyOperatingHome,
} from "./helpers/daily-operating";

const authReady = existsSync(BROWSER_QA_AUTH_STATE_PATH);

test.describe("B1-C1 Production daily operating — tablet", () => {
  test.skip(
    !authReady,
    "OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP (run npm run browser:auth:bootstrap)",
  );

  test("intermediate viewport keeps composition readable", async ({ page }) => {
    await openDailyOperatingHome(page);
    await expectDailyOperatingShell(page);
    await expectNaturalEmptyOperatingState(page);
    await expectNoHorizontalOverflow(page);
  });
});
