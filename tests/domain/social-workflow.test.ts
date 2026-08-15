import { describe, expect, it } from "vitest";
import {
  SOCIAL_APPROVAL_DECISIONS,
  SOCIAL_CLIENT_APPROVAL_B15_DECISION,
  SOCIAL_REVIEW_REQUEST_STATUSES,
  SOCIAL_SELF_APPROVAL_B15_POLICY,
  SOCIAL_WORKFLOW_FORBIDDEN_PUBLICATION_STATES,
  computeWorkflowReady,
  isReviewOverdue,
  isSocialApprovalDecisionKind,
  isSocialReviewRequestStatus,
  isSocialScheduleSlotStatus,
} from "@/features/social-media/domain/workflow";
import {
  canApproveSocialContent,
  canManageSocialConnections,
  canManageSocialContent,
} from "@/features/social-media/domain/permissions";
import { isImplementedSocialProvider } from "@/features/social-media/domain/provider";

describe("SMM-B1.5 workflow domain contracts", () => {
  it("defines finite review/approval/schedule taxonomies without publication states", () => {
    expect(SOCIAL_REVIEW_REQUEST_STATUSES).toEqual([
      "open",
      "completed",
      "cancelled",
      "superseded",
    ]);
    expect(isSocialReviewRequestStatus("superseded")).toBe(true);
    expect(SOCIAL_APPROVAL_DECISIONS).toEqual([
      "approved",
      "changes_requested",
      "rejected",
    ]);
    expect(isSocialApprovalDecisionKind("changes_requested")).toBe(true);
    expect(isSocialScheduleSlotStatus("active")).toBe(true);
    expect(isSocialScheduleSlotStatus("published")).toBe(false);
    for (const forbidden of SOCIAL_WORKFLOW_FORBIDDEN_PUBLICATION_STATES) {
      expect(isSocialScheduleSlotStatus(forbidden)).toBe(false);
    }
  });

  it("computes editorial workflow readiness without claiming provider publishability", () => {
    expect(
      computeWorkflowReady({
        workspaceArchived: false,
        contentArchived: false,
        variantArchived: false,
        mediaAssetsAvailable: true,
        internalApprovalRequired: true,
        clientApprovalRequired: false,
        hasInternalApproval: true,
        hasClientApproval: false,
      }),
    ).toBe(true);
    expect(
      computeWorkflowReady({
        workspaceArchived: false,
        contentArchived: false,
        variantArchived: false,
        mediaAssetsAvailable: true,
        internalApprovalRequired: true,
        clientApprovalRequired: false,
        hasInternalApproval: false,
        hasClientApproval: false,
      }),
    ).toBe(false);
    expect(
      computeWorkflowReady({
        workspaceArchived: false,
        contentArchived: false,
        variantArchived: false,
        mediaAssetsAvailable: true,
        internalApprovalRequired: true,
        clientApprovalRequired: true,
        hasInternalApproval: true,
        hasClientApproval: false,
      }),
    ).toBe(false);
    expect(isImplementedSocialProvider("tiktok")).toBe(false);
  });

  it("derives overdue reviews without requiring a worker", () => {
    expect(
      isReviewOverdue("open", "2026-08-01T10:00:00.000Z", "2026-08-15T10:00:00.000Z"),
    ).toBe(true);
    expect(
      isReviewOverdue("completed", "2026-08-01T10:00:00.000Z", "2026-08-15T10:00:00.000Z"),
    ).toBe(false);
    expect(isReviewOverdue("open", null, "2026-08-15T10:00:00.000Z")).toBe(false);
  });

  it("locks Beta 1 internal approval + self-approval + client deferral decisions", () => {
    expect(SOCIAL_CLIENT_APPROVAL_B15_DECISION).toBe(
      "deferred_internal_only_client_flag_extension",
    );
    expect(SOCIAL_SELF_APPROVAL_B15_POLICY).toBe("allowed");
    expect(canApproveSocialContent("staff", "active")).toBe(true);
    expect(canManageSocialContent("staff", "active")).toBe(true);
    expect(canManageSocialConnections("staff", "active")).toBe(false);
    expect(canApproveSocialContent("viewer", "active")).toBe(false);
  });
});
