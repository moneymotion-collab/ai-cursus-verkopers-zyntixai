import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CUSTOMER_MUTATION_FILES = [
  join(process.cwd(), "src/features/customers/server/customer-rpc-adapters.ts"),
  join(process.cwd(), "src/features/customers/server/customer-mutations.ts"),
  join(process.cwd(), "src/features/customers/actions/customer-actions.ts"),
  join(process.cwd(), "src/features/customers/actions/customer-action-schemas.ts"),
  join(process.cwd(), "src/features/customers/domain/mutation-interpretation.ts"),
  join(process.cwd(), "src/features/customers/validation/mutation-schemas.ts"),
];

const CUSTOMER_READ_QUERY_FILE = join(
  process.cwd(),
  "src/features/customers/server/customer-read-queries.ts",
);

describe("customer mutation security boundaries", () => {
  const mutationSource = CUSTOMER_MUTATION_FILES.map((file) => readFileSync(file, "utf8")).join(
    "\n",
  );

  const readQuerySource = readFileSync(CUSTOMER_READ_QUERY_FILE, "utf8");

  it("does not reference service-role secrets or privileged clients", () => {
    expect(mutationSource).not.toMatch(/SERVICE_ROLE/i);
    expect(mutationSource).not.toMatch(/service_role/);
    expect(mutationSource).not.toMatch(/createClient\([^)]*service/i);
  });

  it("does not perform direct customer insert or delete", () => {
    expect(mutationSource).not.toMatch(/\.from\(["']customers["']\)\.(insert|delete)/);
  });

  it("does not perform direct lifecycle or archive writes", () => {
    expect(mutationSource).not.toMatch(/\.from\(["']customers["']\)\.update\([\s\S]*status/);
    expect(mutationSource).not.toMatch(/\.update\([\s\S]*archived_at/);
    expect(mutationSource).not.toMatch(/\.update\([\s\S]*metadata/);
  });

  it("uses explicit profile allowlist without arbitrary spread", () => {
    expect(mutationSource).toContain("display_name");
    expect(mutationSource).toContain("owner_member_id");
    expect(mutationSource).not.toMatch(/\.update\(\s*\.\.\./);
    expect(mutationSource).not.toMatch(/\.update\(input\)/);
    expect(mutationSource).not.toMatch(/\.update\(parsed\.data\)/);
  });

  it("uses exact lifecycle RPC names and no generic dispatcher", () => {
    expect(mutationSource).toContain("create_customer");
    expect(mutationSource).toContain("transition_customer_status");
    expect(mutationSource).toContain("archive_customer");
    expect(mutationSource).toContain("restore_customer");
    expect(mutationSource).not.toMatch(/supabase\.rpc\(\s*operation/);
    expect(mutationSource).not.toMatch(/callCustomerRpc/);
  });

  it("scopes profile updates by organization and customer", () => {
    expect(mutationSource).toContain('.eq("organization_id"');
    expect(mutationSource).toContain('.eq("id"');
  });

  it("does not mutate inside D5.2 read-query files", () => {
    expect(readQuerySource).not.toMatch(/\.from\(["']customers["']\)\.(insert|update|delete)/);
    expect(readQuerySource).not.toMatch(
      /create_customer|transition_customer_status|archive_customer|restore_customer/,
    );
  });

  it("does not use client-side Supabase mutation helpers in actions", () => {
    expect(mutationSource).not.toMatch(/@\/lib\/supabase\/client/);
    expect(mutationSource).toContain("createSupabaseServerClient");
  });
});
