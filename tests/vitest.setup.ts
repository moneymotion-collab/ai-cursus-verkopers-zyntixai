import React from "react";
import { vi } from "vitest";
import { mockKnowledgeProductModuleAccess } from "./features/product-access/module-access-fixtures";

// Vitest node environment uses the classic JSX runtime for TSX tests.
(globalThis as typeof globalThis & { React: typeof React }).React = React;

vi.mock("@/features/product-access/server/load-product-module-access", () => ({
  loadProductModuleAccess: vi.fn(async () => mockKnowledgeProductModuleAccess()),
}));
