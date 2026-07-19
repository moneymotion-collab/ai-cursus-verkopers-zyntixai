import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createLeadAction } from "@/features/leads/actions/lead-actions";
import { LeadCreateForm } from "@/features/leads/ui/lead-create-form";
import {
  DEFAULT_LEAD_SOURCE_TYPE,
  LEAD_SOURCE_TYPE_OPTIONS,
} from "@/features/leads/ui/lead-source-type-options";
import { createLeadInputSchema } from "@/features/leads/validation/mutation-schemas";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock("@/features/leads/actions/lead-actions", () => ({
  createLeadAction: vi.fn(),
}));

const createActionMock = vi.mocked(createLeadAction);

const organizationId = "11111111-1111-4111-8111-111111111111";
const ownerOptions = {
  members: [{ value: "33333333-3333-4333-8333-333333333333", label: "Taylor Owner" }],
  capped: false,
};

const listState = {
  org: organizationId,
  archived: false,
  sort: "display_name" as const,
  direction: "asc" as const,
  page: 1,
  pageSize: 25,
};

function renderCreateForm() {
  return renderToStaticMarkup(
    <LeadCreateForm
      organizationId={organizationId}
      listState={listState}
      ownerOptions={ownerOptions}
      cancelHref="/leads"
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("LeadCreateForm", () => {
  it("renders updated terminology and approved fields without lifecycle inputs", () => {
    const html = renderCreateForm();

    expect(html).toContain("Create lead");
    expect(html).toContain("Lead name (required)");
    expect(html).toContain('for="create-lead-display-name"');
    expect(html).toContain('id="create-lead-display-name"');
    expect(html).toContain("Assigned to");
    expect(html).toContain('for="create-lead-owner"');
    expect(html).toContain("Lead source");
    expect(html).toContain('for="create-lead-source-type"');
    expect(html).toContain("Source details");
    expect(html).toContain('for="create-lead-source-detail"');
    expect(html).toContain("Interested in");
    expect(html).toContain('for="create-lead-pursuit"');
    expect(html).toContain("Source and interest");
    expect(html).not.toContain("Source and pursuit");
    expect(html).toContain("Unassigned");
    expect(html).not.toContain("Display name (required)");
    expect(html).not.toContain(">Owner<");
    expect(html).not.toContain(">Source type<");
    expect(html).not.toContain(">Source detail<");
    expect(html).not.toContain(">Pursuit label<");
    expect(html).not.toMatch(/pipeline stage/i);
    expect(html.toLowerCase()).not.toContain("archive");
    expect(html.toLowerCase()).not.toContain("convert");
  });

  it("renders Lead source as a select with stable stored values and Manual entry default", () => {
    const html = renderCreateForm();

    expect(html).toMatch(/<select[^>]*id="create-lead-source-type"[^>]*>/);
    expect(html).not.toMatch(/<input[^>]*id="create-lead-source-type"/);

    for (const option of LEAD_SOURCE_TYPE_OPTIONS) {
      expect(html).toContain(`value="${option.value}"`);
      expect(html).toContain(option.label);
    }

    expect(DEFAULT_LEAD_SOURCE_TYPE).toBe("manual");
    expect(html).toMatch(/<option[^>]*value="manual"[^>]*selected[^>]*>Manual entry<\/option>/);
    expect(LEAD_SOURCE_TYPE_OPTIONS.map((option) => option.value)).toEqual([
      "manual",
      "instagram",
      "facebook",
      "linkedin",
      "website",
      "advertisement",
      "referral",
      "event",
      "email",
      "other",
    ]);
  });

  it("keeps optional source and pursuit fields optional with helper placeholders", () => {
    const html = renderCreateForm();

    expect(html).toContain('placeholder="Example: Instagram DM after the beta tester post"');
    expect(html).toContain('placeholder="Example: ZyntixAI Beta or Product Demo"');
    expect(html).not.toMatch(/id="create-lead-source-detail"[^>]*required/);
    expect(html).not.toMatch(/id="create-lead-pursuit"[^>]*required/);
    expect(html).not.toMatch(/id="create-lead-source-type"[^>]*required/);
    expect(html).not.toMatch(/id="create-lead-owner"[^>]*required/);
  });

  it("preserves createLeadAction payload keys and default sourceType contract in source", () => {
    const source = readFileSync(
      join(process.cwd(), "src/features/leads/ui/lead-create-form.tsx"),
      "utf8",
    );

    expect(source).toContain("createLeadAction({");
    expect(source).toContain("organizationId,");
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
    expect(source).toContain('from "@/features/leads/ui/lead-source-type-options"');
    expect(source).toContain("LEAD_SOURCE_TYPE_OPTIONS");
    expect(source).not.toContain("display_name");
    expect(source).not.toContain("owner_id");
    expect(source).not.toContain("source_type");
    expect(source).not.toContain("source_detail");
    expect(source).not.toContain("pursuit_label");
  });

  it("does not invoke createLeadAction during static render", () => {
    renderCreateForm();
    expect(createActionMock).not.toHaveBeenCalled();
  });
});

describe("create lead source type values", () => {
  it("accepts each selectable source type through the existing create schema", () => {
    for (const option of LEAD_SOURCE_TYPE_OPTIONS) {
      const result = createLeadInputSchema.safeParse({
        organizationId,
        displayName: "Prospect Co",
        sourceType: option.value,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.sourceType).toBe(option.value);
      }
    }
  });

  it("defaults missing sourceType to manual without requiring optional fields", () => {
    const result = createLeadInputSchema.safeParse({
      organizationId,
      displayName: "Prospect Co",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sourceType).toBe("manual");
      expect(result.data.sourceDetail).toBeNull();
      expect(result.data.pursuitLabel).toBeNull();
      expect(result.data.ownerMemberId).toBeUndefined();
    }
  });
});
