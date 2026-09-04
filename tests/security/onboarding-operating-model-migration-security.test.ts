import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  OPERATING_MODEL_IDS,
  OPERATING_MODEL_OPTIONS,
  operatingModelAssignmentInputSchema,
} from "@/features/onboarding/domain/operating-model";

const MIGRATION =
  "20260904110421_add_operating_model_context_onboarding.sql";
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION),
  "utf8",
);

describe("ONBOARDING-1A operating-model contract", () => {
  it("exposes exactly four product-facing operating models", () => {
    expect(OPERATING_MODEL_IDS).toEqual([
      "course_seller",
      "service",
      "field_operations",
      "product_operations",
    ]);
    expect(OPERATING_MODEL_OPTIONS).toHaveLength(4);
  });

  it("rejects arbitrary pack IDs and unknown input keys", () => {
    expect(
      operatingModelAssignmentInputSchema.safeParse({
        organizationId: "11111111-1111-4111-8111-111111111111",
        operatingModel: "foundation.service",
      }).success,
    ).toBe(false);
    expect(
      operatingModelAssignmentInputSchema.safeParse({
        organizationId: "11111111-1111-4111-8111-111111111111",
        operatingModel: "service",
        packId: "attacker-controlled",
      }).success,
    ).toBe(false);
  });

  it("owns the exact four TAX/CTX mappings inside the server-only RPC", () => {
    expect(sql).toContain(
      "when 'course_seller' then 'online-course-business'",
    );
    expect(sql).toContain(
      "when 'course_seller' then 'niche.online-course-business'",
    );
    expect(sql).toContain("when 'service' then 'foundation.service'");
    expect(sql).toContain(
      "when 'field_operations' then 'foundation.field-operations'",
    );
    expect(sql).toContain(
      "when 'product_operations' then 'foundation.product-operations'",
    );
  });
});

describe("ONBOARDING-1A assignment RPC security", () => {
  it("requires service_role execution and active Owner/Admin membership", () => {
    expect(sql).toContain("auth.role() is distinct from 'service_role'");
    expect(sql).toMatch(/om\.organization_id = p_organization_id/);
    expect(sql).toMatch(/om\.user_id = p_actor_user_id/);
    expect(sql).toMatch(/om\.status = 'active'/);
    expect(sql).toMatch(/om\.role in \('owner', 'admin'\)/);
  });

  it("is not executable by public, anon, or authenticated callers", () => {
    expect(sql).toMatch(
      /revoke all on function public\.assign_organization_operating_model\(uuid, uuid, text\) from public/,
    );
    expect(sql).toMatch(
      /revoke all on function public\.assign_organization_operating_model\(uuid, uuid, text\) from anon/,
    );
    expect(sql).toMatch(
      /revoke all on function public\.assign_organization_operating_model\(uuid, uuid, text\) from authenticated/,
    );
    expect(sql).toMatch(
      /grant execute on function public\.assign_organization_operating_model\(uuid, uuid, text\) to service_role/,
    );
  });

  it("writes existing ORG-CONTEXT records with onboarding provenance", () => {
    expect(sql).toContain(
      "insert into public.organization_business_activities",
    );
    expect(sql).toContain(
      "insert into public.organization_context_assignments",
    );
    expect(sql).toContain(
      "insert into public.organization_context_assignment_events",
    );
    expect(sql).toMatch(/'onboarding'/);
    expect(sql).toContain("'primary_operating_model'");
    expect(sql).not.toContain("'primary-operating-model'");
    expect(sql).not.toMatch(/alter table public\.organizations add column/i);
  });

  it("is idempotent for the same model and refuses target switching", () => {
    expect(sql).toContain("'idempotent', true");
    expect(sql).toContain("'ALREADY_CONFIGURED'");
    expect(sql).toContain("'CONFIGURATION_REVIEW_REQUIRED'");
    expect(sql).not.toContain("context_version_changed");
    expect(sql).not.toContain("update public.organization_context_assignments");
  });

  it("does not alter readiness, admission, BQA, or Social state", () => {
    expect(sql).not.toMatch(
      /(insert into|update|delete from)\s+public\.context_pack_readiness/i,
    );
    expect(sql).not.toMatch(/business_activity_admission_decisions/i);
    expect(sql).not.toMatch(/business_activity_support_assessments/i);
    expect(sql).not.toMatch(/social_/i);
    expect(sql).not.toMatch(/set\s+readiness_status/i);
  });
});
