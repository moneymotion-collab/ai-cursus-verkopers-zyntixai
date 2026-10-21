import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { createControlPlaneReaders } from "@/features/control-plane/server/control-plane-client";
import { createControlPlaneMemoryClient } from "../control-plane/memory-query-client";
import type { ControlPlaneMemoryTables } from "../control-plane/memory-query-client";
import {
  createOrgContextMemoryClient,
  type OrgContextMemoryTables,
} from "../org-context/memory-query-client";
import type { AuthenticatedResolverClient } from "@/features/context-resolver/server/tenant-context-loader";
import type { ContextResolverServerRuntime } from "@/features/context-resolver/server/context-resolver";

export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const FOREIGN_ORG_ID = "22222222-2222-4222-8222-222222222222";
export const USER_ID = "33333333-3333-4333-8333-333333333333";
export const ACTIVITY_ID = "44444444-4444-4444-8444-444444444444";
export const SECONDARY_ACTIVITY_ID = "55555555-5555-4555-8555-555555555555";
export const FOREIGN_ACTIVITY_ID = "66666666-6666-4666-8666-666666666666";

export const FOUNDATION_TAX_ID = "tax-foundation-knowledge";
export const INDUSTRY_TAX_ID = "tax-industry-education";
export const NICHE_TAX_ID = "tax-niche-ocb";
export const KNOWLEDGE_PACK_ID = "pack-knowledge";
export const NICHE_PACK_ID = "pack-ocb";
export const KNOWLEDGE_VERSION_ID = "ver-knowledge-1";
export const NICHE_VERSION_ID = "ver-ocb-1";
export const NICHE_LATEST_ID = "ver-ocb-99";
export const SUPERSEDED_VERSION_ID = "ver-ocb-superseded";
export const DRAFT_VERSION_ID = "ver-ocb-draft";

const CORE = [
  "core.member-administration",
  "core.tasks",
  "core.attention",
] as const;
const KNOWLEDGE = [
  "shared.crm.customers",
  "knowledge.programs",
  "knowledge.enrollments",
  "knowledge.progress",
] as const;
const NICHE = [
  "shared.crm.leads",
  "horizontal.social.connection",
  "horizontal.social.content",
  "horizontal.social.approval",
  "horizontal.social.scheduling",
  "horizontal.social.publishing",
] as const;
const DECOY = "internal.hidden";

function cap(key: string, ownerClass: string, ownerKey: string) {
  return {
    id: `cap-${key}`,
    capability_key: key,
    label: key,
    description: key,
    owner_class: ownerClass,
    owner_key: ownerKey,
    foundation_id: ownerClass === "foundation" ? FOUNDATION_TAX_ID : null,
    lifecycle_status: "active",
    catalog_visibility: key === DECOY ? "internal" : "listed",
    superseded_by_capability_id: null,
  };
}

function mapping(versionId: string, key: string, relevance: string) {
  return {
    version_id: versionId,
    capability_id: `cap-${key}`,
    mapping_op: "set",
    relevance,
  };
}

function version(input: {
  id: string;
  packId: string;
  versionNumber: number;
  publicationStatus: string;
  parentVersionId?: string | null;
}) {
  return {
    id: input.id,
    pack_id: input.packId,
    version_number: input.versionNumber,
    publication_status: input.publicationStatus,
    completeness: "full",
    parent_version_id: input.parentVersionId ?? null,
    change_impact: "low",
    impact_note: null,
    definition_summary: input.id,
    intended_operator: "operator",
    primary_exchange: "exchange",
  };
}

export function defaultCatalog(): ControlPlaneMemoryTables {
  const capabilities = [
    ...CORE.map((key) => cap(key, "core", "platform")),
    cap("shared.crm.customers", "shared", "crm"),
    cap("shared.crm.leads", "shared", "crm"),
    ...["knowledge.programs", "knowledge.enrollments", "knowledge.progress"].map((key) =>
      cap(key, "foundation", "knowledge"),
    ),
    ...NICHE.filter((key) => key.startsWith("horizontal")).map((key) =>
      cap(key, "horizontal", "social"),
    ),
    cap(DECOY, "core", "platform"),
  ];
  return {
    taxonomy_foundations: [
      {
        id: FOUNDATION_TAX_ID,
        key: "knowledge",
        label: "Knowledge",
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
    ],
    taxonomy_industries: [
      {
        id: INDUSTRY_TAX_ID,
        key: "education-and-learning",
        label: "Education and Learning",
        foundation_id: FOUNDATION_TAX_ID,
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
    ],
    taxonomy_niches: [
      {
        id: NICHE_TAX_ID,
        key: "online-course-business",
        label: "Online Course Business",
        industry_id: INDUSTRY_TAX_ID,
        lifecycle_status: "active",
        catalog_visibility: "listed",
      },
    ],
    capabilities,
    capability_dependencies: [
      {
        capability_id: "cap-knowledge.enrollments",
        depends_on_capability_id: "cap-knowledge.programs",
      },
      {
        capability_id: "cap-knowledge.enrollments",
        depends_on_capability_id: "cap-shared.crm.customers",
      },
      {
        capability_id: "cap-knowledge.progress",
        depends_on_capability_id: "cap-knowledge.enrollments",
      },
      {
        capability_id: "cap-horizontal.social.approval",
        depends_on_capability_id: "cap-horizontal.social.content",
      },
      {
        capability_id: "cap-horizontal.social.scheduling",
        depends_on_capability_id: "cap-horizontal.social.content",
      },
      {
        capability_id: "cap-horizontal.social.publishing",
        depends_on_capability_id: "cap-horizontal.social.connection",
      },
      {
        capability_id: "cap-horizontal.social.publishing",
        depends_on_capability_id: "cap-horizontal.social.content",
      },
    ],
    capability_readiness: capabilities
      .filter((item) => item.capability_key !== DECOY)
      .map((item) => ({
        id: `ready-${item.id}`,
        capability_id: item.id,
        readiness_status: "context_ready",
        supported_scope: { journey: "internal-qa" },
        evidence_phase: "CONTEXT-RESOLVER-1C",
        verified_at: null,
      })),
    context_packs: [
      {
        id: KNOWLEDGE_PACK_ID,
        pack_key: "foundation.knowledge",
        label: "Knowledge",
        pack_kind: "foundation",
        default_locale: "en",
        lifecycle_status: "active",
        foundation_id: FOUNDATION_TAX_ID,
        industry_id: null,
        niche_id: null,
        specialization_id: null,
        deep_specialization_id: null,
      },
      {
        id: NICHE_PACK_ID,
        pack_key: "niche.online-course-business",
        label: "Online Course Business",
        pack_kind: "niche",
        default_locale: "en",
        lifecycle_status: "active",
        foundation_id: null,
        industry_id: null,
        niche_id: NICHE_TAX_ID,
        specialization_id: null,
        deep_specialization_id: null,
      },
    ],
    context_pack_versions: [
      version({
        id: KNOWLEDGE_VERSION_ID,
        packId: KNOWLEDGE_PACK_ID,
        versionNumber: 1,
        publicationStatus: "published",
      }),
      version({
        id: NICHE_VERSION_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 1,
        publicationStatus: "published",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
      version({
        id: NICHE_LATEST_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 99,
        publicationStatus: "published",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
      version({
        id: SUPERSEDED_VERSION_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 2,
        publicationStatus: "superseded",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
      version({
        id: DRAFT_VERSION_ID,
        packId: NICHE_PACK_ID,
        versionNumber: 3,
        publicationStatus: "draft",
        parentVersionId: KNOWLEDGE_VERSION_ID,
      }),
    ],
    context_capability_mappings: [
      ...KNOWLEDGE.map((key) => mapping(KNOWLEDGE_VERSION_ID, key, "required")),
      mapping(NICHE_VERSION_ID, "shared.crm.leads", "recommended"),
      ...NICHE.filter((key) => key.startsWith("horizontal")).map((key) =>
        mapping(NICHE_VERSION_ID, key, "optional"),
      ),
    ],
    context_terminology: [
      ["customer", "Customer", "Customers"],
      ["program", "Program", "Programs"],
      ["enrollment", "Enrollment", "Enrollments"],
      ["progress", "Progress", "Progress"],
    ].map(([termKey, singular, plural]) => ({
      version_id: KNOWLEDGE_VERSION_ID,
      locale: "en",
      term_key: termKey,
      singular_label: singular,
      plural_label: plural,
      short_label: null,
      help_text: null,
    })),
    context_pack_readiness: [
      {
        id: "ready-k",
        version_id: KNOWLEDGE_VERSION_ID,
        readiness_status: "context_ready",
        supported_scope: { journey: "internal-qa" },
        evidence_phase: "CTX",
        verified_at: null,
      },
      {
        id: "ready-n",
        version_id: NICHE_VERSION_ID,
        readiness_status: "context_ready",
        supported_scope: { journey: "internal-qa" },
        evidence_phase: "CTX",
        verified_at: null,
      },
      {
        id: "ready-s",
        version_id: SUPERSEDED_VERSION_ID,
        readiness_status: "context_ready",
        supported_scope: { journey: "internal-qa" },
        evidence_phase: "CTX",
        verified_at: null,
      },
    ],
  };
}

function activityRow(input: {
  id: string;
  organizationId: string;
  key: string;
  primary: boolean;
  classified?: boolean;
}) {
  return {
    id: input.id,
    organization_id: input.organizationId,
    activity_key: input.key,
    display_name: input.key,
    status: "active",
    is_primary: input.primary,
    classification_kind: input.classified === false ? null : "niche",
    foundation_id: null,
    industry_id: null,
    niche_id: input.classified === false ? null : NICHE_TAX_ID,
    specialization_id: null,
    deep_specialization_id: null,
    created_at: "2026-08-26T00:00:00.000Z",
    updated_at: "2026-08-26T00:00:00.000Z",
  };
}

export function defaultTenantTables(input?: {
  locale?: string | null;
  pinVersionId?: string;
  activityIsPrimary?: boolean;
  extraActivities?: OrgContextMemoryTables["organization_business_activities"];
  extraAssignments?: OrgContextMemoryTables["organization_context_assignments"];
}): OrgContextMemoryTables {
  return {
    organizations: [
      { id: ORG_ID, status: "active", locale: input?.locale ?? "nl-NL" },
      { id: FOREIGN_ORG_ID, status: "active", locale: "en" },
    ],
    organization_business_activities: [
      activityRow({
        id: ACTIVITY_ID,
        organizationId: ORG_ID,
        key: "qa_online_course_business",
        primary: input?.activityIsPrimary ?? true,
      }),
      activityRow({
        id: FOREIGN_ACTIVITY_ID,
        organizationId: FOREIGN_ORG_ID,
        key: "foreign_activity",
        primary: true,
      }),
      ...(input?.extraActivities ?? []),
    ],
    organization_context_assignments: [
      {
        id: "assign-active",
        organization_id: ORG_ID,
        business_activity_id: ACTIVITY_ID,
        context_pack_version_id: input?.pinVersionId ?? NICHE_VERSION_ID,
        status: "active",
        source: "platform_operator",
        actor_user_id: USER_ID,
        actor_member_id: null,
        reason: "qa",
        created_at: "2026-08-26T00:00:00.000Z",
        updated_at: "2026-08-26T00:00:00.000Z",
        superseded_at: null,
      },
      ...(input?.extraAssignments ?? []),
    ],
    organization_context_assignment_events: [],
  };
}

type MembershipRow = {
  id: string;
  organization_id: string;
  role: string;
  status: string;
  user_id: string;
};

class MembershipBuilder {
  constructor(
    private readonly rows: MembershipRow[],
    private readonly filters: Array<{ column: string; value: string }> = [],
  ) {}

  select(): MembershipBuilder {
    return this;
  }

  eq(column: string, value: string): MembershipBuilder {
    return new MembershipBuilder(this.rows, [...this.filters, { column, value }]);
  }

  then<T>(
    onfulfilled?: ((value: { data: MembershipRow[]; error: null }) => T) | null,
    onrejected?: ((reason: unknown) => T) | null,
  ): Promise<T> {
    const data = this.rows.filter((row) =>
      this.filters.every((filter) => (row as Record<string, string>)[filter.column] === filter.value),
    );
    return Promise.resolve({ data, error: null }).then(onfulfilled ?? undefined, onrejected ?? undefined);
  }
}

export function createResolverRuntime(input?: {
  userId?: string | null;
  role?: string;
  membershipStatus?: string;
  organizationId?: string;
  locale?: string | null;
  pinVersionId?: string;
  activityIsPrimary?: boolean;
  extraActivities?: OrgContextMemoryTables["organization_business_activities"];
  extraAssignments?: OrgContextMemoryTables["organization_context_assignments"];
  extraMemberships?: MembershipRow[];
  catalog?: ControlPlaneMemoryTables;
}): {
  runtime: ContextResolverServerRuntime;
  controlPlaneCalls: { count: number };
} {
  const tenant = createOrgContextMemoryClient(
    defaultTenantTables({
      locale: input?.locale,
      pinVersionId: input?.pinVersionId,
      activityIsPrimary: input?.activityIsPrimary,
      extraActivities: input?.extraActivities,
      extraAssignments: input?.extraAssignments,
    }),
  );
  const memberships: MembershipRow[] = [
    ...(input?.userId
      ? [
          {
            id: "mem-1",
            organization_id: input.organizationId ?? ORG_ID,
            role: input.role ?? "owner",
            status: input.membershipStatus ?? "active",
            user_id: input.userId,
          },
        ]
      : []),
    ...(input?.extraMemberships ?? []),
  ];
  const client = {
    auth: {
      getUser: async () =>
        input?.userId
          ? { data: { user: { id: input.userId } }, error: null }
          : { data: { user: null }, error: null },
    },
    from(table: string) {
      if (table === "organization_members") {
        return new MembershipBuilder(memberships);
      }
      return tenant.from(table as "organizations");
    },
  } as unknown as AuthenticatedResolverClient;
  const controlPlaneCalls = { count: 0 };
  const catalog = createControlPlaneMemoryClient(input?.catalog ?? defaultCatalog());
  return {
    controlPlaneCalls,
    runtime: {
      getAuthenticatedClient: async () => client as unknown as SupabaseClient<Database> & AuthenticatedResolverClient,
      getControlPlaneReaders: () => {
        controlPlaneCalls.count += 1;
        return createControlPlaneReaders(catalog);
      },
    },
  };
}
