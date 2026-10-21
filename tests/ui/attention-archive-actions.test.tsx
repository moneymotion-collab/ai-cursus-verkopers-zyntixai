import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionArchiveActions } from "@/features/attention/ui/attention-archive-actions";
import * as lifecycleActions from "@/features/attention/actions/lifecycle-attention-actions";
import {
  ATTENTION_ITEM_ID,
  ORG_ID,
} from "../helpers/attention-test-fixtures";

const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh }),
}));

vi.mock("@/features/attention/actions/lifecycle-attention-actions", () => ({
  archiveAttentionItemAction: vi.fn(),
}));

const archiveMock = vi.mocked(lifecycleActions.archiveAttentionItemAction);

beforeEach(() => {
  vi.clearAllMocks();
  archiveMock.mockResolvedValue({
    ok: true,
    action: "archive",
    attentionItemId: ATTENTION_ITEM_ID,
    outcome: "applied",
    committed: true,
    refreshRequired: false,
    returnPath: `/attention/${ATTENTION_ITEM_ID}`,
  });
});

describe("AttentionArchiveActions presentation (B1.7.6-E)", () => {
  it("renders Archive opener without confirmation until opened and without reason field", () => {
    const html = renderToStaticMarkup(
      <AttentionArchiveActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`}
        itemTitleLabel="No recent progress"
        statusLabel="Resolved"
        showArchive
      />,
    );

    expect(html).toContain(">Archive<");
    expect(html).toContain("Archive item");
    expect(html).not.toContain("Confirm archive");
    expect(html).not.toContain("<textarea");
    expect(html).not.toContain("resolutionReason");
    expect(html).not.toContain("dismissalReason");
    expect(html).not.toMatch(/\b(Close|Delete|Reopen|Restore)\b/);
  });

  it("renders nothing when archive is hidden", () => {
    const html = renderToStaticMarkup(
      <AttentionArchiveActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        itemTitleLabel="No recent progress"
        statusLabel="Resolved"
        showArchive={false}
      />,
    );
    expect(html).toBe("");
  });

  it("does not call archive during static render", () => {
    renderToStaticMarkup(
      <AttentionArchiveActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        itemTitleLabel="No recent progress"
        statusLabel="Dismissed"
        showArchive
      />,
    );
    expect(archiveMock).not.toHaveBeenCalled();
  });
});
