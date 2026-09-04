import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContextResolverErrorCode } from "@/features/context-resolver/domain/errors";
import { resolvePrimaryBusinessActivityContext } from "@/features/context-resolver/server/context-resolver";
import type { AuthenticatedResolverClient } from "@/features/context-resolver/server/tenant-context-loader";
import { createControlPlaneReaders } from "@/features/control-plane/server/control-plane-client";
import type { Database } from "@/types/database";

export type ProductContextSummaryResult =
  | { ok: true; packKey: string }
  | { ok: false; errorCode: ContextResolverErrorCode };

export type ProductContextSummaryResolver = (input: {
  organizationId: string;
  authenticatedClient?: SupabaseClient<Database>;
}) => Promise<ProductContextSummaryResult>;

export async function resolveProductContextSummary(input: {
  organizationId: string;
  authenticatedClient?: SupabaseClient<Database>;
}): Promise<ProductContextSummaryResult> {
  const runtime = input.authenticatedClient
    ? {
        getAuthenticatedClient: async () =>
          input.authenticatedClient as unknown as AuthenticatedResolverClient,
        getControlPlaneReaders: createControlPlaneReaders,
      }
    : undefined;
  const resolved = await resolvePrimaryBusinessActivityContext(
    {
      organizationId: input.organizationId,
      mode: "internal_qa",
    },
    runtime,
  );
  return resolved.ok
    ? { ok: true, packKey: resolved.value.context.packKey }
    : { ok: false, errorCode: resolved.error.code };
}
