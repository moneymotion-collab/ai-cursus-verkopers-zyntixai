import type { LeadDetailReadModel } from "@/features/leads/domain/read-types";
import {
  CUSTOMER_ID,
  LEAD_ID,
  MEMBER_ID,
  ORG_ID,
  STAGE_ID,
} from "./lead-read-query-mocks";

export const NEW_LEAD_ID = "99999999-9999-4999-8999-999999999999";

export const sampleLeadDetail: LeadDetailReadModel = {
  id: LEAD_ID,
  organizationId: ORG_ID,
  displayName: "Prospect Co",
  firstName: "Pat",
  lastName: "Prospect",
  email: "ops@prospect.test",
  phone: "+1",
  status: "open",
  statusLabel: "Open",
  ownerMemberId: MEMBER_ID,
  ownerLabel: "Taylor Owner",
  createdByMemberId: MEMBER_ID,
  createdByLabel: "Taylor Owner",
  stage: {
    stageId: STAGE_ID,
    name: "New",
    position: 1,
    stageCategory: "new",
    stageCategoryLabel: "New",
    isDefault: true,
  },
  sourceType: "manual",
  sourceDetail: "Inbound",
  pursuitLabel: "Q3 deal",
  convertedCustomer: null,
  archivedAt: null,
  createdAt: "2026-07-14T10:00:00.000Z",
  updatedAt: "2026-07-14T10:00:00.000Z",
  derived: {
    isArchived: false,
    isConverted: false,
    isConvertible: true,
    allowedStatusTransitions: ["lost", "disqualified"],
  },
};

export const createLeadInput = {
  organizationId: ORG_ID,
  displayName: "Prospect Co",
  firstName: "Pat",
  lastName: "Prospect",
  email: "ops@prospect.test",
  phone: "+1",
  ownerMemberId: null,
  sourceType: "manual",
  sourceDetail: "Inbound",
  pursuitLabel: "Q3 deal",
};

export const updateProfileInput = {
  organizationId: ORG_ID,
  leadId: LEAD_ID,
  displayName: "Prospect Co Updated",
  firstName: "Pat",
  lastName: "Prospect",
  email: "ops@prospect.test",
  phone: "+1",
  ownerMemberId: MEMBER_ID,
  sourceType: "manual",
  sourceDetail: "Inbound",
  pursuitLabel: "Q3 deal",
};

export const transitionStageInput = {
  organizationId: ORG_ID,
  leadId: LEAD_ID,
  toStageId: STAGE_ID,
  reason: "Moved forward",
};

export const transitionStatusInput = {
  organizationId: ORG_ID,
  leadId: LEAD_ID,
  toStatus: "lost" as const,
  reason: "No response",
};

export const convertLeadInput = {
  organizationId: ORG_ID,
  leadId: LEAD_ID,
  existingCustomerId: null,
  reason: "Won",
};

export const convertLeadWithExistingCustomerInput = {
  organizationId: ORG_ID,
  leadId: LEAD_ID,
  existingCustomerId: CUSTOMER_ID,
  reason: "Matched existing",
};

export const archiveRestoreInput = {
  organizationId: ORG_ID,
  leadId: LEAD_ID,
};

export const archivedLeadDetail: LeadDetailReadModel = {
  ...sampleLeadDetail,
  archivedAt: "2026-07-15T10:00:00.000Z",
  derived: {
    ...sampleLeadDetail.derived,
    isArchived: true,
    isConvertible: false,
    allowedStatusTransitions: [],
  },
};

export const convertedLeadDetail: LeadDetailReadModel = {
  ...sampleLeadDetail,
  status: "converted",
  statusLabel: "Converted",
  convertedCustomer: {
    customerId: CUSTOMER_ID,
    displayLabel: "Prospect Co Customer",
    convertedAt: "2026-07-14T11:00:00.000Z",
    isArchived: false,
  },
  derived: {
    isArchived: false,
    isConverted: true,
    isConvertible: false,
    allowedStatusTransitions: [],
  },
};

export const lostLeadDetail: LeadDetailReadModel = {
  ...sampleLeadDetail,
  status: "lost",
  statusLabel: "Lost",
  derived: {
    ...sampleLeadDetail.derived,
    isConvertible: false,
    allowedStatusTransitions: ["open"],
  },
};
