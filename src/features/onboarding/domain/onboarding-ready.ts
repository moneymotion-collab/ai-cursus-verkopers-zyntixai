import { z } from "zod";
import {
  type OnboardingCompletionRunStatus,
} from "@/features/onboarding/domain/onboarding-completion-run";
import {
  invitationResultRowSchema,
  onboardingInvitationResultMessage,
  type OnboardingInvitationEvidenceKind,
  type OnboardingInvitationResultCode,
} from "@/features/onboarding/domain/onboarding-invite-execution";
import {
  operatingModelFromPackKey,
  operatingModelOption,
} from "@/features/onboarding/domain/operating-model";
import type { TeamInviteIntentRole } from "@/features/onboarding/domain/team-invite-intents";

export const READY_OPERATING_MODEL_FALLBACK_LABEL =
  "Configured operating model";

export function readyOperatingModelPresentationLabel(
  packKey: string | null | undefined,
): string {
  if (!packKey) {
    return READY_OPERATING_MODEL_FALLBACK_LABEL;
  }
  const model = operatingModelFromPackKey(packKey);
  return model
    ? operatingModelOption(model).title
    : READY_OPERATING_MODEL_FALLBACK_LABEL;
}

export const completeReadyOnboardingInputSchema = z
  .object({
    organizationId: z.string().uuid(),
  })
  .strict();

const readyListingRpcErrorCodeSchema = z.enum([
  "NOT_AUTHENTICATED",
  "NOT_AUTHORIZED",
  "INVALID_LIFECYCLE",
]);

const readyListingFailureSchema = z
  .object({
    ok: z.literal(false),
    code: readyListingRpcErrorCodeSchema,
  })
  .passthrough();

export const listOnboardingInvitationResultsRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      organization_id: z.string().uuid(),
      results: z.array(invitationResultRowSchema),
    })
    .strict(),
  readyListingFailureSchema,
]);

export const completeOrganizationV2OnboardingRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      idempotent: z.boolean(),
      state: z.literal("completed"),
      organization_id: z.string().uuid(),
      onboarding_setup_ready_at: z.string().min(1),
      onboarding_completed_at: z.string().min(1),
    })
    .strict(),
  z
    .object({
      ok: z.literal(false),
      code: z.enum([
        "NOT_AUTHENTICATED",
        "NOT_AUTHORIZED",
        "ORGANIZATION_NOT_FOUND",
        "WRONG_FLOW_VERSION",
        "SETUP_NOT_READY",
        "NOT_READY",
      ]),
    })
    .passthrough(),
]);

export type OnboardingReadyErrorCode =
  | "NOT_AUTHENTICATED"
  | "NOT_AUTHORIZED"
  | "NOT_READY"
  | "STALE_EVIDENCE"
  | "INVALID_LIFECYCLE"
  | "INVALID_INPUT"
  | "INVALID_RESPONSE"
  | "TRANSPORT_ERROR";

export type ReadyInvitationResult = {
  intentId: string;
  emailNormalized: string;
  targetRole: TeamInviteIntentRole;
  resultCode: OnboardingInvitationResultCode;
  evidenceKind: OnboardingInvitationEvidenceKind;
};

export type OnboardingReadySnapshot = {
  organizationId: string;
  workspaceName: string;
  operatingModelLabel: string;
  runStatus: OnboardingCompletionRunStatus;
  readyForCutoverAt: string | null;
  runCompletedAt: string | null;
  organizationCompletedAt: string | null;
  results: ReadyInvitationResult[];
};

export type OnboardingReadySnapshotResult =
  | { ok: true; snapshot: OnboardingReadySnapshot }
  | { ok: false; code: OnboardingReadyErrorCode; message: string };

export type OnboardingReadyCompletionResult =
  | {
      ok: true;
      organizationId: string;
      idempotent: boolean;
      completedAt: string;
      snapshot: OnboardingReadySnapshot;
    }
  | { ok: false; code: OnboardingReadyErrorCode; message: string };

export const READY_INVITATION_RESULT_KEYS = [
  "intentId",
  "emailNormalized",
  "targetRole",
  "resultCode",
  "evidenceKind",
] as const satisfies ReadonlyArray<keyof ReadyInvitationResult>;

export function toReadyInvitationResult(
  row: z.infer<typeof invitationResultRowSchema>,
): ReadyInvitationResult {
  void row.id;
  void row.organization_id;
  void row.invitation_id;
  void row.attempt_count;
  void row.last_attempt_at;
  void row.idempotency_key;
  void row.created_at;
  void row.updated_at;

  return {
    intentId: row.intent_id,
    emailNormalized: row.email_normalized,
    targetRole: row.target_role,
    resultCode: row.result_code,
    evidenceKind: row.evidence_kind,
  };
}

export function isDatabaseProvenReadyRunStatus(
  status: OnboardingCompletionRunStatus | null,
): boolean {
  return status === "ready_for_cutover";
}

export function shouldEnterReadySurface(
  status: OnboardingCompletionRunStatus | null,
): boolean {
  return isDatabaseProvenReadyRunStatus(status);
}

export function isCoherentCompletedReadySnapshot(
  snapshot: OnboardingReadySnapshot,
): boolean {
  return (
    snapshot.organizationCompletedAt !== null &&
    snapshot.runCompletedAt !== null &&
    snapshot.runStatus === "completed" &&
    snapshot.organizationCompletedAt === snapshot.runCompletedAt
  );
}

export function canOfferExplicitProductEntry(
  snapshot: OnboardingReadySnapshot,
): boolean {
  return isCoherentCompletedReadySnapshot(snapshot);
}

export function canOfferExplicitCompletion(input: {
  runStatus: OnboardingCompletionRunStatus | null;
  organizationCompletedAt: string | null;
  results?: readonly ReadyInvitationResult[];
}): boolean {
  return (
    input.organizationCompletedAt === null &&
    isDatabaseProvenReadyRunStatus(input.runStatus) &&
    !hasStaleInvitationEvidence(input.results ?? [])
  );
}

export function hasStaleInvitationEvidence(
  results: readonly ReadyInvitationResult[],
): boolean {
  return results.some(
    (result) =>
      result.resultCode === "invitation_proof_lost" ||
      result.evidenceKind === "historical_invitation",
  );
}

export function isReadyCompletionBlockedCode(
  code: OnboardingReadyErrorCode,
): boolean {
  return code === "NOT_READY" || code === "STALE_EVIDENCE";
}

export function invitationResultLabel(
  resultCode: OnboardingInvitationResultCode,
): string {
  switch (resultCode) {
    case "not_attempted":
      return "Not started";
    case "success":
      return "Invitation created";
    case "invite_already_pending":
      return "Invitation pending";
    case "already_member":
      return "Already a member";
    case "existing_membership_requires_admin_action":
      return "Needs owner review";
    case "invalid_input":
      return "Cannot invite";
    case "invitation_proof_lost":
      return "No longer current";
    case "forbidden":
      return "Not permitted";
    case "rate_limited":
      return "Temporarily limited";
    case "unexpected":
    case "transport_error":
      return "Needs attention";
  }
}

export function invitationEvidenceLabel(
  evidenceKind: OnboardingInvitationEvidenceKind,
): string {
  switch (evidenceKind) {
    case "created_invitation":
      return "Current invitation record";
    case "pending_invitation":
      return "Current pending invitation";
    case "active_membership":
      return "Active workspace membership";
    case "membership_collision":
      return "Existing membership needs review";
    case "frozen_intent_invalid":
      return "Saved teammate setup is invalid";
    case "historical_invitation":
      return "Previous invitation is no longer current";
    case "rate_limited":
      return "Invitation creation is limited";
    case "none":
      return "No current invitation evidence";
  }
}

export function readyInvitationDetail(
  result: ReadyInvitationResult,
): string {
  return onboardingInvitationResultMessage(result.resultCode);
}

export function onboardingReadyMessage(
  code: OnboardingReadyErrorCode,
): string {
  switch (code) {
    case "NOT_AUTHENTICATED":
    case "NOT_AUTHORIZED":
      return "You no longer have permission to finish this setup.";
    case "NOT_READY":
      return "This workspace is not ready to finish setup yet.";
    case "STALE_EVIDENCE":
      return "Current invitation proof is no longer valid. Review invitations before finishing setup.";
    case "INVALID_LIFECYCLE":
      return "This workspace is not ready to be finished yet.";
    case "INVALID_INPUT":
      return "We could not identify this workspace. Refresh and try again.";
    case "INVALID_RESPONSE":
    case "TRANSPORT_ERROR":
      return "We could not confirm this setup. Please try again.";
  }
}

export function mapReadyListingFailureCode(
  code: string,
): OnboardingReadyErrorCode {
  switch (code) {
    case "NOT_AUTHENTICATED":
      return "NOT_AUTHENTICATED";
    case "NOT_AUTHORIZED":
      return "NOT_AUTHORIZED";
    case "INVALID_LIFECYCLE":
      return "INVALID_LIFECYCLE";
    case "TRANSPORT_ERROR":
      return "TRANSPORT_ERROR";
    case "INVALID_INPUT":
      return "INVALID_INPUT";
    default:
      return "INVALID_RESPONSE";
  }
}

export function mapCompleteRpcFailureCode(
  code: string,
): OnboardingReadyErrorCode {
  switch (code) {
    case "NOT_AUTHENTICATED":
      return "NOT_AUTHENTICATED";
    case "NOT_AUTHORIZED":
    case "ORGANIZATION_NOT_FOUND":
      return "NOT_AUTHORIZED";
    case "WRONG_FLOW_VERSION":
    case "SETUP_NOT_READY":
    case "NOT_READY":
      return "NOT_READY";
    default:
      return "INVALID_RESPONSE";
  }
}

export function completionRefusalCodeForSnapshot(
  snapshot: OnboardingReadySnapshot,
): OnboardingReadyErrorCode | null {
  if (snapshot.organizationCompletedAt) {
    return null;
  }
  if (hasStaleInvitationEvidence(snapshot.results)) {
    return "STALE_EVIDENCE";
  }
  if (!isDatabaseProvenReadyRunStatus(snapshot.runStatus)) {
    return "NOT_READY";
  }
  return null;
}
