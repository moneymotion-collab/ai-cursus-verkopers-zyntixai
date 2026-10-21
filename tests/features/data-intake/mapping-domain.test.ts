import { describe, expect, it } from "vitest";
import {
  DATA_CUSTOMER_EXCLUDED_IMPORT_FIELDS,
  DATA_CUSTOMER_IMPORT_FIELDS,
  getCustomerImportTargetCatalog,
  isExcludedCustomerImportField,
  requiredCustomerImportFieldKeys,
} from "@/features/data-intake/domain/target-catalog";
import {
  findSourceColumn,
  sourceColumnKey,
  sourceColumnsFromDiscovery,
} from "@/features/data-intake/domain/source-column";
import {
  canonicalizeMappingSnapshot,
  duplicateTargetField,
  evaluateMappingCompleteness,
  mappingSnapshotHash,
  validateMappingTarget,
} from "@/features/data-intake/domain/mapping";
import { DATA_PARSER_VERSION } from "@/features/data-intake/domain/constants";
import type { DataSourceStructureDiscovery } from "@/features/data-intake/domain/discovery";

const csvDiscovery: DataSourceStructureDiscovery = {
  format: "csv",
  parserVersion: DATA_PARSER_VERSION,
  encoding: "utf-8",
  bom: false,
  delimiter: ",",
  headerRowIndex: 1,
  headers: ["email", "email", ""],
  columnCount: 3,
  rowCount: 1,
  emptyRowCount: 0,
  warnings: ["DUPLICATE_HEADER", "EMPTY_HEADER"],
};

const xlsxDiscovery: DataSourceStructureDiscovery = {
  format: "xlsx",
  parserVersion: DATA_PARSER_VERSION,
  encoding: "utf-8",
  selectedSheet: "People",
  sheets: [{ name: "People", hidden: false, rowCount: 2, columnCount: 2 }],
  headerRowIndex: 1,
  headers: ["Voornaam", "E-mail"],
  columnCount: 2,
  rowCount: 2,
  emptyRowCount: 0,
  warnings: [],
};

describe("DATA-1F target catalog", () => {
  it("exposes only the frozen customer.v1 importable fields", () => {
    const catalog = getCustomerImportTargetCatalog();
    expect(catalog.map((field) => field.key)).toEqual([
      "display_name",
      "email",
      "phone",
      "first_name",
      "last_name",
    ]);
    expect(requiredCustomerImportFieldKeys()).toEqual(["display_name"]);
    expect(catalog).toEqual(DATA_CUSTOMER_IMPORT_FIELDS);
    expect(catalog.every((field) => field.domain === "customer" && field.importable)).toBe(true);
  });

  it("excludes system-owned Customer columns and denies unknown keys", () => {
    for (const field of DATA_CUSTOMER_EXCLUDED_IMPORT_FIELDS) {
      expect(isExcludedCustomerImportField(field)).toBe(true);
      expect(validateMappingTarget({ targetDomain: "customer", targetField: field })).toBe(
        "TARGET_FIELD_FORBIDDEN",
      );
    }
    expect(validateMappingTarget({ targetDomain: "lead", targetField: "email" })).toBe(
      "TARGET_NOT_SUPPORTED",
    );
    expect(validateMappingTarget({ targetDomain: "customer", targetField: "customer.email" })).toBe(
      "TARGET_FIELD_UNKNOWN",
    );
    expect(validateMappingTarget({ targetDomain: "customer", targetField: "display_name" })).toBe(
      "ok",
    );
  });
});

describe("DATA-1F source column identity", () => {
  it("distinguishes duplicate and empty CSV headers by ordinal", () => {
    const columns = sourceColumnsFromDiscovery(csvDiscovery);
    expect(columns.map((column) => column.key)).toEqual(["csv:0", "csv:1", "csv:2"]);
    expect(columns[0]?.header).toBe("email");
    expect(columns[1]?.header).toBe("email");
    expect(columns[2]?.header).toBe("");
    expect(findSourceColumn(csvDiscovery, "csv:1")?.index).toBe(1);
    expect(findSourceColumn(csvDiscovery, "csv:9")).toBeNull();
  });

  it("includes the selected XLSX sheet in the column key", () => {
    expect(sourceColumnKey({ format: "xlsx", index: 0, sheetName: "People" })).toBe(
      "xlsx:0:People",
    );
    expect(sourceColumnsFromDiscovery(xlsxDiscovery)[1]?.key).toBe("xlsx:1:People");
  });
});

describe("DATA-1F mapping completeness and snapshot", () => {
  it("treats mapped, ignored, and unresolved as distinct and requires display_name", () => {
    const columns = sourceColumnsFromDiscovery(csvDiscovery);
    const incomplete = evaluateMappingCompleteness({
      columns,
      decisions: [
        {
          sourceFieldKey: "csv:0",
          sourceHeader: "email",
          targetField: "email",
          status: "proposed",
        },
      ],
    });
    expect(incomplete.mapped).toBe(1);
    expect(incomplete.unresolved).toBe(2);
    expect(incomplete.confirmable).toBe(false);
    expect(incomplete.missingRequiredTargets).toEqual(["display_name"]);

    const ready = evaluateMappingCompleteness({
      columns,
      decisions: [
        {
          sourceFieldKey: "csv:0",
          sourceHeader: "email",
          targetField: "display_name",
          status: "proposed",
        },
        {
          sourceFieldKey: "csv:1",
          sourceHeader: "email",
          targetField: null,
          status: "rejected",
        },
      ],
    });
    expect(ready.ignored).toBe(1);
    expect(ready.unresolved).toBe(1);
    expect(ready.confirmable).toBe(true);
  });

  it("detects duplicate single-value targets and hashes snapshots independently of input order", () => {
    const columns = sourceColumnsFromDiscovery(csvDiscovery);
    const decisions = [
      {
        sourceFieldKey: "csv:1",
        sourceHeader: "email",
        targetField: "email",
        status: "proposed" as const,
      },
      {
        sourceFieldKey: "csv:0",
        sourceHeader: "email",
        targetField: "display_name",
        status: "proposed" as const,
      },
    ];
    expect(duplicateTargetField(decisions, "csv:2", "email")?.sourceFieldKey).toBe("csv:1");
    expect(duplicateTargetField(decisions, "csv:0", "display_name")).toBeNull();
    const first = canonicalizeMappingSnapshot({ columns, decisions });
    const second = canonicalizeMappingSnapshot({
      columns,
      decisions: [...decisions].reverse(),
    });
    expect(first).toEqual(second);
    expect(mappingSnapshotHash(first)).toBe(mappingSnapshotHash(second));
    expect(mappingSnapshotHash(first)).toMatch(/^[0-9a-f]{64}$/);
  });
});
