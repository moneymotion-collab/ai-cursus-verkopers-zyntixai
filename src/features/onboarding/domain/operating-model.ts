import { z } from "zod";

export const OPERATING_MODEL_IDS = [
  "course_seller",
  "service",
  "field_operations",
  "product_operations",
] as const;

export const operatingModelIdSchema = z.enum(OPERATING_MODEL_IDS);

export type OperatingModelId = z.infer<typeof operatingModelIdSchema>;

export type OperatingModelOption = {
  id: OperatingModelId;
  title: string;
  description: string;
};

/**
 * Product-facing choices only. Internal TAX/CTX mapping is owned by the
 * service-role assignment RPC and is never accepted from browser input.
 */
export const OPERATING_MODEL_OPTIONS: readonly OperatingModelOption[] = [
  {
    id: "course_seller",
    title: "Courses & Coaching",
    description:
      "For businesses selling courses, coaching programs or structured learning.",
  },
  {
    id: "service",
    title: "Agency & Business Services",
    description:
      "For agencies, consultants and service businesses delivering work for clients.",
  },
  {
    id: "field_operations",
    title: "Construction & Field Service",
    description:
      "For installation, construction, maintenance and field-based operational teams.",
  },
  {
    id: "product_operations",
    title: "E-commerce & Product Operations",
    description:
      "For businesses centered on physical products and fulfillment operations.",
  },
] as const;

export const operatingModelAssignmentInputSchema = z
  .object({
    organizationId: z.string().uuid("Organization is required."),
    operatingModel: operatingModelIdSchema,
  })
  .strict();

export type OperatingModelAssignmentInput = z.infer<
  typeof operatingModelAssignmentInputSchema
>;

export type OperatingModelAssignmentErrorCode =
  | "not_authenticated"
  | "not_authorized"
  | "organization_not_found"
  | "invalid_operating_model"
  | "already_configured"
  | "configuration_review_required"
  | "configuration_unavailable"
  | "assignment_failed";

export type OperatingModelAssignmentResult =
  | {
      ok: true;
      idempotent: boolean;
      organizationId: string;
      operatingModel: OperatingModelId;
      packKey: string;
    }
  | {
      ok: false;
      code: OperatingModelAssignmentErrorCode;
      message: string;
    };

export type OperatingModelSetupStatus =
  | {
      kind: "configured";
      organizationId: string;
      role: string;
      packKey: string;
    }
  | {
      kind: "requires_assignment";
      organizationId: string;
      role: string;
      canAssign: boolean;
    }
  | {
      kind: "configuration_review_required";
      organizationId: string;
      role: string;
      canAssign: false;
    };

export function canAssignOperatingModel(role: string): boolean {
  return role === "owner" || role === "admin";
}

export function buildOperatingModelOnboardingPath(
  organizationId: string,
): string {
  return `/onboarding/operating-model?org=${encodeURIComponent(organizationId)}`;
}

export function operatingModelMessage(
  code: OperatingModelAssignmentErrorCode,
): string {
  switch (code) {
    case "not_authenticated":
      return "Sign in to configure this workspace.";
    case "not_authorized":
      return "An organization owner or administrator must configure this workspace.";
    case "organization_not_found":
      return "This organization is unavailable.";
    case "invalid_operating_model":
      return "Choose one of the available operating models.";
    case "already_configured":
      return "This workspace already has an operating model.";
    case "configuration_review_required":
      return "This workspace has existing configuration that requires administrator review.";
    case "configuration_unavailable":
      return "That operating model is not available right now. Please try again later.";
    case "assignment_failed":
      return "We could not save the operating model. Please try again.";
  }
}
