"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import {
  parseOnboardingCompleteInput,
  parseOnboardingDraftInput,
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
import { readOnboardingContext } from "@/features/onboarding/server/read-onboarding-context";

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
