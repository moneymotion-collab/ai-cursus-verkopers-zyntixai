import { describe, expect, it } from "vitest";
import { parseCsvStructure, detectCsvDelimiter } from "@/features/data-intake/domain/csv-structure";
import {
  DATA_MAX_COLUMNS,
  DATA_MAX_DATA_ROWS,
  DATA_MAX_FIELD_LENGTH,
  DATA_MAX_HEADER_LENGTH,
  DATA_PARSER_VERSION,
} from "@/features/data-intake/domain/constants";

function utf8(value: string): Uint8Array {
  return new TextEncoder().encode(value);
}

describe("DATA-1E CSV structure", () => {
  it("parses a simple UTF-8 CSV with trailing LF", () => {
    const result = parseCsvStructure(utf8("qa,col\n1,2\n"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value).toMatchObject({
      format: "csv",
      parserVersion: DATA_PARSER_VERSION,
      encoding: "utf-8",
      bom: false,
      delimiter: ",",
      headerRowIndex: 1,
      headers: ["qa", "col"],
      columnCount: 2,
      rowCount: 1,
      emptyRowCount: 0,
    });
  });

  it("accepts UTF-8 BOM, CRLF, quoted commas, escaped quotes, and empty fields", () => {
    const bom = Uint8Array.from([0xef, 0xbb, 0xbf, ...utf8('a,"b,c","d""e",,\r\n1,2,3,4,\r\n')]);
    const result = parseCsvStructure(bom);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.bom).toBe(true);
    expect(result.value.headers).toEqual(["a", "b,c", 'd"e', "", ""]);
    expect(result.value.rowCount).toBe(1);
  });

  it("detects semicolon and tab delimiters deterministically", () => {
    expect(detectCsvDelimiter("a;b\n1;2\n")).toBe(";");
    expect(detectCsvDelimiter("a\tb\n1\t2\n")).toBe("\t");
    expect(detectCsvDelimiter("a,b\n1,2\n")).toBe(",");
  });

  it("warns on duplicate, empty, whitespace, and inconsistent columns", () => {
    const result = parseCsvStructure(utf8("a,a, \n1,2\n3,4,5\n,\n"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warnings).toEqual(
      expect.arrayContaining([
        "DUPLICATE_HEADER",
        "WHITESPACE_HEADER",
        "INCONSISTENT_COLUMN_COUNT",
        "EMPTY_ROWS",
      ]),
    );
  });

  it("parses a one-column CSV and a control-character header as structure only", () => {
    const oneColumn = parseCsvStructure(utf8("label\nalpha\n"));
    expect(oneColumn.ok).toBe(true);
    if (oneColumn.ok) {
      expect(oneColumn.value.headers).toEqual(["label"]);
      expect(oneColumn.value.columnCount).toBe(1);
      expect(oneColumn.value.rowCount).toBe(1);
    }
    const control = parseCsvStructure(utf8("a\u0001,b\n1,2\n"));
    expect(control.ok).toBe(true);
    if (control.ok) {
      expect(control.value.headers).toEqual(["a\u0001", "b"]);
      expect(control.value.warnings).toContain("CONTROL_CHARACTER_HEADER");
    }
  });

  it("treats formula-like CSV cells as text", () => {
    const result = parseCsvStructure(utf8("name,amount\n=1+1,2\n"));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warnings).toContain("FORMULA_LIKE_CELL");
    expect(result.value.rowCount).toBe(1);
  });

  it("fails closed for invalid encoding, malformed quoting, and limits", () => {
    const invalid = parseCsvStructure(Uint8Array.from([0xff, 0x00, 0x80]));
    expect(invalid.ok).toBe(false);
    if (!invalid.ok) expect(invalid.error.code).toBe("UNSUPPORTED_ENCODING");
    const malformed = parseCsvStructure(utf8('"unclosed\n1,2\n'));
    expect(malformed.ok).toBe(false);
    if (!malformed.ok) expect(malformed.error.code).toBe("MALFORMED_CSV");

    const tooManyColumns = parseCsvStructure(
      utf8(`${Array.from({ length: DATA_MAX_COLUMNS + 1 }, (_, i) => `c${i}`).join(",")}\n1\n`),
    );
    expect(tooManyColumns.ok).toBe(false);
    if (!tooManyColumns.ok) expect(tooManyColumns.error.code).toBe("TOO_MANY_COLUMNS");

    const longHeader = parseCsvStructure(utf8(`${"h".repeat(DATA_MAX_HEADER_LENGTH + 1)},b\n1,2\n`));
    expect(longHeader.ok).toBe(false);
    if (!longHeader.ok) expect(longHeader.error.code).toBe("HEADER_INVALID");

    const longField = parseCsvStructure(utf8(`a,b\n${"x".repeat(DATA_MAX_FIELD_LENGTH + 1)},2\n`));
    expect(longField.ok).toBe(false);
    if (!longField.ok) expect(longField.error.code).toBe("FIELD_TOO_LARGE");

    const empty = parseCsvStructure(utf8("\n\n"));
    expect(empty.ok).toBe(false);
    if (!empty.ok) expect(empty.error.code).toBe("HEADER_INVALID");

    const maxColumns = parseCsvStructure(
      utf8(
        `${Array.from({ length: DATA_MAX_COLUMNS }, (_, i) => `c${i}`).join(",")}\n${Array.from({ length: DATA_MAX_COLUMNS }, () => "1").join(",")}\n`,
      ),
    );
    expect(maxColumns.ok).toBe(true);
    if (maxColumns.ok) expect(maxColumns.value.columnCount).toBe(DATA_MAX_COLUMNS);
  });

  it("rejects one extra data row above the frozen v1 maximum", () => {
    const header = "a,b\n";
    const rows = Array.from({ length: DATA_MAX_DATA_ROWS + 1 }, (_, i) => `${i},x`).join("\n");
    const result = parseCsvStructure(utf8(`${header}${rows}\n`));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.code).toBe("TOO_MANY_ROWS");
  });
});
