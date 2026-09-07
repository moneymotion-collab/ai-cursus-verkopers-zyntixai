import {
  operatingModelMatchesPack,
  type OperatingModelAssignmentResult,
  type OperatingModelId,
} from "@/features/onboarding/domain/operating-model";

export type OperatingModelSubmissionOutcome =
  | { kind: "no_selection" }
  | { kind: "busy" }
  | {
      kind: "confirmed";
      model: OperatingModelId;
      result: Extract<OperatingModelAssignmentResult, { ok: true }>;
    }
  | {
      kind: "failed";
      model: OperatingModelId;
      result: Extract<OperatingModelAssignmentResult, { ok: false }> | null;
    };

type AssignOperatingModel = (
  model: OperatingModelId,
) => Promise<OperatingModelAssignmentResult>;

export class OperatingModelSubmission {
  private active = false;

  get isActive(): boolean {
    return this.active;
  }

  async submit(
    selection: OperatingModelId | null,
    assign: AssignOperatingModel,
  ): Promise<OperatingModelSubmissionOutcome> {
    if (!selection) {
      return { kind: "no_selection" };
    }
    if (this.active) {
      return { kind: "busy" };
    }

    this.active = true;
    const submittedModel = selection;
    try {
      const result = await assign(submittedModel);
      if (
        result.ok &&
        result.operatingModel === submittedModel &&
        operatingModelMatchesPack(submittedModel, result.packKey)
      ) {
        return { kind: "confirmed", model: submittedModel, result };
      }
      return {
        kind: "failed",
        model: submittedModel,
        result: result.ok ? null : result,
      };
    } catch {
      return { kind: "failed", model: submittedModel, result: null };
    } finally {
      this.active = false;
    }
  }
}
