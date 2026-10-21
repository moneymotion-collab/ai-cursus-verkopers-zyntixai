import { describe, expect, it } from "vitest";
import {
  buildImportPlanSnapshot,
  importPlanHash,
  includedFingerprints,
  planningBlockers,
} from "@/features/data-intake/domain/planning";
import type { DataIntakeStagingRow } from "@/features/data-intake/domain/staging";
import type { DataMappingSnapshot } from "@/features/data-intake/domain/mapping";
import { DATA_CUSTOMER_ADAPTER_VERSION, DATA_EXECUTABLE_TARGET_DOMAIN } from "@/features/data-intake/domain/constants";

const CUSTOMER = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";

function snapshot(): DataMappingSnapshot {
  return {
    adapterVersion: DATA_CUSTOMER_ADAPTER_VERSION,
    targetDomain: DATA_EXECUTABLE_TARGET_DOMAIN,
    decisions: [
      {
        sourceFieldKey: "csv:0",
        sourceHeader: "name",
        targetField: "display_name",
        status: "confirmed",
      },
      {
        sourceFieldKey: "csv:1",
        sourceHeader: "email",
        targetField: "email",
        status: "confirmed",
      },
    ],
  };
}

function row(input: {
  sourceRowNumber: number;
  fingerprint: string;
  resolution: DataIntakeStagingRow["resolution"];
  targetOperation: DataIntakeStagingRow["targetOperation"];
  targetRecordId: string | null;
  lifecycle?: "validated" | "blocked";
}): DataIntakeStagingRow {
  return {
    sourceRowNumber: input.sourceRowNumber,
    rawValues: {},
    normalizedValues: { email: "alice@example.com" },
    rowFingerprint: input.fingerprint,
    lifecycle: input.lifecycle ?? "validated",
    resolution: input.resolution,
    targetOperation: input.targetOperation,
    targetRecordId: input.targetRecordId,
    errorCodes: [],
    warningCodes: [],
    errorDetails: [],
  };
}

describe("DATA-1I import plan canonicalization", () => {
  it("hashes the same operations regardless of request or row order", () => {
    const mapping = snapshot();
    const left = [
      row({
        sourceRowNumber: 3,
        fingerprint: "b".repeat(64),
        resolution: "create",
        targetOperation: "create",
        targetRecordId: null,
      }),
      row({
        sourceRowNumber: 2,
        fingerprint: "a".repeat(64),
        resolution: "duplicate",
        targetOperation: "link",
        targetRecordId: CUSTOMER,
      }),
    ];
    const right = [...left].reverse();
    const first = buildImportPlanSnapshot({
      sourceId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      sourceSha256: "c".repeat(64),
      mappingSnapshot: mapping,
      mappingHash: "d".repeat(64),
      rows: left,
    });
    const second = buildImportPlanSnapshot({
      sourceId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      sourceSha256: "c".repeat(64),
      mappingSnapshot: mapping,
      mappingHash: "d".repeat(64),
      rows: right,
    });
    expect(first.planHash).toBe(second.planHash);
    expect(first.includedFingerprints).toEqual(includedFingerprints(first.operations));
    expect(first.summary.createCandidates).toBe(1);
    expect(first.summary.linkCandidates).toBe(1);
    expect(
      importPlanHash({
        sourceSha256: first.sourceSha256,
        mappingSnapshot: mapping,
        includedFingerprints: first.includedFingerprints,
        operations: [...first.operations].reverse(),
      }),
    ).toBe(first.planHash);
  });

  it("treats blocked, conflict, and no-key rows as approval blockers and never as executable items", () => {
    const rows = [
      row({
        sourceRowNumber: 2,
        fingerprint: "a".repeat(64),
        resolution: "none",
        targetOperation: null,
        targetRecordId: null,
        lifecycle: "blocked",
      }),
      row({
        sourceRowNumber: 3,
        fingerprint: "b".repeat(64),
        resolution: "conflict",
        targetOperation: null,
        targetRecordId: null,
      }),
      row({
        sourceRowNumber: 4,
        fingerprint: "c".repeat(64),
        resolution: "none",
        targetOperation: null,
        targetRecordId: null,
      }),
    ];
    const blockers = planningBlockers(rows);
    const plan = buildImportPlanSnapshot({
      sourceId: "dddddddd-dddd-4ddd-8ddd-dddddddddddd",
      sourceSha256: "c".repeat(64),
      mappingSnapshot: snapshot(),
      mappingHash: "d".repeat(64),
      rows,
    });
    expect(blockers.approvalBlocked).toBe(true);
    expect(blockers.blockedRows).toBe(1);
    expect(blockers.conflicts).toBe(1);
    expect(blockers.noKeyRows).toBe(1);
    expect(plan.operations).toEqual([]);
    expect(plan.summary.executableRows).toBe(0);
  });
});
