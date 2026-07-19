"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { updateCustomerProfileAction } from "@/features/customers/actions/customer-actions";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";
import type { CustomerOwnerFormOptions } from "@/features/customers/ui/load-customer-workflow-page";
import { CUSTOMER_OWNER_UNASSIGNED_VALUE } from "@/features/customers/ui/customer-list-search-params";
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

type CustomerEditFormProps = {
  organizationId: string;
  customer: CustomerDetailReadModel;
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

function initialOwnerValue(customer: CustomerDetailReadModel): string {
  return customer.ownerMemberId ?? CUSTOMER_OWNER_UNASSIGNED_VALUE;
}

export function CustomerEditForm({
  organizationId,
  customer,
  listState,
  ownerOptions,
  cancelHref,
}: CustomerEditFormProps) {
  const router = useRouter();
  const pendingRef = useRef(false);
  const [uiState, setUiState] = useState<CustomerFormUiState>({ kind: "idle" });
  const [displayName, setDisplayName] = useState(customer.displayName);
  const [firstName, setFirstName] = useState(customer.firstName ?? "");
  const [lastName, setLastName] = useState(customer.lastName ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [ownerMemberId, setOwnerMemberId] = useState(initialOwnerValue(customer));

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

    const result = await updateCustomerProfileAction({
      organizationId,
      customerId: customer.id,
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

  const reloadCustomerId =
    uiState.kind === "reload_required" && uiState.committed
      ? uiState.customerId ?? customer.id
      : customer.id;

  return (
    <form
      className={styles.customerForm}
      onSubmit={handleSubmit}
      aria-busy={isPending}
      noValidate
    >
      <a className={styles.backLink} href={cancelHref}>
        Back to customer
      </a>
      <h1>Edit customer</h1>

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
          <p>
            <a href={buildCustomerDetailHref(reloadCustomerId, listState)}>Open saved customer</a>
          </p>
        </div>
      ) : null}

      {ownerOptions.loadError ? (
        <div className={styles.formNotice} role="status">
          <p>{ownerOptions.loadError}</p>
        </div>
      ) : null}

      <section className={styles.section} aria-labelledby="edit-identity-title">
        <h2 id="edit-identity-title">Customer details</h2>

        <div className={styles.field}>
          <label htmlFor="edit-display-name">Customer name (required)</label>
          <input
            id="edit-display-name"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "displayName"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "displayName") ? "edit-display-name-error" : undefined
            }
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "displayName") ? (
            <p id="edit-display-name-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "displayName")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-first-name">First name</label>
          <input
            id="edit-first-name"
            name="firstName"
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-last-name">Last name</label>
          <input
            id="edit-last-name"
            name="lastName"
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-email">Email</label>
          <input
            id="edit-email"
            name="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "email"))}
            aria-describedby={fieldErrorMessage(fieldErrors, "email") ? "edit-email-error" : undefined}
            disabled={locked}
          />
          {fieldErrorMessage(fieldErrors, "email") ? (
            <p id="edit-email-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "email")}
            </p>
          ) : null}
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-phone">Phone</label>
          <input
            id="edit-phone"
            name="phone"
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            disabled={locked}
          />
        </div>

        <div className={styles.field}>
          <label htmlFor="edit-owner">Assigned to</label>
          <select
            id="edit-owner"
            name="ownerMemberId"
            value={ownerMemberId}
            onChange={(event) => setOwnerMemberId(event.target.value)}
            aria-invalid={Boolean(fieldErrorMessage(fieldErrors, "ownerMemberId"))}
            aria-describedby={
              fieldErrorMessage(fieldErrors, "ownerMemberId") ? "edit-owner-error" : undefined
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
            <p id="edit-owner-error" className={styles.fieldError}>
              {fieldErrorMessage(fieldErrors, "ownerMemberId")}
            </p>
          ) : null}
        </div>
      </section>

      <div className={styles.actions}>
        <button type="submit" className={styles.submitButton} disabled={locked || isPending}>
          {isPending ? "Saving changes…" : "Save changes"}
        </button>
        <a className={styles.secondaryButton} href={cancelHref}>
          Cancel
        </a>
      </div>
    </form>
  );
}
