import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260716190000_owner_self_registration_hardening.sql",
  ),
  "utf8",
);

describe("PX2.1 registration migration security contract", () => {
  it("creates registration_intents with owner-only select RLS", () => {
    expect(migration).toContain("create table public.registration_intents");
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("registration_intents_select_own");
    expect(migration).not.toMatch(
      /create policy registration_intents_insert/i,
    );
  });

  it("revokes authenticated execute on create_organization_with_owner", () => {
    expect(migration).toMatch(
      /revoke all on function public\.create_organization_with_owner[\s\S]*from authenticated/i,
    );
  });

  it("exposes complete_owner_self_registration with hardened search_path", () => {
    expect(migration).toContain("complete_owner_self_registration");
    expect(migration).toMatch(
      /create or replace function public\.complete_owner_self_registration[\s\S]*security definer[\s\S]*set search_path = ''/i,
    );
    expect(migration).toMatch(
      /grant execute on function public\.complete_owner_self_registration[\s\S]*to authenticated/i,
    );
    expect(migration).toContain("registration intent required");
    expect(migration).toContain("'owner'");
    expect(migration).toContain("pg_advisory_xact_lock");
    expect(migration).toContain("email verification required");
  });

  it("does not create organizations from handle_new_user", () => {
    const handleStart = migration.indexOf(
      "create or replace function public.handle_new_user()",
    );
    const handleEnd = migration.indexOf(
      "create or replace function public.upsert_registration_intent",
      handleStart,
    );
    const handleBody = migration.slice(handleStart, handleEnd);
    expect(handleBody).toContain("registration_intents");
    expect(handleBody).not.toContain("insert into public.organizations");
    expect(handleBody).not.toContain("organization_members");
  });

  it("keeps role assignment constant and ignores client role parameters", () => {
    expect(migration).not.toMatch(/p_role/i);
    expect(migration).not.toMatch(/p_organization_id/i);
    expect(migration).not.toMatch(/p_user_id/i);
  });
});
