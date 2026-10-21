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

const domainIndex = readFileSync(
  join(process.cwd(), "src/features/social-media/domain/index.ts"),
  "utf8",
);

describe("SMM-B1.1-B client-safe persistence boundary", () => {
  it("does not put ciphertext columns on the public connection table", () => {
    const table = migration.match(
      /create table public.social_account_connections \([\s\S]*?\);/,
    )?.[0];
    expect(table).toBeTruthy();
    expect(table).not.toMatch(/ciphertext|auth_tag|\biv\b|access_token|refresh_token/i);
    expect(table).toContain("token_expires_at");
  });

  it("does not re-export crypto modules from the domain barrel", () => {
    expect(domainIndex).not.toContain("credential-crypto");
    expect(domainIndex).not.toContain("credential-key");
    expect(domainIndex).not.toContain("credential-repository");
    expect(domainIndex).not.toContain("server-only");
  });
});
