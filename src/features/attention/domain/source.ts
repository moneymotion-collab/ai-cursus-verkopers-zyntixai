import type { AttentionSourceType } from "@/features/attention/domain/types";

export const ATTENTION_SOURCE_TYPES = [
  "enrollment",
  "social_publication",
  "social_connection",
] as const satisfies readonly AttentionSourceType[];

export const ATTENTION_PRIMARY_SOURCE_TYPE =
  "enrollment" as const satisfies AttentionSourceType;

export function isAttentionSourceType(
  value: string,
): value is AttentionSourceType {
  return (ATTENTION_SOURCE_TYPES as readonly string[]).includes(value);
}
