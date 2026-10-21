import { readFileSync } from "node:fs";
import { join } from "node:path";
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { updateLeadProfileAction } from "@/features/leads/actions/lead-actions";
import { LeadEditForm } from "@/features/leads/ui/lead-edit-form";
import {
  DEFAULT_LEAD_SOURCE_TYPE,
  LEAD_SOURCE_TYPE_OPTIONS,
  buildLeadSourceTypeSelectOptions,
} from "@/features/leads/ui/lead-source-type-options";
import { updateLeadProfileInputSchema } from "@/features/leads/validation/mutation-schemas";
import { CONVERTED_LEAD_EDIT_NOTICE } from "@/features/leads/ui/lead-presentation";
import { sampleLeadDetail } from "../helpers/lead-mutation-mocks";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/leads/actions/lead-actions", () => ({
  updateLeadProfileAction: vi.fn(),
}));

const updateActionMock = vi.mocked(updateLeadProfileAction);

const listState = {
  org: sampleLeadDetail.organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

const ownerOptions = {
  members: [{ value: "33333333-3333-4333-8333-333333333333", label: "Taylor Owner" }],
  capped: false,
};

function renderEditForm(lead = sampleLeadDetail) {
  return renderToStaticMarkup(
    <LeadEditForm
      organizationId={lead.organizationId}
      lead={lead}
      listState={listState}
      ownerOptions={ownerOptions}
      cancelHref={`/leads/${lead.id}`}
    />,
  );
}

describe("LeadEditForm", () => {
  it("renders updated terminology and approved profile fields only", () => {
    const html = renderEditForm();

    expect(html).toContain("Edit lead");
    expect(html).toContain("Prospect Co");
    expect(html).toContain("Lead name (required)");
    expect(html).toContain('for="edit-lead-display-name"');
    expect(html).toContain('id="edit-lead-display-name"');
    expect(html).toContain("Assigned to");
    expect(html).toContain('for="edit-lead-owner"');
    expect(html).toContain("Lead source");
    expect(html).toContain('for="edit-lead-source-type"');
    expect(html).toContain("Source details");
    expect(html).toContain('for="edit-lead-source-detail"');
    expect(html).toContain("Interested in");
    expect(html).toContain('for="edit-lead-pursuit-label"');
    expect(html).toContain("Source and interest");
    expect(html).not.toContain("Source and pursuit");
    expect(html).not.toContain("Display name (required)");
    expect(html).not.toContain(">Owner<");
    expect(html).not.toContain("Source type");
    expect(html).not.toContain(">Source detail<");
    expect(html).not.toContain("Pursuit label");
    expect(html).not.toMatch(/pipeline stage/i);
    expect(html).not.toMatch(/toStatus/);
    expect(html).not.toMatch(/toStageId/);
    expect(html).not.toContain("Archive lead");
  });

  it("shows converted-edit notice only for converted leads and keeps editing available", () => {
    const openHtml = renderEditForm();
    expect(openHtml).not.toContain(CONVERTED_LEAD_EDIT_NOTICE);

    const convertedHtml = renderEditForm({
      ...sampleLeadDetail,
      status: "converted",
      statusLabel: "Converted",
      derived: {
        ...sampleLeadDetail.derived,
        isConverted: true,
        isConvertible: false,
        allowedStatusTransitions: [],
      },
    });

    expect(convertedHtml).toContain(CONVERTED_LEAD_EDIT_NOTICE);
    expect(convertedHtml).toContain('role="status"');
    expect(convertedHtml).toContain("Lead name (required)");
    expect(convertedHtml).toContain("Save lead");
  });

  it("renders the same Lead source select options as Create Lead with current value selected", () => {
    const html = renderEditForm();

    expect(html).toMatch(/<select[^>]*id="edit-lead-source-type"[^>]*>/);
    expect(html).not.toMatch(/<input[^>]*id="edit-lead-source-type"/);

    for (const option of LEAD_SOURCE_TYPE_OPTIONS) {
      expect(html).toContain(`value="${option.value}"`);
      expect(html).toContain(option.label);
    }

    expect(sampleLeadDetail.sourceType).toBe(DEFAULT_LEAD_SOURCE_TYPE);
    expect(html).toMatch(/<option[^>]*value="manual"[^>]*selected[^>]*>Manual entry<\/option>/);
  });

  it("selects a non-default canonical sourceType when editing an existing lead", () => {
    const html = renderEditForm({
      ...sampleLeadDetail,
      sourceType: "instagram",
    });

    expect(html).toMatch(/<option[^>]*value="instagram"[^>]*selected[^>]*>Instagram<\/option>/);
    expect(html).not.toMatch(/<option[^>]*value="manual"[^>]*selected/);
  });

  it("preserves legacy sourceType values in the select without silent replacement", () => {
    const legacyLead = {
      ...sampleLeadDetail,
      sourceType: "trade-show-2024",
    };
    const html = renderEditForm(legacyLead);
    const options = buildLeadSourceTypeSelectOptions(legacyLead.sourceType);

    expect(options[0]).toEqual({ value: "trade-show-2024", label: "trade-show-2024" });
    expect(html).toContain('value="trade-show-2024"');
    expect(html).toMatch(
      /<option[^>]*value="trade-show-2024"[^>]*selected[^>]*>trade-show-2024<\/option>/,
    );
    for (const option of LEAD_SOURCE_TYPE_OPTIONS) {
      expect(html).toContain(`value="${option.value}"`);
    }
  });

  it("keeps optional fields optional with helper placeholders", () => {
    const html = renderEditForm();

    expect(html).toContain('placeholder="Example: Instagram DM after the beta tester post"');
    expect(html).toContain('placeholder="Example: ZyntixAI Beta or Product Demo"');
    expect(html).not.toMatch(/id="edit-lead-source-detail"[^>]*required/);
    expect(html).not.toMatch(/id="edit-lead-pursuit-label"[^>]*required/);
    expect(html).not.toMatch(/id="edit-lead-source-type"[^>]*required/);
    expect(html).not.toMatch(/id="edit-lead-owner"[^>]*required/);
  });

  it("preserves updateLeadProfileAction payload keys and sourceType submission contract", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/leads/ui/lead-edit-form.tsx"),
      "utf8",
    );

    expect(source).toContain("updateLeadProfileAction({");
    expect(source).toContain("organizationId,");
    expect(source).toContain("leadId: lead.id");
    expect(source).toContain("displayName:");
    expect(source).toContain("firstName:");
    expect(source).toContain("lastName:");
    expect(source).toContain("email:");
    expect(source).toContain("phone:");
    expect(source).toContain("ownerMemberId:");
    expect(source).toContain("sourceType:");
    expect(source).toContain("sourceDetail:");
    expect(source).toContain("pursuitLabel:");
    expect(source).toContain("sourceType: sourceType.trim() || DEFAULT_LEAD_SOURCE_TYPE");
    expect(source).toContain("buildLeadSourceTypeSelectOptions(lead.sourceType)");
    expect(source).toContain('from "@/features/leads/ui/lead-source-type-options"');
    expect(source).not.toContain("display_name");
    expect(source).not.toContain("owner_id");
    expect(source).not.toContain("source_type");
    expect(source).not.toContain("source_detail");
    expect(source).not.toContain("pursuit_label");
  });

  it("does not invoke updateLeadProfileAction during static render", () => {
    renderEditForm();
    expect(updateActionMock).not.toHaveBeenCalled();
  });
});

describe("edit lead source type values", () => {
  it("accepts canonical and legacy sourceType values through the update schema", () => {
    for (const option of LEAD_SOURCE_TYPE_OPTIONS) {
      const result = updateLeadProfileInputSchema.safeParse({
        organizationId: sampleLeadDetail.organizationId,
        leadId: sampleLeadDetail.id,
        displayName: "Prospect Co",
        sourceType: option.value,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sourceType).toBe(option.value);
      }
    }

    const legacy = updateLeadProfileInputSchema.safeParse({
      organizationId: sampleLeadDetail.organizationId,
      leadId: sampleLeadDetail.id,
      displayName: "Prospect Co",
      sourceType: "trade-show-2024",
    });
    expect(legacy.success).toBe(true);
    if (legacy.success) {
      expect(legacy.data.sourceType).toBe("trade-show-2024");
    }
  });

  it("keeps optional profile fields optional on update", () => {
    const result = updateLeadProfileInputSchema.safeParse({
      organizationId: sampleLeadDetail.organizationId,
      leadId: sampleLeadDetail.id,
      displayName: "Prospect Co",
      sourceType: "instagram",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceDetail).toBeNull();
      expect(result.data.pursuitLabel).toBeNull();
      expect(result.data.ownerMemberId).toBeUndefined();
    }
  });
});
