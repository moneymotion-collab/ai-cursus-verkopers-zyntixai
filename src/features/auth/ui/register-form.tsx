"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerAction } from "@/features/auth/actions/auth-actions";
import { PENDING_VERIFICATION_EMAIL_KEY } from "@/features/auth/ui/register-status";
import styles from "./register-form.module.css";

type RegisterUiState =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "error"; message: string; fieldErrors?: Record<string, string[]> };

type RegisterFormProps = {
  mode?: "owner" | "invitation";
};

export function RegisterForm({ mode = "owner" }: RegisterFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [uiState, setUiState] = useState<RegisterUiState>({ kind: "idle" });

  const isPending = uiState.kind === "pending";
  const fieldErrors = uiState.kind === "error" ? uiState.fieldErrors : undefined;
  const nameError = fieldErrors?.name?.[0];
  const emailError = fieldErrors?.email?.[0];
  const passwordError = fieldErrors?.password?.[0];
  const companyError = fieldErrors?.companyName?.[0];
  const invitationMode = mode === "invitation";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await registerAction(
      invitationMode
        ? { name, email, password }
        : { name, email, password, companyName },
    );

    if (result.ok) {
      try {
        sessionStorage.setItem(PENDING_VERIFICATION_EMAIL_KEY, email.trim().toLowerCase());
      } catch {
        // Best-effort only; check-email still accepts a typed email.
      }
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
        <h1 id="register-title">
          {invitationMode ? "Create your account" : "Create your account"}
        </h1>
        <p className={styles.subtitle}>
          {invitationMode
            ? "Accept an organization invitation after verifying your email."
            : "Register as the owner of a new organization."}
        </p>
      </div>

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      <div className={styles.field}>
        <label htmlFor="register-name">Name</label>
        <input
          id="register-name"
          name="name"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          disabled={isPending}
          aria-invalid={nameError ? true : undefined}
          aria-describedby={nameError ? "register-name-error" : undefined}
          required
        />
        {nameError ? (
          <p id="register-name-error" className={styles.fieldError}>
            {nameError}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="register-email">Email</label>
        <input
          id="register-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isPending}
          aria-invalid={emailError ? true : undefined}
          aria-describedby={emailError ? "register-email-error" : undefined}
          required
        />
        {emailError ? (
          <p id="register-email-error" className={styles.fieldError}>
            {emailError}
          </p>
        ) : null}
      </div>

      <div className={styles.field}>
        <label htmlFor="register-password">Password</label>
        <input
          id="register-password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={isPending}
          aria-invalid={passwordError ? true : undefined}
          aria-describedby={passwordError ? "register-password-error" : undefined}
          required
          minLength={8}
        />
        {passwordError ? (
          <p id="register-password-error" className={styles.fieldError}>
            {passwordError}
          </p>
        ) : null}
      </div>

      {!invitationMode ? (
        <div className={styles.field}>
          <label htmlFor="register-company">Company name</label>
          <input
            id="register-company"
            name="companyName"
            type="text"
            autoComplete="organization"
            value={companyName}
            onChange={(event) => setCompanyName(event.target.value)}
            disabled={isPending}
            aria-invalid={companyError ? true : undefined}
            aria-describedby={companyError ? "register-company-error" : undefined}
            required
          />
          {companyError ? (
            <p id="register-company-error" className={styles.fieldError}>
              {companyError}
            </p>
          ) : null}
        </div>
      ) : null}

      <button type="submit" className={styles.submit} disabled={isPending}>
        {isPending ? "Creating account…" : "Create account"}
      </button>

      <p className={styles.footer}>
        Already have an account?{" "}
        <Link href="/login" className={styles.link}>
          Sign in
        </Link>
      </p>
    </form>
  );
}
