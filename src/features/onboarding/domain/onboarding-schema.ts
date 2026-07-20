import { z } from "zod";
import {
  BUSINESS_TYPES,
  PRIMARY_AUDIENCES,
  PRIMARY_GOALS,
  PRIMARY_OFFERINGS,
  TEAM_SIZE_BANDS,
} from "@/features/onboarding/domain/onboarding-options";

const CONTROL_CHARS = /[\u0000-\u001F\u007F]/;

function rejectControlChars(value: string, message: string) {
  if (CONTROL_CHARS.test(value)) {
    return { message };
  }
  return null;
}

const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required.")
  .max(80, "Name must be at most 80 characters.")
  .superRefine((value, ctx) => {
    const control = rejectControlChars(value, "Name contains invalid characters.");
    if (control) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: control.message });
    }
  });

const organizationNameSchema = z
  .string()
  .trim()
  .min(2, "Company name must be at least 2 characters.")
  .max(100, "Company name must be at most 100 characters.")
  .superRefine((value, ctx) => {
    const control = rejectControlChars(
      value,
      "Company name contains invalid characters.",
    );
    if (control) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: control.message });
    }
  });

/**
 * Partial draft: every onboarding field optional; unknown keys rejected.
 * `clearTeamSizeBand` clears optional team size without sending a sentinel enum.
 */
export const onboardingDraftInputSchema = z
  .object({
    organizationId: z.string().uuid("Organization is required."),
    displayName: displayNameSchema.optional(),
    organizationName: organizationNameSchema.optional(),
    businessType: z.enum(BUSINESS_TYPES).optional(),
    primaryAudience: z.enum(PRIMARY_AUDIENCES).optional(),
    primaryOffering: z.enum(PRIMARY_OFFERINGS).optional(),
    primaryGoal: z.enum(PRIMARY_GOALS).optional(),
    teamSizeBand: z.enum(TEAM_SIZE_BANDS).optional(),
    clearTeamSizeBand: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.teamSizeBand !== undefined && value.clearTeamSizeBand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot set and clear team size in the same request.",
        path: ["clearTeamSizeBand"],
      });
    }
  });

export type OnboardingDraftInput = z.infer<typeof onboardingDraftInputSchema>;

export const onboardingCompleteInputSchema = z
  .object({
    organizationId: z.string().uuid("Organization is required."),
    displayName: displayNameSchema,
    organizationName: organizationNameSchema,
    businessType: z.enum(BUSINESS_TYPES),
    primaryAudience: z.enum(PRIMARY_AUDIENCES),
    primaryOffering: z.enum(PRIMARY_OFFERINGS),
    primaryGoal: z.enum(PRIMARY_GOALS),
    teamSizeBand: z.enum(TEAM_SIZE_BANDS).optional(),
    clearTeamSizeBand: z.boolean().optional(),
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.teamSizeBand !== undefined && value.clearTeamSizeBand) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Cannot set and clear team size in the same request.",
        path: ["clearTeamSizeBand"],
      });
    }
  });

export type OnboardingCompleteInput = z.infer<
  typeof onboardingCompleteInputSchema
>;

export function parseOnboardingDraftInput(input: unknown) {
  return onboardingDraftInputSchema.safeParse(input);
}

export function parseOnboardingCompleteInput(input: unknown) {
  return onboardingCompleteInputSchema.safeParse(input);
}
