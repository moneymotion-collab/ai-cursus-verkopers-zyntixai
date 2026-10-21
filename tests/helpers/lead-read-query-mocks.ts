import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const OTHER_ORG_ID = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
export const LEAD_ID = "22222222-2222-4222-8222-222222222222";
export const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
export const USER_ID = "44444444-4444-4444-8444-444444444444";
export const STAGE_ID = "55555555-5555-4555-8555-555555555555";
export const STAGE_ID_2 = "66666666-6666-4666-8666-666666666666";
export const CUSTOMER_ID = "77777777-7777-4777-8777-777777777777";
export const TASK_ID = "88888888-8888-4888-8888-888888888888";

export type QueryResult = {
  data?: unknown;
  error?: { message: string; code?: string; status?: number } | null;
  count?: number | null;
};

export function createChainableQuery(result: QueryResult, options?: { thenable?: boolean }) {
  const builder: Record<string, unknown> = {};
  const chain = vi.fn(() => builder);
  builder.eq = chain;
  builder.is = chain;
  builder.in = chain;
  builder.or = chain;
  builder.order = chain;
  builder.limit = vi.fn().mockReturnValue(builder);
  builder.range = vi.fn().mockResolvedValue(result);
  builder.maybeSingle = vi.fn().mockResolvedValue(result);

  if (options?.thenable) {
    const promise = Promise.resolve(result);
    builder.then = promise.then.bind(promise);
    builder.catch = promise.catch.bind(promise);
    builder.finally = promise.finally.bind(promise);
  }

  return builder;
}

export type LeadReadMockOptions = {
  user?: { id: string } | null;
  role?: string;
  leadsList?: QueryResult;
  leadDetail?: QueryResult;
  statusHistory?: QueryResult;
  stageHistory?: QueryResult;
  stages?: QueryResult;
  stageOptions?: QueryResult;
  members?: QueryResult;
  profiles?: QueryResult;
  customers?: QueryResult;
  tasksList?: QueryResult;
  membershipError?: { message: string } | null;
  authError?: { message: string; name?: string; code?: string } | null;
};

export function createLeadReadMockSupabase(options: LeadReadMockOptions) {
  const activeMembershipQuery = vi.fn().mockResolvedValue({
    data: options.user
      ? [
          {
            id: MEMBER_ID,
            organization_id: ORG_ID,
            role: options.role ?? "staff",
            status: "active",
            user_id: options.user.id,
          },
        ]
      : [],
    error: options.membershipError ?? null,
  });

  const from = vi.fn((table: string) => {
    if (table === "organization_members") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation((_column: string, value: unknown) => {
            if (value === ORG_ID) {
              return {
                in: vi.fn().mockResolvedValue(
                  options.members ?? {
                    data: [{ id: MEMBER_ID, user_id: USER_ID }],
                    error: null,
                  },
                ),
              };
            }
            return { eq: activeMembershipQuery };
          }),
        }),
      };
    }

    if (table === "organizations") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { timezone: "UTC" },
              error: null,
            }),
          }),
          in: vi.fn().mockResolvedValue({
            data: [{ id: ORG_ID, name: "Org Alpha" }],
            error: null,
          }),
        }),
      };
    }

    if (table === "profiles") {
      return {
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockResolvedValue(
            options.profiles ?? {
              data: [{ id: USER_ID, display_name: "Taylor Owner" }],
              error: null,
            },
          ),
        }),
      };
    }

    if (table === "leads") {
      return {
        select: vi.fn((columns: string, opts?: { count?: string }) => {
          if (opts?.count === "exact") {
            return createChainableQuery(
              options.leadsList ?? { data: [], count: 0, error: null },
            );
          }

          return {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(
                  options.leadDetail ?? { data: null, error: null },
                ),
              }),
            }),
          };
        }),
      };
    }

    if (table === "lead_status_history") {
      return {
        select: vi.fn().mockReturnValue(
          createChainableQuery(
            options.statusHistory ?? { data: [], error: null },
            { thenable: true },
          ),
        ),
      };
    }

    if (table === "lead_stage_history") {
      return {
        select: vi.fn().mockReturnValue(
          createChainableQuery(
            options.stageHistory ?? { data: [], error: null },
            { thenable: true },
          ),
        ),
      };
    }

    if (table === "lead_pipeline_stages") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockImplementation(() => {
            const builder = createChainableQuery(
              options.stageOptions ??
                options.stages ?? {
                  data: [
                    {
                      id: STAGE_ID,
                      organization_id: ORG_ID,
                      name: "New",
                      position: 1,
                      stage_category: "new",
                      is_default: true,
                      archived_at: null,
                    },
                  ],
                  error: null,
                },
              { thenable: true },
            );
            builder.in = vi.fn().mockResolvedValue(
              options.stages ?? {
                data: [
                  {
                    id: STAGE_ID,
                    organization_id: ORG_ID,
                    name: "New",
                    position: 1,
                    stage_category: "new",
                    is_default: true,
                    archived_at: null,
                  },
                ],
                error: null,
              },
            );
            return builder;
          }),
        }),
      };
    }

    if (table === "customers") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue(
                options.customers ?? {
                  data: {
                    id: CUSTOMER_ID,
                    display_name: "Converted Customer",
                    archived_at: null,
                  },
                  error: null,
                },
              ),
            }),
          }),
        }),
      };
    }

    if (table === "tasks") {
      return {
        select: vi.fn((columns: string, opts?: { count?: string }) => {
          if (opts?.count === "exact") {
            return createChainableQuery(
              options.tasksList ?? { data: [], count: 0, error: null },
            );
          }
          return createChainableQuery({ data: null, error: null });
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: options.authError ?? null,
      }),
    },
    from,
  } as unknown as SupabaseClient<Database>;
}

export const sampleLeadListRow = {
  id: LEAD_ID,
  organization_id: ORG_ID,
  display_name: "Prospect Co",
  status: "open",
  email: "ops@prospect.test",
  owner_member_id: MEMBER_ID,
  stage_id: STAGE_ID,
  source_type: "manual",
  pursuit_label: "Q3 deal",
  converted_customer_id: null,
  converted_at: null,
  created_at: "2026-07-14T10:00:00.000Z",
  updated_at: "2026-07-14T10:00:00.000Z",
  archived_at: null,
};

export const sampleLeadDetailRow = {
  ...sampleLeadListRow,
  first_name: "Pat",
  last_name: "Prospect",
  phone: "+1",
  created_by_member_id: MEMBER_ID,
  source_detail: "Inbound",
};

export const sampleConvertedLeadDetailRow = {
  ...sampleLeadDetailRow,
  status: "converted",
  converted_customer_id: CUSTOMER_ID,
  converted_at: "2026-07-15T10:00:00.000Z",
};

export const sampleTaskListRow = {
  id: TASK_ID,
  organization_id: ORG_ID,
  title: "Follow up",
  status: "open",
  task_type: "follow_up",
  priority: "normal",
  source: "manual",
  due_at: "2026-07-20T10:00:00.000Z",
  assignee_member_id: MEMBER_ID,
  lead_id: LEAD_ID,
  customer_id: null,
  enrollment_id: null,
  program_id: null,
  archived_at: null,
  created_at: "2026-07-14T10:00:00.000Z",
};
