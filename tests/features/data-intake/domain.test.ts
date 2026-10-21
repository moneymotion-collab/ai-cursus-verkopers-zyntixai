import { describe, expect, it } from "vitest";
import {
  canPerformDataIntakeFoundationCommand,
  isKnownDataIntakeRole,
} from "@/features/data-intake/domain/authorization";
import {
  buildDataIntakeStoragePath,
  parseDataIntakeStoragePath,
  storagePathMatchesTenant,
} from "@/features/data-intake/domain/storage-path";
import { ORG_A } from "./harness";

const SESSION = "cccccccc-cccc-4ccc-8ccc-cccccccccccc";
const SOURCE = "dddddddd-dddd-4ddd-8ddd-dddddddddddd";
const OBJECT = "eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee";

describe("DATA-1C authorization", () => {
  it("allows only Owner and Admin foundation commands", () => {
    expect(canPerformDataIntakeFoundationCommand("owner")).toBe(true);
    expect(canPerformDataIntakeFoundationCommand("admin")).toBe(true);
    expect(canPerformDataIntakeFoundationCommand("staff")).toBe(false);
    expect(canPerformDataIntakeFoundationCommand("viewer")).toBe(false);
    expect(isKnownDataIntakeRole("owner")).toBe(true);
    expect(isKnownDataIntakeRole("service_role")).toBe(false);
  });
});

describe("DATA-1C storage path contract", () => {
  it("builds {org}/{session}/{source}/{generated}.ext and never uses the user filename", () => {
    const path = buildDataIntakeStoragePath({
      organizationId: ORG_A,
      sessionId: SESSION,
      sourceId: SOURCE,
      generatedObjectId: OBJECT,
      sourceKind: "csv",
    });
    expect(path).toBe(`${ORG_A}/${SESSION}/${SOURCE}/${OBJECT}.csv`);
    expect(path.includes("customers.csv")).toBe(false);
    const parsed = parseDataIntakeStoragePath(path);
    expect(parsed?.generatedObjectId).toBe(OBJECT);
    expect(
      storagePathMatchesTenant({ path, organizationId: ORG_A, sessionId: SESSION }),
    ).toBe(true);
    expect(
      storagePathMatchesTenant({
        path,
        organizationId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
        sessionId: SESSION,
      }),
    ).toBe(false);
  });
});
