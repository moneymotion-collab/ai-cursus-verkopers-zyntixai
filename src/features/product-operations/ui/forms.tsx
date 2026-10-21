"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  adjustInventoryAction,
  createOrderAction,
  createProductAction,
  updateProductAction,
  type ProductOperationsActionResult,
} from "@/features/product-operations/actions/actions";
import type {
  CustomerOption,
  ProductOption,
  ProductRecord,
} from "@/features/product-operations/domain/types";
import styles from "./product-operations.module.css";

function message(result: ProductOperationsActionResult | null) {
  return result && !result.ok ? <p className={styles.error} role="alert">{result.message}</p> : null;
}

export function ProductForm({ organizationId, product }: { organizationId: string; product?: ProductRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ProductOperationsActionResult | null>(null);
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const actionResult = product
        ? await updateProductAction({ organizationId, productId: product.id, name: data.get("name"), sku: data.get("sku"), description: data.get("description") || null })
        : await createProductAction({ organizationId, name: data.get("name"), sku: data.get("sku"), description: data.get("description") || null });
      setResult(actionResult);
      if (actionResult.ok && actionResult.id) router.push(`/products/${actionResult.id}?org=${organizationId}`);
    });
  }}>
    <label className={styles.field}>Name<input name="name" required maxLength={200} defaultValue={product?.name} /></label>
    <label className={styles.field}>SKU<input name="sku" required maxLength={80} defaultValue={product?.sku} autoCapitalize="characters" /></label>
    <label className={styles.field}>Description<textarea name="description" maxLength={4000} defaultValue={product?.description ?? ""} rows={5} /></label>
    {message(result)}<button className={styles.button} disabled={pending}>{pending ? "Saving…" : product ? "Save product" : "Create product"}</button>
  </form>;
}

export function InventoryAdjustmentForm({ organizationId, product }: { organizationId: string; product: ProductRecord }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ProductOperationsActionResult | null>(null);
  const [key] = useState(() => crypto.randomUUID());
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const actionResult = await adjustInventoryAction({
        organizationId,
        productId: product.id,
        quantityDelta: Number(data.get("quantityDelta")),
        reason: data.get("reason"),
        idempotencyKey: key,
      });
      setResult(actionResult);
      if (actionResult.ok) router.push(`/products/${product.id}?org=${organizationId}`);
    });
  }}>
    <p>Current on hand: <strong>{product.onHand}</strong></p>
    <label className={styles.field}>Quantity change<input name="quantityDelta" type="number" step={1} required placeholder="e.g. 10 or -2" /></label>
    <label className={styles.field}>Reason<input name="reason" required maxLength={500} /></label>
    <p className={styles.muted}>A negative adjustment that would make stock negative is rejected.</p>
    {message(result)}<button className={styles.button} disabled={pending}>{pending ? "Adjusting…" : "Record adjustment"}</button>
  </form>;
}

type Line = { id: string; productId: string; quantity: number };
export function OrderForm({
  organizationId,
  customers,
  products,
  defaultCustomerId,
}: {
  organizationId: string;
  customers: CustomerOption[];
  products: ProductOption[];
  defaultCustomerId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ProductOperationsActionResult | null>(null);
  const [key] = useState(() => crypto.randomUUID());
  const [lines, setLines] = useState<Line[]>([{ id: "initial", productId: products[0]?.value ?? "", quantity: 1 }]);
  return <form className={styles.form} onSubmit={(event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    startTransition(async () => {
      const actionResult = await createOrderAction({
        organizationId,
        customerId: data.get("customerId"),
        reference: data.get("reference"),
        items: lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        idempotencyKey: key,
      });
      setResult(actionResult);
      if (actionResult.ok && actionResult.id) router.push(`/orders/${actionResult.id}?org=${organizationId}`);
    });
  }}>
    <label className={styles.field}>Customer<select name="customerId" required defaultValue={defaultCustomerId ?? customers[0]?.value}>{customers.map((customer) => <option key={customer.value} value={customer.value}>{customer.label}</option>)}</select></label>
    <label className={styles.field}>Order reference<input name="reference" required maxLength={120} /></label>
    <fieldset className={styles.form}><legend>Products</legend><div className={styles.lines}>{lines.map((line, index) => <div className={styles.line} key={line.id}>
      <label className={styles.field}>Product {index + 1}<select value={line.productId} onChange={(event) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, productId: event.target.value } : item))}>{products.map((product) => <option key={product.value} value={product.value}>{product.label} — {product.onHand} available</option>)}</select></label>
      <label className={styles.field}>Quantity<input type="number" min={1} step={1} required value={line.quantity} onChange={(event) => setLines((current) => current.map((item) => item.id === line.id ? { ...item, quantity: Number(event.target.value) } : item))} /></label>
      {lines.length > 1 ? <button className={styles.secondary} type="button" onClick={() => setLines((current) => current.filter((item) => item.id !== line.id))}>Remove</button> : null}
    </div>)}</div><button className={styles.secondary} type="button" onClick={() => setLines((current) => [...current, { id: crypto.randomUUID(), productId: products[0]?.value ?? "", quantity: 1 }])}>Add product</button></fieldset>
    <p className={styles.muted}>Stock is checked and deducted atomically. If any line lacks stock, nothing is created.</p>
    {message(result)}<button className={styles.button} disabled={pending}>{pending ? "Creating…" : "Create order"}</button>
  </form>;
}
