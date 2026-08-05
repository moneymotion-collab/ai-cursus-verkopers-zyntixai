import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const schemaMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805124430_create_attention_items_and_signals.sql",
  ),
  "utf8",
);

const rlsMigration = readFileSync(
  join(
    process.cwd(),
    "supabase/migrations/20260805124448_enable_attention_rls_deny_by_default.sql",
  ),
  "utf8",
);

describe("B1.7.2 Attention database foundation migration security contract", () => {
  it("creates plural Attention tables without Postgres ENUM types", () => {
    expect(schemaMigration).toContain("create table public.attention_items");
    expect(schemaMigration).toContain("create table public.attention_signals");
    expect(schemaMigration).not.toMatch(/create type\s+/i);
    expect(schemaMigration).not.toContain("attention_item_events");
    expect(schemaMigration).not.toContain("priority");
    expect(schemaMigration).not.toContain("snooze");
  });

  it("constrains status and severity with text CHECK constraints", () => {
    expect(schemaMigration).toContain("attention_items_status_check");
    expect(schemaMigration).toContain("'open'");
    expect(schemaMigration).toContain("'acknowledged'");
    expect(schemaMigration).toContain("'resolved'");
    expect(schemaMigration).toContain("'dismissed'");
    expect(schemaMigration).toContain("'expired'");
    expect(schemaMigration).toContain("attention_items_severity_check");
    expect(schemaMigration).toContain("'low'");
    expect(schemaMigration).toContain("'medium'");
    expect(schemaMigration).toContain("'high'");
    expect(schemaMigration).toContain("'critical'");
    expect(schemaMigration).not.toMatch(/status in \([^)]*'archived'/);
  });

  it("enforces lifecycle and archive terminal-only checks", () => {
    expect(schemaMigration).toContain("attention_items_open_fields_check");
    expect(schemaMigration).toContain("attention_items_acknowledged_fields_check");
    expect(schemaMigration).toContain("attention_items_resolved_fields_check");
    expect(schemaMigration).toContain("attention_items_dismissed_fields_check");
    expect(schemaMigration).toContain("attention_items_expired_fields_check");
    expect(schemaMigration).toContain(
      "attention_items_archive_terminal_only_check",
    );
    expect(schemaMigration).toMatch(
      /archived_at is null\s+or status in \('resolved', 'dismissed', 'expired'\)/,
    );
  });

  it("uses organization-consistent composite foreign keys", () => {
    expect(schemaMigration).toContain("attention_items_org_id_unique");
    expect(schemaMigration).toContain("attention_items_enrollment_tuple_fk");
    expect(schemaMigration).toMatch(
      /references public\.enrollments \(\s*organization_id,\s*id,\s*customer_id,\s*program_id\s*\)/,
    );
    expect(schemaMigration).toContain("attention_items_assignee_member_fk");
    expect(schemaMigration).toContain("attention_signals_item_enrollment_fk");
    expect(schemaMigration).toMatch(
      /references public\.attention_items \(\s*organization_id,\s*id,\s*enrollment_id\s*\)/,
    );
  });

  it("enforces non-terminal dedupe uniqueness via partial unique index", () => {
    expect(schemaMigration).toContain("attention_items_nonterminal_dedupe_uidx");
    expect(schemaMigration).toMatch(
      /unique index attention_items_nonterminal_dedupe_uidx[\s\S]*where status in \('open', 'acknowledged'\)/,
    );
  });

  it("locks Signal origin/rule_key combinations and evidence object shape", () => {
    expect(schemaMigration).toContain("signal_origin");
    expect(schemaMigration).toContain("attention_signals_signal_origin_check");
    expect(schemaMigration).toContain(
      "attention_signals_origin_rule_consistency_check",
    );
    expect(schemaMigration).toContain("'enrollment_no_recent_progress'");
    expect(schemaMigration).toContain(
      "attention_signals_evidence_object_check",
    );
    expect(schemaMigration).toContain("jsonb_typeof(evidence) = 'object'");
  });

  it("adds Signal UPDATE immutability trigger without blocking FK CASCADE delete", () => {
    expect(schemaMigration).toContain(
      "private.guard_attention_signal_immutable",
    );
    expect(schemaMigration).toContain("attention_signals_guard_immutable");
    expect(schemaMigration).toMatch(
      /before update on public\.attention_signals/,
    );
    expect(schemaMigration).not.toMatch(
      /before update or delete on public\.attention_signals/,
    );
    expect(schemaMigration).toContain("attention signals are immutable");
    expect(schemaMigration).toContain("DELETE is NOT trigger-blocked");
  });

  it("enables RLS deny-by-default without operational policies or grants", () => {
    expect(rlsMigration).toContain(
      "alter table public.attention_items enable row level security",
    );
    expect(rlsMigration).toContain(
      "alter table public.attention_signals enable row level security",
    );
    expect(rlsMigration).toContain(
      "revoke all on table public.attention_items from anon",
    );
    expect(rlsMigration).toContain(
      "revoke all on table public.attention_items from authenticated",
    );
    expect(rlsMigration).toContain(
      "revoke all on table public.attention_signals from anon",
    );
    expect(rlsMigration).toContain(
      "revoke all on table public.attention_signals from authenticated",
    );
    expect(rlsMigration).not.toMatch(/^\s*grant select/im);
    expect(rlsMigration).not.toMatch(/^\s*grant insert/im);
    expect(rlsMigration).not.toMatch(/^\s*create policy/im);
    expect(rlsMigration).not.toMatch(/^\s*create or replace function public\./im);
  });

  it("documents local-only live verification opt-in guard", () => {
    const liveSql = readFileSync(
      join(
        process.cwd(),
        "tests/security/attention-schema-live-verification.sql",
      ),
      "utf8",
    );
    expect(liveSql).toContain("zyntix.allow_attention_schema_live_verify");
    expect(liveSql).toContain("Never run against production");
    expect(liveSql).toContain("begin;");
    expect(liveSql).toContain("rollback;");
    expect(liveSql).toContain("has_table_privilege('authenticated'");
    expect(liveSql).toContain(
      "expected signal row removed by parent Item CASCADE delete",
    );
    expect(liveSql).toContain("authenticated must have Attention SELECT privileges");
    expect(liveSql).not.toMatch(/expected signal delete denial/);
  });
});
