import { ProductForm } from "@/features/product-operations/ui/forms";
import { loadProductsPage } from "@/features/product-operations/ui/load-pages";
import { ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const result = await loadProductsPage(typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="products" targetPath="/products/new" />;
  return <ProductOperationsShell context={result.context} activeNav="products" action="/products/new"><section className={styles.page}><h1>New product</h1><ProductForm organizationId={result.context.organizationId} /></section></ProductOperationsShell>;
}
