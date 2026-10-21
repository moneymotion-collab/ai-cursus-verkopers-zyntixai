import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import {
  deleteTeamInviteIntentRpcSchema,
  listTeamInviteIntentsRpcSchema,
  saveTeamInviteIntentRpcSchema,
  teamInviteIntentMessage,
  toTeamInviteIntent,
  type TeamInviteIntentDeleteResult,
  type TeamInviteIntentListResult,
  type TeamInviteIntentRole,
  type TeamInviteIntentSaveResult,
} from "@/features/onboarding/domain/team-invite-intents";
import type { Database } from "@/types/database";

function transportFailure() {
  return {
    ok: false as const,
    code: "TRANSPORT_ERROR" as const,
    message: teamInviteIntentMessage("TRANSPORT_ERROR"),
  };
}

function invalidResponseFailure() {
  return {
    ok: false as const,
    code: "INVALID_RESPONSE" as const,
    message: teamInviteIntentMessage("INVALID_RESPONSE"),
  };
}

export async function listOrganizationTeamInviteIntents(
  supabase: SupabaseClient<Database>,
  organizationId: string,
): Promise<TeamInviteIntentListResult> {
  try {
    const { data, error } = await supabase.rpc(
      "list_organization_onboarding_team_invite_intents",
      { p_organization_id: organizationId },
    );
    if (error) {
      return transportFailure();
    }

    const parsed = listTeamInviteIntentsRpcSchema.safeParse(data);
    if (!parsed.success) {
      return invalidResponseFailure();
    }
    if (!parsed.data.ok) {
      return {
        ok: false,
        code: parsed.data.code,
        message: teamInviteIntentMessage(parsed.data.code),
      };
    }

    return {
      ok: true,
      intents: parsed.data.intents.map(toTeamInviteIntent),
    };
  } catch {
    return transportFailure();
  }
}

export async function createOrganizationTeamInviteIntent(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    email: string;
    role: TeamInviteIntentRole;
  },
): Promise<TeamInviteIntentSaveResult> {
  try {
    const { data, error } = await supabase.rpc(
      "create_organization_onboarding_team_invite_intent",
      {
        p_organization_id: input.organizationId,
        p_email: input.email,
        p_role: input.role,
      },
    );
    return mapSaveResult(data, error);
  } catch {
    return transportFailure();
  }
}

export async function updateOrganizationTeamInviteIntent(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    intentId: string;
    expectedRevision: number;
    email: string;
    role: TeamInviteIntentRole;
  },
): Promise<TeamInviteIntentSaveResult> {
  try {
    const { data, error } = await supabase.rpc(
      "update_organization_onboarding_team_invite_intent",
      {
        p_organization_id: input.organizationId,
        p_intent_id: input.intentId,
        p_expected_revision: input.expectedRevision,
        p_email: input.email,
        p_role: input.role,
      },
    );
    return mapSaveResult(data, error);
  } catch {
    return transportFailure();
  }
}

export async function deleteOrganizationTeamInviteIntent(
  supabase: SupabaseClient<Database>,
  input: {
    organizationId: string;
    intentId: string;
    expectedRevision: number;
  },
): Promise<TeamInviteIntentDeleteResult> {
  try {
    const { data, error } = await supabase.rpc(
      "delete_organization_onboarding_team_invite_intent",
      {
        p_organization_id: input.organizationId,
        p_intent_id: input.intentId,
        p_expected_revision: input.expectedRevision,
      },
    );
    if (error) {
      return transportFailure();
    }

    const parsed = deleteTeamInviteIntentRpcSchema.safeParse(data);
    if (!parsed.success) {
      return invalidResponseFailure();
    }
    if (!parsed.data.ok) {
      return {
        ok: false,
        code: parsed.data.code,
        message: teamInviteIntentMessage(parsed.data.code),
      };
    }

    return {
      ok: true,
      intentId: parsed.data.intent_id,
      deletedRevision: parsed.data.deleted_revision,
    };
  } catch {
    return transportFailure();
  }
}

function mapSaveResult(
  data: unknown,
  error: { message: string } | null,
): TeamInviteIntentSaveResult {
  if (error) {
    return transportFailure();
  }

  const parsed = saveTeamInviteIntentRpcSchema.safeParse(data);
  if (!parsed.success) {
    return invalidResponseFailure();
  }
  if (!parsed.data.ok) {
    return {
      ok: false,
      code: parsed.data.code,
      message: teamInviteIntentMessage(parsed.data.code),
    };
  }

  return {
    ok: true,
    intent: toTeamInviteIntent(parsed.data.intent),
  };
}
