import "server-only";

import type { ControlPlaneError } from "@/features/control-plane/domain/errors";
import {
  contextResolverFail,
  type ContextResolverResult,
} from "@/features/context-resolver/domain/errors";
import type { OrgContextError } from "@/features/org-context/domain/errors";
import type { TaskApplicationError } from "@/features/tasks/domain/types";

export function mapMembershipError(
  error: TaskApplicationError,
): ContextResolverResult<never> {
  if (error.code === "AUTH_REQUIRED" || error.category === "auth") {
    return contextResolverFail("UNAUTHORIZED", "Authentication is required to resolve Context");
  }
  if (error.code === "ORG_CONTEXT_MISSING" || error.category === "not_found") {
    return contextResolverFail(
      "ORG_NOT_FOUND",
      "Organization not found or access denied",
    );
  }
  return contextResolverFail("DATABASE_READ_ERROR", error.message);
}

export function mapOrgContextError(
  error: OrgContextError,
): ContextResolverResult<never> {
  if (
    error.code === "ORG_NOT_FOUND" ||
    error.code === "ACTIVITY_NOT_FOUND" ||
    error.code === "ACTIVITY_NOT_OWNED_BY_ORG" ||
    error.code === "DATABASE_READ_ERROR" ||
    error.code === "UNAUTHORIZED" ||
    error.code === "CATALOG_INTEGRITY_ERROR"
  ) {
    return contextResolverFail(error.code, error.message, error.details);
  }
  if (error.code === "PRIMARY_ACTIVITY_CONFLICT") {
    return contextResolverFail(
      "CATALOG_INTEGRITY_ERROR",
      error.message,
      error.details,
    );
  }
  return contextResolverFail("DATABASE_READ_ERROR", error.message, error.details);
}

export function mapControlPlaneError(
  error: ControlPlaneError,
  notFoundCode:
    | "CONTEXT_VERSION_NOT_FOUND"
    | "PARENT_CONTEXT_NOT_FOUND"
    | "CAPABILITY_NOT_FOUND"
    | "CATALOG_INTEGRITY_ERROR" = "CATALOG_INTEGRITY_ERROR",
): ContextResolverResult<never> {
  if (error.code === "DATABASE_READ_ERROR") {
    return contextResolverFail("DATABASE_READ_ERROR", error.message, error.details);
  }
  if (error.code === "NOT_FOUND") {
    return contextResolverFail(notFoundCode, error.message, error.details);
  }
  if (
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("missing capability")
  ) {
    return contextResolverFail("CAPABILITY_NOT_FOUND", error.message, error.details);
  }
  return contextResolverFail("CATALOG_INTEGRITY_ERROR", error.message, error.details);
}
