"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  createSiteAction,
  createWorkOrderAction,
  updateSiteAction,
  updateWorkOrderAction,
} from "@/features/field-operations/actions/actions";
import type {
  SiteFormOptions,
  SiteRecord,
  WorkOrderFormOptions,
  WorkOrderRecord,
} from "@/features/field-operations/domain/types";
import {
  siteDetailHref,
  workOrderDetailHref,
} from "@/features/field-operations/domain/navigation";
import styles from "./field-operations.module.css";

type UiError = { message: string; fieldErrors?: Record<string, string> } | null;

export function SiteForm({
  organizationId,
  options,
  site,
  initialProjectId,
}: {
  organizationId: string;
  options: SiteFormOptions;
  site?: SiteRecord;
  initialProjectId?: string;
}) {
  const router = useRouter();
  const initialProject = site?.projectId ?? initialProjectId ?? options.projects[0]?.value ?? "";
  const [projectId, setProjectId] = useState(initialProject);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<UiError>(null);
  const project = options.projects.find((item) => item.value === projectId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const input = {
      organizationId,
      siteId: site?.id,
      customerId: project?.customerId ?? "",
      projectId,
      name: String(form.get("name") ?? ""),
      addressLine1: String(form.get("addressLine1") ?? ""),
      addressLine2: String(form.get("addressLine2") ?? ""),
      postalCode: String(form.get("postalCode") ?? ""),
      city: String(form.get("city") ?? ""),
      country: String(form.get("country") ?? ""),
      operationalNote: String(form.get("operationalNote") ?? ""),
    };
    const result = site ? await updateSiteAction(input) : await createSiteAction(input);
    setPending(false);
    if (!result.ok) {
      setError(result);
      return;
    }
    router.push(siteDetailHref(result.id ?? site?.id ?? "", organizationId));
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {error ? <p className={styles.error} role="alert">{error.message}</p> : null}
      <label>
        Job
        <select value={projectId} onChange={(event) => setProjectId(event.target.value)} required>
          {options.projects.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label>Name<input name="name" defaultValue={site?.name ?? ""} required maxLength={200} /></label>
      <label>Address<input name="addressLine1" defaultValue={site?.addressLine1 ?? ""} required maxLength={300} /></label>
      <label>Address line 2<input name="addressLine2" defaultValue={site?.addressLine2 ?? ""} maxLength={300} /></label>
      <div className={styles.formRow}>
        <label>Postal code<input name="postalCode" defaultValue={site?.postalCode ?? ""} required maxLength={40} /></label>
        <label>City<input name="city" defaultValue={site?.city ?? ""} required maxLength={120} /></label>
      </div>
      <label>Country<input name="country" defaultValue={site?.country ?? ""} required maxLength={120} /></label>
      <label>Operational note<textarea name="operationalNote" defaultValue={site?.operationalNote ?? ""} maxLength={4000} rows={4} /></label>
      <button className={styles.primaryButton} disabled={pending || !projectId}>
        {pending ? "Saving…" : site ? "Save site" : "Create site"}
      </button>
    </form>
  );
}

function toLocalInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

export function WorkOrderForm({
  organizationId,
  options,
  workOrder,
  initialSiteId,
}: {
  organizationId: string;
  options: WorkOrderFormOptions;
  workOrder?: WorkOrderRecord;
  initialSiteId?: string;
}) {
  const router = useRouter();
  const [siteId, setSiteId] = useState(workOrder?.siteId ?? initialSiteId ?? options.sites[0]?.value ?? "");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<UiError>(null);
  const site = options.sites.find((item) => item.value === siteId);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    const scheduledInput = String(form.get("scheduledFor") ?? "");
    const input = {
      organizationId,
      workOrderId: workOrder?.id,
      projectId: site?.projectId ?? "",
      siteId,
      title: String(form.get("title") ?? ""),
      instructions: String(form.get("instructions") ?? ""),
      technicianMemberId: String(form.get("technicianMemberId") ?? ""),
      scheduledFor: scheduledInput ? new Date(scheduledInput).toISOString() : "",
    };
    const result = workOrder
      ? await updateWorkOrderAction(input)
      : await createWorkOrderAction(input);
    setPending(false);
    if (!result.ok) {
      setError(result);
      return;
    }
    router.push(workOrderDetailHref(result.id ?? workOrder?.id ?? "", organizationId));
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={submit}>
      {error ? <p className={styles.error} role="alert">{error.message}</p> : null}
      <label>
        Site
        <select value={siteId} onChange={(event) => setSiteId(event.target.value)} required disabled={Boolean(workOrder)}>
          {options.sites.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label>Title<input name="title" defaultValue={workOrder?.title ?? ""} required maxLength={200} /></label>
      <label>Instructions<textarea name="instructions" defaultValue={workOrder?.instructions ?? ""} maxLength={4000} rows={5} /></label>
      <label>
        Technician
        <select name="technicianMemberId" defaultValue={workOrder?.technicianMemberId ?? ""}>
          <option value="">Unassigned</option>
          {options.technicians.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
        </select>
      </label>
      <label>
        Scheduled date and time
        <input name="scheduledFor" type="datetime-local" defaultValue={toLocalInput(workOrder?.scheduledFor)} />
      </label>
      <button className={styles.primaryButton} disabled={pending || !siteId}>
        {pending ? "Saving…" : workOrder ? "Save work order" : "Create work order"}
      </button>
    </form>
  );
}
