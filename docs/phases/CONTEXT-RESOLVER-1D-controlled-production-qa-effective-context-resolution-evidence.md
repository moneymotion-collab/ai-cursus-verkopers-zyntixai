# CONTEXT-RESOLVER-1D — Controlled Production QA Effective Context Resolution

| Field | Value |
| --- | --- |
| Phase | **CONTEXT-RESOLVER-1D — CONTROLLED PRODUCTION QA EFFECTIVE CONTEXT RESOLUTION** |
| Parent | CONTEXT-RESOLVER-1C |
| Document type | Read-only Production runtime verification evidence |
| Date | 2026-08-26 |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `17aaa3ef851330519c06067b432bfcbb2ed56f14` |

**PRODUCTION EFFECTIVE CONTEXT RESOLUTION: VERIFIED FOR INTERNAL QA**

**AUTHENTICATED TENANT SERVER PATH: VERIFIED**

**EXACT CONTEXT PIN: VERIFIED**

**PINNED INHERITANCE: VERIFIED**

**DETERMINISTIC RESOLUTION: VERIFIED**

**DATABASE WRITES: 0**

**ENTITLEMENT EFFECT: 0**

**SOCIAL EXECUTION EFFECT: 0**

**CONTEXT PACK READINESS: context_ready / UNCHANGED**

**PRODUCT CONSUMER: NOT IMPLEMENTED**

---

## A. Repository baseline

Proven before execution and unchanged as implementation HEAD:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `17aaa3ef851330519c06067b432bfcbb2ed56f14` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence | `0 0` |
| Worktree | clean (no tracked changes) |
| Resolver code | frozen 1C; **not changed** in 1D |

## B. Production target

| Check | Value |
| --- | --- |
| Project ref | `dmctinrcjvsgmoxwwodw` |
| Canonical URL | `https://dmctinrcjvsgmoxwwodw.supabase.co` |
| Region | `eu-central-1` |
| Status | `ACTIVE_HEALTHY` |
| Site | `https://www.zyntixai.com` |

`createSupabaseServiceRoleClient()` reads URL from `NEXT_PUBLIC_SUPABASE_URL` and key from `SUPABASE_SERVICE_ROLE_KEY` only. Control Plane readers were constructed through that frozen contract after tenant load.

## C. Retained QA fixture

Live Production QA Organization and Activity were discovered through authenticated RLS (`organization_id` + `activity_key = qa_online_course_business`), not copied as a primary lookup.

| Object | Live value |
| --- | --- |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` / ZyntixAI Production QA / `active` / locale `null` |
| Activity | `07e6918e-6c13-437e-b698-f0f3be27e9bb` / `qa_online_course_business` / `active` / `is_primary=true` / niche `online-course-business` |
| Active assignment | exactly 1 (`dba4065d-b7f6-4076-b9a5-610141d41807`), no superseded used |
| Leaf pin | `niche.online-course-business` v1 `published`, `context_ready`, `verified_at` NULL (`1b942da6-9472-4520-a004-3d68096b44ff`) |
| Parent | `foundation.knowledge` v1 via `parent_version_id` (`3f42e003-6df3-4344-9941-8a1afe9bb329`) |

## D. Authenticated session method

Gitignored Playwright Owner storage `playwright/.auth/production-owner.json` was first stale (`refresh_token_not_found`). Owner ran `npm run browser:auth:bootstrap`. The refreshed session was reused for 1D. It was not committed. Cookies/JWTs/emails are not recorded here.

No password reset, no new user, no new membership, no fabricated JWT.

## E. auth.getUser proof

`createServerClient` from `@supabase/ssr` with the Owner `sb-*` cookies and the publishable key from local public env:

`auth.getUser = PASS`

## F. Active membership proof

`resolveOrganizationContext` against Organization `2fc07699-ece5-44b9-bbb3-abbc23e9fffb`:

| Check | Value |
| --- | --- |
| Membership | active |
| Role | `owner` |

## G. Exact server entrypoint

Frozen 1C entrypoints were invoked. `resolveEffectiveContext` was not called as a Production shortcut.

```ts
resolveBusinessActivityContext({ organizationId, activityId, mode: "internal_qa" })
resolvePrimaryBusinessActivityContext({ organizationId, mode: "internal_qa" })
```

No explicit locale (Organization locale is `null`). Control Plane factory ran only after tenant load (`controlPlaneConstructed = 3` for explicit, repeat, and primary).

A gitignored local harness was used only to bind the real Owner cookies to `getAuthenticatedClient` and `createControlPlaneReaders()` to `getControlPlaneReaders`. It was removed before this evidence commit.

## H. Tenant RLS Activity read

Authenticated SELECT:

`organization_business_activities` where `organization_id` + `activity_key = qa_online_course_business`

Returned the exact Activity in §C. No service_role tenant caller.

## I. Tenant RLS assignment read

Authenticated SELECT:

`organization_context_assignments` where `organization_id` + `business_activity_id` + `status = active`

Returned exactly one active assignment. Pin id matched the resolved Activity.

## J. Exact immutable pin

Leaf Context is only `activeAssignment.context_pack_version_id`. Callers did not supply a version id. Newer catalog versions were not substituted.

## K. Pinned parent chain

| Rank | Pack | Version | Provenance |
| --- | --- | --- | --- |
| Parent | `foundation.knowledge` | 1 | `parent_version_id` |
| Leaf | `niche.online-course-business` | 1 | exact pin |

TAX was not used to discover parents. Ancestry in the EffectiveContext matched this chain.

## L. TAX path

Canonical path from Activity classification target:

| Kind | Key | Label |
| --- | --- | --- |
| Foundation | `knowledge` | Knowledge |
| Industry | `education-and-learning` | Education & Learning |
| Niche | `online-course-business` | Online Course Business |
| Specialization | none | — |
| Deep specialization | none | — |

## M. Core baseline

System-baseline required capabilities present:

- `core.attention`
- `core.member-administration`
- `core.tasks`

`sourceKind: system_baseline`. All `lifecycleStatus: active`, `readinessStatus: production_verified`.

## N. Context capability inheritance

From `foundation.knowledge` v1 (required):

- `knowledge.enrollments`
- `knowledge.programs`
- `knowledge.progress`
- `shared.crm.customers`

From `niche.online-course-business` v1:

- `shared.crm.leads` (`recommended`)
- `horizontal.social.approval` (`optional`)
- `horizontal.social.connection` (`optional`)
- `horizontal.social.content` (`optional`)
- `horizontal.social.publishing` (`optional`)
- `horizontal.social.scheduling` (`optional`)

## O. Actual relevant-capability result

`relevantCapabilities.length = 13` (3 Core + 4 Knowledge required + 1 recommended CRM + 5 optional Social).

No unmapped catalog decoy. No entitlement interpretation.

## P. CAP readiness metadata

Every returned capability has `readinessStatus: production_verified`. Missing-row `null` / explicit `planned` paths were not exercised by this fixture; they remain frozen 1B/R1A engine behavior.

## Q. Dependency coherence

Frozen engine accepted the assembled snapshot (`first.ok`, `second.ok`, `primary.ok` all true). Incoherent `requires` would have failed closed. No catalog mutation.

## R. Terminology inheritance

Four `en` terms from `foundation.knowledge` v1: `customer`, `enrollment`, `program`, `progress`. OCB v1 contributes 0 terms. `fallbackUsed: false` on every term.

## S. Locale / fallback

| Field | Value |
| --- | --- |
| Requested locale | `null` (no explicit locale; org locale `null`) |
| Resolved locale | `en` |
| Fallback used | `false` |

No `Accept-Language`, profile, Social, or IP locale.

## T. EffectiveContext contract

Returned keys: `businessActivity`, `context`, `organization`, `relevantCapabilities`, `resolution`, `taxonomy`, `terminology`.

`resolution.mode = internal_qa`. Leaf pack `niche.online-course-business` v1 `published` / `context_ready`.

## U. Deterministic repeated resolution

Two explicit resolves compared on sanitized semantic identity: **equal**.

## V. Primary resolver equivalence

`resolvePrimaryBusinessActivityContext` matched the explicit Activity result. It selected the primary Activity (`is_primary=true`), not the first Activity by listing order.

## W. Pre/post database counts

Unchanged after resolution:

| Scope | Count |
| --- | --- |
| Organizations | 6 |
| QA Activities | 1 |
| QA active assignments | 1 |
| QA assignment events | 2 (`business_activity_created`, `context_version_assigned`) |
| TAX releases / foundations / industries / niches / specializations / deep / aliases | 1 / 4 / 22 / 1 / 0 / 0 / 2 |
| CAP definitions / dependencies / readiness | 13 / 7 / 13 |
| CTX packs / versions / mappings / terminology / readiness | 2 / 2 / 10 / 4 / 2 |

No INSERT/UPDATE/DELETE from this phase. No mutation RPC. No audit event added.

## X. No entitlement / no Social execution

Harness env at resolve time:

| Gate | Value |
| --- | --- |
| `ORG_CONTEXT_PLATFORM_OPERATOR_ENABLED` | not `true` |
| Social publishing | disabled |
| Social scheduling | disabled |
| Public registration | disabled |

`relevantCapabilities` is Context relevance, not entitlement. No Social job/publish/schedule executed.

## Y. Context readiness unchanged

Leaf remains `context_ready`. `verified_at` remains NULL. No readiness promotion.

## Z. TAX / CAP / CTX / ORG-CONTEXT / Closed-Beta safety

- No TAX/CAP/CTX catalog writes.
- `service_role` Control Plane grants remain SELECT-only on the exact 15 catalog tables; no INSERT/UPDATE/DELETE; no anon/authenticated/public table grants added.
- ORG-CONTEXT fixture immutable (1 Activity, 1 active assignment, 2 events).
- `GET https://www.zyntixai.com/register` → `307 Location: /login?registration=disabled`.
- No product UI/API consumer of the resolver (`resolveBusinessActivityContext` exists only in server module + tests).
- Foreign-org and suspended-member live probes were **not** available as extra authenticated sessions; they remain 1C unit-covered and are deferred to CONTEXT-RESOLVER-1FV. They did not block 1D.

### Credential-pull correction

`SUPABASE_SERVICE_ROLE_KEY` in Vercel Production is Sensitive (write-only). `vercel env pull --environment production` must not be treated as the runtime secret. An earlier `CREDENTIAL_MISSING_OR_MALFORMED` classification from that pull is **not proven**.

Local Control Plane auth used a process-local `service_role` value entered by the owner from Supabase project `dmctinrcjvsgmoxwwodw` via hidden terminal input. It was not pasted into chat, not written to `.env.local`, not committed, not logged, and was removed from process env after verification.

Direct `taxonomy_releases` SELECT through `createClient(canonicalUrl, process-local key, { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } })` passed before resolver execution.

`vercel env pull` was not used again to validate this Sensitive credential. Vercel env was not changed. The credential was not rotated.

---

CONTEXT-RESOLVER-1D CLOSED WITH EVIDENCE — CONTROLLED PRODUCTION QA EFFECTIVE CONTEXT RESOLUTION VERIFIED
