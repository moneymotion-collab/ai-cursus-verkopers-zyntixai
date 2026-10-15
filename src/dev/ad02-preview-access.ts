export const COURSE_SELLER_PREVIEW_STATE = "course-seller";

/**
 * Exact Vercel Preview states for the course-seller simulation.
 * This is a closed list: no prefix match and no wildcard.
 * The index links to the screen states. The remaining states are the
 * preview controls those screens render, such as New program.
 */
export const COURSE_SELLER_PREVIEW_STATES = [
  COURSE_SELLER_PREVIEW_STATE,
  "course-seller-empty",
  "course-seller-populated",
  "course-seller-long",
  "course-seller-leads-empty",
  "course-seller-leads",
  "course-seller-leads-long",
  "course-seller-customers-empty",
  "course-seller-customers",
  "course-seller-customers-long",
  "course-seller-customer-form",
  "course-seller-program-empty",
  "course-seller-program-list",
  "course-seller-program-long",
  "course-seller-program-new",
  "course-seller-enrollment-empty",
  "course-seller-enrollment-list",
  "course-seller-enrollment-long",
  "course-seller-enrollment-new",
  "course-seller-progress-empty",
  "course-seller-progress-list",
  "course-seller-progress-long",
  "course-seller-progress-new",
  "course-seller-attention-empty",
  "course-seller-attention",
  "course-seller-attention-detail",
  "course-seller-tasks-empty",
  "course-seller-tasks",
  "course-seller-task-form",
  "course-seller-member-empty",
  "course-seller-member-list",
] as const;

const COURSE_SELLER_PREVIEW_STATE_SET: ReadonlySet<string> = new Set(COURSE_SELLER_PREVIEW_STATES);

export type Ad02PreviewAccess = "allow" | "not-found";

export function courseSellerPreviewHref(state: string, prefix = ""): string {
  return `/ad02-preview?state=${prefix}${state}`;
}

/**
 * Fail-closed gate for /ad02-preview.
 * Local development allows the existing preview states.
 * Vercel Preview allows only the exact course-seller allowlist.
 * Vercel Production and any other production build allow nothing.
 */
export function resolveAd02PreviewAccess(input: {
  nodeEnv: string | undefined;
  vercelEnv: string | undefined;
  state?: string | string[] | undefined;
}): Ad02PreviewAccess {
  if (input.vercelEnv === "production") {
    return "not-found";
  }
  if (input.vercelEnv === "preview") {
    const state = normalizeState(input.state);
    return state !== undefined && COURSE_SELLER_PREVIEW_STATE_SET.has(state) ? "allow" : "not-found";
  }
  if (input.nodeEnv === "production") {
    return "not-found";
  }
  return "allow";
}

function normalizeState(state: string | string[] | undefined): string | undefined {
  if (Array.isArray(state)) {
    return state.length === 1 ? state[0] : undefined;
  }
  return state;
}
