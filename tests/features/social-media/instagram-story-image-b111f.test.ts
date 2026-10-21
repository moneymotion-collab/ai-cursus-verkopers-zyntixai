import { beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { isValidInstagramFeedImageDimensions } from "@/features/social-media/server/jpeg-dimensions";
import { isValidInstagramStoryImageDimensions } from "@/features/social-media/domain/story-image";
import { evaluateScheduledControlledPublishWindowBinding } from "@/features/social-media/domain/controlled-publish-window";
import { SOCIAL_SCHEDULE_MISS_GRACE_SECONDS } from "@/features/social-media/domain/scheduling";
import { canManageSocialConnections, canScheduleSocialPublication } from "@/features/social-media/domain/permissions";

const ORG = "11111111-1111-4111-8111-111111111111";
const WS = "55555555-5555-4555-8555-555555555555";
const CONN = "24420652-d0b4-4237-9a75-51d89be50c65";
const STORY_PUB = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";

const publishMock = vi.fn();

vi.mock("@/features/social-media/server/instagram-publishing/adapter", () => ({
  createInstagramPublishingAdapter: () => ({
    publish: publishMock,
  }),
}));

vi.mock("@/features/social-media/server/credential-repository", () => ({
  loadEncryptedSocialProviderCredentialEnvelope: vi.fn(async () => ({
    ok: true,
    envelope: {
      credentialId: "cred-1",
      organizationId: ORG,
      connectionId: CONN,
      provider: "instagram",
      credentialVersion: 2,
      encrypted: {
        encryptionVersion: 1,
        keyPurpose: "social-provider-credential",
        keyVersion: 1,
        ciphertext: "Yw==",
        iv: "YQ==",
        authTag: "Yg==",
      },
    },
  })),
}));

vi.mock("@/features/social-media/server/credential-crypto", () => ({
  decryptSocialCredentialEnvelope: () => ({
    ok: true,
    payload: { accessToken: "mock-access-token-not-real" },
  }),
}));

function mockSupabase(rpc: ReturnType<typeof vi.fn>) {
  return { rpc, from: vi.fn() } as never;
}

function storyContext(overrides: Record<string, unknown> = {}) {
  return {
    result_code: "success",
    publication_id: STORY_PUB,
    organization_id: ORG,
    workspace_id: WS,
    connection_id: CONN,
    variant_version_id: "7a114018-50ab-4a4b-b53e-6b702079c4d5",
    provider: "instagram",
    operation_id: "op-story-1",
    content_format: "story",
    caption: "editorial story copy must not become a provider caption",
    alt_text: "unused for stories",
    media_snapshot: [
      {
        asset_id: "679c7c07-15ac-4cf1-b81d-1750353f8c64",
        sort_order: 0,
        asset_role: "primary",
        storage_object_key: "org/b18/story.jpg",
        mime_type: "image/jpeg",
        media_category: "image",
      },
    ],
    connection_status: "connected",
    connection_health: "healthy",
    reauthorization_required_at: null,
    capability_snapshot: ["publish_story", "publish_image"],
    external_account_id: "17841400000000000",
    ...overrides,
  };
}

function startRpc(contextRow: Record<string, unknown>, startCodes: string[]) {
  let startCalls = 0;
  return vi.fn(async (fn: string) => {
    if (fn === "scheduler_start_scheduled_publication_attempt") {
      const code = startCodes[Math.min(startCalls, startCodes.length - 1)] ?? "conflict";
      startCalls += 1;
      if (code === "success") {
        return {
          data: [
            {
              result_code: "success",
              attempt_id: "44444444-4444-4444-8444-444444444444",
              worker_id: "sched_storyowner1",
              claim_generation: 1,
            },
          ],
          error: null,
        };
      }
      return { data: [{ result_code: code }], error: null };
    }
    if (fn === "scheduler_load_social_publication_execution_context") {
      return { data: [contextRow], error: null };
    }
    if (fn === "scheduler_complete_scheduled_publication_attempt") {
      return { data: [{ result_code: "success" }], error: null };
    }
    return { data: null, error: { message: `unexpected ${fn}` } };
  });
}

describe("SMM-B1.11-F Story IMAGE scheduler execution", () => {
  beforeEach(() => {
    publishMock.mockReset();
    publishMock.mockResolvedValue({
      outcome: "succeeded",
      externalPublicationId: "ig_story_media_1",
    });
  });

  it("executes Story IMAGE once with publish_story and refuses the second tick", async () => {
    const { executeScheduledSocialPublication } = await import(
      "@/features/social-media/server/execute-scheduled-social-publication"
    );
    const rpc = startRpc(storyContext(), ["success", "controlled_window_exhausted"]);
    const env = {
      SOCIAL_SCHEDULING_ENABLED: "true",
      SOCIAL_PUBLISHING_ENABLED: "true",
    };
    const first = await executeScheduledSocialPublication(mockSupabase(rpc), {
      organizationId: ORG,
      publicationId: STORY_PUB,
      env,
    });
    const second = await executeScheduledSocialPublication(mockSupabase(rpc), {
      organizationId: ORG,
      publicationId: STORY_PUB,
      env,
    });
    expect(first).toMatchObject({
      ok: true,
      outcome: "succeeded",
      externalPublicationIdPresent: true,
    });
    expect(second).toEqual({
      ok: false,
      reason: "controlled_window_exhausted",
      claimed: false,
      providerWriteAttempted: false,
    });
    expect(publishMock).toHaveBeenCalledTimes(1);
    expect(publishMock.mock.calls[0]?.[0]).toMatchObject({
      contentFormat: "story",
      publicationId: STORY_PUB,
      connectionId: CONN,
    });
  });

  it("does not call the adapter for Story VIDEO, missing publish_story, or reauth", async () => {
    const { executeScheduledSocialPublication } = await import(
      "@/features/social-media/server/execute-scheduled-social-publication"
    );
    const env = {
      SOCIAL_SCHEDULING_ENABLED: "true",
      SOCIAL_PUBLISHING_ENABLED: "true",
    };
    const cases = [
      storyContext({
        media_snapshot: [
          {
            asset_id: "679c7c07-15ac-4cf1-b81d-1750353f8c64",
            sort_order: 0,
            asset_role: "primary",
            storage_object_key: "org/b18/story.mp4",
            mime_type: "video/mp4",
            media_category: "video",
          },
        ],
      }),
      storyContext({ capability_snapshot: ["publish_image"] }),
      storyContext({ reauthorization_required_at: "2026-08-21T00:00:00.000Z" }),
      storyContext({ connection_health: "degraded" }),
      storyContext({ connection_status: "disconnected" }),
    ];
    for (const contextRow of cases) {
      publishMock.mockClear();
      const rpc = startRpc(contextRow, ["success"]);
      const result = await executeScheduledSocialPublication(mockSupabase(rpc), {
        organizationId: ORG,
        publicationId: STORY_PUB,
        env,
      });
      expect(result.ok).toBe(false);
      expect(result).toMatchObject({ providerWriteAttempted: false });
      expect(publishMock).not.toHaveBeenCalled();
    }
  });

  it("classifies Story UEO without a second adapter call", async () => {
    const { executeScheduledSocialPublication } = await import(
      "@/features/social-media/server/execute-scheduled-social-publication"
    );
    publishMock.mockRejectedValueOnce(new Error("transport ambiguous"));
    const rpc = startRpc(storyContext(), ["success"]);
    const result = await executeScheduledSocialPublication(mockSupabase(rpc), {
      organizationId: ORG,
      publicationId: STORY_PUB,
      env: {
        SOCIAL_SCHEDULING_ENABLED: "true",
        SOCIAL_PUBLISHING_ENABLED: "true",
      },
    });
    expect(result).toMatchObject({
      ok: true,
      outcome: "unknown_external_outcome",
    });
    expect(publishMock).toHaveBeenCalledTimes(1);
    const complete = rpc.mock.calls.find(
      (call) => call[0] === "scheduler_complete_scheduled_publication_attempt",
    ) as [string, Record<string, unknown>] | undefined;
    expect(complete?.[1]).toMatchObject({
      p_outcome: "unknown_external_outcome",
    });
  });
});

describe("SMM-B1.11-F Story IMAGE contracts and surfaces", () => {
  it("does not reuse feed 4:5–1.91 as a Story hard reject", () => {
    expect(isValidInstagramFeedImageDimensions(1080, 3000)).toBe(false);
    expect(isValidInstagramStoryImageDimensions(1080, 3000)).toBe(true);
  });

  it("keeps the 900-second miss grace and one-shot window for Story", () => {
    expect(SOCIAL_SCHEDULE_MISS_GRACE_SECONDS).toBe(900);
    expect(
      evaluateScheduledControlledPublishWindowBinding({
        activeWindow: {
          windowId: "w1",
          publicationId: STORY_PUB,
          status: "active",
          maxExecuteCount: 1,
          consumedExecuteCount: 0,
          authorizedAt: "2026-08-21T12:00:00.000Z",
          workspaceId: WS,
          connectionId: CONN,
          expiresAt: "2026-08-21T18:00:00.000Z",
        },
        requestedPublicationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        requestedWorkspaceId: WS,
        requestedConnectionId: CONN,
        nowMs: Date.parse("2026-08-21T12:01:00.000Z"),
      }).allowed,
    ).toBe(false);
  });

  it("keeps Story scheduling Owner/Admin-only", () => {
    expect(canScheduleSocialPublication("owner", "active")).toBe(true);
    expect(canScheduleSocialPublication("admin", "active")).toBe(true);
    expect(canScheduleSocialPublication("staff", "active")).toBe(false);
    expect(canScheduleSocialPublication("viewer", "active")).toBe(false);
    expect(canManageSocialConnections("staff", "active")).toBe(false);
  });

  it("exposes Feed/Story placement without Story VIDEO and without Production-verified copy", () => {
    const panel = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/ui/b18-instagram-publish-panel.tsx",
      ),
      "utf8",
    );
    const prepare = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/prepare-b18-instagram-image-publication-action.ts",
      ),
      "utf8",
    );
    const adapter = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/server/instagram-publishing/adapter.ts",
      ),
      "utf8",
    );
    expect(panel).toContain('value="feed"');
    expect(panel).toContain('value="story"');
    expect(panel).not.toContain("Story VIDEO");
    expect(panel).not.toContain("Instagram Stories are Production verified");
    expect(panel).toContain("controlled rollout");
    expect(prepare).toContain('placement === "story" ? "publish_story"');
    expect(prepare).toContain("orgContext.context.organizationId");
    expect(prepare).toContain("canManageSocialConnections");
    expect(adapter).toContain('mediaType: "STORIES"');
    expect(adapter).toContain('format === "story" && primary.mediaCategory !== "image"');
    expect(adapter).not.toContain("mediaType: \"STORIES\",\n            videoUrl");
  });

  it("keeps schedule actions format-agnostic on the existing publication UUID", () => {
    const schedule = readFileSync(
      join(
        process.cwd(),
        "src/features/social-media/actions/schedule-social-publication-actions.ts",
      ),
      "utf8",
    );
    expect(schedule).toContain("schedule_social_publication");
    expect(schedule).not.toContain("social_stories");
    expect(schedule).toContain("canScheduleSocialPublication");
  });
});
