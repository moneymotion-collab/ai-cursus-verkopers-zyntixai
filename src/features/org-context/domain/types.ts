/**
 * ORG-CONTEXT application domain types.
 * Persistence rows live in generated Database types and must not leak as the
 * application contract. Assignment is not entitlement, authorization,
 * execution, or resolved Context.
 */

export type BusinessActivityStatus = "draft" | "active" | "archived";

export type TaxonomyClassificationKind =
  | "foundation"
  | "industry"
  | "niche"
  | "specialization"
  | "deep_specialization";

export type TaxonomyClassificationRef = {
  kind: TaxonomyClassificationKind;
  targetId: string;
  targetKey?: string;
  targetLabel?: string;
};

export type BusinessActivity = {
  activityId: string;
  organizationId: string;
  activityKey: string;
  displayName: string;
  status: BusinessActivityStatus;
  isPrimary: boolean;
  classification: TaxonomyClassificationRef | null;
  createdAt: string;
  updatedAt: string;
};

export type ContextAssignmentStatus = "active" | "superseded";

export type ContextAssignmentSource =
  | "platform_operator"
  | "manual_owner"
  | "manual_admin"
  | "onboarding"
  | "bqa_confirmed"
  | "migration";

export type OrganizationContextAssignment = {
  assignmentId: string;
  organizationId: string;
  activityId: string;
  contextPackVersionId: string;
  status: ContextAssignmentStatus;
  source: ContextAssignmentSource;
  actorUserId: string | null;
  actorMemberId: string | null;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  supersededAt: string | null;
};

export type OrganizationContextEventType =
  | "business_activity_created"
  | "business_activity_classified"
  | "business_activity_activated"
  | "context_version_assigned"
  | "context_version_changed"
  | "primary_activity_changed"
  | "business_activity_archived";

export type OrganizationContextEvent = {
  eventId: string;
  organizationId: string;
  activityId: string;
  assignmentId: string | null;
  eventType: OrganizationContextEventType;
  actorUserId: string | null;
  actorMemberId: string | null;
  source: ContextAssignmentSource;
  reason: string | null;
  payload: Readonly<Record<string, unknown>>;
  createdAt: string;
};

export type PinnedContextVersionSummary = {
  assignmentId: string;
  organizationId: string;
  activityId: string;
  contextPackVersionId: string;
  status: ContextAssignmentStatus;
  source: ContextAssignmentSource;
};

export type ActivityWithContextAssignment = {
  activity: BusinessActivity;
  assignment: OrganizationContextAssignment | null;
};

export type OrgContextAssignmentMode = "internal_qa";

export type OrgContextPlatformOperator = {
  actorUserId: string;
  email: string;
};

export type OrgContextMutationOperation =
  | "create_activity"
  | "classify_activity"
  | "activate_activity"
  | "set_primary"
  | "assign_context_version"
  | "change_context_version"
  | "archive_activity";

export const ORG_CONTEXT_CONFIRMED_MUTATION_OPERATIONS = [
  "classify_activity",
  "activate_activity",
  "assign_context_version",
] as const;

export type OrgContextBqaMutationOperation =
  (typeof ORG_CONTEXT_CONFIRMED_MUTATION_OPERATIONS)[number];

export type OrgContextMutationSuccess = {
  idempotent: boolean;
  activityId: string;
  assignmentId: string | null;
  eventId: string | null;
  eventType: OrganizationContextEventType | null;
};
