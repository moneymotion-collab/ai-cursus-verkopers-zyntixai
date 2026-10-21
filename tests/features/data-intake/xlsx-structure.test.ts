import { describe, expect, it } from "vitest";
import { parseXlsxStructure } from "@/features/data-intake/domain/xlsx-structure";
import { inspectXlsxZipSafety } from "@/features/data-intake/domain/xlsx-zip-safety";
import { DATA_MAX_COLUMNS, DATA_MAX_DATA_ROWS, DATA_MAX_XLSX_SHEETS, DATA_PARSER_VERSION } from "@/features/data-intake/domain/constants";
import { buildSimpleXlsx } from "./xlsx-fixtures";

describe("DATA-1E XLSX structure", () => {
  it("discovers sheets, headers, and a visible default sheet", async () => {
    const bytes = await buildSimpleXlsx({
      sheets: [
        { name: "Hidden", hidden: true, rows: [["h1"], ["x"]] },
        { name: "Main", rows: [["email", "name"], ["a@example.test", "Ada"], [null, null]] },
      ],
    });
    const result = await parseXlsxStructure(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.format).toBe("xlsx");
    expect(result.value.parserVersion).toBe(DATA_PARSER_VERSION);
    expect(result.value.selectedSheet).toBe("Main");
    expect(result.value.headers).toEqual(["email", "name"]);
    expect(result.value.columnCount).toBe(2);
    expect(result.value.rowCount).toBe(2);
    expect(result.value.warnings).toEqual(expect.arrayContaining(["HIDDEN_SHEET", "EMPTY_ROWS"]));
    expect(result.value.sheets.map((sheet) => sheet.name)).toEqual(["Hidden", "Main"]);
  });

  it("exposes formula text without evaluating it", async () => {
    const bytes = await buildSimpleXlsx({
      sheets: [{ name: "Sheet1", rows: [["total"], [{ formula: "1+1" }]] }],
    });
    const result = await parseXlsxStructure(bytes);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warnings).toContain("FORMULA_CELL");
    expect(result.value.headers).toEqual(["total"]);
    expect(result.value.rowCount).toBe(1);
  });

  it("treats dates and numbers as structural cell text and rejects an empty sheet", async () => {
    const dated = await buildSimpleXlsx({
      sheets: [
        {
          name: "Sheet1",
          rows: [["when", "qty"], [new Date("2026-08-27T00:00:00.000Z"), 3]],
        },
      ],
    });
    const datedResult = await parseXlsxStructure(dated);
    expect(datedResult.ok).toBe(true);
    if (datedResult.ok) {
      expect(datedResult.value.headers).toEqual(["when", "qty"]);
      expect(datedResult.value.rowCount).toBe(1);
    }

    const empty = await buildSimpleXlsx({ sheets: [{ name: "Empty", rows: [] }] });
    const emptyResult = await parseXlsxStructure(empty);
    expect(emptyResult.ok).toBe(false);
    if (!emptyResult.ok) expect(emptyResult.error.code).toBe("HEADER_INVALID");
  });

  it("rejects workbooks over the frozen sheet, column, and row limits", async () => {
    const tooManySheets = await buildSimpleXlsx({
      sheets: Array.from({ length: DATA_MAX_XLSX_SHEETS + 1 }, (_, i) => ({
        name: `S${i}`,
        rows: [["h"], ["1"]],
      })),
    });
    const sheetsResult = await parseXlsxStructure(tooManySheets);
    expect(sheetsResult.ok).toBe(false);
    if (!sheetsResult.ok) expect(sheetsResult.error.code).toBe("TOO_MANY_SHEETS");

    const tooManyColumns = await buildSimpleXlsx({
      sheets: [
        {
          name: "Wide",
          rows: [Array.from({ length: DATA_MAX_COLUMNS + 1 }, (_, i) => `c${i}`)],
        },
      ],
    });
    const columnsResult = await parseXlsxStructure(tooManyColumns);
    expect(columnsResult.ok).toBe(false);
    if (!columnsResult.ok) expect(columnsResult.error.code).toBe("TOO_MANY_COLUMNS");

    const tooManyRows = await buildSimpleXlsx({
      sheets: [
        {
          name: "Tall",
          rows: [
            ["h"],
            ...Array.from({ length: DATA_MAX_DATA_ROWS + 1 }, () => ["1"]),
          ],
        },
      ],
    });
    const rowsResult = await parseXlsxStructure(tooManyRows);
    expect(rowsResult.ok).toBe(false);
    if (!rowsResult.ok) expect(rowsResult.error.code).toBe("TOO_MANY_ROWS");
  });

  it("rejects fake xlsx, zip-renamed text, and OLE .xls signatures", async () => {
    const fake = await parseXlsxStructure(new TextEncoder().encode("not-a-workbook"));
    expect(fake.ok).toBe(false);
    if (!fake.ok) expect(fake.error.code).toBe("MALFORMED_XLSX");

    const zipText = Uint8Array.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00]);
    const renamed = await parseXlsxStructure(zipText);
    expect(renamed.ok).toBe(false);

    const ole = Uint8Array.from([0xd0, 0xcf, 0x11, 0xe0, 0x11, 0x11, 0x11, 0x00]);
    const xls = await parseXlsxStructure(ole);
    expect(xls.ok).toBe(false);
    if (!xls.ok) expect(xls.error.code).toBe("UNSUPPORTED_FILE");
  });

  it("rejects a ZIP whose central directory claims a bomb-sized uncompressed payload", () => {
    const filename = "[Content_Types].xml";
    const eocd = new Uint8Array(22);
    eocd.set([0x50, 0x4b, 0x05, 0x06], 0);
    eocd[10] = 1;
    eocd[11] = 0;
    const encodedName = new TextEncoder().encode(filename);
    const central = new Uint8Array(46 + encodedName.length);
    central.set([0x50, 0x4b, 0x01, 0x02], 0);
    central[24] = 0xff;
    central[25] = 0xff;
    central[26] = 0xff;
    central[27] = 0x7f;
    central[28] = encodedName.length;
    central.set(encodedName, 46);
    const bytes = new Uint8Array(central.length + eocd.length);
    bytes.set(central, 0);
    eocd[16] = 0;
    bytes.set(eocd, central.length);
    const zip = inspectXlsxZipSafety(bytes);
    expect(zip.ok).toBe(false);
    if (!zip.ok) expect(zip.error.code).toBe("PARSER_LIMIT_EXCEEDED");
  });
});
