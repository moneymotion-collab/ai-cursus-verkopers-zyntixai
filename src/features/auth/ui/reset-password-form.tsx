"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { updatePasswordAction } from "@/features/auth/actions/auth-actions";
import { getRecoveryExpiredMessage } from "@/features/auth/server/normalize-auth-error";
import styles from "./login-form.module.css";

type ResetPasswordFormProps = {
  hasRecoverySession: boolean;
};

type UiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string; fieldErrors?: Record<string, string[]> };

export function ResetPasswordForm({ hasRecoverySession }: ResetPasswordFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [uiState, setUiState] = useState<UiState>({ kind: "idle" });

  const isPending = uiState.kind === "pending";
  const fieldErrors = uiState.kind === "error" ? uiState.fieldErrors : undefined;
  const passwordError = fieldErrors?.password?.[0];
  const confirmError = fieldErrors?.confirmPassword?.[0];

  if (!hasRecoverySession) {
    return (
      <section className={styles.form} aria-labelledby="reset-password-title">
        <div className={styles.header}>
          <h1 id="reset-password-title">Reset link expired</h1>
          <p className={styles.subtitle}>{getRecoveryExpiredMessage()}</p>
        </div>
        <p className={styles.footer}>
          <Link href="/forgot-password" className={styles.link}>
            Request a new reset link
          </Link>
        </p>
        <p className={styles.footer}>
          <Link href="/login" className={styles.link}>
            Back to sign in
          </Link>
        </p>
      </section>
    );
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await updatePasswordAction({ password, confirmPassword });

    if (result.ok) {
      router.replace(result.redirectTo);
      router.refresh();
      return;
    }

    if (result.redirectTo) {
      router.replace(result.redirectTo);
      router.refresh();
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
        <h1 id="reset-password-title">Choose a new password</h1>
        <p className={styles.subtitle}>
          Enter a new password for your ZyntixAI account.
        </p>
      </div>

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="reset-password">New password</label>
        <input
          id="reset-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isPending}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "reset-password-error" : undefined}
          required
          minLength={8}
        />
        {passwordError ? (
          <p id="reset-password-error" className={styles.fieldError}>
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="reset-confirm-password">Confirm password</label>
        <input
          id="reset-confirm-password"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          disabled={isPending}
          aria-invalid={confirmError ? true : undefined}
          aria-describedby={confirmError ? "reset-confirm-error" : undefined}
          required
          minLength={8}
        />
        {confirmError ? (
          <p id="reset-confirm-error" className={styles.fieldError}>
            {confirmError}
          </p>
        ) : null}
      </div>

      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? "Updating…" : "Update password"}
      </button>

      <p className={styles.footer}>
        <Link href="/login" className={styles.link}>
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
