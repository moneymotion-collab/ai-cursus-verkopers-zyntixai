"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  completeRegistrationAction,
  resendVerificationAction,
} from "@/features/auth/actions/auth-actions";
import styles from "./register-status.module.css";

const PENDING_VERIFICATION_EMAIL_KEY = "px2_pending_verification_email";

export { PENDING_VERIFICATION_EMAIL_KEY };

type CheckEmailPanelProps = {
  initialMessage?: string;
};

export function CheckEmailPanel({ initialMessage }: CheckEmailPanelProps) {
  const [message, setMessage] = useState(
    initialMessage ??
      "Check your email for a verification link to finish creating your account.",
  );
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const pendingRef = useRef(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(PENDING_VERIFICATION_EMAIL_KEY);
      if (stored) {
        setEmail(stored);
      }
    } catch {
      // sessionStorage may be unavailable; email field remains empty.
    }
  }, []);

  function handleResend() {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setError(null);
    startTransition(async () => {
      const result = await resendVerificationAction(
        email.trim() ? { email: email.trim() } : {},
      );
      if (!result.ok) {
        setError(result.message);
      } else {
        setMessage(result.message);
      }
      pendingRef.current = false;
    });
  }

  return (
    <section className={styles.panel} aria-labelledby="check-email-title">
      <h1 id="check-email-title">Verify your email</h1>
      <p className={styles.body}>{message}</p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={styles.field}>
        <label htmlFor="resend-email">Email</label>
        <input
          id="resend-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={isPending}
          required
        />
      </div>
      <button
        type="button"
        className={styles.secondary}
        onClick={handleResend}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? "Sending…" : "Resend verification email"}
      </button>
      <p className={styles.footer}>
        <Link href="/login" className={styles.link}>
          Back to sign in
        </Link>
      </p>
    </section>
  );
}

type CompleteRegistrationPanelProps = {
  initialError?: string;
};

export function CompleteRegistrationPanel({
  initialError,
}: CompleteRegistrationPanelProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [isPending, startTransition] = useTransition();

  function handleRetry() {
    if (pendingRef.current) {
      return;
    }
    pendingRef.current = true;
    setError(null);
    startTransition(async () => {
      const result = await completeRegistrationAction();
      if (result.ok) {
        router.replace(result.redirectTo);
        router.refresh();
        return;
      }
      setError(result.message ?? "Could not finish setting up your account.");
      if (result.redirectTo === "/register/check-email" || result.redirectTo === "/login") {
        router.replace(result.redirectTo);
      }
      pendingRef.current = false;
    });
  }

  return (
    <section className={styles.panel} aria-labelledby="complete-title">
      <h1 id="complete-title">Finish account setup</h1>
      <p className={styles.body}>
        Your email is verified. Complete organization setup to enter the product.
      </p>
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className={styles.primary}
        onClick={handleRetry}
        disabled={isPending}
        aria-busy={isPending}
      >
        {isPending ? "Setting up…" : "Complete setup"}
      </button>
      <p className={styles.footer}>
        <Link href="/login" className={styles.link}>
          Back to sign in
        </Link>
      </p>
    </section>
  );
}

export function OwnerOnboardingUnavailablePanel() {
  return (
    <section className={styles.panel} aria-labelledby="complete-title">
      <h1 id="complete-title">Workspace creation unavailable</h1>
      <p className={styles.body}>
        Owner workspace creation is currently unavailable. If you were invited to
        an organization, reopen the latest invitation link from your email.
      </p>
      <p className={styles.footer}>
        <Link href="/login" className={styles.link}>
          Back to sign in
        </Link>
      </p>
    </section>
  );
}
