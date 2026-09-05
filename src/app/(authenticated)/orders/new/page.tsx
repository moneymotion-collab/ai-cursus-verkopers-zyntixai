import { OrderForm } from "@/features/product-operations/ui/forms";
import { loadOrderCreatePage } from "@/features/product-operations/ui/load-pages";
import { ProductOperationsLoadFailure, ProductOperationsShell } from "@/features/product-operations/ui/views";
import styles from "@/features/product-operations/ui/product-operations.module.css";

export default async function NewOrderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const result = await loadOrderCreatePage(typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="orders" targetPath="/orders/new" />;
  const unavailable = !result.options.customers.length ? "Create a Customer first." : !result.options.products.length ? "Create an active Product first." : null;
  return <ProductOperationsShell context={result.context} activeNav="orders" action="/orders/new"><section className={styles.page}><h1>New order</h1>{unavailable ? <div className={styles.statePanel}><p>{unavailable}</p></div> : <OrderForm organizationId={result.context.organizationId} customers={result.options.customers} products={result.options.products} defaultCustomerId={typeof query.customer === "string" ? query.customer : undefined} />}</section></ProductOperationsShell>;
}
