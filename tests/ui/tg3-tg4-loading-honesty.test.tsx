import React from "react";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { renderAsyncServerTree } from "../helpers/render-async-server-tree";
import DispatchLoading from "@/app/(authenticated)/dispatch/loading";
import FulfillmentLoading from "@/app/(authenticated)/fulfillment/loading";
import InventoryLoading from "@/app/(authenticated)/inventory/loading";
import OrdersLoading from "@/app/(authenticated)/orders/loading";
import ProductsLoading from "@/app/(authenticated)/products/loading";
import SitesLoading from "@/app/(authenticated)/sites/loading";
import WorkOrdersLoading from "@/app/(authenticated)/work-orders/loading";

const LOADING_ENTRIES = [
  {
    path: "src/app/(authenticated)/sites/loading.tsx",
    Component: SitesLoading,
    title: "Loading sites",
    forbidden: ["New site", "No sites yet", "Warehouse"],
  },
  {
    path: "src/app/(authenticated)/work-orders/loading.tsx",
    Component: WorkOrdersLoading,
    title: "Loading work orders",
    forbidden: ["New work order", "No work orders yet"],
  },
  {
    path: "src/app/(authenticated)/dispatch/loading.tsx",
    Component: DispatchLoading,
    title: "Loading dispatch",
    forbidden: ["Overdue", "Unassigned", "New work order"],
  },
  {
    path: "src/app/(authenticated)/products/loading.tsx",
    Component: ProductsLoading,
    title: "Loading products",
    forbidden: ["New product", "No products yet"],
  },
  {
    path: "src/app/(authenticated)/orders/loading.tsx",
    Component: OrdersLoading,
    title: "Loading orders",
    forbidden: ["New order", "Create a Customer"],
  },
  {
    path: "src/app/(authenticated)/inventory/loading.tsx",
    Component: InventoryLoading,
    title: "Loading inventory",
    forbidden: ["No inventory yet", "Adjust", "New product"],
  },
  {
    path: "src/app/(authenticated)/fulfillment/loading.tsx",
    Component: FulfillmentLoading,
    title: "Loading fulfillment",
    forbidden: ["Requires action", "Mark completed"],
  },
] as const;

describe("TG3/TG4 route-level loading honesty", () => {
  it.each(LOADING_ENTRIES)(
    "renders pending $title without ready controls or unauthorized nav",
    async ({ path, Component, title, forbidden }) => {
      const source = readFileSync(join(process.cwd(), path), "utf8");
      expect(source).toContain('navigationPresentation="pending"');
      expect(source).not.toContain("public-web");
      expect(source).not.toContain("@/app/login");
      expect(source).not.toContain("@/features/auth/");

      const html = await renderAsyncServerTree(<Component />);
      expect(html).toContain(title);
      expect(html).toContain("Please wait while the workspace is prepared.");
      expect(html).toContain("Loading workspace…");
      expect(html).toContain('aria-busy="true"');
      expect(html).toContain('aria-live="polite"');
      expect(html).not.toContain('aria-label="Primary"');
      expect(html).not.toContain("5 on hand");
      expect(html).not.toContain("Install control panel");
      for (const label of forbidden) {
        expect(html).not.toContain(label);
      }
    },
  );
});
