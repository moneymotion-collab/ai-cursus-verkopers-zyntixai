import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION =
  "20260907230410_create_onboarding_team_invite_intent_authority.sql";
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION),
  "utf8",
);
const migrationFiles = readdirSync(
  join(process.cwd(), "supabase/migrations"),
);

function functionBody(schema: "private" | "public", name: string): string {
  const marker = `create or replace function ${schema}.${name}`;
  const start = sql.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const next = sql.indexOf("create or replace function ", start + marker.length);
  return sql.slice(start, next === -1 ? undefined : next);
}

const actorGate = functionBody(
  "private",
  "resolve_onboarding_team_invite_intent_actor",
);
const collisionGate = functionBody(
  "private",
  "resolve_onboarding_team_invite_intent_collision",
);
const listRpc = functionBody(
  "public",
  "list_organization_onboarding_team_invite_intents",
);
const createRpc = functionBody(
  "public",
  "create_organization_onboarding_team_invite_intent",
);
const updateRpc = functionBody(
  "public",
  "update_organization_onboarding_team_invite_intent",
);
const deleteRpc = functionBody(
  "public",
  "delete_organization_onboarding_team_invite_intent",
);

describe("ENG-ONB-1G-A1 migration scope and data model", () => {
  it("ships exactly one canonical Team invite-intent migration and table", () => {
    expect(
      migrationFiles.filter((file) =>
        file.includes("onboarding_team_invite_intent_authority"),
      ),
    ).toEqual([MIGRATION]);
    expect(sql).toMatch(/^-- ENG-ONB-1G-A1/);
    expect(sql.match(/create table public\./g)).toHaveLength(1);
    expect(sql).toContain(
      "create table public.organization_onboarding_team_invite_intents",
    );
  });

  it("uses the organization-owned minimal durable model", () => {
    const table = sql.slice(
      sql.indexOf(
        "create table public.organization_onboarding_team_invite_intents",
      ),
      sql.indexOf(");", sql.indexOf("create table public.")) + 2,
    );
    expect(sql).toMatch(
      /organization_id uuid not null\s+references public\.organizations \(id\) on delete cascade/i,
    );
    for (const column of [
      "id uuid primary key default gen_random_uuid()",
      "email_normalized text not null",
      "role text not null",
      "revision bigint not null default 1",
      "created_at timestamptz not null",
      "updated_at timestamptz not null",
    ]) {
      expect(table).toContain(column);
    }
    expect(table).not.toMatch(
      /\b(display_name|phone|title|avatar|department)\b/i,
    );
  });

  it("enforces canonical email, exact role, uniqueness, and revision constraints", () => {
    expect(sql).toMatch(
      /unique \(organization_id, email_normalized\)/i,
    );
    expect(sql).toMatch(
      /email_normalized = pg_catalog\.lower\(pg_catalog\.btrim\(email_normalized\)\)/i,
    );
    expect(sql).toContain("char_length(email_normalized) between 3 and 254");
    expect(sql).toMatch(/check \(role in \('admin', 'staff', 'viewer'\)\)/i);
    expect(sql).not.toMatch(/check \(role in \([^)]*'owner'/i);
    expect(sql).toContain("check (revision >= 1)");
  });

  it("contains no actionable invitation fields or draft status machine", () => {
    const table = sql.slice(
      sql.indexOf(
        "create table public.organization_onboarding_team_invite_intents",
      ),
      sql.indexOf(");", sql.indexOf("create table public.")) + 2,
    );
    for (const forbidden of [
      "token",
      "token_hash",
      "expires_at",
      "delivery",
      "status",
      "accepted",
      "revoked",
      "sent",
      "ready",
    ]) {
      expect(table).not.toMatch(new RegExp(`\\b${forbidden}\\b`, "i"));
    }
  });
});

describe("ENG-ONB-1G-A1 authorization and lifecycle authority", () => {
  it("derives the actor from auth and requires an active Owner membership", () => {
    expect(actorGate).toContain("v_user_id := auth.uid()");
    expect(actorGate).not.toMatch(/p_(actor|user)_/i);
    expect(actorGate).toContain("om.organization_id = p_organization_id");
    expect(actorGate).toContain("om.user_id = v_user_id");
    expect(actorGate).toContain("om.status = 'active'");
    expect(actorGate).toContain("om.role = 'owner'");
  });

  it("accepts only the exact governed V2 configured lifecycle", () => {
    expect(actorGate).toContain(
      "v_org.onboarding_flow_version is distinct from 2",
    );
    expect(actorGate).toContain(
      "v_org.onboarding_setup_ready_at is not null",
    );
    expect(actorGate).toContain(
      "v_org.onboarding_completed_at is not null",
    );
    expect(actorGate).toContain("organization_business_activities");
    expect(actorGate).toContain("organization_context_assignments");
    expect(actorGate).toContain("context_pack_readiness");
    expect(actorGate).toContain("'INVALID_LIFECYCLE'");
    for (const pack of [
      "niche.online-course-business",
      "foundation.knowledge",
      "foundation.service",
      "foundation.field-operations",
      "foundation.product-operations",
    ]) {
      expect(actorGate).toContain(`'${pack}'`);
    }
  });

  it("never mutates onboarding lifecycle columns", () => {
    expect(sql).not.toMatch(
      /(?:update|insert into)\s+public\.organizations\b/i,
    );
    expect(sql).not.toContain(
      "set onboarding_setup_ready_at",
    );
    expect(sql).not.toContain(
      "set onboarding_completed_at",
    );
  });
});

describe("ENG-ONB-1G-A1 collision and concurrency contracts", () => {
  it("protects self, existing membership, active pending invitation, and duplicates", () => {
    expect(createRpc).toContain(
      "v_email_normalized = v_gate.actor_email_normalized",
    );
    expect(createRpc).toContain("'SELF_INVITE'");
    expect(collisionGate).toContain("public.organization_members");
    expect(collisionGate).toContain("'EXISTING_MEMBER'");
    expect(collisionGate).toContain("public.organization_invitations");
    expect(collisionGate).toContain("oi.status = 'pending'");
    expect(collisionGate).toContain("oi.expires_at > pg_catalog.now()");
    expect(collisionGate).toContain("'PENDING_INVITATION'");
    expect(collisionGate).toContain("'DUPLICATE_INTENT'");
  });

  it("normalizes all create and update email input server-side", () => {
    expect(createRpc).toContain(
      "private.normalize_onboarding_team_invite_intent_email(p_email)",
    );
    expect(updateRpc).toContain(
      "private.normalize_onboarding_team_invite_intent_email(p_email)",
    );
    expect(createRpc).toContain("'INVALID_EMAIL'");
    expect(updateRpc).toContain("'INVALID_EMAIL'");
    expect(createRpc).toContain("'INVALID_ROLE'");
    expect(updateRpc).toContain("'INVALID_ROLE'");
  });

  it("requires a current expected revision for update and delete", () => {
    expect(updateRpc).toContain("p_expected_revision <> v_intent.revision");
    expect(updateRpc).toContain("revision = i.revision + 1");
    expect(updateRpc).toContain("'STALE_REVISION'");
    expect(deleteRpc).toContain("p_expected_revision <> v_intent.revision");
    expect(deleteRpc).toContain("'STALE_REVISION'");
  });

  it("locks mutations by organization and scopes every target row", () => {
    for (const body of [createRpc, updateRpc, deleteRpc]) {
      expect(body).toMatch(/pg_advisory_xact_lock\(\s*872003,/i);
      expect(body).toContain(
        "resolve_onboarding_team_invite_intent_actor(p_organization_id)",
      );
    }
    for (const body of [updateRpc, deleteRpc]) {
      expect(body).toContain("i.organization_id = p_organization_id");
      expect(body).toContain("i.id = p_intent_id");
    }
  });
});

describe("ENG-ONB-1G-A1 RLS and RPC boundary", () => {
  it("enables RLS and denies direct public, anon, and authenticated table access", () => {
    expect(sql).toContain(
      "alter table public.organization_onboarding_team_invite_intents enable row level security",
    );
    expect(sql).toMatch(
      /revoke all on table public\.organization_onboarding_team_invite_intents\s+from public, anon, authenticated/i,
    );
    expect(sql).not.toMatch(
      /grant\s+(?:insert|update|delete|all)\s+on table public\.organization_onboarding_team_invite_intents/i,
    );
  });

  it("uses hardened definer RPCs exposed only to authenticated", () => {
    for (const body of [listRpc, createRpc, updateRpc, deleteRpc]) {
      expect(body).toMatch(/security definer\s+set search_path = ''/i);
    }
    for (const name of [
      "list_organization_onboarding_team_invite_intents",
      "create_organization_onboarding_team_invite_intent",
      "update_organization_onboarding_team_invite_intent",
      "delete_organization_onboarding_team_invite_intent",
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}\\([\\s\\S]*?from public, anon`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `grant execute on function public\\.${name}\\([\\s\\S]*?to authenticated`,
          "i",
        ),
      );
    }
  });

  it("returns only deterministic organization-scoped intent data", () => {
    expect(listRpc).toContain("i.organization_id = p_organization_id");
    expect(listRpc).toContain("order by i.created_at, i.id");
    for (const field of [
      "'id'",
      "'organization_id'",
      "'email_normalized'",
      "'role'",
      "'revision'",
      "'created_at'",
      "'updated_at'",
    ]) {
      expect(listRpc).toContain(field);
    }
  });
});

describe("ENG-ONB-1G-A1 invitation side-effect isolation", () => {
  it("only reads the real invitation domain and never mutates invitation artifacts", () => {
    expect(collisionGate).toContain("from public.organization_invitations");
    expect(sql).not.toMatch(
      /(?:insert into|update|delete from)\s+public\.organization_invitations\b/i,
    );
    expect(sql).not.toMatch(
      /(?:insert into|update|delete from)\s+private\.organization_invitation_delivery_attempts\b/i,
    );
    expect(sql).not.toMatch(
      /(?:insert into|update|delete from)\s+public\.organization_members\b/i,
    );
    expect(sql).not.toMatch(/\binvitation_created\b/i);
    expect(sql).not.toMatch(/\braw_token\b|\btoken_hash\b/i);
  });

  it("does not expose execution, delivery, or consumption functions", () => {
    expect(sql).not.toMatch(
      /create or replace function public\.(?:consume|send|dispatch|finalize|execute)_/i,
    );
  });
});
