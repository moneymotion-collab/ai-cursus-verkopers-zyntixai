import { buildProgressListHref } from "@/features/progress/domain/progress-navigation";
import type {
  NbaDestinationIntent,
  NextBestAction,
  NextBestActionType,
} from "@/features/nba/domain/types";

export type NbaDetailCtaCapabilities = {
  canAcknowledge: boolean;
  canAssign: boolean;
};

export type NbaDetailCtaContext = {
  organizationId: string;
  enrollmentHref: string | null;
  customerHref: string | null;
  capabilities: NbaDetailCtaCapabilities;
};

export type NbaDetailCtaResult =
  | {
      kind: "anchor";
      href: "#attention-acknowledge-heading" | "#attention-assign-heading";
      label: string;
    }
  | {
      kind: "navigate";
      href: string;
      label: string;
    }
  | {
      kind: "read_only";
      message: string;
    }
  | {
      kind: "none";
    };

const VIEW_ONLY_MESSAGE = "View only — you cannot perform this action." as const;

function resolveAttentionControlCta(
  control: Extract<NbaDestinationIntent, { kind: "attention_control" }>["control"],
  capabilities: NbaDetailCtaCapabilities,
): NbaDetailCtaResult {
  if (control === "acknowledge") {
    if (!capabilities.canAcknowledge) {
      return { kind: "read_only", message: VIEW_ONLY_MESSAGE };
    }
    return {
      kind: "anchor",
      href: "#attention-acknowledge-heading",
      label: "Go to Acknowledge",
    };
  }

  if (control === "assign") {
    if (!capabilities.canAssign) {
      return { kind: "read_only", message: VIEW_ONLY_MESSAGE };
    }
    return {
      kind: "anchor",
      href: "#attention-assign-heading",
      label: "Go to Assign",
    };
  }

  return { kind: "none" };
}

function resolveNavigateCta(
  actionType: NextBestActionType,
  destination: Extract<NbaDestinationIntent, { kind: "navigate" }>,
  context: NbaDetailCtaContext,
  nba: NextBestAction,
): NbaDetailCtaResult {
  switch (destination.target) {
    case "progress_list": {
      if (actionType !== "review_progress") {
        return { kind: "none" };
      }
      const enrollmentId = nba.relatedEnrollmentId;
      if (!enrollmentId) {
        return { kind: "none" };
      }
      return {
        kind: "navigate",
        href: buildProgressListHref({
          organizationId: context.organizationId,
          enrollmentId,
        }),
        label: "Review progress",
      };
    }
    case "enrollment_detail": {
      if (actionType !== "open_enrollment" || !context.enrollmentHref) {
        return { kind: "none" };
      }
      return {
        kind: "navigate",
        href: context.enrollmentHref,
        label: "Open enrollment",
      };
    }
    case "customer_detail": {
      if (actionType !== "open_customer" || !context.customerHref) {
        return { kind: "none" };
      }
      return {
        kind: "navigate",
        href: context.customerHref,
        label: "Open customer",
      };
    }
    default:
      return { kind: "none" };
  }
}

/**
 * Pure presentation resolver: semantic NBA destination + authorized detail
 * context → safe CTA / read-only note. Does not select recommendations.
 */
export function resolveNbaDetailCta(
  nba: NextBestAction,
  context: NbaDetailCtaContext,
): NbaDetailCtaResult {
  switch (nba.actionType) {
    case "acknowledge_attention":
    case "assign_attention_owner": {
      if (nba.destination.kind !== "attention_control") {
        return { kind: "none" };
      }
      return resolveAttentionControlCta(nba.destination.control, context.capabilities);
    }
    case "review_progress":
    case "open_enrollment":
    case "open_customer": {
      if (nba.destination.kind !== "navigate") {
        return { kind: "none" };
      }
      return resolveNavigateCta(
        nba.actionType,
        nba.destination,
        context,
        nba,
      );
    }
    default: {
      const _exhaustive: never = nba.actionType;
      void _exhaustive;
      return { kind: "none" };
    }
  }
}
