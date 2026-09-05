import { notFound } from "next/navigation";
import { ProductForm } from "@/features/product-operations/ui/forms";
import { loadProductPage } from "@/features/product-operations/ui/load-pages";
import { ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const result = await loadProductPage(productId, typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="products" targetPath={`/products/${productId}/edit`} />;
  if (!result.product) notFound();
  return <ProductOperationsShell context={result.context} activeNav="products" action={`/products/${productId}/edit`}><section className={styles.page}><h1>Edit product</h1><ProductForm organizationId={result.context.organizationId} product={result.product} /></section></ProductOperationsShell>;
}
