export const PRODUCTS_ROUTE = "/products";
export const ORDERS_ROUTE = "/orders";
export const INVENTORY_ROUTE = "/inventory";
export const FULFILLMENT_ROUTE = "/fulfillment";

export const productDetailHref = (productId: string) => `${PRODUCTS_ROUTE}/${productId}`;
export const inventoryAdjustHref = (productId: string) => `${INVENTORY_ROUTE}/${productId}/adjust`;
export const orderDetailHref = (orderId: string) => `${ORDERS_ROUTE}/${orderId}`;
export const orderCreateHrefForCustomer = (customerId: string) =>
  `${ORDERS_ROUTE}/new?customer=${encodeURIComponent(customerId)}`;
