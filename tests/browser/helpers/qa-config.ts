/**
 * Shared browser QA constants for Production read-only smoke.
 * No secrets. Auth state path is gitignored.
 */

import path from "node:path";

export const BROWSER_QA_AUTH_STATE_PATH = path.join(
  process.cwd(),
  "playwright",
  ".auth",
  "production-owner.json",
);

export const BROWSER_QA_DEFAULT_BASE_URL = "https://www.zyntixai.com";

/** Control org used for Course Sellers / Social dogfood Production QA. */
export const BROWSER_QA_CONTROL_ORG_ID =
  "2fc07699-ece5-44b9-bbb3-abbc23e9fffb";

export function browserQaBaseUrl(): string {
  return process.env.BROWSER_QA_BASE_URL?.trim() || BROWSER_QA_DEFAULT_BASE_URL;
}

export function browserQaOrgId(): string {
  return process.env.BROWSER_QA_ORG_ID?.trim() || BROWSER_QA_CONTROL_ORG_ID;
}

export function dailyOperatingHomePath(organizationId = browserQaOrgId()): string {
  return `/home?org=${encodeURIComponent(organizationId)}`;
}
