import { CONTEXT_RESOLUTION_MODE_INTERNAL_QA } from "@/features/context-resolver/domain/types";

/**
 * AppShell gating resolves context packs at context_ready without promoting CTX.
 * internal_qa is the only resolver mode that admits context_ready leaf packs today.
 */
export const PRODUCT_MODULE_ACCESS_RESOLUTION_MODE = CONTEXT_RESOLUTION_MODE_INTERNAL_QA;
