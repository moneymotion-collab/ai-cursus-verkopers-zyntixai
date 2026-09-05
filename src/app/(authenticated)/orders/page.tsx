import { loadOrdersPage } from "@/features/product-operations/ui/load-pages";
import { OrdersList, ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";

export default async function OrdersPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const result = await loadOrdersPage(
    typeof query.org === "string" ? query.org : undefined,
    typeof query.customer === "string" ? query.customer : undefined,
  );
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="orders" targetPath="/orders" />;
  return <ProductOperationsShell context={result.context} activeNav="orders" action="/orders"><OrdersList context={result.context} orders={result.orders} title={result.context.terminology.order.plural} /></ProductOperationsShell>;
}
