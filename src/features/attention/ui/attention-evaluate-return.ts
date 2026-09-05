import { ATTENTION_ROUTE } from "@/features/attention/domain/attention-navigation";
import { isAttentionPathname } from "@/features/attention/domain/attention-navigation";
import { resolveSafeReturnPath } from "@/features/auth/server/safe-return-path";

function isEvaluateReturnPathname(pathname: string): boolean {
  if (isAttentionPathname(pathname)) {
    return true;
  }
  if (pathname === "/home" || pathname.startsWith("/home/")) {
    return true;
  }
  if (pathname === "/enrollments" || pathname.startsWith("/enrollments/")) {
    return true;
  }
  if (pathname === "/projects" || pathname.startsWith("/projects/")) {
    return true;
  }
  return false;
}

/**
 * Resolve a post-evaluate return path limited to Attention, Home, or Enrollments.
 */
export function resolveAttentionEvaluateReturnPath(
  raw: unknown,
  fallback: string = ATTENTION_ROUTE,
): string {
  const candidate = resolveSafeReturnPath(raw, fallback);
  const pathname = candidate.split("?")[0] ?? candidate;

  if (!isEvaluateReturnPathname(pathname)) {
    return fallback;
  }

  return candidate;
}

export function listAttentionEvaluateRevalidationPaths(
  organizationId: string,
  enrollmentId?: string | null,
): string[] {
  const paths = [
    ATTENTION_ROUTE,
    "/home",
    `/home?org=${encodeURIComponent(organizationId)}`,
  ];
  if (enrollmentId) {
    paths.push(
      `/enrollments/${encodeURIComponent(enrollmentId)}`,
      `/enrollments/${encodeURIComponent(enrollmentId)}?org=${encodeURIComponent(organizationId)}`,
    );
  }
  return paths;
}

export function listProjectAttentionEvaluateRevalidationPaths(
  organizationId: string,
  projectId?: string | null,
): string[] {
  const paths = [
    ATTENTION_ROUTE,
    "/home",
    `/home?org=${encodeURIComponent(organizationId)}`,
  ];
  if (projectId) {
    paths.push(
      `/projects/${encodeURIComponent(projectId)}`,
      `/projects/${encodeURIComponent(projectId)}?org=${encodeURIComponent(organizationId)}`,
    );
  }
  return paths;
}
