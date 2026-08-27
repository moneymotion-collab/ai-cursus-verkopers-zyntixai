import { describe, expect, it } from "vitest";
import {
  containsNul,
  extensionMatchesSourceKind,
  inspectSourceBytes,
  looksLikeLegacyXls,
  looksLikeZipContainer,
  normalizeDataIntakeMime,
} from "@/features/data-intake/domain/file-signature";
import { clientAttemptedStorageAuthority } from "@/features/data-intake/domain/client-path-authority";
import { sha256Hex } from "@/features/data-intake/domain/integrity";
import { DATA_CSV_MIME, DATA_XLSX_MIME } from "@/features/data-intake/domain/constants";

describe("DATA-1D MIME and signature contract", () => {
  it("normalizes CSV charset and rejects unknown or Excel-legacy types", () => {
    expect(normalizeDataIntakeMime("text/csv; charset=utf-8")).toBe(DATA_CSV_MIME);
    expect(normalizeDataIntakeMime(DATA_XLSX_MIME)).toBe(DATA_XLSX_MIME);
    expect(normalizeDataIntakeMime("text/plain")).toBeNull();
    expect(normalizeDataIntakeMime("application/csv")).toBeNull();
    expect(normalizeDataIntakeMime("application/vnd.ms-excel")).toBeNull();
    expect(normalizeDataIntakeMime("application/octet-stream")).toBeNull();
  });

  it("rejects OLE .xls signatures and zip bytes presented as CSV", () => {
    const ole = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0xaa]);
    const zip = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0xaa]);
    const csv = new TextEncoder().encode("qa,col\n1,2\n");
    expect(looksLikeLegacyXls(ole)).toBe(true);
    expect(looksLikeZipContainer(zip)).toBe(true);
    expect(inspectSourceBytes({ kind: "csv", bytes: ole })).toBe("legacy_xls");
    expect(inspectSourceBytes({ kind: "csv", bytes: zip })).toBe("zip_disguised_as_csv");
    expect(inspectSourceBytes({ kind: "csv", bytes: csv })).toBe("ok");
    expect(inspectSourceBytes({ kind: "xlsx", bytes: csv })).toBe("not_xlsx");
    expect(inspectSourceBytes({ kind: "xlsx", bytes: zip })).toBe("ok");
    expect(containsNul(Uint8Array.from([0x61, 0x00, 0x62]))).toBe(true);
    expect(extensionMatchesSourceKind("qa.csv", "csv")).toBe(true);
    expect(extensionMatchesSourceKind("qa.xlsx", "csv")).toBe(false);
  });

  it("hashes bytes independently of any client-declared digest", () => {
    const bytes = new TextEncoder().encode("qa_data_intake_foundation_v1\n");
    expect(sha256Hex(bytes)).toHaveLength(64);
    expect(clientAttemptedStorageAuthority({ storagePath: "x" })).toBe(true);
    expect(clientAttemptedStorageAuthority({ originalFilename: "a.csv" })).toBe(false);
  });
});
