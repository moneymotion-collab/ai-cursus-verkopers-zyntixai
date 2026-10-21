import { z } from "zod";
import { WORK_ORDER_STATUSES } from "@/features/field-operations/domain/types";

const uuid = z.string().uuid();
const optionalText = (max: number) =>
  z.string().trim().max(max).optional().nullable().transform((value) => value || null);
const optionalUuid = z
  .union([uuid, z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);
const optionalDateTime = z
  .union([z.string().datetime({ offset: true }), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);

const siteFields = {
  organizationId: uuid,
  customerId: uuid,
  projectId: uuid,
  name: z.string().trim().min(1, "Name is required.").max(200),
  addressLine1: z.string().trim().min(1, "Address is required.").max(300),
  addressLine2: optionalText(300),
  postalCode: z.string().trim().min(1, "Postal code is required.").max(40),
  city: z.string().trim().min(1, "City is required.").max(120),
  country: z.string().trim().min(1, "Country is required.").max(120),
  operationalNote: optionalText(4000),
};

export const createSiteSchema = z.object(siteFields).strict();
export const updateSiteSchema = z.object({ ...siteFields, siteId: uuid }).strict();
export const siteIdSchema = z.object({ organizationId: uuid, siteId: uuid }).strict();

const workOrderFields = {
  organizationId: uuid,
  projectId: uuid,
  siteId: uuid,
  title: z.string().trim().min(1, "Title is required.").max(200),
  instructions: optionalText(4000),
  technicianMemberId: optionalUuid,
  scheduledFor: optionalDateTime,
};

export const createWorkOrderSchema = z.object(workOrderFields).strict();
export const updateWorkOrderSchema = z.object({ ...workOrderFields, workOrderId: uuid }).strict();
export const transitionWorkOrderSchema = z
  .object({
    organizationId: uuid,
    workOrderId: uuid,
    toStatus: z.enum(WORK_ORDER_STATUSES),
    reason: optionalText(500),
  })
  .strict();
export const evaluateWorkOrderRulesSchema = z
  .object({
    organizationId: uuid,
    workOrderId: optionalUuid,
    returnPath: z.string().trim().max(2048).optional().nullable(),
  })
  .strict();
