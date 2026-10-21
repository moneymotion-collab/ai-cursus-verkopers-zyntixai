import type {
  AttentionEventSource,
  AttentionEventType,
} from "@/features/attention/domain/types";

export const ATTENTION_EVENT_TYPES = [
  "created",
  "status_changed",
  "assigned",
  "severity_changed",
  "signal_recorded",
  "archived",
  "detection_updated",
] as const satisfies readonly AttentionEventType[];

export const ATTENTION_EVENT_SOURCES = [
  "manual",
  "rule",
  "system",
] as const satisfies readonly AttentionEventSource[];

export function isAttentionEventType(
  value: string,
): value is AttentionEventType {
  return (ATTENTION_EVENT_TYPES as readonly string[]).includes(value);
}

export function isAttentionEventSource(
  value: string,
): value is AttentionEventSource {
  return (ATTENTION_EVENT_SOURCES as readonly string[]).includes(value);
}
