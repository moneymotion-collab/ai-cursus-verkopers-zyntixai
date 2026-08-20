"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createInvitationAction } from "@/features/invitations/actions/create-invitation-action";
import type { OrganizationInvitationTargetRole } from "@/features/invitations/domain/types";
import type { CreateInvitationActionResult } from "@/features/invitations/server/create-invitation-result";
import styles from "./invite-member-form.module.css";

type InviteMemberFormProps = {
  organizationId: string;
  invitableRoles: readonly OrganizationInvitationTargetRole[];
  invitationAcceptanceEnabled: boolean;
  invitationEmailDeliveryEnabled: boolean;
};

type FormFeedback =
  | { kind: "idle" }
  | { kind: "pending" }
  | { kind: "success"; message: string }
  | {
      kind: "error";
      message: string;
      fieldErrors?: { email?: string; targetRole?: string };
    };

function roleLabel(role: OrganizationInvitationTargetRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function defaultRole(
  roles: readonly OrganizationInvitationTargetRole[],
): OrganizationInvitationTargetRole | "" {
  if (roles.includes("viewer")) {
    return "viewer";
  }
  return roles[0] ?? "";
}

function toCreateSuccessDisplayMessage(
  baseMessage: string,
  invitationAcceptanceEnabled: boolean,
): string {
  if (invitationAcceptanceEnabled) {
    return baseMessage;
  }
  return `${baseMessage} Invitation acceptance is currently disabled.`;
}

export function InviteMemberForm({
  organizationId,
  invitableRoles,
  invitationAcceptanceEnabled,
  invitationEmailDeliveryEnabled,
}: InviteMemberFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const roleSelectRef = useRef<HTMLSelectElement>(null);
  const [email, setEmail] = useState("");
  const [targetRole, setTargetRole] = useState<OrganizationInvitationTargetRole | "">(
    () => defaultRole(invitableRoles),
  );
  const [feedback, setFeedback] = useState<FormFeedback>({ kind: "idle" });

  const isPending = feedback.kind === "pending";
  const emailError =
    feedback.kind === "error" ? feedback.fieldErrors?.email : undefined;
  const roleError =
    feedback.kind === "error" ? feedback.fieldErrors?.targetRole : undefined;
  const hasFieldErrors = Boolean(emailError || roleError);

  useEffect(() => {
    if (feedback.kind !== "error") {
      return;
    }
    if (feedback.fieldErrors?.email) {
      emailInputRef.current?.focus();
      return;
    }
    if (feedback.fieldErrors?.targetRole) {
      roleSelectRef.current?.focus();
    }
  }, [feedback]);

  if (invitableRoles.length === 0) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || isPending) {
      return;
    }

    pendingRef.current = true;
    setFeedback({ kind: "pending" });

    let result: CreateInvitationActionResult;
    try {
      result = await createInvitationAction({
        organizationId,
        email,
        targetRole: targetRole || "",
      });
    } catch {
      setFeedback({
        kind: "error",
        message: "Unable to create the invitation right now. Please try again.",
      });
      pendingRef.current = false;
      return;
    }

    if (result.ok) {
      setFeedback({
        kind: "success",
        message: toCreateSuccessDisplayMessage(
          result.message,
          invitationAcceptanceEnabled,
        ),
      });
      setEmail("");
      setTargetRole(defaultRole(invitableRoles));
      router.refresh();
      pendingRef.current = false;
      return;
    }

    setFeedback({
      kind: "error",
      message: result.message,
      fieldErrors: result.fieldErrors,
    });
    pendingRef.current = false;
  }

  return (
    <form
      className={styles.inviteForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      aria-labelledby="invite-member-heading"
      noValidate
    >
      <div className={styles.sectionHeader}>
        <h2 id="invite-member-heading">Invite member</h2>
        <p className={styles.helpText}>
          {invitationEmailDeliveryEnabled
            ? "Create a pending invitation for this organization. When delivery is enabled, the recipient receives one invitation email."
            : "Create a pending invitation for this organization. Invitation email delivery is currently disabled."}
        </p>
      </div>

      {feedback.kind === "success" ? (
        <div className={styles.formSuccess} role="status" aria-live="polite">
          <p>{feedback.message}</p>
        </div>
      ) : null}

      {feedback.kind === "error" && !hasFieldErrors ? (
        <div className={styles.formError} role="alert">
          <p>{feedback.message}</p>
        </div>
      ) : null}

      <div className={styles.fields}>
        <div className={styles.field}>
          <label htmlFor="invite-member-email">Email</label>
          <input
            ref={emailInputRef}
            id="invite-member-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            disabled={isPending}
            aria-invalid={emailError ? true : undefined}
            aria-describedby={emailError ? "invite-member-email-error" : undefined}
            required
          />
          {emailError ? (
            <p id="invite-member-email-error" className={styles.fieldError} role="alert">
              {emailError}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="invite-member-role">Role</label>
          <select
            ref={roleSelectRef}
            id="invite-member-role"
            name="targetRole"
            value={targetRole}
            onChange={(event) =>
              setTargetRole(
                event.target.value as OrganizationInvitationTargetRole | "",
              )
            }
            disabled={isPending}
            aria-invalid={roleError ? true : undefined}
            aria-describedby={roleError ? "invite-member-role-error" : undefined}
            required
          >
            {invitableRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabel(role)}
              </option>
            ))}
          </select>
          {roleError ? (
            <p id="invite-member-role-error" className={styles.fieldError} role="alert">
              {roleError}
            </p>
          ) : null}
        </div>
      </div>

      <div className={styles.actions}>
        <button
          type="submit"
          className={styles.submitButton}
          disabled={isPending}
          aria-disabled={isPending}
        >
          {isPending ? "Creating invitation…" : "Create invitation"}
        </button>
      </div>
    </form>
  );
}
