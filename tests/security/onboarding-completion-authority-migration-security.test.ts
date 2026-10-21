import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION =
  "20260908111356_onboarding_completion_authority.sql";
const FORWARD_MIGRATION =
  "20260908131955_reconcile_stale_onboarding_invitation_proof.sql";
const ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256 =
  "D86E0B4D72F7D1D9B83571E87723ACAC0649EC9EFE1B501EE1D9BD808F2A1796";
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION),
  "utf8",
);
const forwardSql = readFileSync(
  join(process.cwd(), "supabase/migrations", FORWARD_MIGRATION),
  "utf8",
);
const migrationFiles = readdirSync(
  join(process.cwd(), "supabase/migrations"),
);

// Git stores these migrations as LF blobs, so the worktree bytes are CRLF on
// Windows and LF on Linux CI for identical SQL. Checksum authority is therefore
// defined over the canonical LF form. Only CRLF pairs are rewritten: a lone CR,
// a changed final newline, or any other byte difference still fails the pin.
function normalizeMigrationLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function normalizedMigrationSha256(value: string): string {
  return createHash("sha256")
    .update(normalizeMigrationLineEndings(value), "utf8")
    .digest("hex")
    .toUpperCase();
}

function functionBody(schema: "private" | "public", name: string): string {
  const marker = `create or replace function ${schema}.${name}`;
  const start = sql.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const next = sql.indexOf("create or replace function ", start + marker.length);
  return sql.slice(start, next === -1 ? undefined : next);
}

function forwardFunctionBody(
  schema: "private" | "public",
  name: string,
): string {
  const marker = `create or replace function ${schema}.${name}`;
  const start = forwardSql.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const end = forwardSql.indexOf("\n$$;", start);
  expect(end).toBeGreaterThan(start);
  return forwardSql.slice(start, end + 4);
}

function tableBody(name: string): string {
  const marker = `create table public.${name}`;
  const start = sql.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const end = sql.indexOf("\n);", start);
  expect(end).toBeGreaterThan(start);
  return sql.slice(start, end + 3);
}

function constraintBody(table: string, name: string): string {
  const marker = `constraint ${name}`;
  const start = table.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const next = table.indexOf("\n  constraint ", start + marker.length);
  return table.slice(start, next === -1 ? undefined : next);
}

function quotedValues(value: string): string[] {
  return [...value.matchAll(/'([^']+)'/g)].map((match) => match[1]!);
}

const ATTEMPT_COUNT_PRESERVATION_CASE =
  /attempt_count\s*=\s*case\s+when coalesce\(p_increment_attempt,\s*true\)\s+then public\.organization_onboarding_invitation_results\.attempt_count \+ 1\s+else greatest\(\s*public\.organization_onboarding_invitation_results\.attempt_count,\s*1\s*\)\s+end,/i;
const LAST_ATTEMPT_PRESERVATION_CASE =
  /last_attempt_at\s*=\s*case\s+when coalesce\(p_increment_attempt,\s*true\)\s+then v_now\s+else coalesce\(\s*public\.organization_onboarding_invitation_results\.last_attempt_at,\s*v_now\s*\)\s+end,/i;
const STALE_PROOF_PRESERVATION_CALL =
  /private\.persist_organization_onboarding_invite_intent_result\(\s*p_organization_id,\s*p_intent_id,\s*'invitation_proof_lost',\s*'historical_invitation',\s*v_existing\.invitation_id,\s*false\s*\)/i;
const PENDING_PROOF_CONTRACT =
  /^if found and v_result\.result_code = 'invite_already_pending'\s+and v_result\.evidence_kind = 'pending_invitation'\s+and exists \(\s+select 1\s+from public\.organization_invitations as oi\s+where oi\.organization_id = p_organization_id\s+and oi\.id = v_result\.invitation_id\s+and oi\.email_normalized = v_intent\.email_normalized\s+and oi\.role = v_intent\.role\s+and oi\.status = 'pending'\s+and oi\.expires_at > pg_catalog\.now\(\)\s+\) then[\s\S]*\s+end if;$/i;

function assertForwardPersistenceContract(body: string): void {
  expect(body).toMatch(ATTEMPT_COUNT_PRESERVATION_CASE);
  expect(body).toMatch(LAST_ATTEMPT_PRESERVATION_CASE);
}

function assertStaleProofUsesPreservation(callSite: string): void {
  expect(callSite).toMatch(STALE_PROOF_PRESERVATION_CALL);
}

function assertPendingProofContract(branch: string): void {
  expect(branch.trim()).toMatch(PENDING_PROOF_CONTRACT);
  expect(branch).not.toMatch(/\b(?:accepted|revoked)\b/i);
}

function assertReconcileSideEffectBoundary(body: string): void {
  const executableStart = body.indexOf("as $$");
  expect(executableStart).toBeGreaterThan(-1);
  const executable = body.slice(executableStart + "as $$".length);
  const applicationCalls = [
    ...new Set(
      [...executable.matchAll(/\b(private|public)\.([a-z_][a-z0-9_]*)\s*\(/gi)]
        .map((match) => `${match[1]!.toLowerCase()}.${match[2]!.toLowerCase()}`),
    ),
  ].sort();

  expect(applicationCalls).toEqual([
    "private.advance_organization_onboarding_completion_run",
    "private.persist_organization_onboarding_invite_intent_result",
    "private.resolve_organization_onboarding_completion_actor",
    "private.resolve_organization_onboarding_invite_intent_evidence",
    "public.ensure_organization_onboarding_completion_run",
  ]);

  for (const forbidden of [
    /resolve_organization_invitation_delivery_attempt/i,
    /complete_organization_invitation_delivery_attempt/i,
    /organization_invitation_delivery_attempts/i,
    /create_organization_invitation(?:_core)?\s*\(/i,
    /resend_organization_invitation(?:_core)?\s*\(/i,
    /generate_organization_invitation/i,
    /gen_random_bytes/i,
    /hash_organization_invitation/i,
    /\b(?:extensions\.)?(?:digest|crypt)\s*\(/i,
    /(?:recover|reconstruct|decrypt)[a-z0-9_]*invitation/i,
    /\braw_token\b/i,
    /\btoken_hash\b/i,
    /(?:send|deliver|enqueue)[a-z0-9_]*(?:invitation|email)/i,
    /consume_organization_invitation_mutation_rate_limit/i,
    /organization_invitation_mutation_rate_limits/i,
    /(?:insert\s+into|update|delete\s+from)\s+(?:(?:public|private)\.)?(?:organization_invitations|organization_invitation_delivery_attempts|organization_invitation_mutation_rate_limits)\b/i,
  ]) {
    expect(body).not.toMatch(forbidden);
  }
}

function assertNoForwardCompletionTimestampReference(value: string): void {
  expect(value).not.toMatch(/\b(?:ready_for_cutover_at|completed_at)\b/i);
}

function replaceOnce(
  value: string,
  search: string | RegExp,
  replacement: string,
): string {
  const mutated = value.replace(search, replacement);
  expect(mutated).not.toBe(value);
  return mutated;
}

const runs = tableBody("organization_onboarding_completion_runs");
const results = tableBody("organization_onboarding_invitation_results");
const actor = functionBody(
  "private",
  "resolve_organization_onboarding_completion_actor",
);
const evidenceResolver = functionBody(
  "private",
  "resolve_organization_onboarding_invite_intent_evidence",
);
const persist = functionBody(
  "private",
  "persist_organization_onboarding_invite_intent_result",
);
const advance = functionBody(
  "private",
  "advance_organization_onboarding_completion_run",
);
const ensure = functionBody(
  "public",
  "ensure_organization_onboarding_completion_run",
);
const frozenList = functionBody(
  "public",
  "list_organization_onboarding_frozen_team_invite_intents",
);
const resultList = functionBody(
  "public",
  "list_organization_onboarding_invitation_results",
);
const execute = functionBody(
  "public",
  "execute_organization_onboarding_invite_intent",
);
const reconcile = functionBody(
  "public",
  "reconcile_organization_onboarding_invite_intent",
);
const createInvitation = functionBody(
  "public",
  "create_organization_invitation",
);
const resendInvitation = functionBody(
  "public",
  "resend_organization_invitation",
);
const acceptInvitation = functionBody(
  "public",
  "accept_organization_invitation",
);

describe("ENG-ONB-1H-P0-A migration identity and scope", () => {
  it("ships one completion-authority migration after Team intent authority", () => {
    expect(
      migrationFiles.filter((file) =>
        file.includes("onboarding_completion_authority"),
      ),
    ).toEqual([MIGRATION]);
    expect(MIGRATION.localeCompare(
      "20260907230410_create_onboarding_team_invite_intent_authority.sql",
    )).toBeGreaterThan(0);
    expect(sql).toMatch(/^-- ENG-ONB-1H-P0-A/);
    expect(sql.match(/create table public\./g)).toHaveLength(2);
  });

  it("does not implement completion, product cutover, delivery, or a batch operation", () => {
    expect(sql).not.toMatch(
      /update\s+public\.organizations[\s\S]{0,200}onboarding_completed_at/i,
    );
    expect(sql).not.toMatch(
      /insert into\s+private\.organization_invitation_delivery_attempts/i,
    );
    expect(sql).not.toMatch(
      /create or replace function public\.[^(]*(?:batch|bulk)[^(]*\(/i,
    );
    expect(sql).not.toContain(
      "record_organization_onboarding_invitation_result",
    );
    for (const legacyField of [
      "business_type",
      "primary_audience",
      "primary_offering",
      "primary_goal",
    ]) {
      expect(sql).not.toContain(legacyField);
    }
  });
});

describe("ENG-ONB-1H-P0-A durable table contracts", () => {
  it("creates the exact one-run-per-organization authority", () => {
    for (const column of [
      "organization_id uuid primary key",
      "status text not null",
      "started_at timestamptz not null",
      "updated_at timestamptz not null",
      "ready_for_cutover_at timestamptz",
      "completed_at timestamptz",
      "last_error_code text",
    ]) {
      expect(runs).toContain(column);
    }
    expect(runs).toMatch(
      /references public\.organizations \(id\) on delete cascade/i,
    );
    for (const status of [
      "setup_ready",
      "inviting",
      "invite_partial",
      "ready_for_cutover",
      "completed",
    ]) {
      expect(runs).toContain(`'${status}'`);
    }
    expect(runs).toMatch(
      /status = 'completed' and completed_at is not null/i,
    );
    expect(runs).toMatch(
      /status <> 'completed' and completed_at is null/i,
    );
  });

  it("creates one database-derived result per frozen intent", () => {
    for (const column of [
      "id uuid primary key default gen_random_uuid()",
      "organization_id uuid not null",
      "intent_id uuid not null",
      "email_normalized text not null",
      "target_role text not null",
      "invitation_id uuid",
      "result_code text not null default 'not_attempted'",
      "evidence_kind text not null default 'none'",
      "attempt_count integer not null default 0",
      "last_attempt_at timestamptz",
      "idempotency_key text not null",
      "created_at timestamptz not null",
      "updated_at timestamptz not null",
    ]) {
      expect(results).toContain(column);
    }
    expect(results).toContain("unique (organization_id, intent_id)");
    expect(results).toContain("unique (idempotency_key)");
    expect(results).toContain("check (attempt_count >= 0)");
    expect(results).toMatch(
      /check \(target_role in \('admin', 'staff', 'viewer'\)\)/i,
    );
    expect(results).not.toMatch(/target_role in \([^)]*'owner'/i);
  });

  it("binds results to the same organization, intent, and invitation", () => {
    expect(results).toMatch(
      /foreign key \(organization_id, intent_id\)[\s\S]*references public\.organization_onboarding_team_invite_intents \(\s*organization_id,\s*id\s*\)/i,
    );
    expect(results).toMatch(
      /foreign key \(organization_id, invitation_id\)[\s\S]*references public\.organization_invitations \(organization_id, id\)/i,
    );
    expect(results).toMatch(
      /idempotency_key =\s*'onboarding-invite\/' \|\| organization_id::text \|\| '\/' \|\| intent_id::text/i,
    );
  });

  it("uses exact result/evidence allowlists and cross-column proof", () => {
    const expectedCodes = [
      "not_attempted",
      "success",
      "invite_already_pending",
      "already_member",
      "existing_membership_requires_admin_action",
      "invalid_input",
      "forbidden",
      "rate_limited",
      "unexpected",
      "transport_error",
    ];
    const expectedEvidence = [
      "created_invitation",
      "pending_invitation",
      "active_membership",
      "membership_collision",
      "frozen_intent_invalid",
      "rate_limited",
      "none",
    ];
    const resultAllowlist = constraintBody(
      results,
      "organization_onboarding_invitation_results_result_code_check",
    );
    const evidenceAllowlist = constraintBody(
      results,
      "organization_onboarding_invitation_results_evidence_kind_check",
    );
    expect(quotedValues(resultAllowlist)).toEqual(expectedCodes);
    expect(quotedValues(evidenceAllowlist)).toEqual(expectedEvidence);

    const proof = constraintBody(
      results,
      "organization_onboarding_invitation_results_proof_check",
    );
    const pairings = [
      ["not_attempted", "none", "is null"],
      ["success", "created_invitation", "is not null"],
      ["invite_already_pending", "pending_invitation", "is not null"],
      ["already_member", "active_membership", "is null"],
      [
        "existing_membership_requires_admin_action",
        "membership_collision",
        "is null",
      ],
      ["invalid_input", "frozen_intent_invalid", "is null"],
      ["rate_limited", "rate_limited", "is null"],
    ] as const;
    for (const [code, evidence, invitationRequirement] of pairings) {
      const start = proof.indexOf(`result_code = '${code}'`);
      expect(start).toBeGreaterThan(-1);
      const next = proof.indexOf("\n    or (", start);
      const branch = proof.slice(start, next === -1 ? undefined : next);
      expect(branch).toContain(`evidence_kind = '${evidence}'`);
      expect(branch).toContain(`invitation_id ${invitationRequirement}`);
      expect(branch.match(/evidence_kind = '[^']+'/g)).toEqual([
        `evidence_kind = '${evidence}'`,
      ]);
    }
    const nonterminalStart = proof.indexOf(
      "result_code in ('forbidden', 'unexpected', 'transport_error')",
    );
    expect(nonterminalStart).toBeGreaterThan(-1);
    const nonterminal = proof.slice(nonterminalStart);
    expect(quotedValues(nonterminal).slice(0, 4)).toEqual([
      "forbidden",
      "unexpected",
      "transport_error",
      "none",
    ]);
    expect(nonterminal).toContain("invitation_id is null");
    expect(results).not.toMatch(/\braw_token\b|\btoken_hash\b/i);
  });
});

describe("ENG-ONB-1H-P0-A RLS and execution grants", () => {
  it("enables RLS and grants no table access to API or service roles", () => {
    for (const table of [
      "organization_onboarding_completion_runs",
      "organization_onboarding_invitation_results",
    ]) {
      expect(sql).toMatch(
        new RegExp(
          `alter table public\\.${table}\\s+enable row level security`,
          "i",
        ),
      );
      for (const role of ["public", "anon", "authenticated", "service_role"]) {
        expect(sql).toMatch(
          new RegExp(
            `revoke all on table public\\.${table}\\s+from ${role}`,
            "i",
          ),
        );
      }
      expect(sql).not.toMatch(
        new RegExp(`create policy[\\s\\S]*?on public\\.${table}`, "i"),
      );
      expect(sql).not.toMatch(
        new RegExp(
          `grant\\s+(?:all|select|insert|update|delete)\\s+on table public\\.${table}`,
          "i",
        ),
      );
    }
  });

  it("hardens all public completion RPCs to authenticated only", () => {
    for (const [name, signature] of [
      ["ensure_organization_onboarding_completion_run", "uuid"],
      ["list_organization_onboarding_frozen_team_invite_intents", "uuid"],
      ["list_organization_onboarding_invitation_results", "uuid"],
      ["execute_organization_onboarding_invite_intent", "uuid, uuid"],
      ["reconcile_organization_onboarding_invite_intent", "uuid, uuid"],
    ]) {
      const body = functionBody("public", name);
      expect(body).toMatch(/security definer\s+set search_path = ''/i);
      expect(sql).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}\\(${signature.replaceAll(".", "\\.")}\\)\\s+from public`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}\\(${signature.replaceAll(".", "\\.")}\\)\\s+from anon`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `revoke all on function public\\.${name}\\(${signature.replaceAll(".", "\\.")}\\)\\s+from service_role`,
          "i",
        ),
      );
      expect(sql).toMatch(
        new RegExp(
          `grant execute on function public\\.${name}\\(${signature.replaceAll(".", "\\.")}\\)\\s+to authenticated`,
          "i",
        ),
      );
    }
  });

  it("keeps proof persistence and run advancement private from every role", () => {
    for (const [name, signature] of [
      [
        "persist_organization_onboarding_invite_intent_result",
        "uuid, uuid, text, text, uuid, boolean",
      ],
      ["advance_organization_onboarding_completion_run", "uuid"],
    ]) {
      for (const role of ["public", "anon", "authenticated", "service_role"]) {
        expect(sql).toMatch(
          new RegExp(
            `revoke all on function private\\.${name}\\(${signature.replaceAll(".", "\\.")}\\)\\s+from ${role}`,
            "i",
          ),
        );
      }
    }
    expect(persist).toMatch(/security definer\s+set search_path = ''/i);
    expect(advance).toMatch(/security definer\s+set search_path = ''/i);
  });
});

describe("ENG-ONB-1H-P0-A owner, lifecycle, and replay authority", () => {
  const createdReuseStart = evidenceResolver.indexOf(
    "if found and v_result.result_code = 'success'",
  );
  const createdReuseEnd = evidenceResolver.indexOf(
    "if found and v_result.result_code = 'invite_already_pending'",
    createdReuseStart,
  );
  const createdReuse = evidenceResolver.slice(
    createdReuseStart,
    createdReuseEnd,
  );
  const createdAdvanceStart = advance.indexOf(
    "r.result_code = 'success'",
  );
  const createdAdvanceEnd = advance.indexOf(
    "r.result_code = 'invite_already_pending'",
    createdAdvanceStart,
  );
  const createdAdvance = advance.slice(
    createdAdvanceStart,
    createdAdvanceEnd,
  );

  it("re-resolves and locks the active Owner plus V2 Setup Ready organization", () => {
    expect(actor).toContain("v_user_id uuid := auth.uid()");
    expect(actor).toContain("om.organization_id = p_organization_id");
    expect(actor).toContain("om.user_id = v_user_id");
    expect(actor).toContain("om.status = 'active'");
    expect(actor).toContain("om.role = 'owner'");
    expect(actor).toContain("o.status = 'active'");
    expect(actor).toContain(
      "v_org.onboarding_flow_version is distinct from 2",
    );
    expect(actor).toContain("v_org.onboarding_setup_ready_at is null");
    expect(actor.match(/for update/g)).toHaveLength(2);
  });

  it("serializes all completion entry points with advisory key 872004", () => {
    for (const body of [
      ensure,
      frozenList,
      resultList,
      execute,
      reconcile,
    ]) {
      expect(body).toMatch(/pg_advisory_xact_lock\(\s*872004,/i);
      expect(body).toContain(
        "private.resolve_organization_onboarding_completion_actor",
      );
    }
  });

  it("ensures one run, preserves started_at, snapshots intents, and advances zero intents", () => {
    expect(ensure).toContain("values (p_organization_id, 'setup_ready')");
    expect(ensure).toContain(
      "on conflict (organization_id) do nothing",
    );
    expect(ensure).toContain(
      "on conflict (organization_id, intent_id) do nothing",
    );
    expect(ensure).toContain(
      "'onboarding-invite/' || i.organization_id::text || '/' || i.id::text",
    );
    expect(ensure).toContain(
      "private.advance_organization_onboarding_completion_run",
    );
    expect(ensure).not.toContain("create_organization_invitation");
    expect(advance).toContain("v_total = 0");
    expect(advance).toContain("v_status := 'ready_for_cutover'");
  });

  it("counts only durable terminal proof toward cutover", () => {
    for (const terminal of [
      "success",
      "invite_already_pending",
      "already_member",
      "existing_membership_requires_admin_action",
      "invalid_input",
    ]) {
      expect(advance).toContain(`r.result_code = '${terminal}'`);
    }
    for (const nonterminal of [
      "forbidden",
      "rate_limited",
      "unexpected",
      "transport_error",
    ]) {
      expect(advance).toContain(`'${nonterminal}'`);
    }
    expect(advance).toContain("v_proven_terminal = v_total");
    expect(advance).not.toContain(
      "elsif v_run.status = 'ready_for_cutover'",
    );
    expect(advance).toMatch(
      /when v_status = 'ready_for_cutover'\s+then coalesce\(r\.ready_for_cutover_at, v_now\)\s+else r\.ready_for_cutover_at/i,
    );
    expect(advance).not.toMatch(
      /v_proven_terminal[\s\S]{0,200}(?:forbidden|rate_limited|unexpected|transport_error)/i,
    );
  });

  it("rejects expired created-invitation proof in reuse and advancement", () => {
    expect(createdReuseStart).toBeGreaterThan(-1);
    expect(createdAdvanceStart).toBeGreaterThan(-1);
    expect(createdReuse).toContain("oi.expires_at > pg_catalog.now()");
    expect(createdAdvance).toContain("oi.expires_at > pg_catalog.now()");
  });

  it("rejects accepted or otherwise non-pending created-invitation proof", () => {
    expect(createdReuse).toContain("oi.status = 'pending'");
    expect(createdAdvance).toContain("oi.status = 'pending'");
    expect(createdReuse).not.toMatch(/oi\.status\s*=\s*'accepted'/i);
    expect(createdAdvance).not.toMatch(/oi\.status\s*=\s*'accepted'/i);
  });

  it("rejects revoked created-invitation proof", () => {
    expect(createdReuse).toContain("oi.status = 'pending'");
    expect(createdAdvance).toContain("oi.status = 'pending'");
    expect(createdReuse).not.toMatch(/oi\.status\s*=\s*'revoked'/i);
    expect(createdAdvance).not.toMatch(/oi\.status\s*=\s*'revoked'/i);
  });

  it("falls back from stale created proof to matching active membership", () => {
    const activeMembership = evidenceResolver.indexOf(
      "if v_membership_status = 'active' then",
    );
    expect(activeMembership).toBeGreaterThan(createdReuseEnd);
    expect(evidenceResolver.slice(activeMembership)).toContain(
      "select 'already_member'::text, 'active_membership'::text, null::uuid",
    );
  });

  it("cannot preserve readiness through stale created-invitation proof", () => {
    expect(createdAdvance).toContain("oi.status = 'pending'");
    expect(createdAdvance).toContain("oi.expires_at > pg_catalog.now()");
    expect(advance).toContain("v_proven_terminal = v_total");
    expect(advance).not.toContain(
      "elsif v_run.status = 'ready_for_cutover'",
    );
  });
});

describe("ENG-ONB-1H-P0-A individual execute and reconcile", () => {
  it("accepts no caller-controlled result, invitation, email, role, or key", () => {
    for (const [name, expected] of [
      ["ensure_organization_onboarding_completion_run", 1],
      ["list_organization_onboarding_frozen_team_invite_intents", 1],
      ["list_organization_onboarding_invitation_results", 1],
      ["execute_organization_onboarding_invite_intent", 2],
      ["reconcile_organization_onboarding_invite_intent", 2],
    ] as const) {
      const start = sql.indexOf(
        `create or replace function public.${name}`,
      );
      const signature = sql.slice(start, sql.indexOf("returns jsonb", start));
      expect(signature.match(/\bp_[a-z_]+\s+uuid\b/g)).toHaveLength(expected);
      expect(signature).not.toMatch(
        /p_(?:result|evidence|invitation|email|role|idempotency|status)/i,
      );
    }
    expect(execute).toContain(
      "v_intent.email_normalized",
    );
    expect(execute).toContain("v_intent.role");
  });

  it("executes one frozen intent, verifies invitation proof, and exposes fresh raw token transiently", () => {
    expect(execute).toContain(
      "from public.create_organization_invitation(",
    );
    expect(execute).toContain(
      "oi.organization_id = p_organization_id",
    );
    expect(execute).toContain(
      "oi.email_normalized = v_intent.email_normalized",
    );
    expect(execute).toContain("oi.role = v_intent.role");
    expect(execute).toContain("oi.status = 'pending'");
    expect(execute).toContain(
      "private.persist_organization_onboarding_invite_intent_result",
    );
    expect(execute).toContain(
      "private.advance_organization_onboarding_completion_run",
    );
    expect(execute).toMatch(
      /'raw_token', case\s+when v_create_code = 'success' then v_raw_token\s+else null/i,
    );
  });

  it("reconciles durable facts without create, rate consumption, or raw-token reconstruction", () => {
    expect(reconcile).toContain(
      "private.resolve_organization_onboarding_invite_intent_evidence",
    );
    expect(reconcile).toContain(
      "private.persist_organization_onboarding_invite_intent_result",
    );
    expect(reconcile).not.toContain("create_organization_invitation");
    expect(reconcile).not.toContain(
      "consume_organization_invitation_mutation_rate_limit",
    );
    expect(reconcile).not.toContain("raw_token");
  });

  it("keeps the post-ready frozen list deterministic and read-only without redefining the pre-ready list", () => {
    expect(frozenList).toContain("i.organization_id = p_organization_id");
    expect(frozenList).toContain("order by i.created_at, i.id");
    expect(frozenList).not.toMatch(
      /(?:insert into|update|delete from)\s+public\./i,
    );
    expect(sql).not.toContain(
      "create or replace function public.list_organization_onboarding_team_invite_intents",
    );
  });
});

describe("ENG-ONB-1H-P0-A direct invitation lifecycle boundary", () => {
  it("denies direct V2 create and resend before Setup Ready without changing V1/NULL", () => {
    for (const body of [createInvitation, resendInvitation]) {
      expect(body).toContain(
        "select o.onboarding_flow_version, o.onboarding_setup_ready_at",
      );
      expect(body).toContain(
        "if v_flow_version = 2 and v_setup_ready_at is null then",
      );
      expect(body).toContain("'setup_not_ready'::text");
      expect(body).not.toMatch(
        /v_flow_version (?:is distinct from|<>|!=) 2/i,
      );
    }
  });

  it("denies V2 acceptance opaquely before Setup Ready", () => {
    expect(acceptInvitation).toContain(
      "select o.onboarding_flow_version, o.onboarding_setup_ready_at",
    );
    expect(acceptInvitation).toContain(
      "if found and v_flow_version = 2 and v_setup_ready_at is null then",
    );
    expect(acceptInvitation).toContain(
      "'invite_not_found_or_unavailable'::text",
    );
    expect(acceptInvitation).not.toContain("'setup_not_ready'::text");
  });

  it("preserves individual cores, role validation, pending uniqueness, and service-role revocation", () => {
    expect(sql).toContain(
      "rename to create_organization_invitation_core",
    );
    expect(sql).toContain(
      "rename to resend_organization_invitation_core",
    );
    expect(sql).toContain(
      "rename to accept_organization_invitation_core",
    );
    expect(execute).toContain(
      "from public.create_organization_invitation(",
    );
    expect(results).toMatch(
      /check \(target_role in \('admin', 'staff', 'viewer'\)\)/i,
    );
    expect(sql).not.toMatch(/grant\s+execute[\s\S]{0,200}service_role/i);
  });
});

describe("ENG-ONB-1H-P0-B4 forward stale-proof reconciliation", () => {
  const forwardPersist = forwardFunctionBody(
    "private",
    "persist_organization_onboarding_invite_intent_result",
  );
  const forwardReconcile = forwardFunctionBody(
    "public",
    "reconcile_organization_onboarding_invite_intent",
  );
  const forwardProof = (() => {
    const marker =
      "add constraint organization_onboarding_invitation_results_proof_check";
    const start = forwardSql.indexOf(marker);
    expect(start).toBeGreaterThan(-1);
    const end = forwardSql.indexOf("comment on column", start);
    expect(end).toBeGreaterThan(start);
    return forwardSql.slice(start, end);
  })();
  const currentEvidenceStart = forwardReconcile.indexOf(
    "if v_evidence.result_code is not null then",
  );
  const staleBranchStart = forwardReconcile.indexOf(
    "elsif v_existing.id is not null",
    currentEvidenceStart,
  );
  const staleBranchEnd = forwardReconcile.indexOf(
    "\n  else",
    staleBranchStart,
  );
  const currentEvidenceBranch = forwardReconcile.slice(
    currentEvidenceStart,
    staleBranchStart,
  );
  const staleBranch = forwardReconcile.slice(
    staleBranchStart,
    staleBranchEnd,
  );
  const proofLostStart = forwardPersist.indexOf(
    "elsif p_result_code = 'invitation_proof_lost'",
  );
  const proofLostEnd = forwardPersist.indexOf(
    "elsif p_result_code = 'rate_limited'",
    proofLostStart,
  );
  const proofLostPersist = forwardPersist.slice(
    proofLostStart,
    proofLostEnd,
  );
  const terminalCountStart = advance.indexOf(
    "select pg_catalog.count(*)::integer",
    advance.indexOf("into v_total"),
  );
  const terminalCountEnd = advance.indexOf(
    "select\n    pg_catalog.count(*) filter",
    terminalCountStart,
  );
  const terminalCount = advance.slice(
    terminalCountStart,
    terminalCountEnd,
  );
  const pendingProofStart = evidenceResolver.indexOf(
    "if found and v_result.result_code = 'invite_already_pending'",
  );
  const pendingProofEnd = evidenceResolver.indexOf(
    "\n  select om.status",
    pendingProofStart,
  );
  const pendingProofBranch = evidenceResolver.slice(
    pendingProofStart,
    pendingProofEnd,
  );

  it("pins exact forward ordering and leaves the applied migration unchanged modulo CRLF/LF representation", () => {
    expect(
      migrationFiles
        .filter((file) => file === MIGRATION || file === FORWARD_MIGRATION)
        .sort(),
    ).toEqual([MIGRATION, FORWARD_MIGRATION]);
    expect(normalizedMigrationSha256(sql)).toBe(
      ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
    );
    expect(forwardSql).toMatch(/^-- ENG-ONB-1H-P0-B4:/);
    expect(sql).not.toContain("'invitation_proof_lost'");
    expect(sql).not.toContain("'historical_invitation'");
  });

  it("replaces only the intended exact function signatures and adds no batch RPC", () => {
    const createdFunctions = [
      ...forwardSql.matchAll(
        /create or replace function (private|public)\.([a-z_]+)\s*\(([\s\S]*?)\)\s*returns/gi,
      ),
    ].map((match) => ({
      schema: match[1],
      name: match[2],
      parameters: match[3]!.replace(/\s+/g, " ").trim(),
    }));

    expect(createdFunctions).toEqual([
      {
        schema: "private",
        name: "persist_organization_onboarding_invite_intent_result",
        parameters:
          "p_organization_id uuid, p_intent_id uuid, p_result_code text, p_evidence_kind text, p_invitation_id uuid, p_increment_attempt boolean default true",
      },
      {
        schema: "public",
        name: "reconcile_organization_onboarding_invite_intent",
        parameters: "p_organization_id uuid, p_intent_id uuid",
      },
    ]);
    expect(forwardSql).not.toMatch(
      /create or replace function public\.[^(]*(?:batch|bulk)[^(]*\(/i,
    );
  });

  it("defines the exact historical pair while retaining every previous valid pair", () => {
    const historicalStart = forwardProof.indexOf(
      "result_code = 'invitation_proof_lost'",
    );
    const historicalEnd = forwardProof.indexOf(
      "\n      or (",
      historicalStart,
    );
    const historical = forwardProof.slice(
      historicalStart,
      historicalEnd,
    );
    expect(historical).toMatch(
      /result_code = 'invitation_proof_lost'\s+and evidence_kind = 'historical_invitation'\s+and invitation_id is not null\s+and attempt_count > 0/i,
    );
    expect(
      historical.match(/evidence_kind = '[^']+'/g),
    ).toEqual(["evidence_kind = 'historical_invitation'"]);
    for (const forbiddenEvidence of [
      "active_membership",
      "created_invitation",
      "pending_invitation",
      "none",
    ]) {
      expect(historical).not.toContain(`'${forbiddenEvidence}'`);
    }

    for (const [code, evidence] of [
      ["not_attempted", "none"],
      ["success", "created_invitation"],
      ["invite_already_pending", "pending_invitation"],
      ["already_member", "active_membership"],
      [
        "existing_membership_requires_admin_action",
        "membership_collision",
      ],
      ["invalid_input", "frozen_intent_invalid"],
      ["rate_limited", "rate_limited"],
    ]) {
      expect(forwardProof).toMatch(
        new RegExp(
          `result_code = '${code}'\\s+and evidence_kind = '${evidence}'`,
          "i",
        ),
      );
    }
  });

  it("links positive historical attempts to the unchanged attempt-timestamp constraint", () => {
    const attemptTimestamp = constraintBody(
      results,
      "organization_onboarding_invitation_results_attempt_timestamp_check",
    );
    expect(attemptTimestamp).toMatch(
      /attempt_count > 0 and last_attempt_at is not null/i,
    );
    expect(forwardProof).toContain("attempt_count > 0");
    expect(forwardSql).not.toMatch(
      /drop constraint organization_onboarding_invitation_results_attempt_timestamp_check/i,
    );
  });

  it("statically converts stale created proof without retaining its terminal label", () => {
    expect(currentEvidenceStart).toBeGreaterThan(-1);
    expect(staleBranchStart).toBeGreaterThan(currentEvidenceStart);
    expect(staleBranch).toContain("v_existing.result_code = 'success'");
    expect(staleBranch).toContain(
      "v_existing.evidence_kind = 'created_invitation'",
    );
    expect(staleBranch).toMatch(
      /persist_organization_onboarding_invite_intent_result\(\s*p_organization_id,\s*p_intent_id,\s*'invitation_proof_lost',\s*'historical_invitation',\s*v_existing\.invitation_id,\s*false\s*\)/i,
    );
    expect(staleBranch).not.toContain("v_result := v_existing");
    const persistCall = forwardReconcile.indexOf(
      "'invitation_proof_lost'",
      staleBranchStart,
    );
    const advanceCall = forwardReconcile.indexOf(
      "private.advance_organization_onboarding_completion_run",
      persistCall,
    );
    expect(advanceCall).toBeGreaterThan(persistCall);
  });

  it("separately converts stale pending proof through the same historical branch", () => {
    const pendingStart = staleBranch.indexOf(
      "v_existing.result_code = 'invite_already_pending'",
    );
    expect(pendingStart).toBeGreaterThan(-1);
    const pendingCondition = staleBranch.slice(
      pendingStart,
      staleBranch.indexOf(") then", pendingStart),
    );
    expect(pendingCondition).toContain(
      "v_existing.evidence_kind = 'pending_invitation'",
    );
    expect(staleBranch).toContain(
      "'invitation_proof_lost'",
    );
    expect(staleBranch).toContain("'historical_invitation'");
    expect(staleBranch).not.toContain("v_result := v_existing");
  });

  it("isolates the complete pending-proof validity branch from created proof", () => {
    expect(pendingProofStart).toBeGreaterThan(-1);
    expect(pendingProofEnd).toBeGreaterThan(pendingProofStart);
    assertPendingProofContract(pendingProofBranch);
    expect(pendingProofBranch).not.toContain(
      "v_result.result_code = 'success'",
    );
    expect(pendingProofBranch).not.toContain("'created_invitation'");
  });

  it("rejects pending-proof status and expiry predicate mutations", () => {
    const withoutStatus = replaceOnce(
      pendingProofBranch,
      /\s+and oi\.status = 'pending'/i,
      "",
    );
    const withoutExpiry = replaceOnce(
      pendingProofBranch,
      /\s+and oi\.expires_at > pg_catalog\.now\(\)/i,
      "",
    );

    expect(() => assertPendingProofContract(withoutStatus)).toThrow();
    expect(() => assertPendingProofContract(withoutExpiry)).toThrow();
  });

  it.each(["accepted", "revoked"])(
    "rejects pending proof that also permits %s status",
    (status) => {
      const mutated = replaceOnce(
        pendingProofBranch,
        "and oi.status = 'pending'",
        `and (oi.status = 'pending' or oi.status = '${status}')`,
      );
      expect(() => assertPendingProofContract(mutated)).toThrow();
    },
  );

  it.each([
    "where oi.organization_id = p_organization_id",
    "and oi.id = v_result.invitation_id",
    "and oi.email_normalized = v_intent.email_normalized",
    "and oi.role = v_intent.role",
  ])("rejects pending proof with removed identity predicate: %s", (predicate) => {
    const mutated = replaceOnce(pendingProofBranch, predicate, "");
    expect(() => assertPendingProofContract(mutated)).toThrow();
  });

  it("proves historical persistence only for previously invitation-backed stale proof", () => {
    expect(proofLostPersist).toMatch(
      /prior\.result_code = 'success'\s+and prior\.evidence_kind = 'created_invitation'/i,
    );
    expect(proofLostPersist).toMatch(
      /prior\.result_code = 'invite_already_pending'\s+and prior\.evidence_kind = 'pending_invitation'/i,
    );
    expect(proofLostPersist).toContain(
      "prior.invitation_id = p_invitation_id",
    );
    expect(proofLostPersist).toMatch(
      /not \(\s*oi\.email_normalized = v_intent\.email_normalized\s+and oi\.role = v_intent\.role\s+and oi\.status = 'pending'\s+and oi\.expires_at > v_now\s*\)/i,
    );
  });

  it("gives current evidence precedence in the new reconcile function", () => {
    expect(currentEvidenceStart).toBeGreaterThan(-1);
    expect(staleBranchStart).toBeGreaterThan(currentEvidenceStart);
    expect(currentEvidenceBranch).toMatch(
      /persist_organization_onboarding_invite_intent_result\(\s*p_organization_id,\s*p_intent_id,\s*v_evidence\.result_code,\s*v_evidence\.evidence_kind,\s*v_evidence\.invitation_id,\s*false\s*\)/i,
    );
    expect(currentEvidenceBranch).not.toContain(
      "'invitation_proof_lost'",
    );
  });

  it("labels original resolver assertions: active membership is same-org and email-matched", () => {
    const membershipQueryStart = evidenceResolver.indexOf(
      "select om.status",
    );
    const activeResultEnd = evidenceResolver.indexOf(
      "if v_membership_status in",
      membershipQueryStart,
    );
    const activeMembership = evidenceResolver.slice(
      membershipQueryStart,
      activeResultEnd,
    );
    expect(activeMembership).toContain(
      "om.organization_id = p_organization_id",
    );
    expect(activeMembership).toContain(
      "private.normalize_onboarding_team_invite_intent_email(u.email)",
    );
    expect(activeMembership).toContain(
      "= v_intent.email_normalized",
    );
    expect(activeMembership).toContain(
      "if v_membership_status = 'active' then",
    );
    expect(activeMembership).toContain(
      "select 'already_member'::text, 'active_membership'::text, null::uuid",
    );
  });

  it("labels original resolver assertions: non-active membership remains collision evidence", () => {
    const collisionStart = evidenceResolver.indexOf(
      "if v_membership_status in ('invited', 'suspended', 'removed') then",
    );
    const collisionEnd = evidenceResolver.indexOf(
      "select oi.id",
      collisionStart,
    );
    const collision = evidenceResolver.slice(
      collisionStart,
      collisionEnd,
    );
    expect(collision).toContain(
      "'existing_membership_requires_admin_action'::text",
    );
    expect(collision).toContain("'membership_collision'::text");
    expect(collision).toContain("null::uuid");
    expect(collision).not.toContain("'active_membership'");
  });

  it("requires absence of same-org matching membership before historical persistence", () => {
    expect(proofLostPersist).toContain(
      "om.organization_id = p_organization_id",
    );
    expect(proofLostPersist).toContain(
      "private.normalize_onboarding_team_invite_intent_email(u.email)",
    );
    expect(proofLostPersist).toContain(
      "= v_intent.email_normalized",
    );
    expect(proofLostPersist).toContain(
      "om.status in ('active', 'invited', 'suspended', 'removed')",
    );
  });

  it("removes invitation evidence when current active-membership evidence wins", () => {
    const activeStart = evidenceResolver.indexOf(
      "if v_membership_status = 'active' then",
    );
    const activeEnd = evidenceResolver.indexOf(
      "if v_membership_status in",
      activeStart,
    );
    const activeResult = evidenceResolver.slice(activeStart, activeEnd);
    expect(activeResult).toContain(
      "select 'already_member'::text, 'active_membership'::text, null::uuid",
    );
    expect(currentEvidenceBranch).toContain(
      "v_evidence.invitation_id",
    );
  });

  it("requires absence of a current matching replacement invitation", () => {
    expect(proofLostPersist.match(/and not exists \(/g)).toHaveLength(2);
    expect(proofLostPersist).toContain(
      "current_invitation.status = 'pending'",
    );
    expect(proofLostPersist).toContain(
      "current_invitation.expires_at > v_now",
    );
    expect(proofLostPersist).toContain(
      "current_invitation.email_normalized = v_intent.email_normalized",
    );
    expect(proofLostPersist).toContain(
      "current_invitation.role = v_intent.role",
    );
  });

  it("mutation-resistently excludes historical evidence from terminal counting", () => {
    expect(
      [...terminalCount.matchAll(/r\.result_code = '([^']+)'/g)].map(
        (match) => match[1],
      ),
    ).toEqual([
      "success",
      "invite_already_pending",
      "already_member",
      "existing_membership_requires_admin_action",
      "invalid_input",
    ]);
    expect(
      [...terminalCount.matchAll(/r\.evidence_kind = '([^']+)'/g)].map(
        (match) => match[1],
      ),
    ).toEqual([
      "created_invitation",
      "pending_invitation",
      "active_membership",
      "membership_collision",
      "frozen_intent_invalid",
    ]);
    expect(terminalCount).not.toContain("'historical_invitation'");
    expect(terminalCount).not.toContain("'invitation_proof_lost'");
  });

  it("statically links historical conversion to downgrade and current-proof re-entry", () => {
    expect(staleBranch).toContain("'historical_invitation'");
    expect(forwardReconcile.indexOf(
      "private.advance_organization_onboarding_completion_run",
      staleBranchEnd,
    )).toBeGreaterThan(staleBranchEnd);
    expect(currentEvidenceStart).toBeLessThan(staleBranchStart);
    for (const currentProofGuard of [
      "oi.status = 'pending'",
      "oi.expires_at > pg_catalog.now()",
      "if v_membership_status = 'active' then",
    ]) {
      expect(evidenceResolver).toContain(currentProofGuard);
    }
    expect(advance).toContain("v_proven_terminal = v_total");
  });

  it("statically preserves completed terminal behavior without claiming result immutability", () => {
    expect(advance).toMatch(
      /if v_run\.status = 'completed' then\s+return v_run;/i,
    );
    expect(advance).not.toContain("v_status := 'completed'");
    expect(advance).toMatch(
      /when v_status = 'ready_for_cutover'\s+then coalesce\(r\.ready_for_cutover_at, v_now\)\s+else r\.ready_for_cutover_at/i,
    );
    expect(execute).not.toMatch(/\bcompleted_at\s*=/i);
    expect(reconcile).not.toMatch(/\bcompleted_at\s*=/i);
  });

  it("binds true and false to complete count and timestamp CASE expressions", () => {
    assertForwardPersistenceContract(forwardPersist);
    assertStaleProofUsesPreservation(staleBranch);
  });

  it("rejects swapped or incrementing false attempt-count branches", () => {
    const swapped = replaceOnce(
      forwardPersist,
      ATTEMPT_COUNT_PRESERVATION_CASE,
      `attempt_count = case
      when coalesce(p_increment_attempt, true)
        then greatest(
          public.organization_onboarding_invitation_results.attempt_count,
          1
        )
      else public.organization_onboarding_invitation_results.attempt_count + 1
    end,`,
    );
    const falseIncrements = replaceOnce(
      forwardPersist,
      ATTEMPT_COUNT_PRESERVATION_CASE,
      `attempt_count = case
      when coalesce(p_increment_attempt, true)
        then public.organization_onboarding_invitation_results.attempt_count + 1
      else public.organization_onboarding_invitation_results.attempt_count + 1
    end,`,
    );

    expect(() => assertForwardPersistenceContract(swapped)).toThrow();
    expect(() => assertForwardPersistenceContract(falseIncrements)).toThrow();
  });

  it("rejects swapped or current-time false timestamp branches", () => {
    const swapped = replaceOnce(
      forwardPersist,
      LAST_ATTEMPT_PRESERVATION_CASE,
      `last_attempt_at = case
      when coalesce(p_increment_attempt, true)
        then coalesce(
          public.organization_onboarding_invitation_results.last_attempt_at,
          v_now
        )
      else v_now
    end,`,
    );
    const falseWritesNow = replaceOnce(
      forwardPersist,
      LAST_ATTEMPT_PRESERVATION_CASE,
      `last_attempt_at = case
      when coalesce(p_increment_attempt, true)
        then v_now
      else v_now
    end,`,
    );

    expect(() => assertForwardPersistenceContract(swapped)).toThrow();
    expect(() => assertForwardPersistenceContract(falseWritesNow)).toThrow();
  });

  it("rejects changing the stale historical persistence argument to true", () => {
    const mutated = replaceOnce(
      staleBranch,
      STALE_PROOF_PRESERVATION_CALL,
      `private.persist_organization_onboarding_invite_intent_result(
        p_organization_id,
        p_intent_id,
        'invitation_proof_lost',
        'historical_invitation',
        v_existing.invitation_id,
        true
      )`,
    );
    expect(() => assertStaleProofUsesPreservation(mutated)).toThrow();
  });

  it("does not rewrite an already-historical row as another attempt", () => {
    expect(staleBranch).not.toContain("'invitation_proof_lost' =");
    expect(staleBranch).not.toContain(
      "v_existing.result_code = 'invitation_proof_lost'",
    );
    const finalElse = forwardReconcile.slice(staleBranchEnd);
    expect(finalElse).toMatch(
      /else\s+v_result := v_existing;\s+end if;/i,
    );
    expect(staleBranch).toContain("false");
  });

  it("allowlists governed application calls and denies every invitation side effect", () => {
    assertReconcileSideEffectBoundary(forwardReconcile);
  });

  it.each([
    "public.resolve_organization_invitation_delivery_attempt(null, null, null, null, null)",
    "public.complete_organization_invitation_delivery_attempt(null, null, null, null, null)",
  ])("rejects inserted delivery helper call: %s", (call) => {
    const mutated = replaceOnce(
      forwardReconcile,
      /\r?\nend;\r?\n\$\$;$/,
      `\n  perform ${call};\nend;\n$$;`,
    );
    expect(() => assertReconcileSideEffectBoundary(mutated)).toThrow();
  });

  it("prohibits every forward reference to completion timestamps", () => {
    assertNoForwardCompletionTimestampReference(forwardSql);
  });

  it.each([
    [
      "ready update",
      "update public.organization_onboarding_completion_runs\nset ready_for_cutover_at = pg_catalog.now();",
    ],
    [
      "completed update",
      "update public.organization_onboarding_completion_runs as run\nset run.completed_at = pg_catalog.now();",
    ],
    [
      "ready insert",
      "insert into public.organization_onboarding_completion_runs (\n  organization_id,\n  ready_for_cutover_at\n) values (null, pg_catalog.now());",
    ],
    [
      "completed insert",
      "insert into public.organization_onboarding_completion_runs\n(\n  organization_id,\n  completed_at\n)\nvalues (null, pg_catalog.now());",
    ],
  ])("rejects forward completion timestamp mutation: %s", (_name, mutation) => {
    expect(() =>
      assertNoForwardCompletionTimestampReference(`${forwardSql}\n${mutation}`),
    ).toThrow();
  });

  it("retains organization-scoped locking and governed Owner authority", () => {
    expect(forwardReconcile).toMatch(
      /pg_advisory_xact_lock\(\s*872004,\s*pg_catalog\.hashtext\(coalesce\(p_organization_id::text, ''\)\)\s*\)/i,
    );
    expect(forwardReconcile).not.toContain(
      "private.create_organization_invitation_core",
    );
    expect(forwardReconcile).toContain(
      "private.resolve_organization_onboarding_completion_actor",
    );
    expect(actor).toContain("om.role = 'owner'");
    expect(actor).toContain("om.status = 'active'");
    expect(actor).toContain(
      "v_org.onboarding_flow_version is distinct from 2",
    );
    expect(actor).toContain(
      "v_org.onboarding_setup_ready_at is null",
    );
  });

  it("documents the static-versus-runtime boundary in the regression suite", () => {
    expect(forwardSql).toContain(
      "This state is non-terminal and preserves attempt history.",
    );
    expect(forwardReconcile).toContain(
      "private.resolve_organization_onboarding_invite_intent_evidence",
    );
    // These assertions prove SQL composition only. PostgreSQL execution,
    // transitions, concurrency, ACL catalogs, and CHECK validation require
    // an independent review followed by an authorized local apply in a later
    // runtime-verification phase.
  });
});

describe("ENG-ONB-1H-P0-B4 cross-platform migration checksum authority", () => {
  const canonicalLf = normalizeMigrationLineEndings(sql);
  const crlfRepresentation = canonicalLf.replace(/\n/g, "\r\n");

  it("pins the canonical LF representation of the applied migration", () => {
    expect(canonicalLf).not.toContain("\r");
    expect(normalizedMigrationSha256(canonicalLf)).toBe(
      ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
    );
  });

  it("accepts the CRLF representation of identical SQL content", () => {
    expect(crlfRepresentation).not.toBe(canonicalLf);
    expect(crlfRepresentation).toContain("\r\n");
    expect(normalizedMigrationSha256(crlfRepresentation)).toBe(
      ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
    );
  });

  it("normalizes already-normalized SQL idempotently", () => {
    expect(normalizeMigrationLineEndings(canonicalLf)).toBe(canonicalLf);
    expect(
      normalizeMigrationLineEndings(
        normalizeMigrationLineEndings(crlfRepresentation),
      ),
    ).toBe(canonicalLf);
  });

  it("pins the checked-out worktree SQL whatever its line endings are", () => {
    expect(normalizedMigrationSha256(sql)).toBe(
      ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
    );
  });

  it("still rejects a changed SQL keyword or governed identifier", () => {
    const changedKeyword = replaceOnce(
      canonicalLf,
      "create table public.",
      "create unlogged table public.",
    );
    const changedIdentifier = replaceOnce(
      canonicalLf,
      "organization_onboarding_completion_runs",
      "organization_onboarding_completion_run",
    );

    for (const mutated of [changedKeyword, changedIdentifier]) {
      expect(normalizedMigrationSha256(mutated)).not.toBe(
        ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
      );
    }
  });

  it("still rejects one inserted or removed non-newline character", () => {
    const inserted = `${canonicalLf.slice(0, 1)} ${canonicalLf.slice(1)}`;
    const removed = canonicalLf.slice(1);
    expect(inserted).toHaveLength(canonicalLf.length + 1);
    expect(removed).toHaveLength(canonicalLf.length - 1);

    for (const mutated of [inserted, removed]) {
      expect(normalizedMigrationSha256(mutated)).not.toBe(
        ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
      );
    }
  });

  it("still rejects an added or removed final newline", () => {
    expect(canonicalLf.endsWith("\n")).toBe(true);
    const addedFinalNewline = `${canonicalLf}\n`;
    const removedFinalNewline = canonicalLf.slice(0, -1);

    for (const mutated of [addedFinalNewline, removedFinalNewline]) {
      expect(normalizedMigrationSha256(mutated)).not.toBe(
        ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
      );
    }
  });

  it("still rejects an inserted lone CR", () => {
    const mutated = `${canonicalLf.slice(0, 1)}\r${canonicalLf.slice(1)}`;
    expect(mutated).not.toContain("\r\n");
    expect(normalizedMigrationSha256(mutated)).not.toBe(
      ORIGINAL_MIGRATION_NORMALIZED_LF_SHA256,
    );
  });
});
