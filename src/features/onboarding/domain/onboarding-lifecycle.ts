import { TEAM_SIZE_BANDS } from "@/features/onboarding/domain/onboarding-options";
import type { PersistedOnboardingFlowVersion } from "@/features/onboarding/domain/onboarding-flow-version";

export const V2_ONBOARDING_CONTEXT_PACKS = [
  "niche.online-course-business",
  "foundation.knowledge",
  "foundation.service",
  "foundation.field-operations",
  "foundation.product-operations",
] as const;

export type V2OnboardingContextPack =
  (typeof V2_ONBOARDING_CONTEXT_PACKS)[number];

export type V2CoreField = "displayName" | "organizationName" | "teamSizeBand";

export type OnboardingContextState =
  | { kind: "not_required" }
  | { kind: "not_configured" }
  | { kind: "configured"; packKey: string }
  | { kind: "unavailable" };

export type OnboardingLifecycleState =
  | {
      kind: "grandfathered";
      logicalStage: "completed";
    }
  | {
      kind: "legacy";
      logicalStage: "legacy";
      completed: boolean;
    }
  | {
      kind: "v2_owner_required";
      logicalStage: "owner_required";
    }
  | {
      kind: "v2_core_incomplete";
      logicalStage: "you_and_company";
      missingCoreFields: V2CoreField[];
    }
  | {
      kind: "v2_context_required";
      logicalStage: "operating_model";
    }
  | {
      kind: "v2_configured";
      logicalStage: "workspace";
      packKey: V2OnboardingContextPack;
      setupReadyEligible: true;
    }
  | {
      kind: "v2_ready";
      logicalStage: "ready";
      setupReadyAt: string;
    }
  | {
      kind: "v2_completed";
      logicalStage: "completed";
      setupReadyAt: string;
      completedAt: string;
    }
  | {
      kind: "invalid";
      logicalStage: "blocked";
      reason:
        | "invalid_flow_version"
        | "impossible_timestamps"
        | "unsupported_context"
        | "context_unavailable";
    };

export type OnboardingAvailableRoute =
  | "home"
  | "onboarding"
  | "operating_model";

export type OnboardingStageRoute =
  | "home"
  | "onboarding"
  | "operating_model"
  | "workspace"
  | "creating";

export type OnboardingLifecycleDestination = {
  logicalStage: OnboardingLifecycleState["logicalStage"];
  availableRoute: OnboardingAvailableRoute;
  stageRoute: OnboardingStageRoute;
  productAccessAllowed: boolean;
};

export type V2OnboardingTransitionErrorCode =
  | "unauthorized"
  | "invalid_flow"
  | "invalid_state"
  | "core_data_incomplete"
  | "context_not_configured"
  | "unsupported_context"
  | "retryable_error";

export type V2OnboardingTransitionResult =
  | {
      ok: true;
      organizationId: string;
      idempotent: boolean;
      recovered: boolean;
      state: Extract<
        OnboardingLifecycleState,
        { kind: "v2_ready" | "v2_completed" }
      >;
    }
  | {
      ok: false;
      code: V2OnboardingTransitionErrorCode;
      message: string;
    };

const V2_TRANSITION_MESSAGES: Record<
  V2OnboardingTransitionErrorCode,
  string
> = {
  unauthorized: "You do not have permission to update this setup.",
  invalid_flow: "This organization does not use the current setup flow.",
  invalid_state: "This setup cannot make that transition yet.",
  core_data_incomplete: "Complete your name, company name, and team size first.",
  context_not_configured: "Choose an operating model before continuing.",
  unsupported_context: "This workspace configuration needs review.",
  retryable_error: "We could not confirm the setup change. Refresh and try again.",
};

export function v2OnboardingTransitionMessage(
  code: V2OnboardingTransitionErrorCode,
): string {
  return V2_TRANSITION_MESSAGES[code];
}

export function isV2OnboardingContextPack(
  value: string,
): value is V2OnboardingContextPack {
  return (V2_ONBOARDING_CONTEXT_PACKS as readonly string[]).includes(value);
}

export function resolveV2MissingCoreFields(input: {
  displayName: string | null;
  organizationName: string | null;
  teamSizeBand: string | null;
}): V2CoreField[] {
  const missing: V2CoreField[] = [];
  if (!input.displayName?.trim()) {
    missing.push("displayName");
  }
  if (!input.organizationName?.trim()) {
    missing.push("organizationName");
  }
  if (
    !input.teamSizeBand ||
    !(TEAM_SIZE_BANDS as readonly string[]).includes(input.teamSizeBand)
  ) {
    missing.push("teamSizeBand");
  }
  return missing;
}

export function resolveOnboardingLifecycle(input: {
  flowVersion: PersistedOnboardingFlowVersion | number;
  setupReadyAt: string | null;
  completedAt: string | null;
  membershipRole: string;
  coreData?: {
    displayName: string | null;
    organizationName: string | null;
    teamSizeBand: string | null;
  };
  context: OnboardingContextState;
}): OnboardingLifecycleState {
  if (input.flowVersion === null) {
    if (input.setupReadyAt) {
      return {
        kind: "invalid",
        logicalStage: "blocked",
        reason: "impossible_timestamps",
      };
    }
    return { kind: "grandfathered", logicalStage: "completed" };
  }

  if (input.flowVersion === 1) {
    if (input.setupReadyAt) {
      return {
        kind: "invalid",
        logicalStage: "blocked",
        reason: "impossible_timestamps",
      };
    }
    return {
      kind: "legacy",
      logicalStage: "legacy",
      completed: Boolean(input.completedAt),
    };
  }

  if (input.flowVersion !== 2) {
    return {
      kind: "invalid",
      logicalStage: "blocked",
      reason: "invalid_flow_version",
    };
  }

  if (input.completedAt && !input.setupReadyAt) {
    return {
      kind: "invalid",
      logicalStage: "blocked",
      reason: "impossible_timestamps",
    };
  }
  if (input.completedAt && input.setupReadyAt) {
    return {
      kind: "v2_completed",
      logicalStage: "completed",
      setupReadyAt: input.setupReadyAt,
      completedAt: input.completedAt,
    };
  }
  if (input.setupReadyAt) {
    return {
      kind: "v2_ready",
      logicalStage: "ready",
      setupReadyAt: input.setupReadyAt,
    };
  }

  if (input.membershipRole !== "owner") {
    return { kind: "v2_owner_required", logicalStage: "owner_required" };
  }

  if (!input.coreData) {
    return {
      kind: "invalid",
      logicalStage: "blocked",
      reason: "context_unavailable",
    };
  }

  const missingCoreFields = resolveV2MissingCoreFields(input.coreData);
  if (missingCoreFields.length > 0) {
    return {
      kind: "v2_core_incomplete",
      logicalStage: "you_and_company",
      missingCoreFields,
    };
  }

  if (input.context.kind === "not_configured") {
    return {
      kind: "v2_context_required",
      logicalStage: "operating_model",
    };
  }
  if (input.context.kind === "unavailable") {
    return {
      kind: "invalid",
      logicalStage: "blocked",
      reason: "context_unavailable",
    };
  }
  if (input.context.kind !== "configured") {
    return {
      kind: "invalid",
      logicalStage: "blocked",
      reason: "context_unavailable",
    };
  }
  if (!isV2OnboardingContextPack(input.context.packKey)) {
    return {
      kind: "invalid",
      logicalStage: "blocked",
      reason: "unsupported_context",
    };
  }

  return {
    kind: "v2_configured",
    logicalStage: "workspace",
    packKey: input.context.packKey,
    setupReadyEligible: true,
  };
}

export function resolveOnboardingLifecycleDestination(
  state: OnboardingLifecycleState,
  membershipRole: string,
): OnboardingLifecycleDestination {
  if (
    state.kind === "grandfathered" ||
    state.kind === "v2_completed" ||
    (state.kind === "legacy" &&
      (state.completed || membershipRole !== "owner"))
  ) {
    return {
      logicalStage: state.logicalStage,
      availableRoute: "home",
      stageRoute: "home",
      productAccessAllowed: true,
    };
  }

  if (state.kind === "v2_context_required") {
    return {
      logicalStage: state.logicalStage,
      availableRoute: "operating_model",
      stageRoute: "operating_model",
      productAccessAllowed: false,
    };
  }

  if (state.kind === "v2_configured") {
    return {
      logicalStage: state.logicalStage,
      availableRoute: "onboarding",
      stageRoute: "workspace",
      productAccessAllowed: false,
    };
  }

  if (state.kind === "v2_ready" && membershipRole === "owner") {
    return {
      logicalStage: state.logicalStage,
      availableRoute: "onboarding",
      stageRoute: "creating",
      productAccessAllowed: false,
    };
  }

  return {
    logicalStage: state.logicalStage,
    availableRoute: "onboarding",
    stageRoute: "onboarding",
    productAccessAllowed: false,
  };
}

export function isProductAdmissionAllowed(
  state: OnboardingLifecycleState,
  membershipRole: string,
): boolean {
  return resolveOnboardingLifecycleDestination(state, membershipRole)
    .productAccessAllowed;
}
