import { ORG_ID, CUSTOMER_ID, MEMBER_ID, sampleCustomerDetailRow } from "../helpers/customer-read-query-mocks";
import type { CustomerDetailReadModel } from "@/features/customers/domain/read-types";

export const NEW_CUSTOMER_ID = "77777777-7777-4777-8777-777777777777";

export const sampleCustomerDetail: CustomerDetailReadModel = {
  id: CUSTOMER_ID,
  organizationId: ORG_ID,
  displayName: sampleCustomerDetailRow.display_name,
  firstName: sampleCustomerDetailRow.first_name,
  lastName: sampleCustomerDetailRow.last_name,
  email: sampleCustomerDetailRow.email,
  phone: sampleCustomerDetailRow.phone,
  status: "active",
  statusLabel: "Active",
  ownerMemberId: MEMBER_ID,
  ownerLabel: "Taylor Owner",
  createdByMemberId: MEMBER_ID,
  createdByLabel: "Taylor Owner",
  startedAt: sampleCustomerDetailRow.started_at,
  endedAt: sampleCustomerDetailRow.ended_at,
  archivedAt: null,
  createdAt: sampleCustomerDetailRow.created_at,
  updatedAt: sampleCustomerDetailRow.updated_at,
  derived: {
    isArchived: false,
    allowedTransitions: ["paused", "completed", "cancelled", "churned"],
  },
};

export const archivedCustomerDetail: CustomerDetailReadModel = {
  ...sampleCustomerDetail,
  archivedAt: "2026-07-14T12:00:00.000Z",
  derived: {
    isArchived: true,
    allowedTransitions: [],
  },
};

export const createCustomerInput = {
  organizationId: ORG_ID,
  displayName: "Acme Corp",
  firstName: "Acme",
  lastName: "Corp",
  email: "ops@acme.test",
  phone: "+1",
  ownerMemberId: MEMBER_ID,
};

export const updateProfileInput = {
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
  displayName: "Acme Updated",
  firstName: "Acme",
  lastName: "Updated",
  email: "updated@acme.test",
  phone: "+2",
  ownerMemberId: MEMBER_ID,
};

export const transitionStatusInput = {
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
  toStatus: "paused" as const,
  reason: "On hold",
};

export const archiveRestoreInput = {
  organizationId: ORG_ID,
  customerId: CUSTOMER_ID,
};
