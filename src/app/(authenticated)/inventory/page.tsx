import { loadInventoryPage } from "@/features/product-operations/ui/load-pages";
import { InventoryView, ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";

export default async function InventoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const result = await loadInventoryPage(typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="inventory" targetPath="/inventory" />;
  return <ProductOperationsShell context={result.context} activeNav="inventory" action="/inventory"><InventoryView context={result.context} products={result.products} /></ProductOperationsShell>;
}
