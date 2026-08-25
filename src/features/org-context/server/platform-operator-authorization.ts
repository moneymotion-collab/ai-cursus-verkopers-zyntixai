import "server-only";

import {
  orgContextFail,
  orgContextOk,
  type OrgContextResult,
} from "@/features/org-context/domain/errors";
import { resolveOrgContextPlatformOperatorAccess } from "@/features/org-context/domain/operator-identity";
import type { OrgContextPlatformOperator } from "@/features/org-context/domain/types";

type AuthenticatedIdentity = {
  id: string;
  email?: string | null;
};

type AuthUserLookup = {
  auth: {
    getUser: () => Promise<{
      data: { user: AuthenticatedIdentity | null };
    }>;
  };
};

function userEmail(user: AuthenticatedIdentity): string | null {
  const email = user.email?.trim();
  return email ? email : null;
}

/**
 * Explicit authenticated platform-operator gate.
 * Privileged database access is not sufficient by itself.
 */
export async function resolveOrgContextPlatformOperator(
  authClient: AuthUserLookup,
  env: Record<string, string | undefined> = process.env,
): Promise<OrgContextResult<OrgContextPlatformOperator>> {
  const {
    data: { user },
  } = await authClient.auth.getUser();
  if (!user) {
    return orgContextFail(
      "UNAUTHORIZED",
      "Authenticated platform operator identity is required",
    );
  }

  const access = resolveOrgContextPlatformOperatorAccess({
    email: userEmail(user),
    env,
  });
  if (!access.ok) {
    return orgContextFail(
      "UNAUTHORIZED",
      "Caller is not a recognized ORG-CONTEXT platform operator",
      { reason: access.reason },
    );
  }

  return orgContextOk({
    actorUserId: user.id,
    email: access.email,
  });
}
