import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260818190346_add_social_closed_beta_enrollment_foundation.sql",
  ),
  "utf8",
);

describe("SMM-R1-A closed-beta enrollment migration security", () => {
  it("adds enrollment + append-only events with Owner/Admin select only", () => {
    expect(migration).toContain("create table public.social_closed_beta_enrollments");
    expect(migration).toContain(
      "create table public.social_closed_beta_enrollment_events",
    );
    expect(migration).toContain("'approved'");
    expect(migration).toContain("'publishing_allowed'");
    expect(migration).toContain("'paused'");
    expect(migration).toContain("'revoked'");
    expect(migration).not.toMatch(/status in \([^)]*'not_enrolled'/);
    expect(migration).toContain(
      "social_closed_beta_enrollment_events_guard_immutable",
    );
    expect(migration).toContain(
      "social_closed_beta_enrollments_select_owner_admin",
    );
    expect(migration).toContain(
      "revoke insert, update, delete on table public.social_closed_beta_enrollments from authenticated",
    );
  });

  it("keeps operator mutations off authenticated and behind operator GUC", () => {
    expect(migration).toContain("zyntix.social_closed_beta_operator");
    expect(migration).toContain(
      "platform_enroll_social_closed_beta_organization",
    );
    expect(migration).toContain(
      "platform_allow_social_closed_beta_publishing",
    );
    expect(migration).toContain(
      "platform_pause_social_closed_beta_enrollment",
    );
    expect(migration).toContain(
      "platform_resume_social_closed_beta_enrollment",
    );
    expect(migration).toContain(
      "platform_revoke_social_closed_beta_enrollment",
    );
    expect(migration).toContain(
      "grant execute on function public.%s to service_role",
    );
    expect(migration).toMatch(
      /revoke all on function public\.%s from authenticated/,
    );
    expect(migration).not.toContain(
      "grant execute on function public.platform_enroll_social_closed_beta_organization(uuid, text, uuid) to authenticated",
    );
  });

  it("exposes prepare/publish asserts and status read to authenticated only", () => {
    expect(migration).toContain(
      "public.assert_social_closed_beta_prepare_allowed",
    );
    expect(migration).toContain(
      "public.assert_social_closed_beta_publish_allowed",
    );
    expect(migration).toContain(
      "public.get_social_closed_beta_enrollment_status",
    );
    expect(migration).toContain(
      "grant execute on function public.assert_social_closed_beta_publish_allowed(uuid) to authenticated",
    );
    expect(migration).toContain(
      "private.social_closed_beta_publish_result_code",
    );
    expect(migration).toContain("closed_beta_publish_not_allowed");
  });

  it("does not hard-delete Social evidence or call Meta", () => {
    expect(migration).not.toMatch(/delete from public\.social_publications/i);
    expect(migration).not.toMatch(
      /delete from public\.social_account_connections/i,
    );
    expect(migration).not.toContain("graph.facebook.com");
    expect(migration).not.toMatch(/access_token\s+text/i);
  });

  it("does not silently replace b18_start or create_social_publication bodies", () => {
    expect(migration).not.toContain(
      "create or replace function public.b18_start_controlled_publication_attempt",
    );
    expect(migration).not.toContain(
      "create or replace function public.create_social_publication",
    );
  });

  it("extends social migration inventory additively", () => {
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
      "20260818190346_add_social_closed_beta_enrollment_foundation.sql",
    );
    expect(social.at(-1)).toContain(
      "add_social_closed_beta_operator_mutation_wrappers",
    );
  });
});
