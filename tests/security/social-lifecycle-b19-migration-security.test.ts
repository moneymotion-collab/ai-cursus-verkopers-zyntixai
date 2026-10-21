import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260818145249_add_b19_publishing_lifecycle_hardening.sql",
  ),
  "utf8",
);

describe("SMM-B1.9 lifecycle migration security", () => {
  it("adds Owner/Admin lifecycle RPCs without provider HTTP", () => {
    expect(migration).toContain(
      "public.abandon_authorization_pending_social_connection",
    );
    expect(migration).toContain("public.abandon_stale_social_oauth_intent");
    expect(migration).toContain("public.abandon_queued_social_publication");
    expect(migration).toContain(
      "public.reclaim_stale_social_publication_execution",
    );
    expect(migration).toContain(
      "public.resolve_unknown_external_social_publication",
    );
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toContain("instagram.com");
    expect(migration).not.toMatch(/access_token\s+text/i);
  });

  it("keeps fail-closed reclaim for processing ambiguity", () => {
    expect(migration).toContain("unknown_external_outcome");
    expect(migration).toContain("provider_write_safe_to_retry");
    expect(migration).toContain("stale_execution_lease");
    expect(migration).toMatch(
      /status = 'processing'[\s\S]*?v_next := 'unknown_external_outcome'/,
    );
    expect(migration).toMatch(
      /status = 'claimed'[\s\S]*?v_next := 'failed_retryable'/,
    );
  });

  it("hardens b18_start against terminal and in-flight states", () => {
    expect(migration).toContain(
      "create or replace function public.b18_start_controlled_publication_attempt",
    );
    expect(migration).toContain("'unknown_external_outcome'");
    expect(migration).toContain("'failed_terminal'");
    expect(migration).toContain("a.outcome = 'processing'");
  });

  it("grants authenticated only and revokes service_role/anon", () => {
    for (const name of [
      "abandon_authorization_pending_social_connection",
      "abandon_stale_social_oauth_intent",
      "abandon_queued_social_publication",
      "reclaim_stale_social_publication_execution",
      "resolve_unknown_external_social_publication",
    ]) {
      expect(migration).toContain(
        `grant execute on function public.${name}`,
      );
      expect(migration).toContain(
        `revoke all on function public.${name}`,
      );
      expect(migration).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}[\\s\\S]*?from service_role`,
        ),
      );
    }
  });

  it("does not introduce hard-delete of publications or connections", () => {
    expect(migration).not.toMatch(
      /delete from public\.social_publications/i,
    );
    expect(migration).not.toMatch(
      /delete from public\.social_account_connections/i,
    );
    expect(migration).not.toMatch(
      /delete from public\.social_publication_attempts/i,
    );
  });

  it("uses private oauth intent table for abandon path", () => {
    expect(migration).toContain(
      "private.social_oauth_authorization_intents",
    );
    expect(migration).not.toContain("public.social_oauth_intents");
  });

  it("extends social migration inventory additively", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter(
        (name) =>
          name.includes("social") ||
          name.includes("b18") ||
          name.includes("b19"),
      )
      .sort();
    expect(social).toContain(
      "20260818145249_add_b19_publishing_lifecycle_hardening.sql",
    );
    expect(social).toContain(
      "20260818130747_add_b18_controlled_publication_execution_rpcs.sql",
    );
  });
});
