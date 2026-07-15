import { vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

export const ORG_ID = "11111111-1111-4111-8111-111111111111";
export const CUSTOMER_ID = "22222222-2222-4222-8222-222222222222";
export const MEMBER_ID = "33333333-3333-4333-8333-333333333333";
export const USER_ID = "44444444-4444-4444-8444-444444444444";
export const PROGRAM_ID = "55555555-5555-4555-8555-555555555555";
export const ENROLLMENT_ID = "66666666-6666-4666-8666-666666666666";

export type QueryResult = {
  data?: unknown;
  error?: { message: string } | null;
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

export type CustomerReadMockOptions = {
  user?: { id: string } | null;
  role?: string;
  customersList?: QueryResult;
  customerDetail?: QueryResult;
  customerHistory?: QueryResult;
  enrollments?: QueryResult;
  members?: QueryResult;
  profiles?: QueryResult;
  programs?: QueryResult;
  membershipError?: { message: string } | null;
};

export function createCustomerReadMockSupabase(options: CustomerReadMockOptions) {
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
  const userEq = vi.fn().mockReturnValue({ eq: activeMembershipQuery });

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

    if (table === "customers") {
      return {
        select: vi.fn((columns: string, opts?: { count?: string }) => {
          if (opts?.count === "exact") {
            return createChainableQuery(
              options.customersList ?? { data: [], count: 0, error: null },
            );
          }

          return {
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue(
                  options.customerDetail ?? { data: null, error: null },
                ),
              }),
            }),
          };
        }),
      };
    }

    if (table === "customer_status_history") {
      return {
        select: vi.fn().mockReturnValue(
          createChainableQuery(
            options.customerHistory ?? { data: [], error: null },
            { thenable: true },
          ),
        ),
      };
    }

    if (table === "enrollments") {
      return {
        select: vi.fn().mockReturnValue(
          createChainableQuery(
            options.enrollments ?? { data: [], error: null },
            { thenable: true },
          ),
        ),
      };
    }

    if (table === "programs") {
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            in: vi.fn().mockResolvedValue(
              options.programs ?? {
                data: [{ id: PROGRAM_ID, name: "Trading Foundations" }],
                error: null,
              },
            ),
          }),
        }),
      };
    }

    throw new Error(`Unexpected table: ${table}`);
  });

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: options.user ?? null },
        error: null,
      }),
    },
    from,
  } as unknown as SupabaseClient<Database>;
}

export const sampleCustomerListRow = {
  id: CUSTOMER_ID,
  organization_id: ORG_ID,
  display_name: "Acme Corp",
  status: "active",
  email: "ops@acme.test",
  owner_member_id: MEMBER_ID,
  started_at: "2026-07-14T10:00:00.000Z",
  updated_at: "2026-07-14T10:00:00.000Z",
  archived_at: null,
};

export const sampleCustomerDetailRow = {
  ...sampleCustomerListRow,
  first_name: "Acme",
  last_name: "Corp",
  phone: "+1",
  created_by_member_id: MEMBER_ID,
  ended_at: null,
  created_at: "2026-07-14T10:00:00.000Z",
};
