import { notFound } from "next/navigation";
import { loadProductPage } from "@/features/product-operations/ui/load-pages";
import { ProductDetailView, ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";

export default async function ProductPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ productId }, query] = await Promise.all([params, searchParams]);
  const result = await loadProductPage(productId, typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="products" targetPath={`/products/${productId}`} />;
  if (!result.product) notFound();
  return <ProductOperationsShell context={result.context} activeNav="products" action={`/products/${productId}`}><ProductDetailView context={result.context} product={result.product} movements={result.movements} orders={result.orders} /></ProductOperationsShell>;
}
