import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const STORAGE_MIGRATION =
  "20260827140020_add_data_intake_storage_bucket.sql";
const SOCIAL_BUCKET =
  "20260815212000_add_social_private_media_bucket_r1.sql";

describe("DATA-1C storage bucket", () => {
  const storage = readFileSync(
    join(process.cwd(), "supabase/migrations", STORAGE_MIGRATION),
    "utf8",
  );
  const social = readFileSync(
    join(process.cwd(), "supabase/migrations", SOCIAL_BUCKET),
    "utf8",
  );

  it("creates a private data-intake bucket distinct from Social", () => {
    expect(storage).toContain("'data-intake'");
    expect(storage).toContain("false,");
    expect(storage).toContain("10485760");
    expect(storage).toContain("text/csv");
    expect(storage).toContain(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    expect(storage).not.toContain("zyntix-social-media");
    expect(storage).not.toContain("public = true");
    expect(social).toContain("zyntix-social-media");
  });

  it("restricts anon and authenticated from the data-intake bucket", () => {
    expect(storage).toContain("as restrictive");
    expect(storage).toContain("to anon");
    expect(storage).toContain("to authenticated");
    expect(storage).toContain("bucket_id is distinct from 'data-intake'");
    expect(storage).not.toContain("for insert");
    expect(storage).not.toContain("for select");
  });
});
