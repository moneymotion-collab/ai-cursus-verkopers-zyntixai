import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  getLeadById,
  listLeadRelatedTasks,
  listLeads,
  listLeadStatusHistory,
} from "@/features/leads/server/lead-read-queries";
import {
  createLeadReadMockSupabase,
  LEAD_ID,
  ORG_ID,
  OTHER_ORG_ID,
  sampleLeadDetailRow,
  USER_ID,
} from "../helpers/lead-read-query-mocks";

const LEAD_READ_FILES = [
  join(process.cwd(), "src/features/leads/server/lead-read-queries.ts"),
  join(process.cwd(), "src/features/leads/server/map-lead-read-model.ts"),
  join(process.cwd(), "src/features/leads/server/lead-query-columns.ts"),
  join(process.cwd(), "src/features/leads/server/resolve-lead-labels.ts"),
  join(process.cwd(), "src/features/leads/server/normalize-lead-error.ts"),
];

describe("lead read security boundaries", () => {
  const source = LEAD_READ_FILES.map((file) => readFileSync(file, "utf8")).join("\n");

  it("does not reference service-role secrets", () => {
    expect(source).not.toMatch(/SERVICE_ROLE/i);
    expect(source).not.toMatch(/service_role/);
  });

  it("does not perform direct lead writes", () => {
    expect(source).not.toMatch(/\.from\(["']leads["']\)\.(insert|update|delete)/);
    expect(source).not.toMatch(/\.from\(["']lead_status_history["']\)\.(insert|update|delete)/);
    expect(source).not.toMatch(/\.from\(["']lead_stage_history["']\)\.(insert|update|delete)/);
    expect(source).not.toMatch(/\.from\(["']lead_pipeline_stages["']\)\.(insert|update|delete)/);
  });

  it("does not invoke lead lifecycle RPCs in the read layer", () => {
    expect(source).not.toMatch(
      /create_lead|transition_lead_stage|transition_lead_status|convert_lead_to_customer|archive_lead|restore_lead|ensure_default_pipeline_stages/,
    );
  });

  it("scopes lead queries by organization_id", () => {
    expect(source).toMatch(/eq\("organization_id"/);
  });
});

describe("lead read auth and cross-organization behavior", () => {
  it("returns AUTH_REQUIRED for unauthenticated list, detail, and history", async () => {
    const supabase = createLeadReadMockSupabase({ user: null });

    const list = await listLeads({ supabase, organizationId: ORG_ID });
    const detail = await getLeadById({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });
    const history = await listLeadStatusHistory({
      supabase,
      organizationId: ORG_ID,
      leadId: LEAD_ID,
    });

    expect(list.ok).toBe(false);
    expect(detail.ok).toBe(false);
    expect(history.ok).toBe(false);
    if (!list.ok && !detail.ok && !history.ok) {
      expect(list.error.code).toBe("AUTH_REQUIRED");
      expect(detail.error.code).toBe("AUTH_REQUIRED");
      expect(history.error.code).toBe("AUTH_REQUIRED");
    }
  });

  it("maps foreign organization ids to org-context denial without lead leakage", async () => {
    const supabase = createLeadReadMockSupabase({
      user: { id: USER_ID },
      role: "staff",
      leadDetail: { data: sampleLeadDetailRow, error: null },
    });

    const detail = await getLeadById({
      supabase,
      organizationId: OTHER_ORG_ID,
      leadId: LEAD_ID,
    });
    const related = await listLeadRelatedTasks({
      supabase,
      organizationId: OTHER_ORG_ID,
      leadId: LEAD_ID,
    });

    expect(detail.ok).toBe(false);
    expect(related.ok).toBe(false);
    if (!detail.ok && !related.ok) {
      expect(detail.error.code).toBe("ORG_CONTEXT_MISSING");
      expect(related.error.code).toBe("ORG_CONTEXT_MISSING");
    }
  });
});
