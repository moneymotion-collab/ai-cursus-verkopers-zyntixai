import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const CUSTOMER_READ_FILES = [
  join(process.cwd(), "src/features/customers/server/customer-read-queries.ts"),
  join(process.cwd(), "src/features/customers/server/map-customer-read-model.ts"),
  join(process.cwd(), "src/features/customers/server/customer-query-columns.ts"),
  join(process.cwd(), "src/features/customers/server/resolve-customer-labels.ts"),
  join(process.cwd(), "src/features/customers/server/resolve-customer-page-organization.ts"),
];

describe("customer read security boundaries", () => {
  const source = CUSTOMER_READ_FILES.map((file) => readFileSync(file, "utf8")).join("\n");

  it("does not reference service-role secrets", () => {
    expect(source).not.toMatch(/SERVICE_ROLE/i);
    expect(source).not.toMatch(/service_role/);
  });

  it("does not perform direct customer writes", () => {
    expect(source).not.toMatch(/\.from\(["']customers["']\)\.(insert|update|delete)/);
    expect(source).not.toMatch(/\.from\(["']customer_status_history["']\)\.(insert|update|delete)/);
    expect(source).not.toMatch(/\.from\(["']enrollments["']\)\.(insert|update|delete)/);
  });

  it("does not invoke customer lifecycle RPCs in read layer", () => {
    expect(source).not.toMatch(/create_customer|transition_customer_status|archive_customer|restore_customer/);
  });
});
