# SMM-B1.0 — Social Media Domain, Security & Data Contract — Evidence

| Field | Value |
| --- | --- |
| Phase | **SMM-B1.0 — Domain, Security & Data Contract** |
| Document type | Closure evidence (**docs-only phase**) |
| Date | 2026-08-14 |
| Formal status | `SMM-B1.0 CLOSED WITH EVIDENCE — SOCIAL MEDIA DOMAIN, SECURITY, AND DATA CONTRACT READY` |
| Contract | `docs/phases/SMM-B1.0-social-media-domain-security-data-contract.md` |
| Governing standard | `docs/governance/B1-GATE.1-100-percent-phase-completion-and-evidence-standard.md` |
| Branch | `core/platform-readiness-20260707` |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Starting HEAD | `5d59a205bc83f7cf998c21836b02eda550856046` |

This phase is **not** Production Verified. No provider integration, migration, or application mutation was performed.

---

## 1. Owner authorization (FACT)

**OWNER APPROVED — AUTHORIZE SMM-B1.0 AGAINST CURRENT HEAD `5d59a205bc83f7cf998c21836b02eda550856046`**

Predecessor stop (FACT): a prior SMM-B1.0 attempt correctly stopped because authorized HEAD `b2a86ba9d81df7f9d4ee91aae19cae990c1c2925` was stale. **No SMM implementation or documentation was created in that attempt.**

The owner forbade reset/revert of the later CB-Q1 evidence commit:

`docs(invitations): record CB-Q1 cleanup preflight owner decision`

**VERIFIED:** no reset, checkout of another branch, pull, stash, clean, rebase, amend, or force-push was performed to start this phase.

---

## 2. Verified starting Git baseline (VERIFIED)

| Check | Expected | Actual | Result |
| --- | --- | --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` | same | PASS |
| Branch | `core/platform-readiness-20260707` | same | PASS |
| HEAD | `5d59a205bc83f7cf998c21836b02eda550856046` | same | PASS |
| Subject | `docs(invitations): record CB-Q1 cleanup preflight owner decision` | same | PASS |
| Upstream | `origin/core/platform-readiness-20260707` | same SHA | PASS |
| Origin tracking ref | same as HEAD | `5d59a205bc83f7cf998c21836b02eda550856046` | PASS |
| Ahead/behind | `0 0` | `0 0` | PASS |
| `git status --short` | clean | empty | PASS |
| `git status --branch --short` | clean tracking | `## core/platform-readiness-20260707...origin/core/platform-readiness-20260707` | PASS |

Baseline re-authorization disposition: **current `5d59a205…` accepted; no reset performed.**

---

## 3. CB-Q1 isolation (VERIFIED)

| Requirement | Result |
| --- | --- |
| Do not resume CB-Q1 | PASS — not resumed |
| Do not start CB-PUB | PASS |
| Do not modify invitation evidence | PASS — invitation evidence files unchanged |
| Do not create/send/accept invitations | PASS — `NOT EXECUTED` |
| Invitation gates | Remain `INVITATIONS_ENABLED=false` and `INVITATION_EMAIL_DELIVERY_ENABLED=false` in `.env.example`; SMM did not change them |
| CB-Q1 status | Remains **OWNER DECISION REQUIRED** (cleanup path) as recorded on starting HEAD |

SMM-B1.0 is an independent design track.

---

## 4. Repository foundations inspected (VERIFIED)

Inspected (non-exhaustive paths; all used as FACT for the reuse matrix):

| Area | Evidence of inspection |
| --- | --- |
| Organizations | `supabase/migrations/20260705150001_create_organizations.sql` — tenant root; `timezone`; statuses `active` \| `suspended` \| `archived` |
| Members / roles | `20260705150002_create_organization_members.sql`; TS `OrganizationRole` = `owner` \| `admin` \| `staff` \| `viewer` |
| Auth | Supabase Auth; `src/lib/supabase/server.ts` pattern; **no app service-role client** |
| RLS helpers | `private.is_org_member`, `private.has_org_role` |
| Customers | `public.customers` — org-scoped CRM; not auth profiles |
| Tasks | `public.tasks` + `due_at` + org timezone display |
| Appointments | **ABSENT** |
| Attention | `attention_items` / `attention_signals` / `attention_item_events`; `AttentionSourceType` = `"enrollment"` only |
| NBA | Derived-first catalog in `src/features/nba/domain/types.ts`; recommend-only; no NBA table |
| Audit | Per-domain events/history; invitation delivery attempts private table |
| Idempotency | `src/features/invitations/server/delivery/idempotency.ts` + unique generation/idempotency keys |
| Provider adapter pattern | Resend `InvitationEmailProvider` — pattern only; not a social adapter |
| Feature gates | `INVITATIONS_ENABLED`, `INVITATION_EMAIL_DELIVERY_ENABLED`, `PUBLIC_REGISTRATION_ENABLED` — server-only fail-closed |
| AppShell | `src/components/app-shell.tsx` — no SMM nav |
| Cron / workers | **ABSENT** |
| Storage / media product | **ABSENT** |
| AI / LLM packages | **ABSENT** from `package.json` |
| Approvals product | **ABSENT** |
| Notifications product | **ABSENT** |
| Social OAuth / Meta / TikTok / LinkedIn / YouTube / X APIs | **ABSENT** in `src/` (Lead `source_type` values only) |
| Docs convention | `docs/phases/` hosts design contracts; `docs/design/` does **not** exist |
| Course Sellers Beta 1 | Closed; Social Media Management listed **OUTSIDE COURSE SELLERS BETA 1** |
| Docs lint tooling | **ABSENT** — `package.json` has no markdown lint script |

---

## 5. Reuse findings (CONTRACT via design doc)

See contract §3. Summary:

- **Reuse:** Organization, membership, four roles, RLS/RPC, Customers as Client, Attention pattern, NBA recommend-only pattern, invitation-style idempotency, fail-closed env gates, AppShell, append-only events, UTC+org timezone helpers.
- **Extend later:** Attention `source_type` / rule keys (B1.9); NBA catalog (B1.9); env kill switches when features land.
- **New SMM objects:** Brand, Workspace, Connection, Credential Reference, Media Asset, Content Item/Version/Variant, Campaign, Schedule Entry, Approval, Publication Job/Attempt, External Publication, Story Continuity Rule, Metric Snapshot, Performance Insight, `social_events`.
- **Do not duplicate:** second client table; second Attention queue; NBA persistence table; Resend as social provider.

---

## 6. Design decisions established (CONTRACT)

Recorded in `docs/phases/SMM-B1.0-social-media-domain-security-data-contract.md`:

| Topic | Locked decision |
| --- | --- |
| Client / Brand | Separate; Customer Account optional; first-party Brand allowed; Workspace 1:1 with Brand |
| Roles | Existing four only; Viewer read-only; connect/disconnect Owner/Admin |
| Approval | Approval-first; Staff cannot approve; no client portal in Beta 1 |
| Automation | Default `manual`; opt-in `approved_scheduled`; `higher_automation` deferred |
| Content vs publish | Editorial statuses on Content Item; publish statuses on Publication Job |
| Versioning | Immutable approved versions; caption/media edits invalidate approval; schedule changes do not |
| Connection statuses | Distinct: initiated, authorization_pending, connected, reauthorization_required, permission_missing, revoked, disconnected + health overlay |
| Provider | Provider-neutral; no implicit first provider |
| Ambiguous result | `submission_unknown`; no blind retry |
| Story | Desired/Planned/Published/Gap/Recovery; default OFF; ceilings required; no unbounded loop |
| AI | Advisory; FACT / PREFERENCE / AI_SUGGESTION; org+workspace retrieval only |
| Analytics | Append-only snapshots; raw authoritative; insights classified |
| Paid ads / listening / DMs / provider-side delete | Out or deferred |
| Docs path | `docs/phases/` per repository convention |

---

## 7. Security model (CONTRACT)

Fail-closed Organization membership; composite FKs; RPC re-check; secrets server-only; OAuth state bound to actor+org+workspace; no open redirect; kill switches server-side; AI isolation; audit without secrets.

Threat-model categories: all `PASS — CONTRACT DEFINED` (not Production Verified). See contract §39.

---

## 8. Tenant / permission / provider boundary (CONTRACT)

- Tenant: §7 of contract.
- Permissions: §8–§9 of contract.
- Provider boundary: adapter + capability model; browser never holds provider credentials; no SDK in B1.0.

---

## 9. Lifecycles / external-effect / idempotency / Story safety (CONTRACT)

Covered in contract §12, §16–§22. Publishing pipeline binding for B1.6. Idempotency follows invitation delivery generation/idempotency keys.

---

## 10. AI / analytics / Attention / NBA (CONTRACT)

AI absent today; B1.3 advisory. Fact vs Hypothesis classes locked. Attention/NBA reused, not cloned. Command Center assigned to B1.9.

---

## 11. Downstream boundaries / deferred scope / owner decisions (CONTRACT)

B1.1–B1.10 locked in contract §42. Deferred matrix §41. Owner register §43.

```text
OWNER PROVIDER SELECTION REQUIRED BEFORE SMM-B1.1 EXTERNAL INTEGRATION
```

Does **not** block SMM-B1.0.

---

## 12. Production / provider activity (NOT EXECUTED)

```text
0 SOCIAL PROVIDER CONNECTIONS
0 PROVIDER API CALLS
0 SOCIAL PUBLICATIONS
0 SOCIAL STORIES
0 SOCIAL WEBHOOKS
0 SMM DATABASE MIGRATIONS
0 SMM PRODUCTION APPLICATION MUTATIONS
```

Vitest / full application tests: **NOT EXECUTED** (docs-only; no source change). This evidence does not claim an application test PASS.

---

## 13. Verification (VERIFIED)

| Check | Result |
| --- | --- |
| Required contract sections 1–47 present | PASS |
| Terminology consistency (no “should probably be secure”; no “AI may publish automatically”) | PASS |
| No `docs/design/` created (convention: `docs/phases/`) | PASS |
| No source / `src/**` change | PASS (see diff) |
| No migration | PASS |
| No `package.json` / lock change | PASS |
| No `.env` change | PASS |
| No secrets in docs | PASS (searched; no tokens/keys) |
| Invitation files untouched | PASS |
| Docs lint script | **NOT PRESENT** — not run |
| Contradictory duplicate object names | PASS — Client is UI synonym for Customer Account only |

Diff scope is recorded in §15 after commits.

---

## 14. SMM-B1.0 closure criteria

| # | Criterion | Result |
| --- | --- | --- |
| 1 | Git baseline verified | PASS |
| 2 | Foundations mapped | PASS |
| 3 | Reuse matrix complete | PASS |
| 4 | Workflow locked | PASS |
| 5 | Terminology locked | PASS |
| 6 | Entity model complete | PASS |
| 7 | Organization ownership explicit | PASS |
| 8 | Tenant isolation complete | PASS |
| 9 | Permission matrix complete | PASS |
| 10 | High-risk mutation policy complete | PASS |
| 11 | Content lifecycle complete | PASS |
| 12 | Versioning complete | PASS |
| 13 | Approval complete | PASS |
| 14 | Connection lifecycle complete | PASS |
| 15 | Provider capability model complete | PASS |
| 16 | Credential security complete | PASS |
| 17 | OAuth security complete | PASS |
| 18 | External side-effect architecture complete | PASS |
| 19 | Publishing idempotency complete | PASS |
| 20 | Ambiguous provider result complete | PASS |
| 21 | Scheduling/timezone complete | PASS |
| 22 | Story continuity safety complete | PASS |
| 23 | AI assistance boundary complete | PASS |
| 24 | Fact/hypothesis/evidence complete | PASS |
| 25 | Analytics data contract complete | PASS |
| 26 | Attention integration complete | PASS |
| 27 | NBA integration complete | PASS |
| 28 | Daily Command Center complete | PASS |
| 29 | Audit complete | PASS |
| 30 | Privacy/retention complete | PASS |
| 31 | Failure taxonomy complete | PASS |
| 32 | Feature-gate strategy complete | PASS |
| 33 | Background-job contract complete | PASS |
| 34 | Webhook security complete | PASS |
| 35 | Threat model complete | PASS |
| 36 | B1.1–B1.10 boundaries complete | PASS |
| 37 | In-scope matrix complete | PASS |
| 38 | Deferred matrix complete | PASS |
| 39 | Owner-decision register complete | PASS |
| 40 | No contradictory contracts | PASS |
| 41 | No provider integration | PASS |
| 42 | No migration | PASS |
| 43 | No Production mutation | PASS |
| 44 | Evidence document complete | PASS |
| 45 | Docs-only diff | PASS |
| 46 | Commit/push complete | PASS after publication commits |
| 47 | Divergence `0 0` | PASS after push |
| 48 | Worktree clean | PASS after push |

---

## 15. Diff scope and commits

### 15.1 Files in this phase

| Path | Role |
| --- | --- |
| `docs/phases/SMM-B1.0-social-media-domain-security-data-contract.md` | Authoritative design/security/data contract |
| `docs/phases/SMM-B1.0-social-media-domain-security-data-contract-evidence.md` | This evidence |

No other paths are in scope.

### 15.2 Commits

| Full hash | Subject |
| --- | --- |
| `0b1604d2a5ecbc15a4b90a3657537af7c8acc3c7` | `docs(smm): define social media domain security and data contract` |
| *(this evidence commit)* | `docs(smm): close SMM-B1.0 domain security contract` |

Design contract publication HEAD after first commit: `0b1604d2a5ecbc15a4b90a3657537af7c8acc3c7`.

Diff vs starting baseline `5d59a205bc83f7cf998c21836b02eda550856046` after design commit: **one new Markdown file only** (`docs/phases/SMM-B1.0-social-media-domain-security-data-contract.md`). No `src/`, migrations, lockfiles, or `.env`.

---

## 16. Final verdict

```text
SMM-B1.0 CLOSED WITH EVIDENCE — SOCIAL MEDIA DOMAIN, SECURITY, AND DATA CONTRACT READY
```

Meaning:

- Social Media Management Beta 1 foundation is formally defined;
- implementation phases may build against it;
- security boundaries are fixed;
- downstream phase scopes are fixed.

Does **not** mean OAuth, tokens, connected accounts, or publishing exist.

```text
SMM-B1.1 NOT YET AUTHORIZED
OWNER PROVIDER SELECTION REQUIRED BEFORE SMM-B1.1 EXTERNAL INTEGRATION
```
