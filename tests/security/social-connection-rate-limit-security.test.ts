import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260815130220_add_social_connection_credential_foundation.sql",
  ),
  "utf8",
);

const liveVerification = readFileSync(
  join(
    process.cwd(),
    "tests/security/social-connection-rpc-live-verification.sql",
  ),
  "utf8",
);

describe("SMM-B1.1-B abuse-protection contract", () => {
  it("defines fail-closed consume helper with invitation-like locking", () => {
    expect(migration).toMatch(
      /create or replace function private\.consume_social_connection_mutation_rate_limit[\s\S]*?security definer\s+set search_path = ''/,
    );
    expect(migration).toContain("for update");
    expect(migration).toContain("private.try_consume_social_connection_rate_limit");
    expect(migration).toContain("when others then");
    expect(migration).toContain("return false");
  });

  it("encodes owner-approved numeric limits", () => {
    expect(migration).toMatch(
      /'connect'[\s\S]*?10[\s\S]*?3600/,
    );
    expect(migration).toMatch(
      /'reauthorize'[\s\S]*?10[\s\S]*?3600/,
    );
    expect(migration).toMatch(
      /'disconnect'[\s\S]*?10[\s\S]*?3600/,
    );
    expect(migration).toMatch(
      /'oauth_callback'[\s\S]*?20[\s\S]*?3600/,
    );
    expect(migration).toMatch(
      /'credential_refresh'[\s\S]*?6[\s\S]*?3600/,
    );
  });

  it("keeps limiter table free of tokens and live SQL covers deny semantics", () => {
    const tableBlock = migration.match(
      /create table private.social_connection_mutation_rate_limits \([\s\S]*?\);/,
    )?.[0];
    expect(tableBlock).toBeTruthy();
    expect(tableBlock).not.toMatch(/token|ciphertext|email/i);
    expect(liveVerification).toContain("connect rate limit failed");
    expect(liveVerification).toContain("stale credential version failed");
    expect(liveVerification).toContain("oauth intent single-use failed");
  });
});
