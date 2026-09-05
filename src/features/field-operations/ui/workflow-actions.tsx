"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  archiveSiteAction,
  evaluateWorkOrderAttentionRulesAction,
  restoreSiteAction,
  transitionWorkOrderStatusAction,
} from "@/features/field-operations/actions/actions";
import {
  allowedWorkOrderTransitions,
  type WorkOrderStatus,
  workOrderStatusLabel,
} from "@/features/field-operations/domain/types";
import styles from "./field-operations.module.css";

export function SiteArchiveAction({
  organizationId,
  siteId,
  archived,
}: {
  organizationId: string;
  siteId: string;
  archived: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function run() {
    setPending(true);
    const result = archived
      ? await restoreSiteAction({ organizationId, siteId })
      : await archiveSiteAction({ organizationId, siteId });
    setPending(false);
    if (!result.ok) return setMessage(result.message);
    router.refresh();
  }
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.secondaryButton} disabled={pending} onClick={run}>
        {pending ? "Saving…" : archived ? "Restore site" : "Archive site"}
      </button>
      {message ? <p role="alert" className={styles.error}>{message}</p> : null}
    </div>
  );
}

export function WorkOrderWorkflowActions({
  organizationId,
  workOrderId,
  status,
  canEvaluateAttention,
}: {
  organizationId: string;
  workOrderId: string;
  status: WorkOrderStatus;
  canEvaluateAttention: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function transition(toStatus: WorkOrderStatus) {
    setPending(true);
    setMessage(null);
    const result = await transitionWorkOrderStatusAction({
      organizationId,
      workOrderId,
      toStatus,
      reason: null,
    });
    setPending(false);
    if (!result.ok) return setMessage(result.message);
    router.refresh();
  }
  async function evaluate() {
    setPending(true);
    setMessage(null);
    const result = await evaluateWorkOrderAttentionRulesAction({
      organizationId,
      workOrderId,
      returnPath: `/work-orders/${workOrderId}?org=${encodeURIComponent(organizationId)}`,
    });
    setPending(false);
    if (!result.ok) return setMessage(result.message);
    setMessage(`Attention refreshed: ${result.result?.created ?? 0} created, ${result.result?.expired ?? 0} expired.`);
    router.refresh();
  }
  return (
    <section className={styles.panel}>
      <h2>Execution</h2>
      <div className={styles.actions}>
        {allowedWorkOrderTransitions(status).map((next) => (
          <button key={next} type="button" disabled={pending} onClick={() => transition(next)}>
            Mark {workOrderStatusLabel(next).toLowerCase()}
          </button>
        ))}
        {canEvaluateAttention ? (
          <button type="button" className={styles.secondaryButton} disabled={pending} onClick={evaluate}>
            Refresh Attention
          </button>
        ) : null}
      </div>
      {message ? <p role="status">{message}</p> : null}
    </section>
  );
}

export function DispatchAttentionAction({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  async function evaluate() {
    setPending(true);
    const result = await evaluateWorkOrderAttentionRulesAction({
      organizationId,
      workOrderId: null,
      returnPath: `/dispatch?org=${encodeURIComponent(organizationId)}`,
    });
    setPending(false);
    if (!result.ok) return setMessage(result.message);
    setMessage(
      `${result.result?.created ?? 0} created · ${result.result?.updated ?? 0} updated · ${result.result?.expired ?? 0} expired`,
    );
    router.refresh();
  }
  return (
    <div className={styles.actions}>
      <button type="button" className={styles.secondaryButton} disabled={pending} onClick={evaluate}>
        {pending ? "Checking…" : "Refresh Field Attention"}
      </button>
      {message ? <p role="status">{message}</p> : null}
    </div>
  );
}
