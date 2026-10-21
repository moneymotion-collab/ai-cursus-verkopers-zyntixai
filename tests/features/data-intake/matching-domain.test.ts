import { describe, expect, it } from "vitest";
import {
  classifyIdentityResolutions,
  completedMatchingStatus,
  DATA_CUSTOMER_MATCHER_VERSION,
  summarizeIdentityResolutions,
} from "@/features/data-intake/domain/matching";
import type { DataIntakeStagingRow } from "@/features/data-intake/domain/staging";

const ORG = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const FOREIGN = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const CUSTOMER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const CUSTOMER_TWO = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";

function row(input: {
  sourceRowNumber: number;
  email?: string | null;
  lifecycle?: "validated" | "blocked";
  displayName?: string;
}): DataIntakeStagingRow {
  return {
    sourceRowNumber: input.sourceRowNumber,
    rawValues: {},
    normalizedValues: {
      display_name: input.displayName ?? "Alice Example",
      email: input.email === undefined ? "alice@example.com" : input.email,
    },
    rowFingerprint: "a".repeat(64),
    lifecycle: input.lifecycle ?? "validated",
    resolution: "none",
    targetOperation: null,
    targetRecordId: null,
    errorCodes: input.lifecycle === "blocked" ? ["INVALID_EMAIL"] : [],
    warningCodes: [],
    errorDetails: [],
  };
}

describe("DATA-1H deterministic identity classification", () => {
  it("matches exactly one same-organization Customer by staged email", () => {
    const matches = classifyIdentityResolutions({
      organizationId: ORG,
      rows: [row({ sourceRowNumber: 2 })],
      candidates: [
        { id: CUSTOMER, organizationId: ORG, email: "alice@example.com", archivedAt: null },
      ],
    });
    expect(matches).toEqual([
      {
        sourceRowNumber: 2,
        resolution: "duplicate",
        targetOperation: "link",
        targetRecordId: CUSTOMER,
        matchKind: "exact",
      },
    ]);
    expect(summarizeIdentityResolutions(matches).matcherVersion).toBe(DATA_CUSTOMER_MATCHER_VERSION);
    expect(completedMatchingStatus({ rows: [row({ sourceRowNumber: 2 })], matches })).toBe(
      "ready_for_approval",
    );
  });

  it("uses the already-normalized staged email and does not guess similar addresses", () => {
    const matches = classifyIdentityResolutions({
      organizationId: ORG,
      rows: [row({ sourceRowNumber: 2, email: "person@example.com" })],
      candidates: [
        { id: CUSTOMER, organizationId: ORG, email: "person@example.com", archivedAt: null },
        { id: CUSTOMER_TWO, organizationId: ORG, email: "perso@example.com", archivedAt: null },
      ],
    });
    expect(matches[0]?.targetRecordId).toBe(CUSTOMER);
    expect(matches[0]?.matchKind).toBe("exact");
  });

  it("classifies no-match, no-key, blocked, and name-only rows without selecting a Customer", () => {
    const rows = [
      row({ sourceRowNumber: 2, email: "new@example.com" }),
      row({ sourceRowNumber: 3, email: null }),
      row({ sourceRowNumber: 4, lifecycle: "blocked", email: "bad@example.com" }),
      row({ sourceRowNumber: 5, email: "other@example.com", displayName: "John Smith" }),
    ];
    const matches = classifyIdentityResolutions({
      organizationId: ORG,
      rows,
      candidates: [
        { id: CUSTOMER, organizationId: ORG, email: "name-only@example.com", archivedAt: null },
      ],
    });
    expect(matches.map((item) => item.matchKind)).toEqual([
      "no_match",
      "no_key",
      "skipped",
      "no_match",
    ]);
    expect(matches.every((item) => item.targetRecordId === null)).toBe(true);
    expect(matches[0]).toMatchObject({ resolution: "create", targetOperation: "create" });
    expect(matches[1]).toMatchObject({ resolution: "none", targetOperation: null });
    expect(completedMatchingStatus({ rows, matches })).toBe("review_required");
  });

  it("never auto-selects when two Customers or two staged rows share the email", () => {
    const multi = classifyIdentityResolutions({
      organizationId: ORG,
      rows: [row({ sourceRowNumber: 2 })],
      candidates: [
        { id: CUSTOMER, organizationId: ORG, email: "alice@example.com", archivedAt: null },
        { id: CUSTOMER_TWO, organizationId: ORG, email: "alice@example.com", archivedAt: null },
      ],
    });
    expect(multi[0]).toMatchObject({
      matchKind: "ambiguous",
      resolution: "conflict",
      targetRecordId: null,
    });

    const collision = classifyIdentityResolutions({
      organizationId: ORG,
      rows: [row({ sourceRowNumber: 2 }), row({ sourceRowNumber: 3 })],
      candidates: [
        { id: CUSTOMER, organizationId: ORG, email: "alice@example.com", archivedAt: null },
      ],
    });
    expect(collision.every((item) => item.matchKind === "collision")).toBe(true);
    expect(collision.every((item) => item.targetRecordId === null)).toBe(true);

    const createCollision = classifyIdentityResolutions({
      organizationId: ORG,
      rows: [row({ sourceRowNumber: 2 }), row({ sourceRowNumber: 3 })],
      candidates: [],
    });
    expect(createCollision.every((item) => item.matchKind === "collision")).toBe(true);
  });

  it("ignores foreign-organization Customers with the same email", () => {
    const matches = classifyIdentityResolutions({
      organizationId: ORG,
      rows: [row({ sourceRowNumber: 2 })],
      candidates: [
        { id: CUSTOMER, organizationId: FOREIGN, email: "alice@example.com", archivedAt: null },
      ],
    });
    expect(matches[0]).toMatchObject({
      matchKind: "no_match",
      resolution: "create",
      targetRecordId: null,
    });
  });
});
