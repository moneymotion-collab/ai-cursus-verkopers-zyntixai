import { createHash } from "node:crypto";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const MIGRATION =
  "20260911144302_complete_onboarding_requires_current_ready_authority.sql";
const ORIGINAL_TRANSITION =
  "20260907140829_onboarding_v2_transition_authority.sql";
const ORIGINAL_COMPLETION =
  "20260908111356_onboarding_completion_authority.sql";
const FORWARD_RECONCILE =
  "20260908131955_reconcile_stale_onboarding_invitation_proof.sql";

const ORIGINAL_TRANSITION_SHA256 =
  "8D9B05FC09BC1DB9EA7B0C2AB6C909910D6B04661E75175133692C4227CF9BFF";
const ORIGINAL_COMPLETION_SHA256 =
  "D86E0B4D72F7D1D9B83571E87723ACAC0649EC9EFE1B501EE1D9BD808F2A1796";
const ORIGINAL_RECONCILE_SHA256 =
  "52A041953918A621A88D30C41EFD70AB5167AC303DAED12488BD623181CEFEE3";

const sql = readFileSync(
  join(process.cwd(), "supabase/migrations", MIGRATION),
  "utf8",
);
const originalCompleteSql = readFileSync(
  join(process.cwd(), "supabase/migrations", ORIGINAL_TRANSITION),
  "utf8",
);
const originalCompletionSql = readFileSync(
  join(process.cwd(), "supabase/migrations", ORIGINAL_COMPLETION),
  "utf8",
);
const originalReconcileSql = readFileSync(
  join(process.cwd(), "supabase/migrations", FORWARD_RECONCILE),
  "utf8",
);
const migrationFiles = readdirSync(join(process.cwd(), "supabase/migrations"));

function normalizeMigrationLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n");
}

function functionBody(value: string, name: string): string {
  const marker = `create or replace function public.${name}`;
  const start = value.indexOf(marker);
  expect(start).toBeGreaterThan(-1);
  const grant =
    "grant execute on function public.complete_organization_v2_onboarding(uuid) to authenticated;";
  const grantAt = value.indexOf(grant, start);
  expect(grantAt).toBeGreaterThan(start);
  return value.slice(start, grantAt + grant.length);
}

function executableBody(body: string): string {
  const start = body.indexOf("as $$");
  expect(start).toBeGreaterThan(-1);
  return body.slice(start + "as $$".length);
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

const complete = functionBody(sql, "complete_organization_v2_onboarding");
const executable = executableBody(complete);
const originalComplete = functionBody(
  originalCompleteSql,
  "complete_organization_v2_onboarding",
);

function assertReadyGateContract(body: string): void {
  expect(body).toMatch(
    /create or replace function public\.complete_organization_v2_onboarding\(\s*p_organization_id uuid\s*\)\s*returns jsonb/i,
  );
  expect(body).toMatch(/security definer\s+set search_path = ''/i);
  expect(body).toContain("v_user_id := auth.uid()");
  expect(body).toContain("om.role = 'owner'");
  expect(body).toContain("om.status = 'active'");
  expect(body).toMatch(
    /pg_advisory_xact_lock\(\s*872002,\s*pg_catalog\.hashtext\(p_organization_id::text\)/,
  );
  expect(body).toMatch(
    /pg_advisory_xact_lock\(\s*872004,\s*pg_catalog\.hashtext\(coalesce\(p_organization_id::text, ''\)\)/,
  );
  expect(body).toContain("organization_onboarding_completion_runs");
  expect(body).toContain("'NOT_READY'");
  expect(body).toContain("ready_for_cutover");
  expect(body).toContain(
    "private.resolve_organization_onboarding_invite_intent_evidence",
  );
  expect(body).toContain(
    "private.persist_organization_onboarding_invite_intent_result",
  );
  expect(body).toContain(
    "private.advance_organization_onboarding_completion_run",
  );
  expect(body).toContain("'invitation_proof_lost'");
  expect(body).toContain("'historical_invitation'");
  expect(body).not.toContain("invite_partial");
  expect(body).not.toContain("'inviting'");
  expect(body).toContain("status = 'completed'");
  expect(body).toContain("completed_at = v_completed_at");
  expect(body).toContain("set onboarding_completed_at = v_completed_at");
  expect(body).not.toMatch(/set\s+ready_for_cutover_at/i);
  expect(body).not.toMatch(/set\s+onboarding_setup_ready_at/i);
  expect(body).toContain("v_completed_at := pg_catalog.now()");
  expect(body).toMatch(
    /revoke all on function public\.complete_organization_v2_onboarding\(uuid\) from public/i,
  );
  expect(body).toMatch(
    /revoke all on function public\.complete_organization_v2_onboarding\(uuid\) from anon/i,
  );
  expect(body).toMatch(
    /grant execute on function public\.complete_organization_v2_onboarding\(uuid\) to authenticated/i,
  );
}

function assertDecisionBeforeOrganizationWrite(body: string): void {
  const readyDecision = body.indexOf(
    "v_run.status is distinct from 'ready_for_cutover'",
  );
  const orgWrite = body.search(
    /update public\.organizations[\s\S]*onboarding_completed_at/,
  );
  const runWrite = body.indexOf("status = 'completed'");
  expect(readyDecision).toBeGreaterThan(-1);
  expect(orgWrite).toBeGreaterThan(-1);
  expect(orgWrite).toBeGreaterThan(readyDecision);
  expect(runWrite).toBeGreaterThan(orgWrite);
}

function assertAbsentRunRefused(body: string): void {
  expect(body).toMatch(
    /from public\.organization_onboarding_completion_runs as r\s+where r\.organization_id = p_organization_id\s+for update;\s+if not found then\s+return pg_catalog\.jsonb_build_object\(\s+'ok', false,\s+'code', 'NOT_READY'/i,
  );
}

function assertCompletionRunLookup(body: string): void {
  expect(body).toMatch(
    /select r\.\*\s+into v_run\s+from public\.organization_onboarding_completion_runs as r/i,
  );
}

function assertAuthenticatedOnlyGrant(body: string): void {
  expect(body).toMatch(
    /grant execute on function public\.complete_organization_v2_onboarding\(uuid\) to authenticated;/i,
  );
  expect(body).not.toMatch(
    /grant execute on function public\.complete_organization_v2_onboarding\(uuid\) to authenticated\s*,/i,
  );
}

function assertNoSideEffects(body: string): void {
  for (const forbidden of [
    /create_organization_invitation(?:_core)?\s*\(/i,
    /resend_organization_invitation(?:_core)?\s*\(/i,
    /generate_organization_invitation/i,
    /gen_random_bytes/i,
    /hash_organization_invitation/i,
    /\braw_token\b/i,
    /consume_organization_invitation_mutation_rate_limit/i,
    /organization_invitation_mutation_rate_limits/i,
    /organization_invitation_delivery_attempts/i,
    /(?:insert\s+into|delete\s+from)\s+(?:(?:public|private)\.)?organization_invitations\b/i,
    /execute_organization_onboarding_invite_intent/i,
  ]) {
    expect(body).not.toMatch(forbidden);
  }
}

describe("ENG-ONB-1H-P1-C-R1 forward Ready-gate migration identity", () => {
  it("ships exactly one new Ready-gate completion migration after the governed set", () => {
    expect(
      migrationFiles.filter((file) =>
        file.includes("complete_onboarding_requires_current_ready_authority"),
      ),
    ).toEqual([MIGRATION]);
    expect(sql).toMatch(/^-- ENG-ONB-1H-P1-C-R1/);
    expect(MIGRATION > ORIGINAL_TRANSITION).toBe(true);
    expect(MIGRATION > ORIGINAL_COMPLETION).toBe(true);
    expect(MIGRATION > FORWARD_RECONCILE).toBe(true);
  });

  it("does not modify the three historical onboarding authority migrations", () => {
    const hash = (value: string) =>
      createHash("sha256")
        .update(normalizeMigrationLineEndings(value), "utf8")
        .digest("hex")
        .toUpperCase();
    expect(hash(originalCompleteSql)).toBe(ORIGINAL_TRANSITION_SHA256);
    expect(hash(originalCompletionSql)).toBe(ORIGINAL_COMPLETION_SHA256);
    expect(hash(originalReconcileSql)).toBe(ORIGINAL_RECONCILE_SHA256);
  });

  it("replaces only the existing public completion signature", () => {
    expect(sql).toContain(
      "create or replace function public.complete_organization_v2_onboarding",
    );
    expect(sql).not.toMatch(
      /create or replace function public\.(complete_organization_v2_onboarding_\w+|batch_|bulk_)/i,
    );
    expect(complete.match(/returns jsonb/g)).toHaveLength(1);
  });
});

describe("ENG-ONB-1H-P1-C-R1 replacement function contract", () => {
  it("preserves Owner, V2, Setup Ready, SECURITY DEFINER, and authenticated-only ACL", () => {
    assertReadyGateContract(sql);
    expect(complete).toContain("WRONG_FLOW_VERSION");
    expect(complete).toContain("SETUP_NOT_READY");
    expect(complete).toContain("'idempotent', true");
    expect(complete).toContain("NOT_AUTHENTICATED");
    expect(complete).toContain("NOT_AUTHORIZED");
  });

  it("serializes on 872002 then 872004 using the governed organization-key derivation", () => {
    const first = executable.indexOf("pg_advisory_xact_lock");
    const second = executable.indexOf("pg_advisory_xact_lock", first + 1);
    const third = executable.indexOf("pg_advisory_xact_lock", second + 1);
    expect(first).toBeGreaterThan(-1);
    expect(second).toBeGreaterThan(first);
    expect(third).toBe(-1);
    expect(executable.slice(first, second)).toMatch(/872002/);
    expect(executable.slice(second)).toMatch(/872004/);
    expect(executable.slice(first, second)).toContain(
      "hashtext(p_organization_id::text)",
    );
    expect(executable.slice(second)).toContain(
      "hashtext(coalesce(p_organization_id::text, ''))",
    );
  });

  it("refuses an absent run and does not create one", () => {
    expect(executable).toContain(
      "from public.organization_onboarding_completion_runs as r",
    );
    expect(executable).toContain("for update");
    expect(executable).toMatch(
      /if not found then\s+return pg_catalog\.jsonb_build_object\(\s+'ok', false,\s+'code', 'NOT_READY'/,
    );
    expect(executable).not.toContain(
      "ensure_organization_onboarding_completion_run",
    );
    expect(executable).not.toMatch(
      /insert into public\.organization_onboarding_completion_runs/i,
    );
  });

  it("establishes current Ready authority before any completion write", () => {
    assertDecisionBeforeOrganizationWrite(executable);
    expect(executable).toContain(
      "private.resolve_organization_onboarding_invite_intent_evidence",
    );
    expect(executable).toContain("false");
    expect(executable).toContain(
      "private.advance_organization_onboarding_completion_run",
    );
    expect(executable.indexOf("ready_for_cutover")).toBeLessThan(
      executable.indexOf("set onboarding_completed_at = v_completed_at"),
    );
  });

  it("locks invitation, membership, intent, result, and run rows", () => {
    expect(executable).toMatch(
      /organization_onboarding_team_invite_intents[\s\S]*for update/,
    );
    expect(executable).toMatch(
      /organization_onboarding_invitation_results as r\s+where r\.organization_id = p_organization_id\s+order by r\.id\s+for update/,
    );
    expect(executable).toMatch(
      /organization_invitations as oi\s+where oi\.organization_id = p_organization_id\s+order by oi\.id\s+for update/,
    );
    expect(executable).toMatch(
      /organization_members as om\s+where om\.organization_id = p_organization_id\s+and om\.id is distinct from v_actor_member_id\s+order by om\.id\s+for update/,
    );
  });

  it("completes the organization and run atomically with one timestamp and preserved first-Ready", () => {
    expect(executable).toContain("v_completed_at := pg_catalog.now()");
    expect(executable).toContain("set onboarding_completed_at = v_completed_at");
    expect(executable).toContain("completed_at = v_completed_at");
    expect(executable).toContain("status = 'completed'");
    expect(executable).toContain("r.status = 'ready_for_cutover'");
    expect(executable).toContain("r.ready_for_cutover_at is not null");
    expect(executable).not.toMatch(/ready_for_cutover_at\s*=/);
    expect(executable).toContain("onboarding completion run could not complete atomically");
  });

  it("replays completed organizations without mutating timestamps or invitations", () => {
    const idempotent = executable.indexOf(
      "v_org.onboarding_completed_at is not null",
    );
    const orgWrite = executable.indexOf(
      "set onboarding_completed_at = v_completed_at",
    );
    expect(idempotent).toBeGreaterThan(-1);
    expect(idempotent).toBeLessThan(orgWrite);
    expect(executable).toContain("'idempotent', true");
    assertNoSideEffects(executable);
  });

  it("does not keep the ungated original completion body", () => {
    expect(originalComplete).not.toContain("872004");
    expect(originalComplete).not.toContain("ready_for_cutover");
    expect(complete).toContain("872004");
    expect(complete).toContain("ready_for_cutover");
  });
});

describe("ENG-ONB-1H-P1-C-R1 in-memory mutation fixtures", () => {
  it("fails if 872004 serialization is removed", () => {
    const mutated = replaceOnce(complete, "872004", "872003");
    expect(mutated).not.toMatch(
      /pg_advisory_xact_lock\(\s*872004,\s*pg_catalog\.hashtext\(coalesce\(p_organization_id::text, ''\)\)/,
    );
    expect(() => assertReadyGateContract(mutated)).toThrow();
  });

  it("fails if organization-key locking is removed", () => {
    const mutated = replaceOnce(
      complete,
      "pg_catalog.hashtext(coalesce(p_organization_id::text, ''))",
      "1",
    );
    expect(() => assertReadyGateContract(mutated)).toThrow();
  });

  it("fails if completion-run lookup is removed", () => {
    const mutated = replaceOnce(
      complete,
      /select r\.\*\s+into v_run\s+from public\.organization_onboarding_completion_runs as r/,
      "select r.* into v_run from public.organizations as r",
    );
    expect(() => assertCompletionRunLookup(mutated)).toThrow();
  });

  it("fails if current Ready validation is removed", () => {
    const mutated = replaceOnce(
      complete,
      "if v_run.status is distinct from 'ready_for_cutover' then",
      "if false then",
    );
    expect(() => assertDecisionBeforeOrganizationWrite(executableBody(mutated))).toThrow();
  });

  it("fails if an absent run is permitted", () => {
    const mutated = replaceOnce(
      complete,
      /if not found then\s+return pg_catalog\.jsonb_build_object\(\s+'ok', false,\s+'code', 'NOT_READY'\s+\);\s+end if;\s+perform 1\s+from public\.organization_onboarding_team_invite_intents/,
      `if not found then
    return pg_catalog.jsonb_build_object(
      'ok', false,
      'code', 'OK'
    );
  end if;

  perform 1
  from public.organization_onboarding_team_invite_intents`,
    );
    expect(() => assertAbsentRunRefused(mutated)).toThrow();
  });

  it("fails if invite_partial or inviting is treated as completable", () => {
    const mutatedPartial = replaceOnce(
      complete,
      "v_run.status is distinct from 'ready_for_cutover'",
      "v_run.status is distinct from 'invite_partial'",
    );
    expect(mutatedPartial).toContain("invite_partial");
    expect(() => assertReadyGateContract(mutatedPartial)).toThrow();

    const mutatedInviting = replaceOnce(
      complete,
      "v_run.status is distinct from 'ready_for_cutover'",
      "v_run.status is distinct from 'inviting'",
    );
    expect(mutatedInviting).toContain("'inviting'");
    expect(() => assertReadyGateContract(mutatedInviting)).toThrow();
  });

  it("fails if stale-evidence validation is removed", () => {
    const mutated = replaceOnce(
      complete,
      "private.resolve_organization_onboarding_invite_intent_evidence",
      "private.resolve_organization_onboarding_completion_actor",
    );
    expect(() => assertReadyGateContract(mutated)).toThrow();
  });

  it("fails if organization completion occurs before the final Ready decision", () => {
    const mutated = replaceOnce(
      executable,
      "if v_run.status is distinct from 'ready_for_cutover' then",
      "update public.organizations as o set onboarding_completed_at = pg_catalog.now() where o.id = p_organization_id;\n  if v_run.status is distinct from 'ready_for_cutover' then",
    );
    expect(() => assertDecisionBeforeOrganizationWrite(mutated)).toThrow();
  });

  it("fails if completion-run status or completed_at is omitted", () => {
    const noStatus = replaceOnce(complete, "status = 'completed'", "status = status");
    expect(() => assertReadyGateContract(noStatus)).toThrow();
    const noCompletedAt = replaceOnce(
      complete,
      "completed_at = v_completed_at",
      "completed_at = r.completed_at",
    );
    expect(() => assertReadyGateContract(noCompletedAt)).toThrow();
  });

  it("fails if first-Ready is overwritten or timestamps diverge", () => {
    const overwritten = replaceOnce(
      complete,
      "completed_at = v_completed_at",
      "ready_for_cutover_at = v_completed_at, completed_at = v_completed_at",
    );
    expect(overwritten).toMatch(/ready_for_cutover_at\s*=/);
    expect(() => assertReadyGateContract(overwritten)).toThrow();

    const divergent = replaceOnce(
      complete,
      "set onboarding_completed_at = v_completed_at",
      "set onboarding_completed_at = pg_catalog.now()",
    );
    expect(() => assertReadyGateContract(divergent)).toThrow();
  });

  it("fails if Owner authorization, SECURITY DEFINER, empty search_path, or grants are widened", () => {
    const noOwner = replaceOnce(complete, "om.role = 'owner'", "om.role = om.role");
    expect(() => assertReadyGateContract(noOwner)).toThrow();

    const noDefiner = replaceOnce(complete, "security definer", "security invoker");
    expect(() => assertReadyGateContract(noDefiner)).toThrow();

    const noSearch = replaceOnce(complete, "set search_path = ''", "set search_path = public");
    expect(() => assertReadyGateContract(noSearch)).toThrow();

    const widened = replaceOnce(
      sql,
      "grant execute on function public.complete_organization_v2_onboarding(uuid) to authenticated;",
      "grant execute on function public.complete_organization_v2_onboarding(uuid) to authenticated, anon;",
    );
    expect(() => assertAuthenticatedOnlyGrant(widened)).toThrow();
  });

  it("fails if a delivery, token, or rate-limit side effect is inserted", () => {
    const mutated = replaceOnce(
      complete,
      "v_completed_at := pg_catalog.now();",
      "v_completed_at := pg_catalog.now();\n  perform public.create_organization_invitation(p_organization_id, 'x@example.test', 'staff');",
    );
    expect(() => assertNoSideEffects(executableBody(mutated))).toThrow();
  });
});
