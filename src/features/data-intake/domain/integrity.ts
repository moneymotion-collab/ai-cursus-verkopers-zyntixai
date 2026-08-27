import { createHash } from "node:crypto";
import { DATA_SHA256_PATTERN } from "@/features/data-intake/domain/constants";

export function sha256Hex(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

export function isSha256Hex(value: string): boolean {
  return DATA_SHA256_PATTERN.test(value);
}
