import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const helpersMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805134825_add_attention_helpers_and_rpcs.sql",
  ),
  "utf8",
);

const rlsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805134830_enable_attention_operational_rls.sql",
  ),
  "utf8",
);

const hardeningMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805134833_attention_security_hardening.sql",
  ),
  "utf8",
);

const eventsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805134823_create_attention_item_events.sql",
  ),
  "utf8",
);

describe("B1.7.3 Attention RPC authorization migration security contract", () => {
  it("creates append-only attention_item_events with UPDATE immutability", () => {
    expect(eventsMigration).toContain("create table public.attention_item_events");
    expect(eventsMigration).toContain("attention_item_events_guard_immutable");
    expect(eventsMigration).toMatch(/before update on public\.attention_item_events/);
    expect(eventsMigration).toContain("attention item events are immutable");
    expect(eventsMigration).not.toContain("restore_attention");
  });

  it("exposes the locked public Attention RPC surface", () => {
    for (const name of [
      "create_manual_attention_item",
      "record_attention_signal",
      "acknowledge_attention_item",
      "assign_attention_item",
      "update_attention_severity",
      "resolve_attention_item",
      "dismiss_attention_item",
      "archive_attention_item",
      "evaluate_attention_rules",
    ]) {
      expect(helpersMigration).toContain(`create or replace function public.${name}`);
    }
    expect(helpersMigration).not.toContain("restore_attention_item");
    expect(helpersMigration).toContain("private.expire_attention_item");
  });

  it("restricts archive and evaluate to owner/admin roles", () => {
    expect(helpersMigration).toMatch(
      /create or replace function public\.archive_attention_item[\s\S]*array\['owner', 'admin'\]/,
    );
    expect(helpersMigration).toMatch(
      /create or replace function public\.evaluate_attention_rules[\s\S]*array\['owner', 'admin'\]/,
    );
    expect(helpersMigration).toMatch(
      /create or replace function public\.dismiss_attention_item[\s\S]*array\['owner', 'admin', 'staff'\]/,
    );
  });

  it("keeps mutations RPC-only with SELECT policies only", () => {
    expect(rlsMigration).toContain("grant select on table public.attention_items");
    expect(rlsMigration).toContain("attention_items_select_admin");
    expect(rlsMigration).toContain("attention_items_select_member");
    expect(rlsMigration).toContain("attention_signals_select_member");
    expect(rlsMigration).toContain("attention_item_events_select_admin");
    expect(rlsMigration).not.toMatch(/^\s*create policy\s+\S+_insert/im);
    expect(rlsMigration).not.toMatch(/^\s*create policy\s+\S+_update/im);
    expect(rlsMigration).not.toMatch(/^\s*create policy\s+\S+_delete/im);
    expect(rlsMigration).toContain("revoke insert, update, delete");
  });

  it("hardens EXECUTE grants and strips service_role execute on public RPCs", () => {
    expect(hardeningMigration).toContain(
      "revoke all on function public.evaluate_attention_rules(uuid, uuid) from service_role",
    );
    expect(hardeningMigration).toContain(
      "grant execute on function public.archive_attention_item(uuid, uuid) to authenticated",
    );
    expect(hardeningMigration).toContain(
      "revoke all on function private.require_attention_actor(uuid, text[]) from service_role",
    );
  });

  it("encodes stale-progress rule contract in evaluate helper path", () => {
    expect(helpersMigration).toContain("enrollment_no_recent_progress");
    expect(helpersMigration).toContain("v_age_days >= 14");
    expect(helpersMigration).toContain("status in ('active', 'paused')");
    expect(helpersMigration).toContain("private.expire_attention_item");
  });
});
