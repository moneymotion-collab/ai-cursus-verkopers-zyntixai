import { z } from "zod";

const uuid = z.string().uuid();
const idempotencyKey = z.string().trim().min(8).max(128);
export const createProductSchema = z.object({
  organizationId: uuid,
  name: z.string().trim().min(1).max(200),
  sku: z.string().trim().min(1).max(80),
  description: z.string().trim().max(4000).nullable().optional(),
});
export const updateProductSchema = createProductSchema.extend({ productId: uuid });
export const productIdSchema = z.object({ organizationId: uuid, productId: uuid });
export const adjustInventorySchema = productIdSchema.extend({
  quantityDelta: z.number().int().refine((value) => value !== 0, "Enter a non-zero adjustment."),
  reason: z.string().trim().min(1).max(500),
  idempotencyKey,
});
export const createOrderSchema = z.object({
  organizationId: uuid,
  customerId: uuid,
  reference: z.string().trim().min(1).max(120),
  items: z
    .array(z.object({ productId: uuid, quantity: z.number().int().positive() }))
    .min(1)
    .refine((items) => new Set(items.map((item) => item.productId)).size === items.length, {
      message: "Each product may appear only once.",
    }),
  idempotencyKey,
});
export const transitionFulfillmentSchema = z.object({
  organizationId: uuid,
  orderId: uuid,
  toStatus: z.enum(["in_progress", "completed", "cancelled"]),
  reason: z.string().trim().min(1).max(500),
  idempotencyKey,
});
export const evaluateProductRulesSchema = z.object({ organizationId: uuid });
