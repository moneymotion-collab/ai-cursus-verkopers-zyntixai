import { z } from "zod";

export const TEAM_INVITE_INTENT_ROLES = ["admin", "staff", "viewer"] as const;

export type TeamInviteIntentRole = (typeof TEAM_INVITE_INTENT_ROLES)[number];

export type TeamInviteIntent = {
  id: string;
  organizationId: string;
  emailNormalized: string;
  role: TeamInviteIntentRole;
  revision: number;
  createdAt: string;
  updatedAt: string;
};

export const teamInviteIntentSchema = z
  .object({
    id: z.string().uuid(),
    organization_id: z.string().uuid(),
    email_normalized: z.string().email().min(3).max(254),
    role: z.enum(TEAM_INVITE_INTENT_ROLES),
    revision: z.number().int().positive(),
    created_at: z.string().min(1),
    updated_at: z.string().min(1),
  })
  .strict();

const rpcErrorCodeSchema = z.enum([
  "NOT_AUTHENTICATED",
  "NOT_AUTHORIZED",
  "INVALID_LIFECYCLE",
  "INVALID_EMAIL",
  "INVALID_ROLE",
  "SELF_INVITE",
  "EXISTING_MEMBER",
  "PENDING_INVITATION",
  "DUPLICATE_INTENT",
  "STALE_REVISION",
  "NOT_FOUND",
]);

const rpcFailureSchema = z
  .object({
    ok: z.literal(false),
    code: rpcErrorCodeSchema,
    current_revision: z.number().int().positive().optional(),
  })
  .passthrough();

export const listTeamInviteIntentsRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      organization_id: z.string().uuid(),
      intents: z.array(teamInviteIntentSchema),
    })
    .strict(),
  rpcFailureSchema,
]);

export const saveTeamInviteIntentRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      intent: teamInviteIntentSchema,
    })
    .strict(),
  rpcFailureSchema,
]);

export const deleteTeamInviteIntentRpcSchema = z.union([
  z
    .object({
      ok: z.literal(true),
      code: z.literal("OK"),
      intent_id: z.string().uuid(),
      deleted_revision: z.number().int().positive(),
    })
    .strict(),
  rpcFailureSchema,
]);

export const createTeamInviteIntentInputSchema = z
  .object({
    organizationId: z.string().uuid(),
    email: z.string().trim().toLowerCase().email().min(3).max(254),
    role: z.enum(TEAM_INVITE_INTENT_ROLES),
  })
  .strict();

export const updateTeamInviteIntentInputSchema =
  createTeamInviteIntentInputSchema.extend({
    intentId: z.string().uuid(),
    expectedRevision: z.number().int().positive(),
  });

export const deleteTeamInviteIntentInputSchema = z
  .object({
    organizationId: z.string().uuid(),
    intentId: z.string().uuid(),
    expectedRevision: z.number().int().positive(),
  })
  .strict();

export const listTeamInviteIntentsInputSchema = z
  .object({
    organizationId: z.string().uuid(),
  })
  .strict();

export type TeamInviteIntentErrorCode =
  | z.infer<typeof rpcErrorCodeSchema>
  | "INVALID_INPUT"
  | "TRANSPORT_ERROR"
  | "INVALID_RESPONSE";

export type TeamInviteIntentFailure = {
  ok: false;
  code: TeamInviteIntentErrorCode;
  message: string;
  fieldErrors?: {
    email?: string;
    role?: string;
  };
};

export type TeamInviteIntentListResult =
  | {
      ok: true;
      intents: TeamInviteIntent[];
    }
  | TeamInviteIntentFailure;

export type TeamInviteIntentSaveResult =
  | {
      ok: true;
      intent: TeamInviteIntent;
    }
  | TeamInviteIntentFailure;

export type TeamInviteIntentDeleteResult =
  | {
      ok: true;
      intentId: string;
      deletedRevision: number;
    }
  | TeamInviteIntentFailure;

export function toTeamInviteIntent(
  value: z.infer<typeof teamInviteIntentSchema>,
): TeamInviteIntent {
  return {
    id: value.id,
    organizationId: value.organization_id,
    emailNormalized: value.email_normalized,
    role: value.role,
    revision: value.revision,
    createdAt: value.created_at,
    updatedAt: value.updated_at,
  };
}

export function teamInviteIntentMessage(
  code: TeamInviteIntentErrorCode,
): string {
  switch (code) {
    case "INVALID_EMAIL":
      return "Enter a valid email address.";
    case "INVALID_ROLE":
      return "Choose Admin, Staff, or Viewer.";
    case "SELF_INVITE":
      return "The workspace Owner is already included.";
    case "EXISTING_MEMBER":
      return "This person is already part of the workspace.";
    case "PENDING_INVITATION":
      return "An invitation for this person already exists.";
    case "DUPLICATE_INTENT":
      return "This teammate is already included in your team setup.";
    case "STALE_REVISION":
      return "This teammate was updated elsewhere. Review the latest details before saving again.";
    case "NOT_FOUND":
      return "This teammate is no longer in the current team setup.";
    case "NOT_AUTHENTICATED":
    case "NOT_AUTHORIZED":
      return "You no longer have permission to update this team setup.";
    case "INVALID_LIFECYCLE":
      return "Team setup is no longer available at this stage.";
    case "INVALID_INPUT":
      return "Check the teammate details and try again.";
    case "INVALID_RESPONSE":
    case "TRANSPORT_ERROR":
      return "We could not confirm the latest team setup. Please try again.";
  }
}

export function isValidTeamInviteIntentEmail(value: string): boolean {
  return z.string().trim().email().min(3).max(254).safeParse(value).success;
}
