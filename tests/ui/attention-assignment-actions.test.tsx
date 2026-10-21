import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionAssignmentActions } from "@/features/attention/ui/attention-assignment-actions";
import * as lifecycleActions from "@/features/attention/actions/lifecycle-attention-actions";
import {
  ATTENTION_ITEM_ID,
  MEMBER_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("@/features/attention/actions/lifecycle-attention-actions", () => ({
  assignAttentionItemAction: vi.fn(),
}));

const assignMock = vi.mocked(lifecycleActions.assignAttentionItemAction);

const MEMBER_B = "66666666-6666-4666-8666-666666666666";

beforeEach(() => {
  vi.clearAllMocks();
  assignMock.mockResolvedValue({
    ok: true,
    action: "assign",
    attentionItemId: ATTENTION_ITEM_ID,
    outcome: "applied",
    committed: true,
    refreshRequired: false,
    returnPath: `/attention/${ATTENTION_ITEM_ID}`,
  });
});

describe("AttentionAssignmentActions presentation (B1.7.6-C)", () => {
  it("renders assign select with eligible labels and no free UUID input", () => {
    const html = renderToStaticMarkup(
      <AttentionAssignmentActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`}
        showAssign
        showUnassign={false}
        currentAssigneeMemberId={null}
        assigneeOptions={[
          { value: MEMBER_ID, label: "Alex Owner" },
          { value: MEMBER_B, label: "Sam Staff" },
        ]}
        assigneeOptionsFailed={false}
      />,
    );

    expect(html).toContain("Assignment");
    expect(html).toContain('for="attention-assignee-select"');
    expect(html).toContain('id="attention-assignee-select"');
    expect(html).toContain(">Alex Owner<");
    expect(html).toContain(">Sam Staff<");
    expect(html).toContain(">Unassigned<");
    expect(html).toContain("Save assignment");
    expect(html).not.toContain(">Unassign<");
    expect(html).not.toMatch(/type=["']text["']/);
    expect(html).not.toMatch(/>Resolve</);
    expect(html).not.toMatch(/>Dismiss</);
    expect(html).not.toMatch(/>Archive</);
  });

  it("renders Unassign when assigned and empty-options guidance when none eligible", () => {
    const assigned = renderToStaticMarkup(
      <AttentionAssignmentActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        showAssign
        showUnassign
        currentAssigneeMemberId={MEMBER_ID}
        assigneeOptions={[{ value: MEMBER_ID, label: "Alex Owner" }]}
        assigneeOptionsFailed={false}
      />,
    );
    expect(assigned).toContain(">Unassign<");
    expect(assigned).toContain(`value="${MEMBER_ID}"`);

    const empty = renderToStaticMarkup(
      <AttentionAssignmentActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        showAssign
        showUnassign={false}
        currentAssigneeMemberId={null}
        assigneeOptions={[]}
        assigneeOptionsFailed={false}
      />,
    );
    expect(empty).toContain("No active organization members are available to assign.");
    expect(empty).not.toMatch(/type=["']text["']/);

    const failed = renderToStaticMarkup(
      <AttentionAssignmentActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        showAssign
        showUnassign
        currentAssigneeMemberId={MEMBER_ID}
        assigneeOptions={[]}
        assigneeOptionsFailed
      />,
    );
    expect(failed).toContain("Eligible members could not be loaded");
    expect(failed).toContain(">Unassign<");
  });

  it("renders nothing when both assignment actions are hidden", () => {
    const html = renderToStaticMarkup(
      <AttentionAssignmentActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        showAssign={false}
        showUnassign={false}
        currentAssigneeMemberId={MEMBER_ID}
        assigneeOptions={[{ value: MEMBER_ID, label: "Alex Owner" }]}
        assigneeOptionsFailed={false}
      />,
    );
    expect(html).toBe("");
  });
});
