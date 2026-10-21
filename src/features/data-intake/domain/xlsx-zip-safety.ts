import {
  DATA_MAX_ZIP_COMPRESSION_RATIO,
  DATA_MAX_ZIP_ENTRIES,
  DATA_MAX_ZIP_UNCOMPRESSED_BYTES,
} from "@/features/data-intake/domain/constants";
import { dataFail, dataOk, type DataIntakeResult } from "@/features/data-intake/domain/errors";

const CENTRAL_SIG = 0x02014b50;
const EOCD_SIG = 0x06054b50;

function u16(bytes: Uint8Array, offset: number): number {
  return bytes[offset]! | (bytes[offset + 1]! << 8);
}

function u32(bytes: Uint8Array, offset: number): number {
  return (
    (bytes[offset]! |
      (bytes[offset + 1]! << 8) |
      (bytes[offset + 2]! << 16) |
      (bytes[offset + 3]! << 24)) >>>
    0
  );
}

function findEocd(bytes: Uint8Array): number | null {
  const min = Math.max(0, bytes.length - 22 - 65535);
  for (let offset = bytes.length - 22; offset >= min; offset -= 1) {
    if (u32(bytes, offset) === EOCD_SIG) {
      return offset;
    }
  }
  return null;
}

export function inspectXlsxZipSafety(bytes: Uint8Array): DataIntakeResult<{
  entryCount: number;
  uncompressedBytes: number;
  names: string[];
}> {
  if (bytes.length < 22) {
    return dataFail("MALFORMED_XLSX", "Workbook container is too small");
  }
  const eocd = findEocd(bytes);
  if (eocd === null) {
    return dataFail("MALFORMED_XLSX", "Workbook ZIP end-of-central-directory is missing");
  }
  const entryCount = u16(bytes, eocd + 10);
  const centralOffset = u32(bytes, eocd + 16);
  if (entryCount === 0) {
    return dataFail("MALFORMED_XLSX", "Workbook ZIP contains no files");
  }
  if (entryCount > DATA_MAX_ZIP_ENTRIES) {
    return dataFail("PARSER_LIMIT_EXCEEDED", "Workbook ZIP entry count exceeds v1 limits");
  }
  if ((u16(bytes, eocd + 4) !== 0 || u16(bytes, eocd + 6) !== 0) && centralOffset === 0xffffffff) {
    return dataFail("PARSER_LIMIT_EXCEEDED", "ZIP64 workbooks are not accepted");
  }

  let offset = centralOffset;
  let uncompressedBytes = 0;
  const names: string[] = [];
  const decoder = new TextDecoder("utf-8", { fatal: false });

  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > bytes.length || u32(bytes, offset) !== CENTRAL_SIG) {
      return dataFail("MALFORMED_XLSX", "Workbook ZIP central directory is malformed");
    }
    const flags = u16(bytes, offset + 8);
    if ((flags & 0x0001) !== 0) {
      return dataFail("UNSUPPORTED_FILE", "Encrypted workbooks are not supported");
    }
    const compressed = u32(bytes, offset + 20);
    const uncompressed = u32(bytes, offset + 24);
    const nameLength = u16(bytes, offset + 28);
    const extraLength = u16(bytes, offset + 30);
    const commentLength = u16(bytes, offset + 32);
    const nameStart = offset + 46;
    const nameEnd = nameStart + nameLength;
    if (nameEnd > bytes.length) {
      return dataFail("MALFORMED_XLSX", "Workbook ZIP filename is truncated");
    }
    names.push(decoder.decode(bytes.subarray(nameStart, nameEnd)));
    if (uncompressed > 0xffffffff - uncompressedBytes) {
      return dataFail("PARSER_LIMIT_EXCEEDED", "Workbook uncompressed size exceeds v1 limits");
    }
    uncompressedBytes += uncompressed;
    if (uncompressedBytes > DATA_MAX_ZIP_UNCOMPRESSED_BYTES) {
      return dataFail("PARSER_LIMIT_EXCEEDED", "Workbook uncompressed size exceeds v1 limits");
    }
    if (compressed > 0 && uncompressed / compressed > DATA_MAX_ZIP_COMPRESSION_RATIO) {
      return dataFail("PARSER_LIMIT_EXCEEDED", "Workbook compression ratio exceeds v1 limits");
    }
    offset = nameEnd + extraLength + commentLength;
  }

  const hasContentTypes = names.some((name) => name === "[Content_Types].xml");
  const hasWorkbook = names.some(
    (name) => name === "xl/workbook.xml" || name.endsWith("/xl/workbook.xml"),
  );
  if (!hasContentTypes || !hasWorkbook) {
    return dataFail("MALFORMED_XLSX", "ZIP archive is not a valid XLSX workbook");
  }
  return dataOk({ entryCount, uncompressedBytes, names });
}
