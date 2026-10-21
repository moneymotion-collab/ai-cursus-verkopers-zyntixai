import {
  DATA_INTAKE_STORAGE_BUCKET,
  extensionForSourceKind,
  isDataUuid,
  type DataSourceKind,
} from "@/features/data-intake/domain/constants";

export type DataIntakeStoragePathParts = {
  organizationId: string;
  sessionId: string;
  sourceId: string;
  generatedObjectId: string;
  sourceKind: DataSourceKind;
};

/**
 * Server-generated object key. User filename is never path authority.
 */
export function buildDataIntakeStoragePath(
  parts: DataIntakeStoragePathParts,
): string {
  return [
    parts.organizationId,
    parts.sessionId,
    parts.sourceId,
    `${parts.generatedObjectId}${extensionForSourceKind(parts.sourceKind)}`,
  ].join("/");
}

export function parseDataIntakeStoragePath(
  path: string,
): DataIntakeStoragePathParts | null {
  const segments = path.split("/");
  if (segments.length !== 4) {
    return null;
  }
  const [organizationId, sessionId, sourceId, fileName] = segments;
  if (!organizationId || !sessionId || !sourceId || !fileName) {
    return null;
  }
  if (![organizationId, sessionId, sourceId].every(isDataUuid)) {
    return null;
  }
  const csv = fileName.endsWith(".csv");
  const xlsx = fileName.endsWith(".xlsx");
  if (csv === xlsx) {
    return null;
  }
  const generatedObjectId = fileName.slice(0, csv ? -4 : -5);
  if (!isDataUuid(generatedObjectId)) {
    return null;
  }
  return {
    organizationId,
    sessionId,
    sourceId,
    generatedObjectId,
    sourceKind: csv ? "csv" : "xlsx",
  };
}

export function storagePathMatchesTenant(input: {
  path: string;
  organizationId: string;
  sessionId: string;
}): boolean {
  const parsed = parseDataIntakeStoragePath(input.path);
  return (
    parsed !== null &&
    parsed.organizationId === input.organizationId &&
    parsed.sessionId === input.sessionId
  );
}

export { DATA_INTAKE_STORAGE_BUCKET };
