"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createCustomerAction } from "@/features/customers/actions/customer-actions";
import type { CustomerOwnerFormOptions } from "@/features/customers/ui/load-customer-workflow-page";
import {
  CUSTOMER_OWNER_UNASSIGNED_VALUE,
} from "@/features/customers/ui/customer-list-search-params";
import {
  customerFormIsLocked,
  customerMutationRefreshRequired,
  fieldErrorMessage,
  interpretCustomerFormMutationResult,
  type CustomerFormUiState,
} from "@/features/customers/ui/customer-form-state";
import { buildCustomerDetailHref } from "@/features/customers/ui/customer-navigation";
import type { CustomerListUrlState } from "@/features/customers/ui/customer-list-search-params";
import styles from "./customer-form.module.css";

type CustomerCreateFormProps = {
  organizationId: string;
  listState: CustomerListUrlState;
  ownerOptions: CustomerOwnerFormOptions;
  cancelHref: string;
};

function resolveOwnerMemberId(value: string): string | null {
  if (!value || value === CUSTOMER_OWNER_UNASSIGNED_VALUE) {
    return null;
  }
  return value;
}

export function CustomerCreateForm({
  organizationId,
  listState,
  ownerOptions,
  cancelHref,
}: CustomerCreateFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<CustomerFormUiState>({ kind: "idle" });
  const [displayName, setDisplayName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [ownerMemberId, setOwnerMemberId] = useState(CUSTOMER_OWNER_UNASSIGNED_VALUE);

  const fieldErrors = uiState.kind === "field_error" ? uiState.fieldErrors : undefined;
  const locked = customerFormIsLocked(uiState);
  const isPending = uiState.kind === "pending";

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || locked) {
      return;
    }

    pendingRef.current = true;
    setUiState({ kind: "pending" });

    const result = await createCustomerAction({
      organizationId,
      displayName: displayName.trim(),
      firstName: firstName.trim() || null,
      lastName: lastName.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      ownerMemberId: resolveOwnerMemberId(ownerMemberId),
    });

    const next = interpretCustomerFormMutationResult(result);
    setUiState(next);

    if (next.kind === "success") {
      if (customerMutationRefreshRequired(next.refreshHints)) {
        router.refresh();
      }
      router.push(buildCustomerDetailHref(next.customerId, listState));
      return;
    }

    pendingRef.current = false;
  }

  const committedCustomerId =
    uiState.kind === "reload_required" && uiState.committed ? uiState.customerId : undefined;

  return (
    <form
      className={styles.customerForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to customers
      </a>
      <h1>Create customer</h1>

      {uiState.kind === "error" ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "field_error" && uiState.message ? (
        <div className={styles.formError} role="alert">
          <p>{uiState.message}</p>
        </div>
      ) : null}

      {uiState.kind === "reload_required" ? (
        <div className={styles.formNotice} role="status">
          <p>{uiState.message}</p>
          {committedCustomerId ? (
            <p>
              <a href={buildCustomerDetailHref(committedCustomerId, listState)}>Open saved customer</a>
            </p>
          ) : null}
        </div>
      ) : null}

      {ownerOptions.loadError ? (
        <div className={styles.formNotice} role="status">
          <p>{ownerOptions.loadError}</p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="create-identity-title">
        <h2 id="create-identity-title">Customer identity</h2>

        <div className={styles.field}>
          <label htmlFor="create-display-name">Display name (required)</label>
          <input
            id="create-display-name"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "displayName"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "displayName") ? "create-display-name-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "displayName") ? (
            <p id="create-display-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "displayName")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-first-name">First name</label>
          <input
            id="create-first-name"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "firstName"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "firstName") ? "create-first-name-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "firstName") ? (
            <p id="create-first-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "firstName")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-last-name">Last name</label>
          <input
            id="create-last-name"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "lastName"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "lastName") ? "create-last-name-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "lastName") ? (
            <p id="create-last-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "lastName")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-email">Email</label>
          <input
            id="create-email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "email"))}
            aria-describedby={fieldErrorMessage(fieldErrors, "email") ? "create-email-error" : undefined}
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "email") ? (
            <p id="create-email-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "email")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-phone">Phone</label>
          <input
            id="create-phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "phone"))}
            aria-describedby={fieldErrorMessage(fieldErrors, "phone") ? "create-phone-error" : undefined}
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "phone") ? (
            <p id="create-phone-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "phone")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="create-owner">Owner</label>
          <select
            id="create-owner"
            name="ownerMemberId"
            value={ownerMemberId}
            onChange={(event) => setOwnerMemberId(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "ownerMemberId"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "ownerMemberId") ? "create-owner-error" : undefined
            }
            disabled={locked}
          >
            <option value={CUSTOMER_OWNER_UNASSIGNED_VALUE}>Unassigned</option>
            {ownerOptions.members.map((member) => (
              <option key={member.value} value={member.value}>
                {member.label}
              </option>
            ))}
          </select>
          {fieldErrorMessage(fieldErrors, "ownerMemberId") ? (
            <p id="create-owner-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "ownerMemberId")}
            </p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
          {isPending ? "Creating customer…" : "Create customer"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
