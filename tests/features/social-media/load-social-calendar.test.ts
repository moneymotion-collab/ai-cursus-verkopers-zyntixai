import { describe, expect, it } from "vitest";
import { loadSocialCalendar } from "@/features/social-media/server/load-social-calendar";

const ORG = "11111111-1111-4111-8111-111111111111";
const OTHER = "22222222-2222-4222-8222-222222222222";
const IN_RANGE = "2026-08-21T09:00:00.000Z";
const OUT_RANGE = "2026-09-01T09:00:00.000Z";
const WEEK_START = "2026-08-16T22:00:00.000Z";
const WEEK_END = "2026-08-23T22:00:00.000Z";

type Row = Record<string, unknown>;

function createQuery(rows: Row[]) {
  const filters: Array<(row: Row) => boolean> = [];
  const api = {
    select() {
      return api;
    },
    eq(column: string, value: string) {
      filters.push((row) => row[column] === value);
      return api;
    },
    in(column: string, values: string[]) {
      filters.push((row) => values.includes(String(row[column])));
      return api;
    },
    gte(column: string, value: string) {
      filters.push((row) => String(row[column]) >= value);
      return api;
    },
    lt(column: string, value: string) {
      filters.push((row) => String(row[column]) < value);
      return api;
    },
    order() {
      return api;
    },
    limit() {
      return api;
    },
    then(resolve: (value: { data: Row[]; error: null }) => void) {
      resolve({
        data: rows.filter((row) => filters.every((filter) => filter(row))),
        error: null,
      });
    },
  };
  return api;
}

function supabaseFrom(tables: Record<string, Row[]>) {
  return {
    from(table: string) {
      return {
        select() {
          return createQuery(tables[table] ?? []);
        },
      };
    },
  };
}

const publications: Row[] = [
  {
    id: "pub-in",
    organization_id: ORG,
    connection_id: "conn-1",
    provider: "instagram",
    status: "queued",
    execution_mode: "scheduled",
    intended_execute_at: IN_RANGE,
    variant_version_id: "ver-1",
    created_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "pub-out",
    organization_id: ORG,
    connection_id: "conn-1",
    provider: "instagram",
    status: "queued",
    execution_mode: "scheduled",
    intended_execute_at: OUT_RANGE,
    variant_version_id: "ver-1",
    created_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "pub-foreign",
    organization_id: OTHER,
    connection_id: "conn-2",
    provider: "instagram",
    status: "queued",
    execution_mode: "scheduled",
    intended_execute_at: IN_RANGE,
    variant_version_id: "ver-2",
    created_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "pub-immediate",
    organization_id: ORG,
    connection_id: "conn-1",
    provider: "instagram",
    status: "queued",
    execution_mode: "immediate",
    intended_execute_at: IN_RANGE,
    variant_version_id: "ver-1",
    created_at: "2026-08-20T00:00:00.000Z",
  },
  {
    id: "pub-cancelled",
    organization_id: ORG,
    connection_id: "conn-1",
    provider: "instagram",
    status: "cancelled",
    execution_mode: "scheduled",
    intended_execute_at: "2026-08-21T15:00:00.000Z",
    variant_version_id: "ver-1",
    created_at: "2026-08-20T00:00:00.000Z",
  },
];

const tables = {
  social_publications: publications,
  social_account_connections: [
    {
      id: "conn-1",
      organization_id: ORG,
      display_name: "Brand IG",
      provider: "instagram",
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  social_content_variant_versions: [
    {
      id: "ver-1",
      organization_id: ORG,
      content_format: "image",
      title: "Launch image",
      caption: "Caption",
      media_snapshot: [{ asset_id: "asset-1" }],
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
};

describe("SMM-B1.11-B calendar loader", () => {
  it("loads only the visible week, scoped to the authoritative organization", async () => {
    const result = await loadSocialCalendar({
      supabase: supabaseFrom(tables) as never,
      organizationId: ORG,
      role: "owner",
      timeZone: "Europe/Amsterdam",
      visibleStartIso: WEEK_START,
      visibleEndIso: WEEK_END,
      now: new Date("2026-08-21T12:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const ids = result.items.map((item) => item.publicationId).sort();
    expect(ids).toEqual(["pub-cancelled", "pub-in"]);
    expect(result.items.some((item) => item.publicationId === "pub-out")).toBe(
      false,
    );
    expect(result.items.some((item) => item.publicationId === "pub-foreign")).toBe(
      false,
    );
    expect(result.items.find((item) => item.publicationId === "pub-in")?.localDayKey).toBe(
      "2026-08-21",
    );
    expect(
      result.items.find((item) => item.publicationId === "pub-cancelled")
        ?.statusLabel,
    ).toBe("Cancelled");
    expect(result.eligibleToSchedule.map((row) => row.publicationId)).toEqual([
      "pub-immediate",
    ]);
    expect(JSON.stringify(result)).not.toMatch(
      /accessToken|ciphertext|storage_object_key|clientSecret/i,
    );
  });

  it("does not grant Staff mutation flags on loaded items", async () => {
    const result = await loadSocialCalendar({
      supabase: supabaseFrom(tables) as never,
      organizationId: ORG,
      role: "staff",
      timeZone: "Europe/Amsterdam",
      visibleStartIso: WEEK_START,
      visibleEndIso: WEEK_END,
      now: new Date("2026-08-21T12:00:00.000Z"),
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.items.every((item) => !item.canReschedule && !item.canCancel)).toBe(
      true,
    );
    expect(result.eligibleToSchedule.every((row) => !row.canSchedule)).toBe(true);
  });
});
