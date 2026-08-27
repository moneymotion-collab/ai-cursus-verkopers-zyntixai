import "server-only";

import { canPerformDataIntakeFoundationCommand } from "@/features/data-intake/domain/authorization";
import {
  DATA_CSV_MIME,
  DATA_INTAKE_STORAGE_BUCKET,
  DATA_MAX_FILE_BYTES,
  DATA_SHA256_PATTERN,
  DATA_XLSX_MIME,
  isDataSourceKind,
  isDataUuid,
  mimeForSourceKind,
} from "@/features/data-intake/domain/constants";
import {
  dataFail,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { storagePathMatchesTenant } from "@/features/data-intake/domain/storage-path";
import type {
  CancelDataIntakeSessionInput,
  CreateDataIntakeSessionInput,
  DataIntakeFoundationSuccess,
  RegisterDataIntakeSourceInput,
} from "@/features/data-intake/domain/types";
import {
  createDataIntakeFoundationRpcClient,
  createDataIntakeQueryClient,
} from "@/features/data-intake/server/data-intake-client";
import {
  invokeDataIntakeFoundationMutation,
  type DataIntakeFoundationRpcClient,
} from "@/features/data-intake/server/data-intake-rpc";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import {
  authorizeDataIntakeCaller,
  type DataIntakeAuthLookup,
} from "@/features/data-intake/server/tenant-authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DataIntakeServiceDeps = {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  mutate: DataIntakeFoundationRpcClient;
};

function sanitizeOriginalFilename(value: string): string {
  const trimmed = value.trim();
  const withoutPath = trimmed.replace(/^.*[\\/]/, "");
  return withoutPath.slice(0, 255) || "upload";
}

function looksLikeXls(filename: string): boolean {
  return /\.xls$/i.test(filename) && !/\.xlsx$/i.test(filename);
}

export class DataIntakeService {
  constructor(private readonly deps: DataIntakeServiceDeps) {}

  async createDataIntakeSession(
    input: CreateDataIntakeSessionInput,
  ): Promise<DataIntakeResult<DataIntakeFoundationSuccess>> {
    const authorized = await this.authorizeCommand(input.organizationId);
    if (!authorized.ok) {
      return authorized;
    }
    if (input.targetDomain !== "customer") {
      return dataFail("TARGET_NOT_SUPPORTED", "DATA-1C executable target_domain is customer");
    }
    if (input.businessActivityId) {
      return dataFail(
        "ACTIVITY_NOT_ALLOWED_FOR_TARGET",
        "Customer intake must not bind a Business Activity",
      );
    }
    if (!isDataSourceKind(input.sourceKind)) {
      return dataFail("UNSUPPORTED_FILE", "sourceKind must be csv or xlsx");
    }
    return invokeDataIntakeFoundationMutation(this.deps.mutate, {
      p_operation: "create_session",
      p_organization_id: authorized.value.organizationId,
      p_actor_user_id: authorized.value.userId,
      p_actor_member_id: authorized.value.membershipId,
      p_payload: {
        target_domain: input.targetDomain,
        source_kind: input.sourceKind,
      },
    });
  }

  async registerDataIntakeSource(
    input: RegisterDataIntakeSourceInput,
  ): Promise<DataIntakeResult<DataIntakeFoundationSuccess>> {
    const authorized = await this.authorizeCommand(input.organizationId);
    if (!authorized.ok) {
      return authorized;
    }
    if (!isDataUuid(input.sessionId)) {
      return dataFail("SESSION_NOT_FOUND", "sessionId is required");
    }

    const filename = sanitizeOriginalFilename(input.originalFilename);
    if (looksLikeXls(filename)) {
      return dataFail("UNSUPPORTED_FILE", ".xls is not supported");
    }
    if (!Number.isInteger(input.byteSize) || input.byteSize <= 0) {
      return dataFail("SOURCE_INVALID", "byteSize is required");
    }
    if (input.byteSize > DATA_MAX_FILE_BYTES) {
      return dataFail("FILE_TOO_LARGE", "File exceeds the 10 MB DATA-1 v1 limit");
    }
    const sha256 = input.sha256.trim().toLowerCase();
    if (!DATA_SHA256_PATTERN.test(sha256)) {
      return dataFail(
        "SOURCE_HASH_INVALID",
        "sha256 must be a 64-character lowercase hex digest",
      );
    }
    const mimeType = input.mimeType.trim().toLowerCase();
    if (mimeType !== DATA_CSV_MIME && mimeType !== DATA_XLSX_MIME) {
      return dataFail("UNSUPPORTED_FILE", "Unsupported mime type");
    }
    if (input.sourceKind && mimeType !== mimeForSourceKind(input.sourceKind)) {
      return dataFail("UNSUPPORTED_FILE", "mimeType must match sourceKind");
    }

    const result = await invokeDataIntakeFoundationMutation(this.deps.mutate, {
      p_operation: "register_source",
      p_organization_id: authorized.value.organizationId,
      p_actor_user_id: authorized.value.userId,
      p_actor_member_id: authorized.value.membershipId,
      p_payload: {
        session_id: input.sessionId,
        original_filename: filename,
        mime_type: mimeType,
        byte_size: input.byteSize,
        sha256,
        ...(input.sourceKind ? { source_kind: input.sourceKind } : {}),
      },
    });
    if (!result.ok) {
      return result;
    }
    if (
      result.value.storagePath &&
      !storagePathMatchesTenant({
        path: result.value.storagePath,
        organizationId: authorized.value.organizationId,
        sessionId: input.sessionId,
      })
    ) {
      return dataFail("DATABASE_WRITE_ERROR", "Generated storage path failed tenant check");
    }
    if (
      result.value.storageBucket &&
      result.value.storageBucket !== DATA_INTAKE_STORAGE_BUCKET
    ) {
      return dataFail("DATABASE_WRITE_ERROR", "Unexpected storage bucket");
    }
    return result;
  }

  async cancelDataIntakeSession(
    input: CancelDataIntakeSessionInput,
  ): Promise<DataIntakeResult<DataIntakeFoundationSuccess>> {
    const authorized = await this.authorizeCommand(input.organizationId);
    if (!authorized.ok) {
      return authorized;
    }
    if (!isDataUuid(input.sessionId)) {
      return dataFail("SESSION_NOT_FOUND", "sessionId is required");
    }
    return invokeDataIntakeFoundationMutation(this.deps.mutate, {
      p_operation: "cancel_session",
      p_organization_id: authorized.value.organizationId,
      p_actor_user_id: authorized.value.userId,
      p_actor_member_id: authorized.value.membershipId,
      p_payload: {
        session_id: input.sessionId,
      },
    });
  }

  private async authorizeCommand(organizationId: string) {
    const authorized = await authorizeDataIntakeCaller({
      auth: this.deps.auth,
      queryClient: this.deps.queryClient,
      organizationId,
    });
    if (!authorized.ok) {
      return authorized;
    }
    if (!canPerformDataIntakeFoundationCommand(authorized.value.role)) {
      return dataFail("FORBIDDEN_ROLE", "Owner or Admin role is required");
    }
    return authorized;
  }
}

export function createDataIntakeService(input: {
  env?: Record<string, string | undefined>;
  auth?: DataIntakeAuthLookup;
  queryClient?: DataIntakeQueryClient;
  mutate?: DataIntakeFoundationRpcClient;
} = {}): DataIntakeService {
  const env = input.env ?? process.env;
  const queryClient = input.queryClient ?? createDataIntakeQueryClient(env);
  const mutate = input.mutate ?? createDataIntakeFoundationRpcClient(env);
  const auth =
    input.auth ??
    ({
      async getUser() {
        const supabase = await createSupabaseServerClient();
        const { data } = await supabase.auth.getUser();
        return data.user ? { id: data.user.id } : null;
      },
    } satisfies DataIntakeAuthLookup);
  return new DataIntakeService({
    auth,
    queryClient,
    mutate,
  });
}
