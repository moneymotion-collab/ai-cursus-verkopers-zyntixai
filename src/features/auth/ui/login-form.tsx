"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { loginAction } from "@/features/auth/actions/auth-actions";
import styles from "./login-form.module.css";

type LoginFormProps = {
  nextPath?: string;
  sessionExpired?: boolean;
  sessionExpiredMessage?: string;
};

type LoginUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string; fieldErrors?: Record<string, string[]> };

export function LoginForm({
  nextPath,
  sessionExpired = false,
  sessionExpiredMessage,
}: LoginFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [uiState, setUiState] = useState<LoginUiState>({ kind: "idle" });

  const isPending = uiState.kind === "pending";
  const fieldErrors = uiState.kind === "error" ? uiState.fieldErrors : undefined;
  const emailError = fieldErrors?.email?.[0];
  const passwordError = fieldErrors?.password?.[0];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await loginAction({
      email,
      password,
      next: nextPath,
    });

    if (result.ok) {
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
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <div className={styles.header}>
        <h1 id="login-title">Sign in</h1>
        <p className={styles.subtitle}>Sign in to continue to ZyntixAI.</p>
      </div>

      {sessionExpired && sessionExpiredMessage ? (
        <div className={styles.notice} role="status" aria-live="polite">
          <p>{sessionExpiredMessage}</p>
        </div>
      ) : null}

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isPending}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "login-email-error" : undefined}
          required
        />
        {emailError ? (
          <p id="login-email-error" className={styles.fieldError}>
            {emailError}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="login-password">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isPending}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "login-password-error" : undefined}
          required
        />
        {passwordError ? (
          <p id="login-password-error" className={styles.fieldError}>
            {passwordError}
          </p>
        ) : null}
      </div>

      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
