"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  archiveProductAction,
  evaluateProductAttentionRulesAction,
  restoreProductAction,
  transitionFulfillmentAction,
} from "@/features/product-operations/actions/actions";
import {
  allowedFulfillmentTransitions,
  fulfillmentStatusLabel,
  type OrderRecord,
  type ProductRecord,
} from "@/features/product-operations/domain/types";
import styles from "./product-operations.module.css";

export function ArchiveProductButton({ organizationId, product }: { organizationId: string; product: ProductRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  return <div>{error ? <span className={styles.error}>{error}</span> : null}<button className={styles.secondary} disabled={pending} onClick={() => startTransition(async () => {
    const result = product.archivedAt
      ? await restoreProductAction({ organizationId, productId: product.id })
      : await archiveProductAction({ organizationId, productId: product.id });
    if (!result.ok) setError(result.message); else router.refresh();
  })}>{pending ? "Saving…" : product.archivedAt ? "Restore" : "Archive"}</button></div>;
}

export function FulfillmentActions({ organizationId, order }: { organizationId: string; order: OrderRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const transitions = allowedFulfillmentTransitions(order.fulfillmentStatus);
  if (!transitions.length) return null;
  return <div className={styles.actions}>{transitions.map((status) => <button key={status} className={status === "completed" ? styles.button : styles.secondary} disabled={pending} onClick={() => startTransition(async () => {
    const result = await transitionFulfillmentAction({
      organizationId,
      orderId: order.id,
      toStatus: status,
      reason: status === "cancelled" ? "Order cancelled by operator" : `Fulfillment moved to ${fulfillmentStatusLabel(status)}`,
      idempotencyKey: crypto.randomUUID(),
    });
    if (!result.ok) setError(result.message); else router.refresh();
  })}>{status === "cancelled" ? "Cancel and restore stock" : `Mark ${fulfillmentStatusLabel(status).toLowerCase()}`}</button>)}{error ? <p className={styles.error}>{error}</p> : null}</div>;
}

export function AttentionEvaluationButton({ organizationId }: { organizationId: string }) {
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  return <div><button className={styles.secondary} disabled={pending} onClick={() => startTransition(async () => {
    const result = await evaluateProductAttentionRulesAction({ organizationId });
    if (result.ok) {
      setNotice(result.result ? `${result.result.created} created, ${result.result.updated} updated, ${result.result.expired} resolved.` : "Exceptions checked.");
    } else {
      setNotice(result.message);
    }
  })}>{pending ? "Checking…" : "Check exceptions"}</button>{notice ? <p className={styles.muted}>{notice}</p> : null}</div>;
}
