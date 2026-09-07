import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  isOnboardingFlowVersion,
  ONBOARDING_FLOW_VERSIONS,
} from "@/features/onboarding/domain/onboarding-flow-version";

const MIGRATION = "20260907120240_add_versioned_onboarding_state.sql";
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION),
  "utf8",
);

const provisioningStart = sql.indexOf(
  "create or replace function public.complete_owner_self_registration",
);
const provisioningSql = sql.slice(provisioningStart);

describe("ENG-ONB-1H-A versioned onboarding migration", () => {
  it("adds the nullable repository-conventional state columns", () => {
    expect(sql).toContain("add column onboarding_flow_version smallint");
    expect(sql).toContain("add column onboarding_setup_ready_at timestamptz");
    expect(sql).not.toContain(
      "add column onboarding_flow_version smallint not null",
    );
    expect(sql).not.toContain(
      "add column onboarding_setup_ready_at timestamptz not null",
    );
  });

  it("allows only governed versions and enforces V2 timestamp ordering", () => {
    expect(sql).toContain("organizations_onboarding_flow_version_check");
    expect(sql).toContain("onboarding_flow_version in (1, 2)");
    expect(sql).toContain("organizations_onboarding_setup_ready_requires_v2");
    expect(sql).toMatch(
      /onboarding_setup_ready_at is null\s+or onboarding_flow_version = 2/i,
    );
    expect(sql).toContain(
      "organizations_v2_completion_requires_setup_ready",
    );
    expect(sql).toMatch(
      /onboarding_flow_version is distinct from 2\s+or onboarding_completed_at is null\s+or onboarding_setup_ready_at is not null/i,
    );
  });

  it("classifies only positive legacy questionnaire evidence", () => {
    const backfill = sql.slice(
      sql.indexOf("update public.organizations"),
      sql.indexOf("alter table public.organizations", sql.indexOf("update public.organizations")),
    );

    expect(backfill).toContain("onboarding_completed_at is not null");
    for (const field of [
      "business_type",
      "primary_audience",
      "primary_offering",
      "primary_goal",
    ]) {
      expect(backfill).toContain(`${field} is not null`);
    }
    expect(backfill).not.toContain("team_size_band");
    expect(backfill).not.toContain("created_at");
    expect(backfill).not.toContain("context");
    expect(backfill).not.toContain("operating_model");
  });

  it("keeps the new state fields out of authenticated column updates", () => {
    expect(sql).toContain(
      "revoke update on table public.organizations from authenticated",
    );
    const authenticatedGrant = sql.slice(
      sql.indexOf("grant update ("),
      sql.indexOf(") on table public.organizations to authenticated"),
    );
    expect(authenticatedGrant).not.toContain("onboarding_flow_version");
    expect(authenticatedGrant).not.toContain("onboarding_setup_ready_at");
    expect(sql).not.toMatch(/create policy/i);
  });

  it("assigns V2 only in the genuine organization insert", () => {
    expect(provisioningSql).toMatch(
      /insert into public\.organizations\s*\([\s\S]*onboarding_flow_version[\s\S]*\)\s*values\s*\([\s\S]*v_user_id,\s*2\s*\)/i,
    );
    expect(provisioningSql).not.toContain("onboarding_setup_ready_at");
  });

  it("returns replayed organizations before the V2 insert", () => {
    const insertIndex = provisioningSql.indexOf(
      "insert into public.organizations",
    );
    const membershipReplayIndex = provisioningSql.indexOf(
      "if v_org_id is not null then",
    );
    const completedIntentReplayIndex = provisioningSql.indexOf(
      "if v_intent_status = 'completed' and v_intent_org is not null then",
    );

    expect(membershipReplayIndex).toBeGreaterThan(-1);
    expect(completedIntentReplayIndex).toBeGreaterThan(-1);
    expect(membershipReplayIndex).toBeLessThan(insertIndex);
    expect(completedIntentReplayIndex).toBeLessThan(insertIndex);
    expect(
      provisioningSql.slice(membershipReplayIndex, insertIndex),
    ).not.toMatch(/update public\.organizations/i);
  });

  it("retains hardened provisioning authorization", () => {
    expect(provisioningSql).toMatch(
      /security definer\s+set search_path = ''/i,
    );
    expect(provisioningSql).toContain("v_user_id := auth.uid()");
    expect(provisioningSql).toContain("pg_advisory_xact_lock");
    expect(provisioningSql).toMatch(
      /revoke all on function public\.complete_owner_self_registration[\s\S]*from anon/i,
    );
    expect(provisioningSql).toMatch(
      /grant execute on function public\.complete_owner_self_registration[\s\S]*to authenticated/i,
    );
  });
});

describe("onboarding flow version domain contract", () => {
  it("represents exactly legacy V1 and four-target V2", () => {
    expect(ONBOARDING_FLOW_VERSIONS).toEqual([1, 2]);
    expect(isOnboardingFlowVersion(1)).toBe(true);
    expect(isOnboardingFlowVersion(2)).toBe(true);
    expect(isOnboardingFlowVersion(null)).toBe(false);
    expect(isOnboardingFlowVersion(0)).toBe(false);
    expect(isOnboardingFlowVersion(3)).toBe(false);
  });
});
