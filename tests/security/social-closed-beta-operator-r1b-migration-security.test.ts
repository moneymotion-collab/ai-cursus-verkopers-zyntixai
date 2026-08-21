import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260818194719_add_social_closed_beta_operator_mutation_wrappers.sql",
  ),
  "utf8",
);

describe("SMM-R1-B operator mutation wrapper migration security", () => {
  it("adds service_role-only wrappers that arm operator GUC in-transaction", () => {
    expect(migration).toContain(
      "operator_enroll_social_closed_beta_organization",
    );
    expect(migration).toContain(
      "operator_allow_social_closed_beta_publishing",
    );
    expect(migration).toContain("operator_pause_social_closed_beta_enrollment");
    expect(migration).toContain(
      "operator_resume_social_closed_beta_enrollment",
    );
    expect(migration).toContain(
      "operator_revoke_social_closed_beta_enrollment",
    );
    expect(migration).toContain(
      "set_config('zyntix.social_closed_beta_operator', 'on', true)",
    );
    expect(migration).toContain(
      "grant execute on function public.%s to service_role",
    );
    expect(migration).not.toContain(
      "grant execute on function public.operator_enroll_social_closed_beta_organization(uuid, text, uuid) to authenticated",
    );
  });

  it("adds cross-org operator read RPCs without Meta or secrets", () => {
    expect(migration).toContain(
      "operator_list_social_closed_beta_organizations",
    );
    expect(migration).toContain(
      "operator_get_social_closed_beta_organization",
    );
    expect(migration).toContain(
      "operator_list_social_closed_beta_enrollment_events",
    );
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toMatch(/access_token\s+text/i);
    expect(migration).not.toMatch(/insert into public\.social_closed_beta_enrollments/i);
  });

  it("extends social migration inventory", () => {
    const social = readdirSync(join(process.cwd(), "supabase/migrations"))
      .filter(
        (name) =>
          name.includes("social") ||
          name.includes("b18") ||
          name.includes("b19") ||
          name.includes("closed_beta"),
      )
      .sort();
    expect(social).toContain(
      "20260818194719_add_social_closed_beta_operator_mutation_wrappers.sql",
    );
    expect(social).toContain(
      "20260820120000_add_social_reauthorization_connected_finalize.sql",
    );
    expect(social).toContain(
      "20260821114627_add_social_publication_scheduling_domain.sql",
    );
    expect(social.at(-1)).toContain(
      "add_social_scheduler_worker_domain",
    );
  });
});
