import { z } from "zod";
import { PROJECT_STATUSES } from "@/features/projects/domain/types";

const uuid = z.string().uuid();
const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .nullable()
    .transform((value) => value || null);
const optionalUuid = z
  .union([z.string().uuid(), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);
const optionalDate = z
  .union([z.string().date(), z.literal(""), z.null()])
  .optional()
  .transform((value) => value || null);

const projectFields = {
  organizationId: uuid,
  customerId: uuid,
  name: z.string().trim().min(1, "Name is required.").max(200),
  summary: optionalText(4000),
  ownerMemberId: optionalUuid,
  plannedStart: optionalDate,
  plannedEnd: optionalDate,
};

function datesInOrder(value: { plannedStart?: string | null; plannedEnd?: string | null }) {
  return !value.plannedStart || !value.plannedEnd || value.plannedEnd >= value.plannedStart;
}

export const createProjectSchema = z
  .object(projectFields)
  .strict()
  .refine(datesInOrder, {
    message: "Planned end must be on or after planned start.",
    path: ["plannedEnd"],
  });

export const updateProjectSchema = z
  .object({ ...projectFields, projectId: uuid })
  .strict()
  .refine(datesInOrder, {
    message: "Planned end must be on or after planned start.",
    path: ["plannedEnd"],
  });

export const projectIdActionSchema = z
  .object({ organizationId: uuid, projectId: uuid })
  .strict();

export const transitionProjectSchema = projectIdActionSchema.extend({
  toStatus: z.enum(PROJECT_STATUSES),
  reason: optionalText(500),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
