import { describe, expect, it } from "vitest";
import {
  IMPLEMENTED_SOCIAL_PROVIDERS,
  isConnectionEnabledSocialProvider,
  isImplementedSocialProvider,
} from "@/features/social-media/domain/provider";
import {
  PLANNED_SOCIAL_PROVIDERS,
  SOCIAL_PROVIDER_ROLLOUT_WAVES,
  isPlannedSocialProvider,
} from "@/features/social-media/domain/planned-providers";
import {
  SOCIAL_ACTION_AUTHORIZATION_CLASSES,
  SOCIAL_CAPABILITY_AVAILABILITY_STATES,
  SOCIAL_DATA_PROVENANCE_KINDS,
  SOCIAL_UNIVERSAL_CAPABILITY_CATALOG,
  isSocialCapabilityAvailabilityState,
} from "@/features/social-media/domain/universal-contracts";
import { SOCIAL_BETA1_CAPABILITIES } from "@/features/social-media/domain/capabilities";
import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";

describe("SMM-B1.1-D universal social planning contracts", () => {
  it("keeps Instagram as the only implemented/connectable provider", () => {
    expect(IMPLEMENTED_SOCIAL_PROVIDERS).toEqual(["instagram"]);
    expect(isImplementedSocialProvider("tiktok")).toBe(false);
    expect(isImplementedSocialProvider("threads")).toBe(false);
    expect(isImplementedSocialProvider("pinterest")).toBe(false);
    expect(
      isConnectionEnabledSocialProvider("facebook", true, true),
    ).toBe(false);
  });

  it("catalogs planned providers without enabling them", () => {
    expect(PLANNED_SOCIAL_PROVIDERS).toEqual([
      "instagram",
      "facebook",
      "threads",
      "tiktok",
      "linkedin",
      "youtube",
      "pinterest",
      "x",
    ]);
    expect(isPlannedSocialProvider("threads")).toBe(true);
    expect(isPlannedSocialProvider("pinterest")).toBe(true);
    expect(isImplementedSocialProvider("threads")).toBe(false);
  });

  it("locks rollout waves with Instagram as Provider 1", () => {
    expect(SOCIAL_PROVIDER_ROLLOUT_WAVES.provider_1).toEqual(["instagram"]);
    expect(SOCIAL_PROVIDER_ROLLOUT_WAVES.wave_2).toEqual([
      "facebook",
      "threads",
    ]);
  });

  it("preserves Beta 1 capability IDs inside the universal catalog", () => {
    for (const capability of SOCIAL_BETA1_CAPABILITIES) {
      expect(SOCIAL_UNIVERSAL_CAPABILITY_CATALOG).toContain(capability);
    }
  });

  it("defines capability availability and provenance/governance enums", () => {
    expect(SOCIAL_CAPABILITY_AVAILABILITY_STATES).toContain("unsupported");
    expect(isSocialCapabilityAvailabilityState("supported")).toBe(true);
    expect(isSocialCapabilityAvailabilityState("maybe")).toBe(false);
    expect(SOCIAL_DATA_PROVENANCE_KINDS).toContain("ai_inferred");
    expect(SOCIAL_ACTION_AUTHORIZATION_CLASSES).toContain(
      "approval_required",
    );
  });

  it("preserves B1.1-B connection migration and allows B1.2 workspace foundation", () => {
    const migrations = readdirSync(join(process.cwd(), "supabase/migrations"));
    const social = migrations.filter((name) => name.includes("social")).sort();
    expect(social).toEqual([
      "20260815130220_add_social_connection_credential_foundation.sql",
      "20260815161759_add_social_workspace_foundation.sql",
      "20260815162306_add_social_workspace_foundation.sql",
      "20260815182703_add_social_brand_brain_campaign_foundation.sql",
      "20260815184059_add_social_master_content_variants_media_foundation.sql",
      "20260815185612_add_social_versioning_review_approval_calendar_foundation.sql",
      "20260815202145_add_social_publishing_infrastructure_foundation.sql",
      "20260815212000_add_social_private_media_bucket_r1.sql",
      "20260818190346_add_social_closed_beta_enrollment_foundation.sql",
      "20260818191706_add_social_closed_beta_entitlement_defense_in_depth.sql",
      "20260818194719_add_social_closed_beta_operator_mutation_wrappers.sql",
      "20260819101500_add_social_instagram_provider_4xx_diagnostic_hardening.sql",
      "20260819120000_add_social_controlled_publish_window_binding.sql",
      "20260820120000_add_social_reauthorization_connected_finalize.sql",
      "20260821114627_add_social_publication_scheduling_domain.sql",
      "20260821123346_add_social_scheduler_worker_domain.sql",
      "20260821130449_add_social_attention_missed_window_domain.sql",
      "20260821135320_add_social_publication_scheduler_pg_cron_trigger.sql",
    ]);
  });

  it("publishes durable architecture and evidence documents", () => {
    expect(
      existsSync(
        join(
          process.cwd(),
          "docs/architecture/social-media/universal-social-data-domain-contract.md",
        ),
      ),
    ).toBe(true);
    expect(
      existsSync(
        join(
          process.cwd(),
          "docs/phases/SMM-B1.1-D-universal-social-architecture-data-contract-evidence.md",
        ),
      ),
    ).toBe(true);
  });
});
