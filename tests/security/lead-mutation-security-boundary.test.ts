import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const LEAD_MUTATION_FILES = [
  join(process.cwd(), "src/features/leads/server/lead-rpc-adapters.ts"),
  join(process.cwd(), "src/features/leads/server/lead-mutations.ts"),
  join(process.cwd(), "src/features/leads/actions/lead-actions.ts"),
  join(process.cwd(), "src/features/leads/actions/lead-action-schemas.ts"),
  join(process.cwd(), "src/features/leads/domain/mutation-interpretation.ts"),
  join(process.cwd(), "src/features/leads/validation/mutation-schemas.ts"),
];

const LEAD_READ_QUERY_FILE = join(process.cwd(), "src/features/leads/server/lead-read-queries.ts");

describe("lead mutation security boundaries", () => {
  const mutationSource = LEAD_MUTATION_FILES.map((file) => readFileSync(file, "utf8")).join("\n");
  const readQuerySource = readFileSync(LEAD_READ_QUERY_FILE, "utf8");

  it("does not reference service-role secrets or privileged clients", () => {
    expect(mutationSource).not.toMatch(/SERVICE_ROLE/i);
    expect(mutationSource).not.toMatch(/service_role/);
    expect(mutationSource).not.toMatch(/createClient\([^)]*service/i);
  });

  it("does not perform direct lead insert or delete", () => {
    expect(mutationSource).not.toMatch(/\.from\(["']leads["']\)\.(insert|delete)/);
  });

  it("does not perform direct lifecycle or archive column writes", () => {
    expect(mutationSource).not.toMatch(/\.from\(["']leads["']\)\.update\([\s\S]*status/);
    expect(mutationSource).not.toMatch(/\.update\([\s\S]*archived_at/);
    expect(mutationSource).not.toMatch(/\.update\([\s\S]*stage_id/);
    expect(mutationSource).not.toMatch(/\.update\([\s\S]*converted_customer_id/);
  });

  it("uses explicit profile allowlist without arbitrary spread", () => {
    expect(mutationSource).toContain("display_name");
    expect(mutationSource).toContain("owner_member_id");
    expect(mutationSource).toContain("source_type");
    expect(mutationSource).not.toMatch(/\.update\(\s*\.\.\./);
    expect(mutationSource).not.toMatch(/\.update\(input\)/);
    expect(mutationSource).not.toMatch(/\.update\(parsed\.data\)/);
  });

  it("uses exact lifecycle RPC names and no generic dispatcher", () => {
    expect(mutationSource).toContain("create_lead");
    expect(mutationSource).toContain("transition_lead_stage");
    expect(mutationSource).toContain("transition_lead_status");
    expect(mutationSource).toContain("convert_lead_to_customer");
    expect(mutationSource).toContain("archive_lead");
    expect(mutationSource).toContain("restore_lead");
    expect(mutationSource).not.toMatch(/supabase\.rpc\(\s*operation/);
    expect(mutationSource).not.toMatch(/callLeadRpc\(/);
  });

  it("scopes profile updates by organization and lead", () => {
    expect(mutationSource).toContain('.eq("organization_id"');
    expect(mutationSource).toContain('.eq("id"');
  });

  it("keeps conversion separate from generic status transition", () => {
    expect(mutationSource).toContain("LEAD_STATUS_TRANSITION_TARGETS");
    expect(mutationSource).toContain("convert_lead_to_customer");
    expect(mutationSource).not.toMatch(/toStatus:\s*["']converted["']/);
  });

  it("does not mutate inside D6.2 read-query files", () => {
    expect(readQuerySource).not.toMatch(/\.from\(["']leads["']\)\.(insert|update|delete)/);
    expect(readQuerySource).not.toMatch(
      /create_lead|transition_lead_stage|transition_lead_status|convert_lead_to_customer|archive_lead|restore_lead/,
    );
  });

  it("uses server supabase client in actions", () => {
    expect(mutationSource).not.toMatch(/@\/lib\/supabase\/client/);
    expect(mutationSource).toContain("createSupabaseServerClient");
    expect(mutationSource).toContain('"use server"');
  });
});
