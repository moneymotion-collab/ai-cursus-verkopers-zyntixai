import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  evaluateSocialProviderWriteAuthorization,
  closedBetaPrepareDenialCode,
  closedBetaPublishDenialCode,
} from "@/features/social-media/domain/closed-beta-enrollment";

const foundation = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260818190346_add_social_closed_beta_enrollment_foundation.sql",
  ),
  "utf8",
);
const defense = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql",
  ),
  "utf8",
);

describe("SMM-R1-A-R1 entitlement defense-in-depth", () => {
  it("patches create_social_publication prepare entitlement before insert", () => {
    expect(defense).toContain(
      "create or replace function public.create_social_publication",
    );
    expect(defense).toContain("social_closed_beta_prepare_result_code");
    expect(defense).toContain("social_content_schedule_slots");
    const prepareIdx = defense.indexOf(
      "social_closed_beta_prepare_result_code",
    );
    const insertIdx = defense.indexOf(
      "insert into public.social_publications",
    );
    expect(prepareIdx).toBeGreaterThan(-1);
    expect(insertIdx).toBeGreaterThan(prepareIdx);
  });

  it("patches b18_start to require publishing_allowed before GUC arm", () => {
    expect(defense).toContain(
      "create or replace function public.b18_start_controlled_publication_attempt",
    );
    expect(defense).toContain("social_closed_beta_publish_result_code");
    expect(defense).toContain("claim_lease_expires_at");
    expect(defense).toContain("private.start_social_publication_attempt");
    const entIdx = defense.indexOf(
      "v_beta := private.social_closed_beta_publish_result_code",
    );
    const armIdx = defense.indexOf(
      "set_config('zyntix.social_publishing_enabled', 'true', true)",
    );
    expect(entIdx).toBeGreaterThan(-1);
    expect(armIdx).toBeGreaterThan(entIdx);
  });

  it("exposes composed GUC-first write gate helper without Meta", () => {
    expect(defense).toContain("private.social_provider_write_gate_result_code");
    expect(defense).toContain("public.evaluate_social_provider_write_gates");
    expect(defense).toMatch(
      /if not private\.social_publishing_execution_enabled\(\) then[\s\S]*?return 'feature_disabled'/,
    );
    expect(defense).not.toContain("graph.facebook.com");
  });

  it("keeps operator mutations off authenticated self-promotion", () => {
    expect(foundation).toContain("zyntix.social_closed_beta_operator");
    expect(foundation).toContain(
      "grant execute on function public.%s to service_role",
    );
    expect(foundation).not.toContain(
      "grant execute on function public.platform_enroll_social_closed_beta_organization(uuid, text, uuid) to authenticated",
    );
  });

  it("proves prepare and execute denial matrices in domain", () => {
    expect(closedBetaPrepareDenialCode("not_enrolled")).toBe(
      "closed_beta_not_enrolled",
    );
    expect(closedBetaPrepareDenialCode("approved")).toBeNull();
    expect(closedBetaPrepareDenialCode("publishing_allowed")).toBeNull();
    expect(closedBetaPrepareDenialCode("paused")).toBe("closed_beta_paused");
    expect(closedBetaPrepareDenialCode("revoked")).toBe("closed_beta_revoked");

    expect(closedBetaPublishDenialCode("approved")).toBe(
      "closed_beta_publish_not_allowed",
    );
    expect(
      evaluateSocialProviderWriteAuthorization({
        socialPublishingEnabled: false,
        enrollmentStatus: "publishing_allowed",
        isOwnerOrAdmin: true,
        membershipActive: true,
        connectionEligible: true,
        lifecycleClaimable: true,
      }),
    ).toEqual({ allowed: false, reason: "publishing_globally_disabled" });
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
    expect(social).toContain(
      "20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql",
    );
  });
});
