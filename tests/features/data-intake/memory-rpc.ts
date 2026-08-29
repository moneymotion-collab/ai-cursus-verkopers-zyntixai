import { DATA_INTAKE_STORAGE_BUCKET } from "@/features/data-intake/domain/constants";
import { DATA_INTAKE_FOUNDATION_RPC } from "@/features/data-intake/server/data-intake-rpc";
import type {
  DataIntakeFoundationRpcArgs,
  DataIntakeFoundationRpcClient,
} from "@/features/data-intake/server/data-intake-rpc";
import {
  DATA_INTAKE_SOURCE_OBJECT_RPC,
  type DataIntakeSourceObjectRpcArgs,
  type DataIntakeSourceObjectRpcClient,
} from "@/features/data-intake/server/data-intake-object-rpc";
import {
  DATA_INTAKE_SOURCE_STRUCTURE_RPC,
  type DataIntakeSourceStructureRpcArgs,
  type DataIntakeSourceStructureRpcClient,
} from "@/features/data-intake/server/data-intake-structure-rpc";
import {
  DATA_INTAKE_MAPPING_RPC,
  type DataIntakeMappingRpcArgs,
  type DataIntakeMappingRpcClient,
} from "@/features/data-intake/server/data-intake-mapping-rpc";
import type { DataIntakeMappingRow, DataMappingDecisionStatus } from "@/features/data-intake/domain/mapping";
import {
  dataOk,
  type DataIntakeResult,
} from "@/features/data-intake/domain/errors";
import { buildDataIntakeStoragePath } from "@/features/data-intake/domain/storage-path";
import type {
  DataIntakeRecordLookup,
  DataIntakeSessionRecord,
  DataIntakeSourceRecord,
} from "@/features/data-intake/server/data-intake-lookup";
import type { DataIntakeMemoryTables } from "./memory-query-client";
import { isDataSourceKind } from "@/features/data-intake/domain/constants";
import type { DataIntakeSessionStatus } from "@/features/data-intake/domain/types";

type SessionRow = {
  id: string;
  organization_id: string;
  status: string;
  target_domain: string;
  source_kind: string;
  created_by_user_id: string;
  cancelled_at: string | null;
};

type SourceRow = {
  id: string;
  organization_id: string;
  session_id: string;
  source_kind: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type: string;
  byte_size: number;
  sha256: string;
  superseded_at: string | null;
  deleted_at: string | null;
  object_verified_at: string | null;
  object_verified_by_user_id: string | null;
  encoding: string | null;
  delimiter: string | null;
  sheet_name: string | null;
  header_row_index: number | null;
  row_count: number | null;
  column_count: number | null;
  parse_metadata: Record<string, unknown>;
};

type MappingRow = {
  id: string;
  organization_id: string;
  session_id: string;
  source_id: string;
  source_field_key: string;
  source_header: string;
  target_domain: string;
  target_field: string | null;
  status: string;
  proposal_source: string;
  confirmed_by_user_id: string | null;
  confirmed_at: string | null;
};

export type DataIntakeMemoryStore = {
  sessions: SessionRow[];
  sources: SourceRow[];
  events: Array<{ event_type: string; metadata: Record<string, unknown> }>;
  mappings: MappingRow[];
  staging: unknown[];
  plans: unknown[];
  rowResults: unknown[];
  links: unknown[];
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(code: string, message: string) {
  return { ok: false, code, message };
}

function randomUuid() {
  return crypto.randomUUID();
}

export function emptyDataIntakeStore(): DataIntakeMemoryStore {
  return {
    sessions: [],
    sources: [],
    events: [],
    mappings: [],
    staging: [],
    plans: [],
    rowResults: [],
    links: [],
  };
}

function mapSession(row: SessionRow): DataIntakeSessionRecord | null {
  if (!isDataSourceKind(row.source_kind)) {
    return null;
  }
  return {
    id: row.id,
    organizationId: row.organization_id,
    status: row.status as DataIntakeSessionStatus,
    sourceKind: row.source_kind,
    targetDomain: row.target_domain,
  };
}

function mapSource(row: SourceRow): DataIntakeSourceRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    sessionId: row.session_id,
    sourceKind: row.source_kind as DataIntakeSourceRecord["sourceKind"],
    storageBucket: row.storage_bucket,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    mimeType: row.mime_type,
    byteSize: row.byte_size,
    sha256: row.sha256,
    supersededAt: row.superseded_at,
    deletedAt: row.deleted_at,
    objectVerifiedAt: row.object_verified_at,
    encoding: row.encoding,
    delimiter: row.delimiter,
    sheetName: row.sheet_name,
    headerRowIndex: row.header_row_index,
    rowCount: row.row_count,
    columnCount: row.column_count,
    parseMetadata: row.parse_metadata,
  };
}

export function createStoreDataIntakeRecordLookup(
  store: DataIntakeMemoryStore,
): DataIntakeRecordLookup {
  return {
    async findSession(input) {
      const row = store.sessions.find(
        (session) =>
          session.id === input.sessionId && session.organization_id === input.organizationId,
      );
      return dataOk(row ? mapSession(row) : null) as DataIntakeResult<DataIntakeSessionRecord | null>;
    },
    async findSource(input) {
      const row = store.sources.find(
        (source) => source.id === input.sourceId && source.organization_id === input.organizationId,
      );
      return dataOk(row ? mapSource(row) : null);
    },
    async findActiveSource(input) {
      const row = store.sources.find(
        (source) =>
          source.session_id === input.sessionId &&
          source.organization_id === input.organizationId &&
          source.superseded_at === null,
      );
      return dataOk(row ? mapSource(row) : null);
    },
    async findMappings(input) {
      const rows = store.mappings
        .filter(
          (row) =>
            row.organization_id === input.organizationId && row.source_id === input.sourceId,
        )
        .flatMap((row): DataIntakeMappingRow[] => {
          const status = row.status as DataMappingDecisionStatus;
          if (
            status !== "proposed" &&
            status !== "confirmed" &&
            status !== "rejected" &&
            status !== "unmapped" &&
            status !== "needs_review"
          ) {
            return [];
          }
          return [
            {
              sourceFieldKey: row.source_field_key,
              sourceHeader: row.source_header,
              targetField: row.target_field,
              status,
            },
          ];
        });
      return dataOk(rows);
    },
  };
}

export function createMemoryDataIntakeFoundationRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeFoundationRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  return {
    async rpc(fn, args: DataIntakeFoundationRpcArgs) {
      if (fn !== DATA_INTAKE_FOUNDATION_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }

      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }

      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }

      if (args.p_operation === "create_session") {
        const targetDomain = args.p_payload.target_domain;
        const sourceKind = args.p_payload.source_kind;
        if (args.p_payload.business_activity_id) {
          return {
            data: fail(
              "ACTIVITY_NOT_ALLOWED_FOR_TARGET",
              "Customer intake must not bind a Business Activity",
            ),
            error: null,
          };
        }
        if (targetDomain !== "customer") {
          return {
            data: fail("TARGET_NOT_SUPPORTED", "DATA-1C executable target_domain is customer"),
            error: null,
          };
        }
        if (sourceKind !== "csv" && sourceKind !== "xlsx") {
          return { data: fail("UNSUPPORTED_FILE", "sourceKind must be csv or xlsx"), error: null };
        }
        const session: SessionRow = {
          id: randomUuid(),
          organization_id: args.p_organization_id,
          status: "created",
          target_domain: "customer",
          source_kind: sourceKind,
          created_by_user_id: args.p_actor_user_id,
          cancelled_at: null,
        };
        input.store.sessions.push(session);
        input.store.events.push({
          event_type: "intake_created",
          metadata: { target_domain: "customer", source_kind: sourceKind },
        });
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: null,
            storage_path: null,
            event_id: randomUuid(),
            event_type: "intake_created",
          },
          error: null,
        };
      }

      const sessionId =
        typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }

      if (args.p_operation === "cancel_session") {
        if (
          session.status !== "created" &&
          session.status !== "source_ready" &&
          session.status !== "parsed" &&
          session.status !== "mapping_required" &&
          session.status !== "mapped"
        ) {
          return {
            data: fail(
              "INVALID_STATE",
              "DATA can cancel only created, source_ready, parsed, mapping_required, or mapped sessions",
            ),
            error: null,
          };
        }
        session.status = "cancelled";
        session.cancelled_at = new Date().toISOString();
        input.store.events.push({ event_type: "import_cancelled", metadata: { status: "cancelled" } });
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: null,
            storage_path: null,
            event_id: randomUuid(),
            event_type: "import_cancelled",
          },
          error: null,
        };
      }

      if (session.status !== "created" && session.status !== "source_ready") {
        return {
          data: fail("INVALID_STATE", "Source metadata can be registered only before parse"),
          error: null,
        };
      }

      const sha256 =
        typeof args.p_payload.sha256 === "string" ? args.p_payload.sha256.toLowerCase() : "";
      if (!/^[0-9a-f]{64}$/.test(sha256)) {
        return {
          data: fail("SOURCE_HASH_INVALID", "sha256 must be a 64-character lowercase hex digest"),
          error: null,
        };
      }
      const byteSize =
        typeof args.p_payload.byte_size === "number" ? args.p_payload.byte_size : Number.NaN;
      if (!Number.isInteger(byteSize) || byteSize <= 0) {
        return { data: fail("SOURCE_INVALID", "byteSize is required"), error: null };
      }
      if (byteSize > 10 * 1024 * 1024) {
        return {
          data: fail("FILE_TOO_LARGE", "File exceeds the 10 MB DATA-1 v1 limit"),
          error: null,
        };
      }

      const sourceId = randomUuid();
      const generatedObjectId = randomUuid();
      if (!UUID.test(sourceId) || !UUID.test(generatedObjectId)) {
        return { data: fail("DATABASE_WRITE_ERROR", "uuid generation failed"), error: null };
      }
      const storagePath = buildDataIntakeStoragePath({
        organizationId: session.organization_id,
        sessionId: session.id,
        sourceId,
        generatedObjectId,
        sourceKind: session.source_kind as "csv" | "xlsx",
      });
      let eventType: "source_uploaded" | "source_replaced" = "source_uploaded";
      if (session.status === "source_ready") {
        for (const source of input.store.sources) {
          if (source.session_id === session.id && source.superseded_at === null) {
            source.superseded_at = new Date().toISOString();
          }
        }
        eventType = "source_replaced";
      } else {
        session.status = "source_ready";
        eventType = "source_uploaded";
      }
      const mimeType =
        typeof args.p_payload.mime_type === "string" ? args.p_payload.mime_type : "";
      const originalFilename =
        typeof args.p_payload.original_filename === "string"
          ? args.p_payload.original_filename
          : "upload";
      input.store.events.push({ event_type: eventType, metadata: { source_id: sourceId } });
      input.store.sources.push({
        id: sourceId,
        organization_id: session.organization_id,
        session_id: session.id,
        source_kind: session.source_kind,
        storage_bucket: DATA_INTAKE_STORAGE_BUCKET,
        storage_path: storagePath,
        original_filename: originalFilename,
        mime_type: mimeType,
        byte_size: byteSize,
        sha256,
        superseded_at: null,
        deleted_at: null,
        object_verified_at: null,
        object_verified_by_user_id: null,
        encoding: null,
        delimiter: null,
        sheet_name: null,
        header_row_index: null,
        row_count: null,
        column_count: null,
        parse_metadata: {},
      });
      return {
        data: {
          ok: true,
          session_id: session.id,
          status: session.status,
          target_domain: session.target_domain,
          source_kind: session.source_kind,
          source_id: sourceId,
          storage_path: storagePath,
          storage_bucket: DATA_INTAKE_STORAGE_BUCKET,
          event_id: randomUuid(),
          event_type: eventType,
        },
        error: null,
      };
    },
  };
}

export function createMemoryDataIntakeSourceObjectRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeSourceObjectRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  return {
    async rpc(fn, args: DataIntakeSourceObjectRpcArgs) {
      if (fn !== DATA_INTAKE_SOURCE_OBJECT_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }
      if (
        "storage_path" in args.p_payload ||
        "storagePath" in args.p_payload ||
        "path" in args.p_payload ||
        "bucket" in args.p_payload ||
        "generated_object_id" in args.p_payload ||
        "generatedObjectId" in args.p_payload
      ) {
        return {
          data: fail("SOURCE_INVALID", "Client storage path is not accepted"),
          error: null,
        };
      }
      if (args.p_operation !== "confirm_source_object") {
        return {
          data: fail("DATABASE_WRITE_ERROR", "Unknown DATA source-object operation"),
          error: null,
        };
      }

      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }
      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }

      const sessionId =
        typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const sourceId =
        typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }
      if (session.status !== "source_ready") {
        return {
          data: fail(
            "INVALID_STATE",
            "Source object can be verified only on an active source_ready session",
          ),
          error: null,
        };
      }
      const source = input.store.sources.find(
        (row) =>
          row.id === sourceId &&
          row.session_id === session.id &&
          row.organization_id === args.p_organization_id,
      );
      if (!source) {
        return {
          data: fail("SOURCE_INVALID", "Intake source not found for this session"),
          error: null,
        };
      }
      if (source.superseded_at) {
        return {
          data: fail("INVALID_STATE", "Superseded source objects cannot be verified"),
          error: null,
        };
      }
      const sha256 =
        typeof args.p_payload.sha256 === "string" ? args.p_payload.sha256.toLowerCase() : "";
      if (sha256 !== source.sha256) {
        return {
          data: fail("SOURCE_HASH_INVALID", "Verified digest must match registered source sha256"),
          error: null,
        };
      }
      const byteSize =
        typeof args.p_payload.byte_size === "number" ? args.p_payload.byte_size : Number.NaN;
      if (byteSize !== source.byte_size) {
        return {
          data: fail("SOURCE_INVALID", "Verified size must match registered source byte_size"),
          error: null,
        };
      }
      if (source.object_verified_at) {
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: source.id,
            storage_path: source.storage_path,
            storage_bucket: source.storage_bucket,
            object_verified_at: source.object_verified_at,
            event_id: randomUuid(),
            event_type: "source_object_verified",
            replayed: true,
          },
          error: null,
        };
      }
      source.object_verified_at = new Date().toISOString();
      source.object_verified_by_user_id = args.p_actor_user_id;
      input.store.events.push({
        event_type: "source_object_verified",
        metadata: {
          source_id: source.id,
          source_kind: source.source_kind,
          byte_size: source.byte_size,
          sha256: source.sha256,
          storage_bucket: source.storage_bucket,
        },
      });
      return {
        data: {
          ok: true,
          session_id: session.id,
          status: session.status,
          target_domain: session.target_domain,
          source_kind: session.source_kind,
          source_id: source.id,
          storage_path: source.storage_path,
          storage_bucket: source.storage_bucket,
          object_verified_at: source.object_verified_at,
          event_id: randomUuid(),
          event_type: "source_object_verified",
          replayed: false,
        },
        error: null,
      };
    },
  };
}

export function createMemoryDataIntakeSourceStructureRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeSourceStructureRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  return {
    async rpc(fn, args: DataIntakeSourceStructureRpcArgs) {
      if (fn !== DATA_INTAKE_SOURCE_STRUCTURE_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }
      if (
        "storage_path" in args.p_payload ||
        "storagePath" in args.p_payload ||
        "path" in args.p_payload ||
        "bucket" in args.p_payload ||
        "rows" in args.p_payload ||
        "records" in args.p_payload ||
        "bytes" in args.p_payload
      ) {
        return {
          data: fail("SOURCE_INVALID", "Client storage path and source rows are not accepted"),
          error: null,
        };
      }
      if (args.p_operation !== "confirm_source_structure") {
        return {
          data: fail("DATABASE_WRITE_ERROR", "Unknown DATA source-structure operation"),
          error: null,
        };
      }
      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }
      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }
      const sessionId = typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const sourceId = typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }
      if (session.status === "cancelled") {
        return {
          data: fail("INVALID_STATE", "Cancelled sessions cannot accept structure discovery"),
          error: null,
        };
      }
      if (session.status !== "source_ready" && session.status !== "parsed") {
        return {
          data: fail(
            "INVALID_STATE",
            "Structure discovery requires a source_ready or parsed session",
          ),
          error: null,
        };
      }
      const source = input.store.sources.find(
        (row) =>
          row.id === sourceId &&
          row.organization_id === args.p_organization_id &&
          row.session_id === session.id,
      );
      if (!source) {
        return {
          data: fail("SOURCE_NOT_FOUND", "Intake source not found for this session"),
          error: null,
        };
      }
      if (!source.object_verified_at) {
        return {
          data: fail(
            "SOURCE_NOT_VERIFIED",
            "Source object must be verified before structure discovery",
          ),
          error: null,
        };
      }
      const sha256 = typeof args.p_payload.sha256 === "string" ? args.p_payload.sha256 : "";
      if (sha256 !== source.sha256) {
        return {
          data: fail("SOURCE_HASH_INVALID", "Discovery digest must match registered source sha256"),
          error: null,
        };
      }
      const encoding = typeof args.p_payload.encoding === "string" ? args.p_payload.encoding : null;
      const delimiter = typeof args.p_payload.delimiter === "string" ? args.p_payload.delimiter : null;
      const sheetName = typeof args.p_payload.sheet_name === "string" ? args.p_payload.sheet_name : null;
      const headerRowIndex =
        typeof args.p_payload.header_row_index === "number" ? args.p_payload.header_row_index : null;
      const rowCount = typeof args.p_payload.row_count === "number" ? args.p_payload.row_count : null;
      const columnCount =
        typeof args.p_payload.column_count === "number" ? args.p_payload.column_count : null;
      const parseMetadata =
        args.p_payload.parse_metadata &&
        typeof args.p_payload.parse_metadata === "object" &&
        !Array.isArray(args.p_payload.parse_metadata)
          ? (args.p_payload.parse_metadata as Record<string, unknown>)
          : {};
      if (source.header_row_index !== null) {
        return {
          data: {
            ok: true,
            session_id: session.id,
            status: session.status,
            target_domain: session.target_domain,
            source_kind: session.source_kind,
            source_id: source.id,
            storage_path: source.storage_path,
            storage_bucket: source.storage_bucket,
            event_id: randomUuid(),
            event_type: "source_parsed",
            replayed: true,
          },
          error: null,
        };
      }
      source.encoding = encoding;
      source.delimiter = delimiter;
      source.sheet_name = sheetName;
      source.header_row_index = headerRowIndex;
      source.row_count = rowCount;
      source.column_count = columnCount;
      source.parse_metadata = parseMetadata;
      session.status = "parsed";
      input.store.events.push({
        event_type: "source_parsed",
        metadata: {
          source_id: source.id,
          format: source.source_kind,
          parser_version: "data-parser-v1",
          column_count: columnCount,
          row_count: rowCount,
        },
      });
      return {
        data: {
          ok: true,
          session_id: session.id,
          status: session.status,
          target_domain: session.target_domain,
          source_kind: session.source_kind,
          source_id: source.id,
          storage_path: source.storage_path,
          storage_bucket: source.storage_bucket,
          event_id: randomUuid(),
          event_type: "source_parsed",
          replayed: false,
        },
        error: null,
      };
    },
  };
}

export function createMemoryDataIntakeMappingRpc(input: {
  tables: DataIntakeMemoryTables;
  store: DataIntakeMemoryStore;
  requireServiceRole?: boolean;
  isServiceRole?: boolean;
}): DataIntakeMappingRpcClient {
  const requireServiceRole = input.requireServiceRole ?? true;
  const allowedTargets = new Set(["display_name", "email", "phone", "first_name", "last_name"]);
  const forbiddenTargets = new Set([
    "id",
    "organization_id",
    "status",
    "owner_member_id",
    "created_by_member_id",
    "metadata",
    "started_at",
    "ended_at",
    "archived_at",
    "created_at",
    "updated_at",
  ]);

  function okPayload(session: SessionRow, source: SourceRow, extra: Record<string, unknown>) {
    return {
      ok: true,
      session_id: session.id,
      status: session.status,
      target_domain: session.target_domain,
      source_kind: session.source_kind,
      source_id: source.id,
      storage_path: source.storage_path,
      storage_bucket: source.storage_bucket,
      ...extra,
    };
  }

  return {
    async rpc(fn, args: DataIntakeMappingRpcArgs) {
      if (fn !== DATA_INTAKE_MAPPING_RPC) {
        return { data: null, error: { message: "unknown rpc" } };
      }
      if (requireServiceRole && input.isServiceRole === false) {
        return {
          data: fail("UNAUTHORIZED", "DATA mutation requires the privileged database role"),
          error: null,
        };
      }
      const org = input.tables.organizations.find((row) => row.id === args.p_organization_id);
      if (!org || org.status !== "active") {
        return { data: fail("ORG_NOT_FOUND", "Organization not found or not active"), error: null };
      }
      const member = input.tables.organization_members.find(
        (row) =>
          row.organization_id === args.p_organization_id &&
          row.id === args.p_actor_member_id &&
          row.user_id === args.p_actor_user_id,
      );
      if (!member || member.status !== "active") {
        return {
          data: fail("UNAUTHORIZED", "Active organization membership is required"),
          error: null,
        };
      }
      if (member.role !== "owner" && member.role !== "admin") {
        return { data: fail("FORBIDDEN_ROLE", "Owner or Admin role is required"), error: null };
      }
      if (
        args.p_payload.storage_path ||
        args.p_payload.records ||
        args.p_payload.bytes ||
        args.p_payload.rows
      ) {
        return {
          data: fail("SOURCE_INVALID", "Client storage path and source rows are not accepted"),
          error: null,
        };
      }
      const sessionId = typeof args.p_payload.session_id === "string" ? args.p_payload.session_id : "";
      const sourceId = typeof args.p_payload.source_id === "string" ? args.p_payload.source_id : "";
      const session = input.store.sessions.find(
        (row) => row.id === sessionId && row.organization_id === args.p_organization_id,
      );
      if (!session) {
        return { data: fail("SESSION_NOT_FOUND", "Intake session not found"), error: null };
      }
      if (session.target_domain !== "customer") {
        return {
          data: fail("TARGET_NOT_SUPPORTED", "DATA-1F mapping supports customer only"),
          error: null,
        };
      }
      if (session.status === "cancelled") {
        return {
          data: fail("INVALID_STATE", "Cancelled sessions cannot accept mapping"),
          error: null,
        };
      }
      if (
        session.status !== "parsed" &&
        session.status !== "mapping_required" &&
        session.status !== "mapped"
      ) {
        return {
          data: fail("INVALID_STATE", "Mapping requires a parsed or mapping session"),
          error: null,
        };
      }
      const source = input.store.sources.find(
        (row) =>
          row.id === sourceId &&
          row.organization_id === args.p_organization_id &&
          row.session_id === session.id,
      );
      if (!source) {
        return {
          data: fail("SOURCE_NOT_FOUND", "Intake source not found for this session"),
          error: null,
        };
      }
      if (source.header_row_index === null) {
        return {
          data: fail("INVALID_STATE", "Mapping requires completed structure discovery"),
          error: null,
        };
      }

      if (session.status === "mapped" && args.p_operation !== "confirm_mapping") {
        session.status = "mapping_required";
        for (const row of input.store.mappings) {
          if (row.source_id === source.id && row.status === "confirmed") {
            row.status = "proposed";
            row.confirmed_at = null;
            row.confirmed_by_user_id = null;
          }
        }
      }

      if (args.p_operation === "confirm_mapping") {
        if (session.status === "mapped") {
          return {
            data: okPayload(session, source, {
              event_id: randomUuid(),
              event_type: "mapping_confirmed",
              replayed: true,
            }),
            error: null,
          };
        }
        const requiredMapped = input.store.mappings.some(
          (row) =>
            row.source_id === source.id &&
            row.target_field === "display_name" &&
            (row.status === "proposed" || row.status === "confirmed"),
        );
        if (!requiredMapped) {
          return {
            data: fail("MAPPING_INCOMPLETE", "Required customer import fields are not mapped"),
            error: null,
          };
        }
        if (session.status === "parsed") {
          session.status = "mapping_required";
        }
        const now = new Date().toISOString();
        for (const row of input.store.mappings) {
          if (row.source_id === source.id && row.status === "proposed" && row.target_field) {
            row.status = "confirmed";
            row.confirmed_at = now;
            row.confirmed_by_user_id = args.p_actor_user_id;
          }
        }
        session.status = "mapped";
        input.store.events.push({
          event_type: "mapping_confirmed",
          metadata: {
            source_id: source.id,
            adapter_version: "customer.v1",
            target_domain: "customer",
            mapping_hash:
              typeof args.p_payload.mapping_hash === "string" ? args.p_payload.mapping_hash : null,
          },
        });
        return {
          data: okPayload(session, source, {
            event_id: randomUuid(),
            event_type: "mapping_confirmed",
            replayed: false,
          }),
          error: null,
        };
      }

      const sourceFieldKey =
        typeof args.p_payload.source_field_key === "string" ? args.p_payload.source_field_key : "";
      const sourceHeader =
        typeof args.p_payload.source_header === "string" ? args.p_payload.source_header : "";
      const targetField =
        typeof args.p_payload.target_field === "string" ? args.p_payload.target_field.trim() : "";
      if (
        !sourceFieldKey ||
        sourceFieldKey.length > 200 ||
        (!sourceFieldKey.startsWith("csv:") && !sourceFieldKey.startsWith("xlsx:"))
      ) {
        return {
          data: fail("SOURCE_COLUMN_UNKNOWN", "Source column is not in the frozen discovery"),
          error: null,
        };
      }

      if (args.p_operation === "upsert_mapping") {
        if (!targetField) {
          return { data: fail("TARGET_FIELD_UNKNOWN", "targetField is required"), error: null };
        }
        if (!allowedTargets.has(targetField)) {
          return {
            data: fail(
              forbiddenTargets.has(targetField) ? "TARGET_FIELD_FORBIDDEN" : "TARGET_FIELD_UNKNOWN",
              "Target field is not an approved customer import field",
            ),
            error: null,
          };
        }
        const conflict = input.store.mappings.find(
          (row) =>
            row.source_id === source.id &&
            row.target_field === targetField &&
            row.source_field_key !== sourceFieldKey &&
            (row.status === "proposed" || row.status === "confirmed"),
        );
        if (conflict) {
          return {
            data: fail(
              "DUPLICATE_TARGET_MAPPING",
              "Each customer field may be mapped from at most one source column",
            ),
            error: null,
          };
        }
      }

      if (session.status === "parsed") {
        session.status = "mapping_required";
      }

      const existing = input.store.mappings.find(
        (row) => row.source_id === source.id && row.source_field_key === sourceFieldKey,
      );
      let replayed = false;
      if (args.p_operation === "upsert_mapping") {
        if (
          existing &&
          existing.target_field === targetField &&
          (existing.status === "proposed" || existing.status === "confirmed")
        ) {
          replayed = true;
        } else if (!existing) {
          input.store.mappings.push({
            id: randomUuid(),
            organization_id: args.p_organization_id,
            session_id: session.id,
            source_id: source.id,
            source_field_key: sourceFieldKey,
            source_header: sourceHeader,
            target_domain: "customer",
            target_field: targetField,
            status: "proposed",
            proposal_source: "user",
            confirmed_by_user_id: null,
            confirmed_at: null,
          });
        } else {
          existing.source_header = sourceHeader;
          existing.target_field = targetField;
          existing.status = "proposed";
          existing.confirmed_at = null;
          existing.confirmed_by_user_id = null;
        }
      } else if (existing && existing.status === "rejected" && existing.target_field === null) {
        replayed = true;
      } else if (!existing) {
        input.store.mappings.push({
          id: randomUuid(),
          organization_id: args.p_organization_id,
          session_id: session.id,
          source_id: source.id,
          source_field_key: sourceFieldKey,
          source_header: sourceHeader,
          target_domain: "customer",
          target_field: null,
          status: "rejected",
          proposal_source: "user",
          confirmed_by_user_id: null,
          confirmed_at: null,
        });
      } else {
        existing.source_header = sourceHeader;
        existing.target_field = null;
        existing.status = "rejected";
        existing.confirmed_at = null;
        existing.confirmed_by_user_id = null;
      }

      if (!replayed) {
        input.store.events.push({
          event_type: "mapping_proposed",
          metadata: {
            source_id: source.id,
            source_field_key: sourceFieldKey,
            decision: args.p_operation === "ignore_source_column" ? "ignored" : "mapped",
          },
        });
      }
      return {
        data: okPayload(session, source, {
          event_id: randomUuid(),
          event_type: "mapping_proposed",
          replayed,
        }),
        error: null,
      };
    },
  };
}
