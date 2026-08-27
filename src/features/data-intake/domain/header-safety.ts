import {
  DATA_MAX_HEADER_LENGTH,
} from "@/features/data-intake/domain/constants";
import type { DataStructureWarningCode } from "@/features/data-intake/domain/discovery";

const CONTROL_CHARS = /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/;

export function collectHeaderWarnings(headers: readonly string[]): DataStructureWarningCode[] {
  const warnings: DataStructureWarningCode[] = [];
  const seen = new Map<string, number>();
  for (const header of headers) {
    if (header === "") {
      if (!warnings.includes("EMPTY_HEADER")) {
        warnings.push("EMPTY_HEADER");
      }
    } else if (header.trim() === "") {
      if (!warnings.includes("WHITESPACE_HEADER")) {
        warnings.push("WHITESPACE_HEADER");
      }
    }
    if (CONTROL_CHARS.test(header) && !warnings.includes("CONTROL_CHARACTER_HEADER")) {
      warnings.push("CONTROL_CHARACTER_HEADER");
    }
    if (header.length > DATA_MAX_HEADER_LENGTH) {
      continue;
    }
    const key = header;
    seen.set(key, (seen.get(key) ?? 0) + 1);
  }
  if ([...seen.values()].some((count) => count > 1)) {
    warnings.push("DUPLICATE_HEADER");
  }
  return warnings;
}
