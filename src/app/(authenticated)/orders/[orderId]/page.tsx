import { notFound } from "next/navigation";
import { loadOrderPage } from "@/features/product-operations/ui/load-pages";
import { OrderDetailView, ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";

export default async function OrderPage({ params, searchParams }: { params: Promise<{ orderId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [{ orderId }, query] = await Promise.all([params, searchParams]);
  const result = await loadOrderPage(orderId, typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="orders" targetPath={`/orders/${orderId}`} />;
  if (!result.order) notFound();
  return <ProductOperationsShell context={result.context} activeNav="orders" action={`/orders/${orderId}`}><OrderDetailView context={result.context} order={result.order} /></ProductOperationsShell>;
}
