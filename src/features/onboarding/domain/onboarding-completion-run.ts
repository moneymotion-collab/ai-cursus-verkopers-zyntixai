import { z } from "zod";

export const ONBOARDING_COMPLETION_RUN_STATUSES = [
  "setup_ready",
  "inviting",
  "invite_partial",
  "ready_for_cutover",
  "completed",
] as const;

export type OnboardingCompletionRunStatus =
  (typeof ONBOARDING_COMPLETION_RUN_STATUSES)[number];

export type OnboardingCompletionRun = {
  organizationId: string;
  status: OnboardingCompletionRunStatus;
  startedAt: string;
  readyForCutoverAt: string | null;
  completedAt: string | null;
};

const completionRunRpcErrorCodeSchema = z.enum([
  "NOT_AUTHENTICATED",
  "NOT_AUTHORIZED",
  "INVALID_LIFECYCLE",
]);

const completionRunFailureSchema = z
  .object({
    ok: z.literal(false),
    code: completionRunRpcErrorCodeSchema,
  })
  .passthrough();

// `last_error_code` is accepted so a governed payload still parses, but it is
// never projected into the application type: it is internal diagnostic detail.
export const ensureCompletionRunRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      organization_id: z.string().uuid(),
      status: z.enum(ONBOARDING_COMPLETION_RUN_STATUSES),
      started_at: z.string().min(1),
      ready_for_cutover_at: z.string().min(1).nullable(),
      completed_at: z.string().min(1).nullable(),
      last_error_code: z.string().nullable(),
    })
    .strict(),
  completionRunFailureSchema,
]);

export const ensureCompletionRunInputSchema = z
  .object({
    organizationId: z.string().uuid(),
  })
  .strict();

export type OnboardingCompletionRunErrorCode =
  | z.infer<typeof completionRunRpcErrorCodeSchema>
  | "INVALID_INPUT"
  | "TRANSPORT_ERROR"
  | "INVALID_RESPONSE";

export type OnboardingCompletionRunFailure = {
  ok: false;
  code: OnboardingCompletionRunErrorCode;
  message: string;
};

export type OnboardingCompletionRunResult =
  | {
      ok: true;
      run: OnboardingCompletionRun;
    }
  | OnboardingCompletionRunFailure;

export function toOnboardingCompletionRun(
  value: Extract<
    z.infer<typeof ensureCompletionRunRpcSchema>,
    { ok: true }
  >,
): OnboardingCompletionRun {
  return {
    organizationId: value.organization_id,
    status: value.status,
    startedAt: value.started_at,
    readyForCutoverAt: value.ready_for_cutover_at,
    completedAt: value.completed_at,
  };
}

export function onboardingCompletionRunMessage(
  code: OnboardingCompletionRunErrorCode,
): string {
  switch (code) {
    case "NOT_AUTHENTICATED":
    case "NOT_AUTHORIZED":
      return "You no longer have permission to finish this setup.";
    case "INVALID_LIFECYCLE":
      return "This workspace is not ready to be finished yet.";
    case "INVALID_INPUT":
      return "We could not identify this workspace. Refresh and try again.";
    case "INVALID_RESPONSE":
    case "TRANSPORT_ERROR":
      return "We could not confirm your setup. Please try again.";
  }
}
