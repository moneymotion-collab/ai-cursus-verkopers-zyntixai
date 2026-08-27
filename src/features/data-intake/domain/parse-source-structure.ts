import { parseCsvStructure } from "@/features/data-intake/domain/csv-structure";
import type { DataSourceStructureDiscovery } from "@/features/data-intake/domain/discovery";
import { dataFail, type DataIntakeResult } from "@/features/data-intake/domain/errors";
import { inspectSourceBytes } from "@/features/data-intake/domain/file-signature";
import { parseXlsxStructure } from "@/features/data-intake/domain/xlsx-structure";
import type { DataSourceKind } from "@/features/data-intake/domain/constants";

export async function parseSourceStructure(input: {
  kind: DataSourceKind;
  bytes: Uint8Array;
}): Promise<DataIntakeResult<DataSourceStructureDiscovery>> {
  const signature = inspectSourceBytes(input);
  if (signature === "legacy_xls") {
    return dataFail("UNSUPPORTED_FILE", ".xls is not supported");
  }
  if (signature !== "ok") {
    return dataFail("UNSUPPORTED_FILE", "File signature does not match the declared source type");
  }
  if (input.kind === "csv") {
    return parseCsvStructure(input.bytes);
  }
  return parseXlsxStructure(input.bytes);
}
