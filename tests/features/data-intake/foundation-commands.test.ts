import { describe, expect, it } from "vitest";
import {
  ACTIVITY_A,
  ADMIN_USER,
  FOREIGN_USER,
  ORG_A,
  ORG_B,
  OWNER_USER,
  STAFF_USER,
  VALID_SHA256,
  VIEWER_USER,
  createService,
} from "./harness";
import { parseDataIntakeStoragePath } from "@/features/data-intake/domain/storage-path";
import { DATA_CSV_MIME, DATA_INTAKE_STORAGE_BUCKET } from "@/features/data-intake/domain/constants";

describe("DATA-1C create session", () => {
  it("creates a customer csv session for Owner and records intake_created without PII", async () => {
    const { service, store } = createService({ userId: OWNER_USER });
    const result = await service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value.status).toBe("created");
      expect(result.value.targetDomain).toBe("customer");
      expect(result.value.sourceKind).toBe("csv");
      expect(result.value.eventType).toBe("intake_created");
    }
    expect(store.events[0]?.metadata).toEqual({
      target_domain: "customer",
      source_kind: "csv",
    });
  });

  it("allows Admin and denies Staff, Viewer, foreign Owner, and unauthenticated", async () => {
    const admin = await createService({ userId: ADMIN_USER }).service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "xlsx",
    });
    const staff = await createService({ userId: STAFF_USER }).service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    const viewer = await createService({ userId: VIEWER_USER }).service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    const foreign = await createService({ userId: FOREIGN_USER }).service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    const anon = await createService({ userId: null }).service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    expect(admin.ok).toBe(true);
    expect(staff.ok).toBe(false);
    if (!staff.ok) expect(staff.error.code).toBe("FORBIDDEN_ROLE");
    expect(viewer.ok).toBe(false);
    if (!viewer.ok) expect(viewer.error.code).toBe("FORBIDDEN_ROLE");
    expect(foreign.ok).toBe(false);
    if (!foreign.ok) expect(foreign.error.code).toBe("ORG_NOT_FOUND");
    expect(anon.ok).toBe(false);
    if (!anon.ok) expect(anon.error.code).toBe("UNAUTHORIZED");
  });

  it("fails closed when a Customer session supplies a Business Activity", async () => {
    const { service, store } = createService({ userId: OWNER_USER });
    const result = await service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
      businessActivityId: ACTIVITY_A,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe("ACTIVITY_NOT_ALLOWED_FOR_TARGET");
    }
    expect(store.sessions).toHaveLength(0);
  });
});

describe("DATA-1C register source", () => {
  it("registers metadata, generates a tenant path, and moves created to source_ready", async () => {
    const { service, store } = createService({ userId: OWNER_USER });
    const created = await service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    expect(created.ok).toBe(true);
    if (!created.ok) return;
    const registered = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "C:\\exports\\customers.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: 2048,
      sha256: VALID_SHA256,
      sourceKind: "csv",
    });
    expect(registered.ok).toBe(true);
    if (!registered.ok) return;
    expect(registered.value.status).toBe("source_ready");
    expect(registered.value.storageBucket).toBe(DATA_INTAKE_STORAGE_BUCKET);
    expect(registered.value.eventType).toBe("source_uploaded");
    const parsed = parseDataIntakeStoragePath(registered.value.storagePath ?? "");
    expect(parsed?.organizationId).toBe(ORG_A);
    expect(parsed?.sessionId).toBe(created.value.sessionId);
    expect(parsed?.sourceId).toBe(registered.value.sourceId);
    expect(store.sources).toHaveLength(1);
  });

  it("supersedes the previous active source instead of overwriting hash/path", async () => {
    const { service, store } = createService({ userId: OWNER_USER });
    const created = await service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    if (!created.ok) throw new Error("create failed");
    const first = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "one.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: 100,
      sha256: VALID_SHA256,
    });
    const second = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "two.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: 200,
      sha256: "b".repeat(64),
    });
    expect(first.ok && second.ok).toBe(true);
    expect(store.sources).toHaveLength(2);
    expect(store.sources.filter((row) => row.superseded_at === null)).toHaveLength(1);
    if (second.ok) expect(second.value.eventType).toBe("source_replaced");
    expect(store.sources[0]?.storage_path).not.toBe(store.sources[1]?.storage_path);
  });

  it("rejects .xls, oversize files, invalid hashes, and Org B sessions", async () => {
    const { service } = createService({ userId: OWNER_USER });
    const created = await service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    if (!created.ok) throw new Error("create failed");
    const xls = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "legacy.xls",
      mimeType: DATA_CSV_MIME,
      byteSize: 100,
      sha256: VALID_SHA256,
    });
    const oversize = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "big.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: 10 * 1024 * 1024 + 1,
      sha256: VALID_SHA256,
    });
    const badHash = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "ok.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: 100,
      sha256: "not-a-hash",
    });
    const crossTenant = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      originalFilename: "ok.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: 100,
      sha256: VALID_SHA256,
    });
    expect(xls.ok).toBe(false);
    if (!xls.ok) expect(xls.error.code).toBe("UNSUPPORTED_FILE");
    expect(oversize.ok).toBe(false);
    if (!oversize.ok) expect(oversize.error.code).toBe("FILE_TOO_LARGE");
    expect(badHash.ok).toBe(false);
    if (!badHash.ok) expect(badHash.error.code).toBe("SOURCE_HASH_INVALID");
    expect(crossTenant.ok).toBe(false);
    if (!crossTenant.ok) expect(crossTenant.error.code).toBe("SESSION_NOT_FOUND");
  });

  it("cancels created sessions and refuses later mutation", async () => {
    const { service } = createService({ userId: OWNER_USER });
    const created = await service.createDataIntakeSession({
      organizationId: ORG_A,
      targetDomain: "customer",
      sourceKind: "csv",
    });
    if (!created.ok) throw new Error("create failed");
    const cancelled = await service.cancelDataIntakeSession({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
    });
    expect(cancelled.ok && cancelled.value.status).toBe("cancelled");
    const register = await service.registerDataIntakeSource({
      organizationId: ORG_A,
      sessionId: created.value.sessionId,
      originalFilename: "ok.csv",
      mimeType: DATA_CSV_MIME,
      byteSize: 100,
      sha256: VALID_SHA256,
    });
    expect(register.ok).toBe(false);
    if (!register.ok) expect(register.error.code).toBe("INVALID_STATE");
  });
});
