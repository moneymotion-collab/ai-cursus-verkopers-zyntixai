import { loadFulfillmentPage } from "@/features/product-operations/ui/load-pages";
import { FulfillmentView, ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";

export default async function FulfillmentPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const result = await loadFulfillmentPage(typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="fulfillment" targetPath="/fulfillment" />;
  return <ProductOperationsShell context={result.context} activeNav="fulfillment" action="/fulfillment"><FulfillmentView context={result.context} orders={result.orders} /></ProductOperationsShell>;
}
