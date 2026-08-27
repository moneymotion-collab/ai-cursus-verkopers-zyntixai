import "server-only";

import { canPerformDataIntakeFoundationCommand } from "@/features/data-intake/domain/authorization";
import { clientAttemptedStorageAuthority } from "@/features/data-intake/domain/client-path-authority";
import {
  DATA_INTAKE_SIGNED_READ_TTL_SECONDS,
  DATA_INTAKE_STORAGE_BUCKET,
  DATA_MAX_FILE_BYTES,
  DATA_SHA256_PATTERN,
  isDataSourceKind,
  isDataUuid,
  mimeForSourceKind,
} from "@/features/data-intake/domain/constants";
import {
  dataFail,
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import {
  extensionMatchesSourceKind,
  inspectSourceBytes,
  normalizeDataIntakeMime,
} from "@/features/data-intake/domain/file-signature";
import { sha256Hex } from "@/features/data-intake/domain/integrity";
import { parseSourceStructure } from "@/features/data-intake/domain/parse-source-structure";
import {
  discoveryFromPersisted,
  parseMetadataFromDiscovery,
} from "@/features/data-intake/domain/parse-metadata";
import { canonicalStructureFingerprint } from "@/features/data-intake/domain/discovery";
import { storagePathMatchesTenant } from "@/features/data-intake/domain/storage-path";
import type {
  CancelDataIntakeSessionInput,
  CreateDataIntakeSessionInput,
  CreateDataIntakeSourceReadUrlInput,
  DataIntakeFoundationSuccess,
  DataIntakeSignedReadUrl,
  DiscoverDataIntakeSourceStructureInput,
  RegisterDataIntakeSourceInput,
  UploadDataIntakeSourceInput,
} from "@/features/data-intake/domain/types";
import {
  createDataIntakeFoundationRpcClient,
  createDataIntakeObjectStore,
  createDataIntakeQueryClient,
  createDataIntakeRecordLookup,
  createDataIntakeSourceObjectRpcClient,
  createDataIntakeSourceStructureRpcClient,
} from "@/features/data-intake/server/data-intake-client";
import {
  invokeDataIntakeFoundationMutation,
  type DataIntakeFoundationRpcClient,
} from "@/features/data-intake/server/data-intake-rpc";
import {
  invokeDataIntakeSourceObjectMutation,
  type DataIntakeSourceObjectRpcClient,
} from "@/features/data-intake/server/data-intake-object-rpc";
import {
  invokeDataIntakeSourceStructureMutation,
  type DataIntakeSourceStructureRpcClient,
} from "@/features/data-intake/server/data-intake-structure-rpc";
import type { DataIntakeQueryClient } from "@/features/data-intake/server/data-intake-query";
import type { DataIntakeRecordLookup } from "@/features/data-intake/server/data-intake-lookup";
import type { DataIntakeObjectStore } from "@/features/data-intake/server/source-object-store";
import {
  authorizeDataIntakeCaller,
  type DataIntakeAuthLookup,
} from "@/features/data-intake/server/tenant-authorization";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DataIntakeServiceDeps = {
  auth: DataIntakeAuthLookup;
  queryClient: DataIntakeQueryClient;
  mutate: DataIntakeFoundationRpcClient;
  lookup?: DataIntakeRecordLookup;
  objectStore?: DataIntakeObjectStore;
  objectMutate?: DataIntakeSourceObjectRpcClient;
  structureMutate?: DataIntakeSourceStructureRpcClient;
};

function sanitizeOriginalFilename(value: string): string {
  const trimmed = value.trim();
  const withoutPath = trimmed.replace(/^.*[\\/]/, "");
  return withoutPath.slice(0, 255) || "upload";
}

function looksLikeXls(filename: string): boolean {
  return /\.xls$/i.test(filename) && !/\.xlsx$/i.test(filename);
}

function asUnknownRecord(input: object): Record<string, unknown> {
  return input as Record<string, unknown>;
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
    const mimeType = normalizeDataIntakeMime(input.mimeType);
    if (!mimeType) {
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

  async uploadAndVerifyDataIntakeSource(
    input: UploadDataIntakeSourceInput,
  ): Promise<DataIntakeResult<DataIntakeFoundationSuccess>> {
    if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
      return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
    }
    const authorized = await this.authorizeCommand(input.organizationId);
    if (!authorized.ok) {
      return authorized;
    }
    if (!this.deps.lookup || !this.deps.objectStore || !this.deps.objectMutate) {
      return dataFail("DATABASE_WRITE_ERROR", "Source object verification is not configured");
    }
    if (!isDataUuid(input.sessionId)) {
      return dataFail("SESSION_NOT_FOUND", "sessionId is required");
    }
    if (input.sourceId && !isDataUuid(input.sourceId)) {
      return dataFail("SOURCE_INVALID", "sourceId is required");
    }

    const filename = sanitizeOriginalFilename(input.originalFilename);
    if (looksLikeXls(filename)) {
      return dataFail("UNSUPPORTED_FILE", ".xls is not supported");
    }
    const mimeType = normalizeDataIntakeMime(input.mimeType);
    if (!mimeType) {
      return dataFail("UNSUPPORTED_FILE", "Unsupported mime type");
    }
    if (!(input.bytes instanceof Uint8Array) || input.bytes.byteLength <= 0) {
      return dataFail("SOURCE_INVALID", "Empty source files are rejected");
    }
    if (input.bytes.byteLength > DATA_MAX_FILE_BYTES) {
      return dataFail("FILE_TOO_LARGE", "File exceeds the 10 MB DATA-1 v1 limit");
    }

    const session = await this.deps.lookup.findSession({
      organizationId: authorized.value.organizationId,
      sessionId: input.sessionId,
    });
    if (!session.ok) {
      return session;
    }
    if (!session.value) {
      return dataFail("SESSION_NOT_FOUND", "Intake session not found");
    }
    if (session.value.status === "cancelled") {
      return dataFail("INVALID_STATE", "Cancelled sessions cannot accept uploads");
    }
    if (session.value.status !== "source_ready") {
      return dataFail("INVALID_STATE", "Upload requires a source_ready session");
    }

    const sourceResult = input.sourceId
      ? await this.deps.lookup.findSource({
          organizationId: authorized.value.organizationId,
          sourceId: input.sourceId,
        })
      : await this.deps.lookup.findActiveSource({
          organizationId: authorized.value.organizationId,
          sessionId: input.sessionId,
        });
    if (!sourceResult.ok) {
      return sourceResult;
    }
    const source = sourceResult.value;
    if (!source || source.sessionId !== input.sessionId) {
      return dataFail("SOURCE_INVALID", "Intake source not found for this session");
    }
    if (source.supersededAt) {
      return dataFail("INVALID_STATE", "Superseded source objects cannot be verified");
    }
    if (source.deletedAt) {
      return dataFail("INVALID_STATE", "Deleted source objects cannot be verified");
    }
    if (source.storageBucket !== DATA_INTAKE_STORAGE_BUCKET) {
      return dataFail("DATABASE_WRITE_ERROR", "Unexpected storage bucket");
    }
    if (
      !storagePathMatchesTenant({
        path: source.storagePath,
        organizationId: authorized.value.organizationId,
        sessionId: input.sessionId,
      })
    ) {
      return dataFail("DATABASE_WRITE_ERROR", "Generated storage path failed tenant check");
    }
    if (mimeType !== source.mimeType || mimeType !== mimeForSourceKind(source.sourceKind)) {
      return dataFail("UNSUPPORTED_FILE", "mimeType must match the registered source");
    }
    if (!extensionMatchesSourceKind(filename, source.sourceKind)) {
      return dataFail("UNSUPPORTED_FILE", "Filename extension must match the registered source");
    }

    const signature = inspectSourceBytes({
      kind: source.sourceKind,
      bytes: input.bytes,
    });
    if (signature !== "ok") {
      return dataFail("UNSUPPORTED_FILE", "File signature does not match the declared source type");
    }
    if (input.bytes.byteLength !== source.byteSize) {
      return dataFail("SOURCE_INVALID", "Uploaded size must match registered source byte_size");
    }
    const digest = sha256Hex(input.bytes);
    if (digest !== source.sha256) {
      return dataFail(
        "SOURCE_HASH_INVALID",
        "Uploaded digest must match registered source sha256",
      );
    }

    const existing = await this.deps.objectStore.getObject({
      bucket: source.storageBucket,
      path: source.storagePath,
    });
    if (!existing.ok && existing.error.code !== "SOURCE_INVALID") {
      return existing;
    }
    if (existing.ok) {
      const existingDigest = sha256Hex(existing.value.bytes);
      if (
        existingDigest === source.sha256 &&
        existing.value.bytes.byteLength === source.byteSize
      ) {
        return invokeDataIntakeSourceObjectMutation(this.deps.objectMutate, {
          p_operation: "confirm_source_object",
          p_organization_id: authorized.value.organizationId,
          p_actor_user_id: authorized.value.userId,
          p_actor_member_id: authorized.value.membershipId,
          p_payload: {
            session_id: input.sessionId,
            source_id: source.id,
            sha256: digest,
            byte_size: source.byteSize,
          },
        });
      }
      if (source.objectVerifiedAt) {
        return dataFail(
          "SOURCE_HASH_INVALID",
          "Stored object no longer matches the verified source",
        );
      }
      const cleaned = await this.deps.objectStore.removeObject({
        bucket: source.storageBucket,
        path: source.storagePath,
      });
      if (!cleaned.ok) {
        return cleaned;
      }
    }

    const uploaded = await this.deps.objectStore.putObject({
      bucket: source.storageBucket,
      path: source.storagePath,
      bytes: input.bytes,
      contentType: source.mimeType,
    });
    if (!uploaded.ok) {
      return uploaded;
    }

    const readback = await this.deps.objectStore.getObject({
      bucket: source.storageBucket,
      path: source.storagePath,
    });
    if (!readback.ok) {
      await this.deps.objectStore.removeObject({
        bucket: source.storageBucket,
        path: source.storagePath,
      });
      return readback;
    }
    const readbackDigest = sha256Hex(readback.value.bytes);
    if (
      readbackDigest !== source.sha256 ||
      readback.value.bytes.byteLength !== source.byteSize
    ) {
      await this.deps.objectStore.removeObject({
        bucket: source.storageBucket,
        path: source.storagePath,
      });
      return dataFail(
        "SOURCE_HASH_INVALID",
        "Stored object failed independent hash/size verification",
      );
    }

    const confirmed = await invokeDataIntakeSourceObjectMutation(this.deps.objectMutate, {
      p_operation: "confirm_source_object",
      p_organization_id: authorized.value.organizationId,
      p_actor_user_id: authorized.value.userId,
      p_actor_member_id: authorized.value.membershipId,
      p_payload: {
        session_id: input.sessionId,
        source_id: source.id,
        sha256: readbackDigest,
        byte_size: source.byteSize,
      },
    });
    if (!confirmed.ok) {
      await this.deps.objectStore.removeObject({
        bucket: source.storageBucket,
        path: source.storagePath,
      });
    }
    return confirmed;
  }

  async createDataIntakeSourceReadUrl(
    input: CreateDataIntakeSourceReadUrlInput,
  ): Promise<DataIntakeResult<DataIntakeSignedReadUrl>> {
    if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
      return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
    }
    const authorized = await this.authorizeCommand(input.organizationId);
    if (!authorized.ok) {
      return authorized;
    }
    if (!this.deps.lookup || !this.deps.objectStore) {
      return dataFail("DATABASE_READ_ERROR", "Source object verification is not configured");
    }
    if (!isDataUuid(input.sessionId)) {
      return dataFail("SESSION_NOT_FOUND", "sessionId is required");
    }
    if (!isDataUuid(input.sourceId)) {
      return dataFail("SOURCE_INVALID", "sourceId is required");
    }
    const source = await this.deps.lookup.findSource({
      organizationId: authorized.value.organizationId,
      sourceId: input.sourceId,
    });
    if (!source.ok) {
      return source;
    }
    if (!source.value || source.value.sessionId !== input.sessionId) {
      return dataFail("SOURCE_INVALID", "Intake source not found for this session");
    }
    if (!source.value.objectVerifiedAt) {
      return dataFail("INVALID_STATE", "Source object is not verified");
    }
    if (source.value.storageBucket !== DATA_INTAKE_STORAGE_BUCKET) {
      return dataFail("DATABASE_WRITE_ERROR", "Unexpected storage bucket");
    }
    const signed = await this.deps.objectStore.createSignedReadUrl({
      bucket: source.value.storageBucket,
      path: source.value.storagePath,
      expiresInSeconds: DATA_INTAKE_SIGNED_READ_TTL_SECONDS,
    });
    if (!signed.ok) {
      return signed;
    }
    return dataOk({
      bucket: source.value.storageBucket,
      path: source.value.storagePath,
      expiresInSeconds: signed.value.expiresInSeconds,
      signedUrl: signed.value.signedUrl,
    });
  }

  async discoverDataIntakeSourceStructure(
    input: DiscoverDataIntakeSourceStructureInput,
  ): Promise<DataIntakeResult<DataIntakeFoundationSuccess>> {
    if (clientAttemptedStorageAuthority(asUnknownRecord(input))) {
      return dataFail("SOURCE_INVALID", "Client storage path is not accepted");
    }
    const authorized = await this.authorizeCommand(input.organizationId);
    if (!authorized.ok) {
      return authorized;
    }
    if (!this.deps.lookup || !this.deps.objectStore || !this.deps.structureMutate) {
      return dataFail("DATABASE_WRITE_ERROR", "Source structure discovery is not configured");
    }
    if (!isDataUuid(input.sessionId)) {
      return dataFail("SESSION_NOT_FOUND", "sessionId is required");
    }
    if (input.sourceId && !isDataUuid(input.sourceId)) {
      return dataFail("SOURCE_INVALID", "sourceId is required");
    }

    const session = await this.deps.lookup.findSession({
      organizationId: authorized.value.organizationId,
      sessionId: input.sessionId,
    });
    if (!session.ok) {
      return session;
    }
    if (!session.value) {
      return dataFail("SESSION_NOT_FOUND", "Intake session not found");
    }
    if (session.value.status === "cancelled") {
      return dataFail("INVALID_STATE", "Cancelled sessions cannot accept structure discovery");
    }
    if (session.value.status !== "source_ready" && session.value.status !== "parsed") {
      return dataFail("INVALID_STATE", "Discovery requires a source_ready or parsed session");
    }

    const sourceResult = input.sourceId
      ? await this.deps.lookup.findSource({
          organizationId: authorized.value.organizationId,
          sourceId: input.sourceId,
        })
      : await this.deps.lookup.findActiveSource({
          organizationId: authorized.value.organizationId,
          sessionId: input.sessionId,
        });
    if (!sourceResult.ok) {
      return sourceResult;
    }
    const source = sourceResult.value;
    if (!source || source.sessionId !== input.sessionId) {
      return dataFail("SOURCE_NOT_FOUND", "Intake source not found for this session");
    }
    if (!source.objectVerifiedAt) {
      return dataFail("SOURCE_NOT_VERIFIED", "Source object must be verified before structure discovery");
    }
    if (source.supersededAt || source.deletedAt) {
      return dataFail("INVALID_STATE", "Superseded or deleted sources cannot be parsed");
    }
    if (source.storageBucket !== DATA_INTAKE_STORAGE_BUCKET) {
      return dataFail("DATABASE_WRITE_ERROR", "Unexpected storage bucket");
    }
    if (
      !storagePathMatchesTenant({
        path: source.storagePath,
        organizationId: authorized.value.organizationId,
        sessionId: input.sessionId,
      })
    ) {
      return dataFail("DATABASE_WRITE_ERROR", "Generated storage path failed tenant check");
    }

    const stored = await this.deps.objectStore.getObject({
      bucket: source.storageBucket,
      path: source.storagePath,
    });
    if (!stored.ok) {
      return stored;
    }
    if (stored.value.bytes.byteLength !== source.byteSize) {
      return dataFail("SOURCE_HASH_INVALID", "Stored object no longer matches the verified source");
    }
    const digest = sha256Hex(stored.value.bytes);
    if (digest !== source.sha256) {
      return dataFail("SOURCE_HASH_INVALID", "Stored object no longer matches the verified source");
    }

    const parsed = await parseSourceStructure({
      kind: source.sourceKind,
      bytes: stored.value.bytes,
    });
    if (!parsed.ok) {
      return parsed;
    }

    const persisted = discoveryFromPersisted({
      sourceKind: source.sourceKind,
      encoding: source.encoding,
      delimiter: source.delimiter,
      sheetName: source.sheetName,
      headerRowIndex: source.headerRowIndex,
      rowCount: source.rowCount,
      columnCount: source.columnCount,
      parseMetadata: source.parseMetadata,
    });
    if (persisted && canonicalStructureFingerprint(persisted) !== canonicalStructureFingerprint(parsed.value)) {
      return dataFail("SOURCE_INVALID", "Replay discovery does not match persisted structure");
    }

    const confirmed = await invokeDataIntakeSourceStructureMutation(this.deps.structureMutate, {
      p_operation: "confirm_source_structure",
      p_organization_id: authorized.value.organizationId,
      p_actor_user_id: authorized.value.userId,
      p_actor_member_id: authorized.value.membershipId,
      p_payload: {
        session_id: input.sessionId,
        source_id: source.id,
        sha256: digest,
        encoding: parsed.value.encoding,
        delimiter: parsed.value.format === "csv" ? parsed.value.delimiter : null,
        sheet_name: parsed.value.format === "xlsx" ? parsed.value.selectedSheet : null,
        header_row_index: parsed.value.headerRowIndex,
        row_count: parsed.value.rowCount,
        column_count: parsed.value.columnCount,
        parse_metadata: parseMetadataFromDiscovery(parsed.value),
      },
    });
    if (!confirmed.ok) {
      return confirmed;
    }
    return dataOk({
      ...confirmed.value,
      discovery: parsed.value,
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
  lookup?: DataIntakeRecordLookup;
  objectStore?: DataIntakeObjectStore;
  objectMutate?: DataIntakeSourceObjectRpcClient;
  structureMutate?: DataIntakeSourceStructureRpcClient;
} = {}): DataIntakeService {
  const env = input.env ?? process.env;
  const queryClient = input.queryClient ?? createDataIntakeQueryClient(env);
  const mutate = input.mutate ?? createDataIntakeFoundationRpcClient(env);
  const lookup = input.lookup ?? createDataIntakeRecordLookup(env);
  const objectStore = input.objectStore ?? createDataIntakeObjectStore(env);
  const objectMutate = input.objectMutate ?? createDataIntakeSourceObjectRpcClient(env);
  const structureMutate = input.structureMutate ?? createDataIntakeSourceStructureRpcClient(env);
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
    lookup,
    objectStore,
    objectMutate,
    structureMutate,
  });
}
