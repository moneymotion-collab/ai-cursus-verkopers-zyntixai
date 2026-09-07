"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  operatingModelAssignmentInputSchema,
  operatingModelMessage,
  type OperatingModelAssignmentResult,
} from "@/features/onboarding/domain/operating-model";
import {
  v2OnboardingTransitionMessage,
  type V2OnboardingTransitionResult,
} from "@/features/onboarding/domain/onboarding-lifecycle";
import {
  parseOnboardingCompleteInput,
  parseOnboardingDraftInput,
  parseV2CoreDraftInput,
} from "@/features/onboarding/domain/onboarding-schema";
import type {
  OnboardingReadResult,
  OnboardingWriteResult,
} from "@/features/onboarding/domain/onboarding-types";
import { onboardingMessage } from "@/features/onboarding/server/normalize-onboarding-error";
import {
  completeOnboarding,
  saveOnboardingDraft,
} from "@/features/onboarding/server/apply-onboarding";
import {
  checklistMessage,
  dismissFirstValueChecklist,
  type ChecklistDismissResult,
} from "@/features/onboarding/server/dismiss-first-value-checklist";
import { readOnboardingContext } from "@/features/onboarding/server/read-onboarding-context";
import { assignOrganizationOperatingModel } from "@/features/onboarding/server/assign-operating-model";
import {
  completeV2Onboarding,
  markV2OnboardingSetupReady,
} from "@/features/onboarding/server/transition-v2-onboarding";
import { saveV2CoreDraft } from "@/features/onboarding/server/save-v2-core-draft";

const organizationIdInputSchema = z
  .object({
    organizationId: z.string().uuid("Organization is required."),
  })
  .strict();

function zodFieldErrors(
  error: import("zod").ZodError,
): Record<string, string[]> {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_form";
    fieldErrors[key] ??= [];
    fieldErrors[key].push(issue.message);
  }
  return fieldErrors;
}

export async function getOnboardingContextAction(
  organizationId?: string,
): Promise<OnboardingReadResult> {
  try {
    const supabase = await createSupabaseServerClient();
    return await readOnboardingContext(supabase, organizationId);
  } catch {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }
}

export async function saveOnboardingDraftAction(
  input: unknown,
): Promise<OnboardingWriteResult> {
  const parsed = parseOnboardingDraftInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation_error",
      message: onboardingMessage("validation_error"),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await saveOnboardingDraft(supabase, parsed.data);
  } catch {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }
}

export async function saveV2CoreDraftAction(
  input: unknown,
): Promise<OnboardingWriteResult> {
  const parsed = parseV2CoreDraftInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation_error",
      message: onboardingMessage("validation_error"),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await saveV2CoreDraft(supabase, parsed.data);
  } catch {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }
}

export async function completeOnboardingAction(
  input: unknown,
): Promise<OnboardingWriteResult> {
  const parsed = parseOnboardingCompleteInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation_error",
      message: onboardingMessage("validation_error"),
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await completeOnboarding(supabase, parsed.data);
  } catch {
    return {
      ok: false,
      code: "unexpected_error",
      message: onboardingMessage("unexpected_error"),
    };
  }
}

export async function markV2OnboardingSetupReadyAction(
  input: unknown,
): Promise<V2OnboardingTransitionResult> {
  const parsed = organizationIdInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_state",
      message: v2OnboardingTransitionMessage("invalid_state"),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    return await markV2OnboardingSetupReady(
      supabase,
      parsed.data.organizationId,
    );
  } catch {
    return {
      ok: false,
      code: "retryable_error",
      message: v2OnboardingTransitionMessage("retryable_error"),
    };
  }
}

export async function completeV2OnboardingAction(
  input: unknown,
): Promise<V2OnboardingTransitionResult> {
  const parsed = organizationIdInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_state",
      message: v2OnboardingTransitionMessage("invalid_state"),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await completeV2Onboarding(
      supabase,
      parsed.data.organizationId,
    );
    if (result.ok) {
      revalidatePath("/home");
    }
    return result;
  } catch {
    return {
      ok: false,
      code: "retryable_error",
      message: v2OnboardingTransitionMessage("retryable_error"),
    };
  }
}

export async function assignOperatingModelAction(
  input: unknown,
): Promise<OperatingModelAssignmentResult> {
  const parsed = operatingModelAssignmentInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "invalid_operating_model",
      message: operatingModelMessage("invalid_operating_model"),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await assignOrganizationOperatingModel(
      supabase,
      parsed.data,
    );
    if (result.ok) {
      revalidatePath("/home");
      revalidatePath("/onboarding/operating-model");
    }
    return result;
  } catch {
    return {
      ok: false,
      code: "assignment_failed",
      message: operatingModelMessage("assignment_failed"),
    };
  }
}

export async function dismissFirstValueChecklistAction(
  input: unknown,
): Promise<ChecklistDismissResult> {
  const parsed = organizationIdInputSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      code: "validation_error",
      message: checklistMessage("validation_error"),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const result = await dismissFirstValueChecklist(
      supabase,
      parsed.data.organizationId,
    );
    if (result.ok) {
      revalidatePath("/leads");
    }
    return result;
  } catch {
    return {
      ok: false,
      code: "unexpected_error",
      message: checklistMessage("unexpected_error"),
    };
  }
}
