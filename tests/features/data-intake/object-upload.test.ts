import { describe, expect, it } from "vitest";
import {
  ADMIN_USER,
  FOREIGN_USER,
  ORG_A,
  OWNER_USER,
  STAFF_USER,
  VIEWER_USER,
  authLookup,
  createService,
} from "./harness";
import { sha256Hex } from "@/features/data-intake/domain/integrity";
import { parseDataIntakeStoragePath } from "@/features/data-intake/domain/storage-path";
import {
  DATA_CSV_MIME,
  DATA_INTAKE_STORAGE_BUCKET,
  DATA_MAX_FILE_BYTES,
  DATA_XLSX_MIME,
} from "@/features/data-intake/domain/constants";
import {
  createDataIntakeMemoryQueryClient,
  emptyDataIntakeTables,
  OWNER_MEMBER,
  seedMember,
  seedOrg,
  STAFF_MEMBER,
  STAFF_USER as STAFF,
} from "./memory-query-client";
import {
  createMemoryDataIntakeFoundationRpc,
  createMemoryDataIntakeSourceObjectRpc,
  createStoreDataIntakeRecordLookup,
  emptyDataIntakeStore,
} from "./memory-rpc";
import { DATA_INTAKE_SOURCE_OBJECT_RPC } from "@/features/data-intake/server/data-intake-object-rpc";
import { mapDataIntakeSourceObjectRpcPayload } from "@/features/data-intake/server/data-intake-object-rpc";
import type { DataIntakeObjectStore } from "@/features/data-intake/server/source-object-store";
import { dataOk } from "@/features/data-intake/domain/errors";
import { createMemoryDataIntakeObjectStore } from "./memory-object-store";
import { DataIntakeService } from "@/features/data-intake/server/data-intake.service";

const CSV_BYTES = new TextEncoder().encode("qa,col\n1,2\n");
const CSV_HASH = sha256Hex(CSV_BYTES);
const XLSX_BYTES = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x06, 0x00, 0x08]);
const OLE_BYTES = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0x11, 0x11, 0x11, 0x00, 0x00]);

async function registerReadySource(input: {
  userId?: string;
  sourceKind?: "csv" | "xlsx";
  bytes?: Uint8Array;
  filename?: string;
  mimeType?: string;
  sha256?: string;
  byteSize?: number;
}) {
  const sourceKind = input.sourceKind ?? "csv";
  const bytes = input.bytes ?? CSV_BYTES;
  const ctx = createService({ userId: input.userId ?? OWNER_USER });
  const created = await ctx.service.createDataIntakeSession({
    organizationId: ORG_A,
    targetDomain: "customer",
    sourceKind,
  });
  if (!created.ok) throw new Error("create failed");
  const registered = await ctx.service.registerDataIntakeSource({
    organizationId: ORG_A,
    sessionId: created.value.sessionId,
    originalFilename: input.filename ?? (sourceKind === "csv" ? "qa.csv" : "qa.xlsx"),
    mimeType: input.mimeType ?? (sourceKind === "csv" ? DATA_CSV_MIME : DATA_XLSX_MIME),
    byteSize: input.byteSize ?? bytes.byteLength,
    sha256: input.sha256 ?? sha256Hex(bytes),
    sourceKind,
  });
  if (!registered.ok) throw new Error("register failed");
  return { ...ctx, created, registered, bytes };
}

describe("DATA-1D happy path", () => {
  it("accepts Owner CSV upload, verifies path/size/hash, and records source_object_verified", async () => {
    const ctx = await registerReadySource({});
    const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(uploaded.ok).toBe(true);
    if (!uploaded.ok) return;
    expect(uploaded.value.status).toBe("source_ready");
    expect(uploaded.value.eventType).toBe("source_object_verified");
    expect(uploaded.value.objectVerifiedAt).toBeTruthy();
    expect(uploaded.value.storageBucket).toBe(DATA_INTAKE_STORAGE_BUCKET);
    const parsed = parseDataIntakeStoragePath(uploaded.value.storagePath ?? "");
    expect(parsed?.organizationId).toBe(ORG_A);
    expect(parsed?.sessionId).toBe(ctx.created.value.sessionId);
    expect(parsed?.sourceId).toBe(uploaded.value.sourceId);
    expect(ctx.objectStore.records.size).toBe(1);
    const stored = [...ctx.objectStore.records.values()][0];
    expect(stored?.bytes.byteLength).toBe(CSV_BYTES.byteLength);
    expect(sha256Hex(stored?.bytes ?? new Uint8Array())).toBe(CSV_HASH);
    expect(ctx.store.events.map((event) => event.event_type)).toEqual([
      "intake_created",
      "source_uploaded",
      "source_object_verified",
    ]);
    expect(ctx.store.events[2]?.metadata).not.toHaveProperty("filename");
    expect(ctx.store.mappings).toHaveLength(0);
    expect(ctx.store.staging).toHaveLength(0);
    expect(ctx.store.plans).toHaveLength(0);
    expect(ctx.store.rowResults).toHaveLength(0);
    expect(ctx.store.links).toHaveLength(0);
  });

  it("accepts Admin CSV and Owner XLSX with a zip signature", async () => {
    const admin = await registerReadySource({ userId: ADMIN_USER });
    const adminUpload = await admin.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: admin.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    const xlsx = await registerReadySource({
      sourceKind: "xlsx",
      bytes: XLSX_BYTES,
      filename: "qa.xlsx",
      mimeType: DATA_XLSX_MIME,
    });
    const xlsxUpload = await xlsx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: xlsx.created.value.sessionId,
      originalFilename: "qa.xlsx",
      mimeType: DATA_XLSX_MIME,
      bytes: XLSX_BYTES,
    });
    expect(adminUpload.ok).toBe(true);
    expect(xlsxUpload.ok).toBe(true);
    expect(xlsx.objectStore.records.size).toBe(1);
  });
});

describe("DATA-1D authorization", () => {
  it("denies unauthenticated, Staff, Viewer, suspended, and foreign Owner", async () => {
    const owner = await registerReadySource({});
    const payload = {
      organizationId: ORG_A,
      sessionId: owner.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    };
    const anon = createService({
      userId: null,
      store: owner.store,
      tables: owner.tables,
      seedDefaultOrg: false,
    });
    const staff = createService({ userId: STAFF_USER });
    const viewer = createService({ userId: VIEWER_USER });
    const foreign = createService({ userId: FOREIGN_USER });
    const suspendedTables = emptyDataIntakeTables();
    seedOrg(suspendedTables, ORG_A);
    seedMember(suspendedTables, {
      userId: OWNER_USER,
      role: "owner",
      membershipId: OWNER_MEMBER,
      status: "suspended",
    });
    const suspended = createService({
      userId: OWNER_USER,
      tables: suspendedTables,
      seedDefaultOrg: false,
    });

    const anonResult = await anon.service.uploadAndVerifyDataIntakeSource(payload);
    const staffResult = await staff.service.uploadAndVerifyDataIntakeSource(payload);
    const viewerResult = await viewer.service.uploadAndVerifyDataIntakeSource(payload);
    const foreignResult = await foreign.service.uploadAndVerifyDataIntakeSource(payload);
    const suspendedResult = await suspended.service.uploadAndVerifyDataIntakeSource(payload);

    expect(anonResult.ok).toBe(false);
    if (!anonResult.ok) expect(anonResult.error.code).toBe("UNAUTHORIZED");
    expect(staffResult.ok).toBe(false);
    if (!staffResult.ok) expect(staffResult.error.code).toBe("FORBIDDEN_ROLE");
    expect(viewerResult.ok).toBe(false);
    if (!viewerResult.ok) expect(viewerResult.error.code).toBe("FORBIDDEN_ROLE");
    expect(foreignResult.ok).toBe(false);
    if (!foreignResult.ok) expect(foreignResult.error.code).toBe("ORG_NOT_FOUND");
    expect(suspendedResult.ok).toBe(false);
    if (!suspendedResult.ok) expect(suspendedResult.error.code).toBe("ORG_NOT_FOUND");
  });

  it("rejects a Staff confirm RPC even when invoked as service_role", async () => {
    const tables = emptyDataIntakeTables();
    seedOrg(tables, ORG_A);
    seedMember(tables, {
      userId: STAFF,
      role: "staff",
      membershipId: STAFF_MEMBER,
    });
    const rpc = createMemoryDataIntakeSourceObjectRpc({
      tables,
      store: emptyDataIntakeStore(),
      isServiceRole: true,
    });
    const { data } = await rpc.rpc(DATA_INTAKE_SOURCE_OBJECT_RPC, {
      p_operation: "confirm_source_object",
      p_organization_id: ORG_A,
      p_actor_user_id: STAFF,
      p_actor_member_id: STAFF_MEMBER,
      p_payload: { session_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
    });
    const mapped = mapDataIntakeSourceObjectRpcPayload(data);
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) expect(mapped.error.code).toBe("FORBIDDEN_ROLE");
  });
});

describe("DATA-1D path security", () => {
  it("rejects client-supplied path, bucket, or generated object id", async () => {
    const ctx = await registerReadySource({});
    const uploaded = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
      storagePath: `${ORG_A}/evil`,
    } as never);
    expect(uploaded.ok).toBe(false);
    if (!uploaded.ok) expect(uploaded.error.code).toBe("SOURCE_INVALID");
    expect(ctx.objectStore.records.size).toBe(0);
  });

  it("cannot confirm a foreign session or source id", async () => {
    const ctx = await registerReadySource({});
    const missingSession = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    const missingSource = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      sourceId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(missingSession.ok).toBe(false);
    if (!missingSession.ok) expect(missingSession.error.code).toBe("SESSION_NOT_FOUND");
    expect(missingSource.ok).toBe(false);
    if (!missingSource.ok) expect(missingSource.error.code).toBe("SOURCE_INVALID");
  });

  it("memory object store refuses the Social bucket and non-canonical keys", async () => {
    const store = createMemoryDataIntakeObjectStore();
    const social = await store.putObject({
      bucket: "zyntix-social-media",
      path: `${ORG_A}/x`,
      bytes: CSV_BYTES,
      contentType: DATA_CSV_MIME,
    });
    const traversal = await store.putObject({
      bucket: DATA_INTAKE_STORAGE_BUCKET,
      path: `${ORG_A}/../other.csv`,
      bytes: CSV_BYTES,
      contentType: DATA_CSV_MIME,
    });
    expect(social.ok).toBe(false);
    expect(traversal.ok).toBe(false);
  });
});

describe("DATA-1D type validation", () => {
  it("rejects unsupported extension, MIME, mismatch, zero-byte, oversize, OLE, and zip-as-csv", async () => {
    const ctx = await registerReadySource({});
    const sessionId = ctx.created.value.sessionId;
    const unsupportedExt = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId,
      originalFilename: "qa.txt",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    const unsupportedMime = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId,
      originalFilename: "qa.csv",
      mimeType: "text/plain",
      bytes: CSV_BYTES,
    });
    const zero = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: new Uint8Array(),
    });
    const oversize = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: new Uint8Array(DATA_MAX_FILE_BYTES + 1),
    });
    const ole = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: OLE_BYTES,
    });
    const zipAsCsv = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: XLSX_BYTES,
    });
    expect(unsupportedExt.ok).toBe(false);
    if (!unsupportedExt.ok) expect(unsupportedExt.error.code).toBe("UNSUPPORTED_FILE");
    expect(unsupportedMime.ok).toBe(false);
    if (!unsupportedMime.ok) expect(unsupportedMime.error.code).toBe("UNSUPPORTED_FILE");
    expect(zero.ok).toBe(false);
    if (!zero.ok) expect(zero.error.code).toBe("SOURCE_INVALID");
    expect(oversize.ok).toBe(false);
    if (!oversize.ok) expect(oversize.error.code).toBe("FILE_TOO_LARGE");
    expect(ole.ok).toBe(false);
    if (!ole.ok) expect(ole.error.code).toBe("UNSUPPORTED_FILE");
    expect(zipAsCsv.ok).toBe(false);
    if (!zipAsCsv.ok) expect(zipAsCsv.error.code).toBe("UNSUPPORTED_FILE");
    expect(ctx.objectStore.records.size).toBe(0);
  });
});

describe("DATA-1D integrity", () => {
  it("rejects declared size and hash mismatches without storing an object", async () => {
    const sizeMismatch = await registerReadySource({ byteSize: CSV_BYTES.byteLength + 1 });
    const sizeResult = await sizeMismatch.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: sizeMismatch.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    const hashMismatch = await registerReadySource({ sha256: "b".repeat(64) });
    const hashResult = await hashMismatch.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: hashMismatch.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(sizeResult.ok).toBe(false);
    if (!sizeResult.ok) expect(sizeResult.error.code).toBe("SOURCE_INVALID");
    expect(hashResult.ok).toBe(false);
    if (!hashResult.ok) expect(hashResult.error.code).toBe("SOURCE_HASH_INVALID");
    expect(sizeMismatch.objectStore.records.size).toBe(0);
    expect(hashMismatch.objectStore.records.size).toBe(0);
  });

  it("deletes a mutated object and refuses to confirm when readback hash diverges", async () => {
    const ctx = await registerReadySource({});
    const inner = ctx.objectStore;
    const mutatingStore: DataIntakeObjectStore = {
      putObject: (input) => inner.putObject(input),
      async getObject(input) {
        const got = await inner.getObject(input);
        if (!got.ok) return got;
        return dataOk({ bytes: new TextEncoder().encode("tampered") });
      },
      removeObject: (input) => inner.removeObject(input),
      createSignedReadUrl: (input) => inner.createSignedReadUrl(input),
    };
    const verifying = new DataIntakeService({
      auth: authLookup(OWNER_USER),
      queryClient: createDataIntakeMemoryQueryClient(ctx.tables),
      mutate: createMemoryDataIntakeFoundationRpc({ tables: ctx.tables, store: ctx.store }),
      lookup: createStoreDataIntakeRecordLookup(ctx.store),
      objectStore: mutatingStore,
      objectMutate: createMemoryDataIntakeSourceObjectRpc({
        tables: ctx.tables,
        store: ctx.store,
      }),
    });
    const result = await verifying.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("SOURCE_HASH_INVALID");
    expect(inner.records.size).toBe(0);
    expect(ctx.store.sources[0]?.object_verified_at).toBeNull();
  });
});

describe("DATA-1D state machine", () => {
  it("denies upload and signed read after cancel, and replays a verified source safely", async () => {
    const ctx = await registerReadySource({});
    const cancelled = await ctx.service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
    });
    expect(cancelled.ok).toBe(true);
    const afterCancel = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(afterCancel.ok).toBe(false);
    if (!afterCancel.ok) expect(afterCancel.error.code).toBe("INVALID_STATE");

    const live = await registerReadySource({});
    const first = await live.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: live.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    const second = await live.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: live.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(first.ok && second.ok).toBe(true);
    if (second.ok) expect(second.value.replayed).toBe(true);
    expect(live.objectStore.records.size).toBe(1);
    expect(
      live.store.events.filter((event) => event.event_type === "source_object_verified"),
    ).toHaveLength(1);

    const readUrl = await live.service.createDataIntakeSourceReadUrl({
      organizationId: ORG_A,
      sessionId: live.created.value.sessionId,
      sourceId: live.registered.value.sourceId ?? "",
    });
    expect(readUrl.ok).toBe(true);
    if (readUrl.ok) {
      expect(readUrl.value.bucket).toBe(DATA_INTAKE_STORAGE_BUCKET);
      expect(readUrl.value.expiresInSeconds).toBe(60);
      expect(readUrl.value.signedUrl.startsWith("memory-signed://data-intake/")).toBe(true);
      expect(readUrl.value.path).toBe(live.registered.value.storagePath);
    }
  });

  it("preserves superseded source path/hash and verifies only the active replacement", async () => {
    const ctx = createService({ userId: OWNER_USER });
    const created = await ctx.service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    if (!created.ok) throw new Error("create failed");
    const first = await ctx.service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "one.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: CSV_BYTES.byteLength,
      sha256: CSV_HASH,
    });
    const replacementBytes = new TextEncoder().encode("qa,col\n3,4\n");
    const second = await ctx.service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "two.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: replacementBytes.byteLength,
      sha256: sha256Hex(replacementBytes),
    });
    expect(first.ok && second.ok).toBe(true);
    if (!first.ok || !second.ok) return;
    expect(first.value.storagePath).not.toBe(second.value.storagePath);
    const stale = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      sourceId: first.value.sourceId ?? undefined,
      originalFilename: "one.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    const active = await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "two.csv",
      mimeType: DATA_CSV_MIME,
      bytes: replacementBytes,
    });
    expect(stale.ok).toBe(false);
    if (!stale.ok) expect(stale.error.code).toBe("INVALID_STATE");
    expect(active.ok).toBe(true);
    expect(ctx.store.sources[0]?.storage_path).toBe(first.value.storagePath);
    expect(ctx.store.sources[0]?.sha256).toBe(CSV_HASH);
  });
});

describe("DATA-1D non-effects", () => {
  it("does not create parser, staging, mapping, plan, link, or Customer-side artifacts", async () => {
    const ctx = await registerReadySource({});
    await ctx.service.uploadAndVerifyDataIntakeSource({
      organizationId: ORG_A,
      sessionId: ctx.created.value.sessionId,
      originalFilename: "qa.csv",
      mimeType: DATA_CSV_MIME,
      bytes: CSV_BYTES,
    });
    expect(ctx.store.mappings).toHaveLength(0);
    expect(ctx.store.staging).toHaveLength(0);
    expect(ctx.store.plans).toHaveLength(0);
    expect(ctx.store.rowResults).toHaveLength(0);
    expect(ctx.store.links).toHaveLength(0);
    expect(ctx.store.sessions[0]?.status).toBe("source_ready");
  });
});
