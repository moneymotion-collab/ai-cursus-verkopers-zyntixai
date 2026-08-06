import {
  ATTENTION_ROUTE,
  buildAttentionDetailHref,
  isAttentionPathname,
} from "@/features/attention/domain/attention-navigation";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";

/**
 * Resolve a post-mutation return path limited to Attention routes.
 * Rejects external, protocol-relative, and non-Attention allowlisted paths.
 */
export function resolveAttentionLifecycleReturnPath(
  raw: unknown,
  attentionItemId: string,
  organizationId?: string,
): string {
  const fallback = buildAttentionDetailHref(attentionItemId, organizationId);
  const candidate = resolveSafeReturnPath(raw, fallback);
  const pathname = candidate.split("?")[0] ?? candidate;

  if (!isAttentionPathname(pathname)) {
    return fallback;
  }

  return candidate;
}

export function buildAttentionLifecycleDetailPath(
  attentionItemId: string,
): string {
  return `${ATTENTION_ROUTE}/${encodeURIComponent(attentionItemId)}`;
}

export function listAttentionLifecycleRevalidationPaths(
  attentionItemId: string,
): readonly [string, string] {
  return [ATTENTION_ROUTE, buildAttentionLifecycleDetailPath(attentionItemId)];
}
