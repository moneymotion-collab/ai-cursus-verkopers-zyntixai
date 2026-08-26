/**
 * Frozen BQA Context-readiness × rollout eligibility.
 * CAP readiness is not a v1 admission gate. Open Beta has no eligibility rule.
 */

import type { ContextReadinessStatus, RolloutMode } from "./types";

export const ROLLOUT_MODES = [
  "internal_qa",
  "closed_beta",
  "production",
  "open_beta",
] as const;

export const CONTEXT_READINESS_STATUSES = [
  "planned",
  "context_ready",
  "beta_supported",
  "production_verified",
] as const;

const ELIGIBLE_READINESS: Record<
  Exclude<RolloutMode, "open_beta">,
  readonly ContextReadinessStatus[]
> = {
  internal_qa: ["context_ready", "beta_supported", "production_verified"],
  closed_beta: ["beta_supported", "production_verified"],
  production: ["production_verified"],
};

export function isRolloutMode(value: string): value is RolloutMode {
  return (ROLLOUT_MODES as readonly string[]).includes(value);
}

export function isContextReadinessStatus(
  value: string,
): value is ContextReadinessStatus {
  return (CONTEXT_READINESS_STATUSES as readonly string[]).includes(value);
}

export function isOpenBetaPolicyDefined(): boolean {
  return false;
}

export function eligibleReadinessForRollout(
  rollout: RolloutMode,
): readonly ContextReadinessStatus[] | null {
  if (rollout === "open_beta") {
    return null;
  }
  return ELIGIBLE_READINESS[rollout];
}

export function isReadinessEligibleForRollout(
  readiness: ContextReadinessStatus,
  rollout: RolloutMode,
): boolean {
  const eligible = eligibleReadinessForRollout(rollout);
  if (!eligible) {
    return false;
  }
  return eligible.includes(readiness);
}
