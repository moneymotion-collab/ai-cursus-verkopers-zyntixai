import { z } from "zod";
import {
  ONBOARDING_COMPLETION_RUN_STATUSES,
  type OnboardingCompletionRunStatus,
} from "@/features/onboarding/domain/onboarding-completion-run";
import {
  TEAM_INVITE_INTENT_ROLES,
  teamInviteIntentSchema,
  toTeamInviteIntent,
  type TeamInviteIntent,
  type TeamInviteIntentRole,
} from "@/features/onboarding/domain/team-invite-intents";

export const ONBOARDING_INVITATION_RESULT_CODES = [
  "not_attempted",
  "success",
  "invite_already_pending",
  "already_member",
  "existing_membership_requires_admin_action",
  "invalid_input",
  "invitation_proof_lost",
  "forbidden",
  "rate_limited",
  "unexpected",
  "transport_error",
] as const;

export type OnboardingInvitationResultCode =
  (typeof ONBOARDING_INVITATION_RESULT_CODES)[number];

export const ONBOARDING_INVITATION_EVIDENCE_KINDS = [
  "created_invitation",
  "pending_invitation",
  "active_membership",
  "membership_collision",
  "frozen_intent_invalid",
  "historical_invitation",
  "rate_limited",
  "none",
] as const;

export type OnboardingInvitationEvidenceKind =
  (typeof ONBOARDING_INVITATION_EVIDENCE_KINDS)[number];

export const TERMINAL_INVITATION_RESULT_CODES = [
  "success",
  "invite_already_pending",
  "already_member",
  "existing_membership_requires_admin_action",
  "invalid_input",
] as const;

export const MATERIAL_SEQUENCE_STOP_INVITATION_RESULT_CODES = [
  "invitation_proof_lost",
  "forbidden",
  "rate_limited",
  "unexpected",
  "transport_error",
] as const;

const RETRYABLE_INVITATION_RESULT_CODES = [
  "not_attempted",
  ...MATERIAL_SEQUENCE_STOP_INVITATION_RESULT_CODES,
] as const;

export type OnboardingInviteExecutionErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "INVALID_LIFECYCLE"
  | "INTENT_NOT_FOUND"
  | "INVALID_INPUT"
  | "TRANSPORT_ERROR"
  | "INVALID_RESPONSE";

export type OnboardingInviteIntentOutcome = {
  intentId: string;
  emailNormalized: string;
  targetRole: TeamInviteIntentRole;
  resultCode: OnboardingInvitationResultCode;
  evidenceKind: OnboardingInvitationEvidenceKind;
  runStatus: OnboardingCompletionRunStatus;
};

export type OnboardingInviteExecutionSuccess = {
  ok: true;
  outcome: OnboardingInviteIntentOutcome;
};

export type OnboardingInviteExecutionFailure = {
  ok: false;
  code: OnboardingInviteExecutionErrorCode;
  message: string;
};

export type OnboardingInviteExecutionResult =
  | OnboardingInviteExecutionSuccess
  | OnboardingInviteExecutionFailure;

export type OnboardingFrozenIntentListResult =
  | {
      ok: true;
      intents: TeamInviteIntent[];
    }
  | OnboardingInviteExecutionFailure;

export type OnboardingCreatingSnapshot =
  | {
      ok: true;
      intents: TeamInviteIntent[];
      outcomes: OnboardingInviteIntentOutcome[];
      runStatus: OnboardingCompletionRunStatus | null;
    }
  | OnboardingInviteExecutionFailure;

export const listFrozenTeamInviteIntentsInputSchema = z
  .object({
    organizationId: z.string().uuid(),
  })
  .strict();

export const executeOnboardingInviteIntentInputSchema = z
  .object({
    organizationId: z.string().uuid(),
    intentId: z.string().uuid(),
  })
  .strict();

export const reconcileOnboardingInviteIntentInputSchema =
  executeOnboardingInviteIntentInputSchema;

const inviteExecutionRpcErrorCodeSchema = z.enum([
  "NOT_AUTHENTICATED",
  "NOT_AUTHORIZED",
  "INVALID_LIFECYCLE",
  "INTENT_NOT_FOUND",
]);

const inviteExecutionFailureSchema = z
  .object({
    ok: z.literal(false),
    code: inviteExecutionRpcErrorCodeSchema,
  })
  .passthrough();

export const listFrozenTeamInviteIntentsRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      organization_id: z.string().uuid(),
      intents: z.array(teamInviteIntentSchema),
    })
    .strict(),
  inviteExecutionFailureSchema,
]);

export const invitationResultRowSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    intent_id: z.string().uuid(),
    email_normalized: z.string().min(1),
    target_role: z.enum(TEAM_INVITE_INTENT_ROLES),
    invitation_id: z.string().uuid().nullable(),
    result_code: z.enum(ONBOARDING_INVITATION_RESULT_CODES),
    evidence_kind: z.enum(ONBOARDING_INVITATION_EVIDENCE_KINDS),
    attempt_count: z.number().int().nonnegative(),
    last_attempt_at: z.string().min(1).nullable(),
    idempotency_key: z.string().min(1),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
  })
  .strict();

export const executeOnboardingInviteIntentRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      fresh_create: z.boolean(),
      expires_at: z.string().min(1).nullable().optional(),
      raw_token: z.string().nullable().optional(),
      result: invitationResultRowSchema,
      run_status: z.enum(ONBOARDING_COMPLETION_RUN_STATUSES),
    })
    .strict(),
  inviteExecutionFailureSchema,
]);

export const reconcileOnboardingInviteIntentRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      result: invitationResultRowSchema,
      run_status: z.enum(ONBOARDING_COMPLETION_RUN_STATUSES),
    })
    .strict(),
  inviteExecutionFailureSchema,
]);

export function toOnboardingInviteIntentOutcome(value: {
  result: z.infer<typeof invitationResultRowSchema>;
  run_status: OnboardingCompletionRunStatus;
}): OnboardingInviteIntentOutcome {
  return {
    intentId: value.result.intent_id,
    emailNormalized: value.result.email_normalized,
    targetRole: value.result.target_role,
    resultCode: value.result.result_code,
    evidenceKind: value.result.evidence_kind,
    runStatus: value.run_status,
  };
}

export function isRetryableInvitationResultCode(
  code: OnboardingInvitationResultCode,
): boolean {
  return (RETRYABLE_INVITATION_RESULT_CODES as readonly string[]).includes(code);
}

export function isTerminalInvitationResultCode(
  code: OnboardingInvitationResultCode,
): boolean {
  return (TERMINAL_INVITATION_RESULT_CODES as readonly string[]).includes(code);
}

export function isMaterialSequenceStopInvitationResultCode(
  code: OnboardingInvitationResultCode,
): boolean {
  return (
    MATERIAL_SEQUENCE_STOP_INVITATION_RESULT_CODES as readonly string[]
  ).includes(code);
}

export function nextExecutableIntentId(
  intents: TeamInviteIntent[],
  outcomesByIntentId: ReadonlyMap<string, OnboardingInvitationResultCode>,
  stopped: boolean,
): string | null {
  if (stopped) {
    return null;
  }

  for (const intent of intents) {
    const resultCode = outcomesByIntentId.get(intent.id);
    if (!resultCode || !isTerminalInvitationResultCode(resultCode)) {
      return intent.id;
    }
  }

  return null;
}

export function resolvedOutcomeCount(
  outcomes: Iterable<OnboardingInvitationResultCode>,
): number {
  let count = 0;
  for (const code of outcomes) {
    if (code !== "not_attempted") {
      count += 1;
    }
  }
  return count;
}

export function creatingRunStatusMessage(
  status: OnboardingCompletionRunStatus | null,
): string {
  switch (status) {
    case "setup_ready":
      return "Invitations have not been created yet.";
    case "inviting":
      return "Invitations are being created.";
    case "invite_partial":
      return "Some invitations still need attention.";
    case "ready_for_cutover":
      return "Invitation setup is finished for now. The next setup step is not available yet.";
    case "completed":
      return "Invitation setup is finished for now. The next setup step is not available yet.";
    case null:
      return "Invitations have not been created yet.";
  }
}

export function onboardingInvitationResultMessage(
  code: OnboardingInvitationResultCode,
): string {
  switch (code) {
    case "not_attempted":
      return "This teammate has not been invited yet.";
    case "success":
      return "An invitation was created for this teammate.";
    case "invite_already_pending":
      return "An invitation is already pending for this teammate.";
    case "already_member":
      return "This person is already a member of the workspace.";
    case "existing_membership_requires_admin_action":
      return "This person has an existing membership that needs an owner to review.";
    case "invalid_input":
      return "This teammate setup cannot be invited as saved.";
    case "invitation_proof_lost":
      return "The previous invitation is no longer current. You can try again.";
    case "forbidden":
      return "You no longer have permission to invite this teammate.";
    case "rate_limited":
      return "Invitation creation is temporarily limited. Try again shortly.";
    case "unexpected":
      return "We could not complete this invitation. Try again.";
    case "transport_error":
      return "We could not reach the invitation service. Try again.";
  }
}

export function onboardingInviteExecutionMessage(
  code: OnboardingInviteExecutionErrorCode,
): string {
  switch (code) {
    case "NOT_AUTHENTICATED":
    case "NOT_AUTHORIZED":
      return "You no longer have permission to create these invitations.";
    case "INVALID_LIFECYCLE":
      return "This workspace is not ready to create invitations yet.";
    case "INTENT_NOT_FOUND":
      return "This teammate is not part of the current invitation setup.";
    case "INVALID_INPUT":
      return "We could not identify this invitation setup. Refresh and try again.";
    case "INVALID_RESPONSE":
    case "TRANSPORT_ERROR":
      return "We could not confirm this invitation. Please try again.";
  }
}

export function toFrozenTeamInviteIntents(
  value: Extract<
    z.infer<typeof listFrozenTeamInviteIntentsRpcSchema>,
    { ok: true }
  >,
): TeamInviteIntent[] {
  return value.intents.map(toTeamInviteIntent);
}

export const ONBOARDING_INVITE_EXECUTION_OUTCOME_KEYS = [
  "intentId",
  "emailNormalized",
  "targetRole",
  "resultCode",
  "evidenceKind",
  "runStatus",
] as const satisfies ReadonlyArray<keyof OnboardingInviteIntentOutcome>;
