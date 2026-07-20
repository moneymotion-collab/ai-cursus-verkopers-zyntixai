"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { requestPasswordResetAction } from "@/features/auth/actions/auth-actions";
import {
  getRecoveryExpiredMessage,
  getRecoveryGenericSuccessMessage,
} from "@/features/auth/server/normalize-auth-error";
import styles from "./login-form.module.css";

type ForgotPasswordFormProps = {
  recoveryExpired?: boolean;
};

type UiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; message: string }
  | { kind: "error"; message: string; fieldErrors?: Record<string, string[]> };

export function ForgotPasswordForm({
  recoveryExpired = false,
}: ForgotPasswordFormProps) {
  const pendingRef = useRef(false);
  const [email, setEmail] = useState("");
  const [uiState, setUiState] = useState<UiState>({ kind: "idle" });

  const isPending = uiState.kind === "pending";
  const fieldErrors = uiState.kind === "error" ? uiState.fieldErrors : undefined;
  const emailError = fieldErrors?.email?.[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await requestPasswordResetAction({ email });

    if (result.ok) {
      setUiState({ kind: "success", message: result.message });
      pendingRef.current = false;
      return;
    }

    setUiState({
      kind: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    });
    pendingRef.current = false;
  }

  return (
    <form
      className={styles.form}
      method="post"
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <div className={styles.header}>
        <h1 id="forgot-password-title">Reset password</h1>
        <p className={styles.subtitle}>
          Enter your email and we will send a reset link if an account exists.
        </p>
      </div>

      {recoveryExpired ? (
        <div className={styles.notice} role="status" aria-live="polite">
          <p>{getRecoveryExpiredMessage()}</p>
        </div>
      ) : null}

      {uiState.kind === "success" ? (
        <div className={styles.notice} role="status" aria-live="polite">
          <p>{uiState.message || getRecoveryGenericSuccessMessage()}</p>
        </div>
      ) : null}

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind !== "success" ? (
        <>
          <div className={styles.field}>
            <label htmlFor="forgot-email">Email</label>
            <input
              id="forgot-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
              aria-invalid={emailError ? true : undefined}
              aria-describedby={emailError ? "forgot-email-error" : undefined}
              required
            />
            {emailError ? (
              <p id="forgot-email-error" className={styles.fieldError}>
                {emailError}
              </p>
            ) : null}
          </div>

          <button type="submit" className={styles.submit} disabled={isPending}>
            {isPending ? "Sending…" : "Send reset link"}
          </button>
        </>
      ) : null}

      <p className={styles.footer}>
        <Link href="/login" className={styles.link}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
