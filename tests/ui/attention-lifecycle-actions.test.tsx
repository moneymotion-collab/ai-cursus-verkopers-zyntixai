import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AttentionAcknowledgeSeverityActions } from "@/features/attention/ui/attention-lifecycle-actions";
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
  acknowledgeAttentionItemAction: vi.fn(),
  updateAttentionSeverityAction: vi.fn(),
}));

const acknowledgeMock = vi.mocked(lifecycleActions.acknowledgeAttentionItemAction);
const severityMock = vi.mocked(lifecycleActions.updateAttentionSeverityAction);

beforeEach(() => {
  vi.clearAllMocks();
  acknowledgeMock.mockResolvedValue({
    ok: true,
    action: "acknowledge",
    attentionItemId: ATTENTION_ITEM_ID,
    outcome: "applied",
    committed: true,
    refreshRequired: false,
    returnPath: `/attention/${ATTENTION_ITEM_ID}`,
  });
  severityMock.mockResolvedValue({
    ok: true,
    action: "update_severity",
    attentionItemId: ATTENTION_ITEM_ID,
    outcome: "applied",
    committed: true,
    refreshRequired: false,
    returnPath: `/attention/${ATTENTION_ITEM_ID}`,
  });
});

describe("AttentionAcknowledgeSeverityActions presentation", () => {
  it("renders acknowledge and severity controls with accessible labels", () => {
    const html = renderToStaticMarkup(
      <AttentionAcknowledgeSeverityActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}?org=${ORG_ID}`}
        showAcknowledge
        showUpdateSeverity
        currentSeverity="high"
      />,
    );

    expect(html).toContain("Lifecycle actions");
    expect(html).toContain(">Acknowledge<");
    expect(html).toContain('for="attention-severity-select"');
    expect(html).toContain('id="attention-severity-select"');
    expect(html).toContain('value="high"');
    expect(html).toContain(">Low<");
    expect(html).toContain(">Medium<");
    expect(html).toContain(">High<");
    expect(html).toContain(">Critical<");
    expect(html).toContain("Save severity");
    expect(html).not.toMatch(/>Assign</);
    expect(html).not.toMatch(/>Resolve</);
    expect(html).not.toMatch(/>Dismiss</);
    expect(html).not.toMatch(/>Archive</);
  });

  it("can render acknowledge-only or severity-only blocks", () => {
    const ackOnly = renderToStaticMarkup(
      <AttentionAcknowledgeSeverityActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        showAcknowledge
        showUpdateSeverity={false}
        currentSeverity="medium"
      />,
    );
    expect(ackOnly).toContain(">Acknowledge<");
    expect(ackOnly).not.toContain("Save severity");

    const severityOnly = renderToStaticMarkup(
      <AttentionAcknowledgeSeverityActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        showAcknowledge={false}
        showUpdateSeverity
        currentSeverity="low"
      />,
    );
    expect(severityOnly).toContain("Save severity");
    expect(severityOnly).not.toContain(">Acknowledge<");
  });

  it("renders nothing when both actions are hidden", () => {
    const html = renderToStaticMarkup(
      <AttentionAcknowledgeSeverityActions
        organizationId={ORG_ID}
        attentionItemId={ATTENTION_ITEM_ID}
        returnPath={`/attention/${ATTENTION_ITEM_ID}`}
        showAcknowledge={false}
        showUpdateSeverity={false}
        currentSeverity="medium"
      />,
    );
    expect(html).toBe("");
  });
});
