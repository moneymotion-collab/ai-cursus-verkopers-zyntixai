import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const rateLimitMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260814140000_add_organization_invitation_mutation_rate_limits.sql",
  ),
  "utf8",
);

const liveVerification = readFileSync(
  join(process.cwd(), "tests/security/invitation-rpc-live-verification.sql"),
  "utf8",
);

describe("CB-R1 invitation mutation rate-limit security contract", () => {
  it("adds private rate-limit table with no client/service grants", () => {
    expect(rateLimitMigration).toContain(
      "create table if not exists private.organization_invitation_mutation_rate_limits",
    );
    expect(rateLimitMigration).toContain(
      "revoke all on table private.organization_invitation_mutation_rate_limits from authenticated",
    );
    expect(rateLimitMigration).toContain(
      "revoke all on table private.organization_invitation_mutation_rate_limits from service_role",
    );
    expect(rateLimitMigration).toContain(
      "revoke all on table private.organization_invitation_mutation_rate_limits from anon",
    );
    expect(rateLimitMigration).not.toMatch(
      /grant\s+(select|insert|update|delete|all)\b[\s\S]{0,80}organization_invitation_mutation_rate_limits/i,
    );
  });

  it("exposes atomic private consume helper with empty search_path and no EXECUTE grants", () => {
    expect(rateLimitMigration).toMatch(
      /create or replace function private\.consume_organization_invitation_mutation_rate_limit[\s\S]*?security definer\s+set search_path = ''/,
    );
    expect(rateLimitMigration).toContain(
      "revoke all on function private.consume_organization_invitation_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from authenticated",
    );
    expect(rateLimitMigration).toContain(
      "revoke all on function private.consume_organization_invitation_mutation_rate_limit(uuid, uuid, text, text, integer, integer) from service_role",
    );
    expect(rateLimitMigration).toContain("for update");
  });

  it("enforces create/resend rate limits inside public RPCs with fail-closed defaults", () => {
    expect(rateLimitMigration).toContain("'rate_limited'");
    expect(rateLimitMigration).toMatch(
      /create or replace function public\.create_organization_invitation[\s\S]*?consume_organization_invitation_mutation_rate_limit\([\s\S]*?'create'[\s\S]*?10[\s\S]*?3600/,
    );
    expect(rateLimitMigration).toMatch(
      /create or replace function public\.resend_organization_invitation[\s\S]*?consume_organization_invitation_mutation_rate_limit\([\s\S]*?'resend'[\s\S]*?3[\s\S]*?3600/,
    );
    expect(rateLimitMigration).toMatch(
      /can_create_organization_invitation_target[\s\S]*?consume_organization_invitation_mutation_rate_limit[\s\S]*?resolve_organization_invitation_membership_collision/,
    );
    expect(rateLimitMigration).toMatch(
      /can_manage_organization_invitation_target[\s\S]*?rate_limited[\s\S]*?generate_organization_invitation_token_pair/,
    );
  });

  it("does not rate-limit revoke and stores no raw tokens or emails in rate-limit state", () => {
    expect(rateLimitMigration).not.toContain("revoke_organization_invitation");
    expect(rateLimitMigration).not.toContain("accept_organization_invitation");
    expect(rateLimitMigration).toContain("No emails, tokens, or secrets");
    expect(rateLimitMigration).toMatch(
      /create table if not exists private\.organization_invitation_mutation_rate_limits \([\s\S]*?constraint organization_invitation_mutation_rate_limits_scope_chk/,
    );
    const tableBlock = rateLimitMigration.match(
      /create table if not exists private\.organization_invitation_mutation_rate_limits \([\s\S]*?\);/,
    )?.[0];
    expect(tableBlock).toBeTruthy();
    expect(tableBlock).not.toMatch(/\bemail\b/i);
    expect(tableBlock).not.toMatch(/token/i);
    expect(rateLimitMigration).not.toMatch(
      /insert into private\.organization_invitation_mutation_rate_limits[\s\S]{0,400}email/i,
    );
  });

  it("keeps authenticated-only EXECUTE on create/resend and covers live deny semantics", () => {
    expect(rateLimitMigration).toContain(
      "grant execute on function public.create_organization_invitation(uuid, text, text) to authenticated",
    );
    expect(rateLimitMigration).toContain(
      "grant execute on function public.resend_organization_invitation(uuid, uuid) to authenticated",
    );
    expect(rateLimitMigration).toContain(
      "revoke all on function public.create_organization_invitation(uuid, text, text) from service_role",
    );
    expect(liveVerification).toContain("resend rate limit failed");
    expect(liveVerification).toContain("create rate limit failed");
    expect(liveVerification).toContain(
      "rate-limited resend must not mutate invitation",
    );
    expect(liveVerification).toContain(
      "rate-limited create must not insert invitation",
    );
    expect(liveVerification).toContain(
      "org B create must not inherit org A rate limit",
    );
  });
});
