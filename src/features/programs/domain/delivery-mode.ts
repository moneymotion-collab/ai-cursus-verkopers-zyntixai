import type { ProgramDeliveryMode } from "@/features/programs/domain/types";

export const PROGRAM_DELIVERY_MODES = [
  "self_paced",
  "cohort",
  "group_coaching",
  "one_to_one",
  "membership",
  "hybrid",
] as const satisfies readonly ProgramDeliveryMode[];

/** Deterministic form/select ordering matching schema CHECK order. */
export const PROGRAM_DELIVERY_MODE_ORDER = [
  "self_paced",
  "cohort",
  "group_coaching",
  "one_to_one",
  "membership",
  "hybrid",
] as const satisfies readonly ProgramDeliveryMode[];

const DELIVERY_MODE_LABELS: Record<ProgramDeliveryMode, string> = {
  self_paced: "Self-paced",
  cohort: "Cohort",
  group_coaching: "Group coaching",
  one_to_one: "One-to-one",
  membership: "Membership",
  hybrid: "Hybrid",
};

const DELIVERY_MODE_DESCRIPTIONS: Record<ProgramDeliveryMode, string> = {
  self_paced: "Learners progress independently.",
  cohort: "Scheduled group cohort delivery.",
  group_coaching: "Facilitated group coaching.",
  one_to_one: "Individual coaching or mentoring.",
  membership: "Ongoing membership-style access.",
  hybrid: "Combined delivery approaches.",
};

export type ProgramDeliveryModeMetadata = {
  value: ProgramDeliveryMode;
  label: string;
  description: string;
};

export const PROGRAM_DELIVERY_MODE_METADATA: readonly ProgramDeliveryModeMetadata[] =
  PROGRAM_DELIVERY_MODE_ORDER.map((value) => ({
    value,
    label: DELIVERY_MODE_LABELS[value],
    description: DELIVERY_MODE_DESCRIPTIONS[value],
  }));

export function isProgramDeliveryMode(value: string): value is ProgramDeliveryMode {
  return (PROGRAM_DELIVERY_MODES as readonly string[]).includes(value);
}

export function getProgramDeliveryModeLabel(mode: ProgramDeliveryMode): string {
  return DELIVERY_MODE_LABELS[mode];
}

export function getProgramDeliveryModeDescription(
  mode: ProgramDeliveryMode,
): string {
  return DELIVERY_MODE_DESCRIPTIONS[mode];
}
