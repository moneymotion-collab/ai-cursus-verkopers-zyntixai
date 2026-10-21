import { dataFail, dataOk, type DataIntakeResult } from "@/features/data-intake/domain/errors";

const UTF8_BOM = [0xef, 0xbb, 0xbf] as const;

export function decodeUtf8Strict(bytes: Uint8Array): DataIntakeResult<{
  text: string;
  bom: boolean;
}> {
  const bom =
    bytes.length >= 3 &&
    bytes[0] === UTF8_BOM[0] &&
    bytes[1] === UTF8_BOM[1] &&
    bytes[2] === UTF8_BOM[2];
  const payload = bom ? bytes.subarray(3) : bytes;
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(payload);
    return dataOk({ text, bom });
  } catch {
    return dataFail("UNSUPPORTED_ENCODING", "CSV must be valid UTF-8");
  }
}
