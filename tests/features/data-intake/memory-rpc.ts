import { DATA_INTAKE_STORAGE_BUCKET } from "@/features/data-intake/domain/constants";
import { DATA_INTAKE_FOUNDATION_RPC } from "@/features/data-intake/server/data-intake-rpc";
import type {
  DataIntakeFoundationRpcArgs,
  DataIntakeFoundationRpcClient,
} from "@/features/data-intake/server/data-intake-rpc";
import { buildDataIntakeStoragePath } from "@/features/data-intake/domain/storage-path";
import type { DataIntakeMemoryTables } from "./memory-query-client";

type SessionRow = {
  id: string;
  organization_id: string;
  status: string;
  target_domain: string;
  source_kind: string;
  created_by_user_id: string;
};

type SourceRow = {
  id: string;
  organization_id: string;
  session_id: string;
  superseded_at: string | null;
  storage_path: string;
};

export type DataIntakeMemoryStore = {
  sessions: SessionRow[];
  sources: SourceRow[];
  events: Array<{ event_type: string; metadata: Record<string, unknown> }>;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function fail(code: string, message: string) {
  return { ok: false, code, message };
}

function randomUuid() {
  return crypto.randomUUID();
}

export function emptyDataIntakeStore(): DataIntakeMemoryStore {
  return { sessions: [], sources: [], events: [] };
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
        if (session.status !== "created" && session.status !== "source_ready") {
          return {
            data: fail(
              "INVALID_STATE",
              "DATA-1C can cancel only pre-import created or source_ready sessions",
            ),
            error: null,
          };
        }
        session.status = "cancelled";
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
      input.store.events.push({ event_type: eventType, metadata: { source_id: sourceId } });
      input.store.sources.push({
        id: sourceId,
        organization_id: session.organization_id,
        session_id: session.id,
        superseded_at: null,
        storage_path: storagePath,
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
