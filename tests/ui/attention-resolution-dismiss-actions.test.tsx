import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionResolutionDismissActions } from "@/features/attention/ui/attention-resolution-dismiss-actions";
import * as lifecycleActions from "@/features/attention/actions/lifecycle-attention-actions";
import { ATTENTION_REASON_MAX_LENGTH } from "@/features/attention/domain/validation";
import {
  ATTENTION_ITEM_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("@/features/attention/actions/lifecycle-attention-actions", () => ({
  resolveAttentionItemAction: vi.fn(),
  dismissAttentionItemAction: vi.fn(),
}));

const resolveMock = vi.mocked(lifecycleActions.resolveAttentionItemAction);
const dismissMock = vi.mocked(lifecycleActions.dismissAttentionItemAction);

beforeEach(() => {
  vi.clearAllMocks();
  resolveMock.mockResolvedValue({
    ok: true,
    action: "resolve",
    attentionItemId: ATTENTION_ITEM_ID,
    outcome: "applied",
    committed: true,
    refreshRequired: false,
    returnPath: `/attention/${ATTENTION_ITEM_ID}`,
  });
  dismissMock.mockResolvedValue({
    ok: true,
    action: "dismiss",
    attentionItemId: ATTENTION_ITEM_ID,
    outcome: "applied",
    committed: true,
    refreshRequired: false,
    returnPath: `/attention/${ATTENTION_ITEM_ID}`,
  });
});

describe("AttentionResolutionDismissActions presentation (B1.7.6-D)", () => {
  it("renders Resolve and Dismiss openers without confirmation forms until opened", () => {
    const html = renderToStaticMarkup(
      <AttentionResolutionDismissActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`}
        itemTitleLabel="No recent progress"
        showResolve
        showDismiss
      />,
    );

    expect(html).toContain("Resolve or dismiss");
    expect(html).toContain(">Resolve<");
    expect(html).toContain(">Dismiss<");
    expect(html).not.toContain("Confirm resolve");
    expect(html).not.toContain("Confirm dismiss");
    expect(html).not.toContain("attention-resolution-reason");
    expect(html).not.toContain("attention-dismissal-reason");
    expect(html).not.toMatch(/>Archive</);
    expect(html).not.toMatch(/\bClose\b/);
    expect(html).not.toContain(String(ATTENTION_REASON_MAX_LENGTH + 1));
  });

  it("can render resolve-only or dismiss-only blocks", () => {
    const resolveOnly = renderToStaticMarkup(
      <AttentionResolutionDismissActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        itemTitleLabel="No recent progress"
        showResolve
        showDismiss={false}
      />,
    );
    expect(resolveOnly).toContain(">Resolve<");
    expect(resolveOnly).not.toContain(">Dismiss<");

    const dismissOnly = renderToStaticMarkup(
      <AttentionResolutionDismissActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        itemTitleLabel="No recent progress"
        showResolve={false}
        showDismiss
      />,
    );
    expect(dismissOnly).toContain(">Dismiss<");
    expect(dismissOnly).not.toContain(">Resolve<");
  });

  it("renders nothing when both actions are hidden", () => {
    const html = renderToStaticMarkup(
      <AttentionResolutionDismissActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        itemTitleLabel="No recent progress"
        showResolve={false}
        showDismiss={false}
      />,
    );
    expect(html).toBe("");
  });

  it("does not call mutation actions during static render", () => {
    renderToStaticMarkup(
      <AttentionResolutionDismissActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        itemTitleLabel="No recent progress"
        showResolve
        showDismiss
      />,
    );
    expect(resolveMock).not.toHaveBeenCalled();
    expect(dismissMock).not.toHaveBeenCalled();
  });
});
