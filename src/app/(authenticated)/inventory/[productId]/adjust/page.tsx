import { notFound } from "next/navigation";
import { InventoryAdjustmentForm } from "@/features/product-operations/ui/forms";
import { loadInventoryAdjustPage } from "@/features/product-operations/ui/load-pages";
import { ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default async function AdjustInventoryPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const result = await loadInventoryAdjustPage(productId, typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="inventory" targetPath={`/inventory/${productId}/adjust`} />;
  if (!result.product) notFound();
  return <ProductOperationsShell context={result.context} activeNav="inventory" action={`/inventory/${productId}/adjust`}><section className={styles.page}><h1>Adjust inventory — {result.product.name}</h1><InventoryAdjustmentForm organizationId={result.context.organizationId} product={result.product} /></section></ProductOperationsShell>;
}
