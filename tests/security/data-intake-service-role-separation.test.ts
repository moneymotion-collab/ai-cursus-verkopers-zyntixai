import { describe, expect, it } from "vitest";
import { mapDataIntakeFoundationRpcPayload } from "@/features/data-intake/server/data-intake-rpc";
import { DATA_INTAKE_FOUNDATION_RPC } from "@/features/data-intake/server/data-intake-rpc";
import {
  createMemoryDataIntakeFoundationRpc,
  emptyDataIntakeStore,
} from "../features/data-intake/memory-rpc";
import {
  emptyDataIntakeTables,
  ORG_A,
  OWNER_MEMBER,
  OWNER_USER,
  STAFF_MEMBER,
  STAFF_USER,
  seedMember,
  seedOrg,
} from "../features/data-intake/memory-query-client";

describe("DATA-1C RPC mapper and service_role separation", () => {
  it("maps a bounded success payload and rejects incomplete rows", () => {
    const ok = mapDataIntakeFoundationRpcPayload({
      ok: true,
      session_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
      status: "created",
      target_domain: "customer",
      source_kind: "csv",
      source_id: null,
      event_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      event_type: "intake_created",
    });
    expect(ok.ok).toBe(true);
    const fail = mapDataIntakeFoundationRpcPayload({
      ok: false,
      code: "FORBIDDEN_ROLE",
      message: "Owner or Admin role is required",
    });
    expect(fail.ok).toBe(false);
    if (!fail.ok) expect(fail.error.code).toBe("FORBIDDEN_ROLE");
  });

  it("rejects a Staff actor even when invoked as service_role", async () => {
    const tables = emptyDataIntakeTables();
    seedOrg(tables, ORG_A);
    seedMember(tables, {
      userId: STAFF_USER,
      role: "staff",
      membershipId: STAFF_MEMBER,
    });
    const rpc = createMemoryDataIntakeFoundationRpc({
      tables,
      store: emptyDataIntakeStore(),
      isServiceRole: true,
    });
    const { data } = await rpc.rpc(DATA_INTAKE_FOUNDATION_RPC, {
      p_operation: "create_session",
      p_organization_id: ORG_A,
      p_actor_user_id: STAFF_USER,
      p_actor_member_id: STAFF_MEMBER,
      p_payload: { target_domain: "customer", source_kind: "csv" },
    });
    const mapped = mapDataIntakeFoundationRpcPayload(data);
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) expect(mapped.error.code).toBe("FORBIDDEN_ROLE");
  });

  it("rejects missing service_role even for an Owner actor", async () => {
    const tables = emptyDataIntakeTables();
    seedOrg(tables, ORG_A);
    seedMember(tables, {
      userId: OWNER_USER,
      role: "owner",
      membershipId: OWNER_MEMBER,
    });
    const rpc = createMemoryDataIntakeFoundationRpc({
      tables,
      store: emptyDataIntakeStore(),
      isServiceRole: false,
    });
    const { data } = await rpc.rpc(DATA_INTAKE_FOUNDATION_RPC, {
      p_operation: "create_session",
      p_organization_id: ORG_A,
      p_actor_user_id: OWNER_USER,
      p_actor_member_id: OWNER_MEMBER,
      p_payload: { target_domain: "customer", source_kind: "csv" },
    });
    const mapped = mapDataIntakeFoundationRpcPayload(data);
    expect(mapped.ok).toBe(false);
    if (!mapped.ok) expect(mapped.error.code).toBe("UNAUTHORIZED");
  });
});
