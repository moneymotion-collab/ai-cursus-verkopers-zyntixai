import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260814150000_add_organization_invitation_delivery_attempts.sql",
  ),
  "utf8",
);

describe("CB-E1-C invitation delivery-attempt security contract", () => {
  it("creates a private delivery-attempt table without client grants or secret columns", () => {
    expect(migration).toContain(
      "create table if not exists private.organization_invitation_delivery_attempts",
    );
    expect(migration).toContain(
      "revoke all on table private.organization_invitation_delivery_attempts from authenticated",
    );
    expect(migration).toContain(
      "revoke all on table private.organization_invitation_delivery_attempts from service_role",
    );
    expect(migration).toContain(
      "revoke all on table private.organization_invitation_delivery_attempts from anon",
    );
    expect(migration).not.toMatch(
      /grant\s+(select|insert|update|delete|all)\b[\s\S]{0,100}organization_invitation_delivery_attempts/i,
    );

    const tableBlock = migration.match(
      /create table if not exists private\.organization_invitation_delivery_attempts \([\s\S]*?\);/,
    )?.[0];
    expect(tableBlock).toBeTruthy();
    expect(tableBlock).not.toMatch(/\braw_token\b/i);
    expect(tableBlock).not.toMatch(/\btoken_hash\b/i);
    expect(tableBlock).not.toMatch(/\bemail\b/i);
    expect(tableBlock).not.toMatch(/acceptance_url|html|text_body|api_key/i);
    expect(migration).toContain("No tokens, URLs, bodies, or secrets");
  });

  it("enforces unique generation/idempotency and narrow statuses", () => {
    expect(migration).toContain(
      "organization_invitation_delivery_attempts_generation_uidx",
    );
    expect(migration).toContain(
      "organization_invitation_delivery_attempts_idempotency_uidx",
    );
    expect(migration).toContain("check (status in ('pending', 'submitted', 'failed'))");
    expect(migration).toContain("check (operation in ('create', 'resend'))");
    expect(migration).not.toContain("'delivered'");
    expect(migration).not.toContain("'bounced'");
  });

  it("exposes authenticated-only SECURITY DEFINER resolve/complete RPCs with empty search_path", () => {
    expect(migration).toMatch(
      /create or replace function public\.resolve_organization_invitation_delivery_attempt[\s\S]*?security definer\s+set search_path = ''/,
    );
    expect(migration).toMatch(
      /create or replace function public\.complete_organization_invitation_delivery_attempt[\s\S]*?security definer\s+set search_path = ''/,
    );
    expect(migration).toContain(
      "grant execute on function public.resolve_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) to authenticated",
    );
    expect(migration).toContain(
      "grant execute on function public.complete_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) to authenticated",
    );
    expect(migration).toContain(
      "revoke all on function public.resolve_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from service_role",
    );
    expect(migration).toContain(
      "revoke all on function public.complete_organization_invitation_delivery_attempt(uuid, uuid, text, text, text) from service_role",
    );
    expect(migration).toContain("get_organization_invitation_actor_membership");
    expect(migration).toContain("for update");
    expect(migration).toContain("'owner', 'admin'");
  });
});
