import { OrderForm } from "@/features/product-operations/ui/forms";
import { loadOrderCreatePage } from "@/features/product-operations/ui/load-pages";
import {
  OrderCreateUnavailablePanel,
  ProductOperationsLoadFailure,
  ProductOperationsShell,
  resolveOrderCreateUnavailableProps,
} from "@/features/product-operations/ui/views";
import styles from "@/features/product-operations/ui/product-operations.module.css";
import { authenticatedPageMetadata } from "@/features/workspace/authenticated-document-titles";

export const metadata = authenticatedPageMetadata("/orders/new");



export default async function NewOrderPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams;
  const result = await loadOrderCreatePage(typeof query.org === "string" ? query.org : undefined);
  if (result.kind !== "ready") return <ProductOperationsLoadFailure result={result} activeNav="orders" targetPath="/orders/new" />;
  const unavailable = resolveOrderCreateUnavailableProps(result.context, result.options);
  const blocked = unavailable.missingCustomers || unavailable.missingProducts;
  return (
    <ProductOperationsShell context={result.context} activeNav="orders" action="/orders/new">
      <section className={styles.page}>
        <h1>New order</h1>
        {blocked ? (
          <OrderCreateUnavailablePanel {...unavailable} />
        ) : (
          <OrderForm
            organizationId={result.context.organizationId}
            customers={result.options.customers}
            products={result.options.products}
            defaultCustomerId={typeof query.customer === "string" ? query.customer : undefined}
          />
        )}
      </section>
    </ProductOperationsShell>
  );
}
