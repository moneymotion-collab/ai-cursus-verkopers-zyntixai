import { describe, expect, it, vi } from "vitest";
import type {
  OperatingModelAssignmentResult,
  OperatingModelId,
} from "@/features/onboarding/domain/operating-model";
import { OperatingModelSubmission } from "@/features/onboarding/ui/operating-model-submission";

function success(
  operatingModel: OperatingModelId,
  packKey: string,
): OperatingModelAssignmentResult {
  return {
    ok: true,
    idempotent: false,
    organizationId: "11111111-1111-4111-8111-111111111111",
    operatingModel,
    packKey,
  };
}

describe("OperatingModelSubmission", () => {
  it("does not submit or confirm without an explicit selection", async () => {
    const assign = vi.fn();
    const outcome = await new OperatingModelSubmission().submit(null, assign);

    expect(outcome).toEqual({ kind: "no_selection" });
    expect(assign).not.toHaveBeenCalled();
  });

  it("confirms each model only when its authoritative pack matches", async () => {
    const cases = [
      ["course_seller", "foundation.knowledge"],
      ["course_seller", "niche.online-course-business"],
      ["service", "foundation.service"],
      ["field_operations", "foundation.field-operations"],
      ["product_operations", "foundation.product-operations"],
    ] as const;

    for (const [model, packKey] of cases) {
      const outcome = await new OperatingModelSubmission().submit(
        model,
        async () => success(model, packKey),
      );
      expect(outcome).toMatchObject({ kind: "confirmed", model });
    }
  });

  it("fails closed when the response model or resolved pack does not match", async () => {
    const modelMismatch = await new OperatingModelSubmission().submit(
      "service",
      async () => success("product_operations", "foundation.product-operations"),
    );
    const packMismatch = await new OperatingModelSubmission().submit(
      "service",
      async () => success("service", "foundation.product-operations"),
    );

    expect(modelMismatch.kind).toBe("failed");
    expect(packMismatch.kind).toBe("failed");
  });

  it("freezes one submitted intent and rejects overlapping assignment", async () => {
    let resolveFirst!: (result: OperatingModelAssignmentResult) => void;
    const assign = vi.fn(
      () =>
        new Promise<OperatingModelAssignmentResult>((resolve) => {
          resolveFirst = resolve;
        }),
    );
    const submission = new OperatingModelSubmission();

    const first = submission.submit("service", assign);
    const overlapping = await submission.submit("product_operations", assign);

    expect(submission.isActive).toBe(true);
    expect(overlapping).toEqual({ kind: "busy" });
    expect(assign).toHaveBeenCalledTimes(1);
    expect(assign).toHaveBeenCalledWith("service");

    resolveFirst(success("service", "foundation.service"));
    await expect(first).resolves.toMatchObject({
      kind: "confirmed",
      model: "service",
    });
    expect(submission.isActive).toBe(false);
  });

  it("releases the guard after failure so the preserved selection can retry", async () => {
    const assign = vi
      .fn<() => Promise<OperatingModelAssignmentResult>>()
      .mockResolvedValueOnce({
        ok: false,
        code: "assignment_failed",
        message: "We could not save the operating model. Please try again.",
      })
      .mockResolvedValueOnce(success("service", "foundation.service"));
    const submission = new OperatingModelSubmission();

    await expect(submission.submit("service", assign)).resolves.toMatchObject({
      kind: "failed",
      model: "service",
    });
    await expect(submission.submit("service", assign)).resolves.toMatchObject({
      kind: "confirmed",
      model: "service",
    });
    expect(assign).toHaveBeenCalledTimes(2);
  });

  it("recovers from a rejected action without exposing its raw error", async () => {
    const outcome = await new OperatingModelSubmission().submit(
      "field_operations",
      async () => {
        throw new Error("sensitive transport detail");
      },
    );

    expect(outcome).toEqual({
      kind: "failed",
      model: "field_operations",
      result: null,
    });
  });
});
