"use server";

import { redirect } from "next/navigation";
import { resolvePostLoginDestination } from "@/features/auth/server/resolve-authenticated-landing";
import { parseLoginInput } from "@/features/auth/server/login-schema";
import {
  normalizeLoginError,
  zodFieldErrors,
} from "@/features/auth/server/normalize-auth-error";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type LoginActionResult =
  | { ok: true; redirectTo: string }
  | {
      ok: false;
      message: string;
      fieldErrors?: Record<string, string[]>;
    };

export async function loginAction(input: unknown): Promise<LoginActionResult> {
  const parsed = parseLoginInput(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please correct the highlighted fields and try again.",
      fieldErrors: zodFieldErrors(parsed.error),
    };
  }

  try {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: parsed.data.email,
      password: parsed.data.password,
    });

    if (error) {
      return {
        ok: false,
        message: normalizeLoginError(error),
      };
    }

    const redirectTo = await resolvePostLoginDestination(supabase, parsed.data.next);
    return { ok: true, redirectTo };
  } catch {
    return {
      ok: false,
      message: "Unable to sign in. Please try again.",
    };
  }
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/login");
}
