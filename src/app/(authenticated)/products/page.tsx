import { loadProductsPage } from "@/features/product-operations/ui/load-pages";
import { ProductOperationsLoadFailure, ProductOperationsShell, ProductsList } from "@/features/product-operations/ui/views";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const result = await loadProductsPage(typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="products" targetPath="/products" />;
  return <ProductOperationsShell context={result.context} activeNav="products" action="/products">{result.warning ? <p className={styles.error}>{result.warning}</p> : null}<ProductsList context={result.context} products={result.products} /></ProductOperationsShell>;
}
