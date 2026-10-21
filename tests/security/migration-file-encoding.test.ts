import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATIONS = join(process.cwd(), "supabase/migrations");
const UTF8_BOM = Buffer.from([0xef, 0xbb, 0xbf]);

describe("Supabase migration file encoding", () => {
  it("rejects UTF-8 BOM-prefixed SQL migrations", () => {
    const offenders = readdirSync(MIGRATIONS)
      .filter((name) => name.endsWith(".sql"))
      .sort()
      .filter((name) => readFileSync(join(MIGRATIONS, name)).subarray(0, 3).equals(UTF8_BOM))
      .map((name) => `supabase/migrations/${name}`);

    expect(offenders, `UTF-8 BOM-prefixed migrations:\n${offenders.join("\n")}`).toEqual([]);
  });
});
