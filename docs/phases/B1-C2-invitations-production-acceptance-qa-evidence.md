# B1-C2 — Invitations Production Acceptance QA — Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C2 — Invitations Production Acceptance QA** |
| Stage | **Post-acceptance verified + gates OFF; Owner session refresh needed for Members UI QA** |
| Date | 2026-08-20 |
| Formal status | `OWNER ACTION REQUIRED — OWNER BROWSER SESSION REFRESH FOR B1-C2 MEMBERS QA` |
| Real invitation emails | **1** |
| Acceptance successes | **1** |
| Membership creates | **1** (Viewer) |
| Provider writes | **1** |
| Gate state | delivery **OFF**; acceptance **OFF** |

```text
OWNER ACTION REQUIRED — OWNER BROWSER SESSION REFRESH FOR B1-C2 MEMBERS QA
```

**Strict stop:** Durable acceptance proven. Gates resting OFF. Temporary Viewer kept (disposition A). Do not start B1-C3.

---

## 1. Executive status

Invitation architecture, gates, provider adapter, acceptance security contract, Production inventory, Members read-only browser QA, and the future controlled-test plan are **reconstructed and ready for Owner target approval**.

Safe resting state remains:

- `INVITATIONS_ENABLED` = **OFF** (fail-closed)
- `INVITATION_EMAIL_DELIVERY_ENABLED` = **OFF** (fail-closed)
- `SOCIAL_PUBLISHING_ENABLED` = **OFF** (unchanged; R1-F remains paused)

No Stage-1 Product/schema defect blocks readiness. Owner supplied controlled QA recipient (`email_fp=dc8bd0d9c066`); clean-target PASS; no existing auth user (invite-gated registration path). **Allowlist confirmation**, **cleanup disposition**, and **explicit Phase 3 authorization** remain required before any gate enable.

---

## 2. Authoritative baseline

### Git

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| HEAD | `cfefec597fcb915fa0a5b6dafdba47a52e5c9466` (`cfefec5`) |
| Upstream | `origin/core/platform-readiness-20260707` @ same SHA |
| Origin | `https://github.com/moneymotion-collab/ai-cursus-verkopers-zyntixai.git` |
| Divergence | `0 0` |
| Worktree (Stage-1 start) | clean (local gitignored Playwright auth may exist) |

### Production www

| Item | Value |
| --- | --- |
| Alias | `https://www.zyntixai.com` |
| Deployment | `dpl_3qCR3y7dSkGniCwMwFRZ8KG9a1MH` (`zyntixai-bxuniqpfz-…`) |
| Target | production · Ready |
| Invitation implementation | Present on current Production app (Members + invite/accept surfaces; gated) |

### Social safety

| Check | Result |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | **false / OFF** |
| B1-C2 Social mutation | **none** |
| R1-F | remains paused |

### Database (Production `dmctinrcjvsgmoxwwodw`)

| Item | Result |
| --- | --- |
| Invitation schema | `public.organization_invitations` + private delivery attempts |
| Membership | `public.organization_members` |
| RPCs | `create_organization_invitation`, `resend_organization_invitation`, `revoke_organization_invitation`, `accept_organization_invitation`, delivery attempt resolve/complete |
| Latest relevant migrations | through `20260814150000` era (rate limits / acceptance hardening present) |
| Drift observed Stage 1 | none for invitation inventory queries |

### Prior evidence (authoritative invitation/email trail)

- `docs/phases/Invitations-closed-beta-CB-E1-A-delivery-core-resend-adapter-evidence.md`
- `docs/phases/Invitations-closed-beta-CB-E1-C-production-verification-closure-evidence.md`
- `docs/phases/Invitations-closed-beta-CB-E1-E-controlled-production-email-delivery-verification-evidence.md`
- `docs/phases/Invitations-closed-beta-CB-Q1-controlled-production-invitation-acceptance-qa-evidence.md`
- `docs/phases/Invitations-member-administration-design-security-and-readiness-contract.md`
- `docs/phases/B1-C1-daily-operating-composition-evidence.md` (browser harness foundation)

---

## 3. Existing invitation architecture

Exact Product path (no parallel model):

| # | Concern | Existing component |
| --- | --- | --- |
| 1 | Creation UI | `InviteMemberForm` on `/settings/members` |
| 2 | Server action | `createInvitationAction` |
| 3 | Domain create | `createOrganizationInvitation` → RPC `create_organization_invitation` |
| 4 | Role validation | `canCreateOrganizationInvitation` / `getInvitableOrganizationRoles` (+ RPC) |
| 5 | Org binding | `resolveOrganizationContext` then trusted `organizationId` |
| 6 | Recipient normalization | `normalizeOrganizationInvitationEmail` (`lower(btrim)`) |
| 7 | Duplicate pending | RPC returns pending reuse / `invite_already_pending` class codes |
| 8 | Token model | Raw token returned once from RPC; stored hashed server-side; never in action return type |
| 9 | Acceptance URL | `buildInvitationAcceptanceUrl` (delivery only; not logged) |
| 10 | Delivery adapter | Resend via `createResendInvitationEmailProvider` |
| 11 | Template | Invitation email template module (unit-tested) |
| 12 | Idempotency | delivery generation + provider idempotency keys + attempt store |
| 13 | Expiry | **7 days** from create/resend (`interval '7 days'`) |
| 14 | Resend | `resendInvitationAction` → `resend_organization_invitation` (rotates credential/expiry per RPC) |
| 15 | Revoke | revoke RPC + UI for managers |
| 16 | Acceptance | `acceptInvitationAction` + `accept_organization_invitation(text)` |
| 17 | Membership | Created/activated inside Accept RPC (org + role from invitation row) |
| 18 | Audit/events | Invitation lifecycle events via RPC paths |
| 19 | Failure classification | Create/delivery/accept result mappers → user-visible codes |
| 20 | Operator visibility | Members pending list + restricted-rollout notice; delivery attempts in `private.organization_invitation_delivery_attempts` |

**Durable create vs delivery:** invitation row is created **first** (RPC success), then `orchestrateInvitationDelivery` runs. Delivery OFF → durable invite may still exist with `delivery_disabled` (honest Owner messaging).

---

## 4. Feature gates

| Gate / config | Production value (Stage 1) | Fail mode | Exposure | OFF | ON |
| --- | --- | --- | --- | --- | --- |
| `INVITATIONS_ENABLED` | **OFF** | fail-closed (`true` only) | server-only | Accept surfaces unavailable; rollout notice | Accept path eligible |
| `INVITATION_EMAIL_DELIVERY_ENABLED` | **OFF** | fail-closed | server-only | no provider send | delivery eligible if config ready |
| `INVITATION_EMAIL_FROM` | Encrypted **present** | N/A | server-only | — | From identity for Resend |
| `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` | Encrypted **present** | empty → fail-closed when delivery ON | server-only | — | only listed recipients |
| `RESEND_API_KEY` | Encrypted **present** | missing → config error when ON | server-only | — | provider auth |
| `SOCIAL_PUBLISHING_ENABLED` | **OFF** | fail-closed | server | no Social publish | (must stay OFF for B1-C2) |

**Safe resting state:** both invitation gates OFF → **unintended Production delivery/acceptance prevented**.

Note: `vercel env run` may load `.env.local` and report From/allowlist/Resend as absent locally even when Production Encrypted vars exist. Authoritative presence = `vercel env ls production` + Members restricted-rollout UI copy.

---

## 5. Email delivery readiness

| Check | Result |
| --- | --- |
| Provider adapter | Resend |
| Sender identity configured | **yes** (Encrypted `INVITATION_EMAIL_FROM` present) |
| Credentials present | **yes** (boolean only; Encrypted `RESEND_API_KEY`) |
| Allowlist configured | **yes** (Encrypted present; contents not decrypted Stage 1) |
| Template availability | **yes** (code + tests) |
| Tracking | not a Product surface in invitation delivery path |
| Failure diagnostics | attempt store + classified delivery results |
| Idempotency | generation key + attempt store; **no blind auto-retries** |
| Provider request Stage 1 | **none** |

`invitation_delivery_ready` / `provider_config_ready` = **PASS** (infrastructure). Gate remains **OFF**.

---

## 6. Acceptance architecture

| Piece | Detail |
| --- | --- |
| Route | `/invite/accept` (gated by `INVITATIONS_ENABLED`) |
| Action | `acceptInvitationAction` |
| RPC | `public.accept_organization_invitation(p_raw_token text)` SECURITY DEFINER |
| Identity | `auth.uid()` + confirmed email from `auth.users` via private helper |
| Email bind | exact normalized match to invitation; mismatch → `email_mismatch` |
| Same-origin | Accept defense in app layer |
| Continuation | cookie/continuation pattern for auth handoff (existing) |
| Gate OFF UI | Members notice + accept unavailable |

`acceptance_ready` = **PASS** (implementation). Gate remains **OFF**.

---

## 7. Security contract

| Defense | Classification |
| --- | --- |
| Token unpredictability | **VERIFIED** (RPC token generation + shape checks) |
| Token storage/hash | **VERIFIED** (raw not persisted for lookup; hash model in migrations) |
| Expiry | **VERIFIED** + **TEST COVERED** (lazy at accept/resend) |
| One-time use / terminal accept | **VERIFIED** + **TEST COVERED** |
| Revoked rejection | **VERIFIED** + **TEST COVERED** |
| Already accepted | **VERIFIED** / `already_member` path |
| Wrong org | **VERIFIED** (invitation row binds org; RPC derives membership org) |
| Wrong identity/email | **VERIFIED** + **TEST COVERED** |
| Replay | **VERIFIED** + **TEST COVERED** (fixture/security tests) |
| Duplicate membership | **VERIFIED** |
| Role escalation | **VERIFIED** (role from invitation; Owner never invitable) |
| Cross-tenant create | **VERIFIED** (org context + RPC) |
| Concurrent double accept | **PARTIAL** (DB uniqueness/transactional intent; fixture concurrency coverage exists in matrix intent) |
| Status transition | **VERIFIED** |
| Audit event | **VERIFIED** (RPC event writes; fixture tests assert contract) |

No Production acceptance exercised in Stage 1.

---

## 8. Current Production member/invitation state

Organization: `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA)

| Metric | Count |
| --- | --- |
| Active members | **6** |
| Owner (active) | **1** |
| Admin (active) | **1** |
| Staff (active) | **1** |
| Viewer (active) | **3** |
| Suspended | **2** (do **not** use as invite targets) |
| Pending invitations | **0** |
| Accepted invitations | **3** |
| Revoked invitations | **11** |
| Expired (as distinct status) | not a stored terminal status; expiry evaluated lazily on pending |
| Delivery attempts (historical submitted) | **2** |

Recipient emails not published.

---

## 9. Test recipient requirements

Recipient must be:

- legitimate email controlled by Owner/tester;
- able to receive mail and complete acceptance;
- not an unrelated customer;
- preferably **not** already an active member of this org;
- preferably **no** pending invite for same org;
- allowlisted when delivery is later enabled.

**Do not choose address in Stage 1.**

### Owner-supplied controlled QA recipient (Stage-1 confirmation)

Owner supplied a controlled QA recipient address in chat (full address not republished here).

| Field | Value |
| --- | --- |
| `email_fp` | `dc8bd0d9c066` |
| Match to prior CB-E1-E inbox (`8359c74f65e0`) | **no** — new Stage-1 target |
| Match to CB-Q1 Option B (`c221bfd439a3`) | **no** |
| Auth `users` for this email | **0** |
| QA org active membership | **0** |
| QA org suspended membership | **0** |
| Pending invitation | **0** |
| Accepted / revoked history for org+email | **none** |
| Other-org memberships | **0** |
| Clean-target (membership + pending) | **PASS** |
| Acceptance auth path | **invite-gated registration** (new account + email verification), not Option B existing-auth |

**Allowlist:** Encrypted Production `INVITATION_EMAIL_RECIPIENT_ALLOWLIST` was not decrypted. Owner must ensure it includes this exact normalized recipient before Phase 3 delivery ON.

### Clean-target check (executed read-only after Owner supplied address)

Before Phase 4 create (re-verify immediately before create):

1. `organization_members` active/suspended for org+email = none — **PASS now**
2. pending invitation for org+email = none — **PASS now**
3. allowlist contains exact normalized recipient — **Owner confirm required**
4. auth user — **absent now**; Product supports invite-gated signup before accept

---

## 10. Recommended test role

**`viewer`**

| Role | Verdict |
| --- | --- |
| Admin | meaningful but excess privilege |
| Staff | mid privilege |
| Viewer | **recommended** — membership proof, minimal privilege, easy Members verification |

Owner never invited. No role assigned in Stage 1.

---

## 11. Delivery lifecycle

Expected after future Owner submit:

1. Authorize actor + org + role  
2. Durable `create_organization_invitation`  
3. Orchestrate delivery (gate/allowlist/config)  
4. Persist attempt result  
5. Honest Owner UI status  

**Create before provider dispatch** (not transactional around provider). Delivery failure does not roll back invitation row.

---

## 12. Acceptance lifecycle

Future (gates ON): open secure URL → authenticate as bound identity → Accept RPC → membership+role → terminal accepted → Owner sees member → replay safe.

Stage 1: **not executed**.

---

## 13. Resend

| Item | Contract |
| --- | --- |
| Allowed states | pending (not expired terminal path per RPC) |
| Token | rotated on successful resend RPC |
| Expiry | refreshed (+7 days) |
| Delivery | post-mutation orchestration; idempotent attempt keys |
| Abuse | mutation rate-limit migration present |
| Stage 1 | **no resend** |

---

## 14. Revoke / cancel

| Item | Contract |
| --- | --- |
| Who | Owner all; Admin for staff/viewer targets |
| Result | pending → revoked; accept after revoke fails |
| Audit | RPC event |
| Stage 1 | **no revoke** |

---

## 15. Expiry

| Item | Contract |
| --- | --- |
| Duration | **7 days** |
| Clock | server/`now()` in RPC |
| After expiry | accept/resend reject `invite_expired` |
| Scheduler | **lazy evaluation** (no required expiry job) |
| Stage 1 | values unchanged |

---

## 16. Failure / recovery

| Scenario | Durable invite | Retryability | Owner message | Diagnostics | Idempotency |
| --- | --- | --- | --- | --- | --- |
| Provider reject | yes (if create succeeded) | manual resend later | classified error | attempt store | keys prevent blind dup send |
| Timeout / 5xx | yes | no auto-retry; safe re-entry via attempt store | provider_error class | attempt store | provider + app keys |
| Delivery OFF | yes possible | enable gate later + resend path | delivery disabled honesty | none provider | N/A |
| Duplicate create request | pending reuse / already_pending | — | honest code | — | RPC |
| Never receives mail | pending remains | resend if authorized | UI pending | attempts | — |

No blind retries in Product.

---

## 17. Browser QA readiness

Reuse B1-C1 Playwright Production Owner harness (`playwright/.auth/production-owner.json` gitignored).

Stage-1 read-only Members checks (`/settings/members?org=2fc07699-…`):

| Check | Desktop | Mobile (Chromium + iPhone 13 device metrics) |
| --- | --- | --- |
| Open Members | PASS | PASS |
| Member list / roles | PASS | PASS |
| Restricted-rollout notice (gates OFF) | PASS | PASS |
| Invite entry / form inspect | form present for Owner; **submit not pressed** | invite copy present; **submit not pressed** |
| Overflow | OK | `scrollWidth === clientWidth` (390) |
| Console/page errors | none observed | none observed |

**Do not create a second browser framework.**

---

## 18. Automated test coverage

Existing fixture/unit/security suites (non-Production delivery):

- feature gate, delivery orchestration/idempotency/template
- create schema validation, email normalization, permissions, status lifecycle
- RPC/migration/acceptance/rate-limit/delivery-attempt security tests

Automatable matrix items 1–26 map primarily to these fixtures + future Playwright Members extensions. **No Production email** in fixture tests.

Gap note: full Playwright invite-form negative matrix on Production remains **HUMAN-ASSISTED / fixture-first** until Stage 2+ authorization.

---

## 19. Production controlled-test plan

| Phase | Action | Stage 1 |
| --- | --- | --- |
| 1 | Safe baseline / gates OFF | **DONE** |
| 2 | Exact recipient + role Owner-approved | **WAIT** |
| 3 | Enable minimum delivery/acceptance gates | **STOP — not started** |
| 4 | Owner submits exactly one invitation | blocked until later |
| 5 | Verify one durable invitation | — |
| 6 | Verify one provider delivery attempt | — |
| 7 | Inbox receipt confirmation | — |
| 8–9 | Open + accept once | — |
| 10 | Membership/role/audit | — |
| 11 | Replay/security | — |
| 12 | Restore safe resting gates | — |
| 13 | Evidence + Git publication | Stage-1 evidence only |

Also required before Phase 3: Owner cleanup disposition (CB-Q1): leave temporary Viewer membership **or** pause controlled acceptance.

---

## 20. Mutation budget (later controlled window)

| Mutation | Max if Owner approves later | Stage 1 actual |
| --- | --- | --- |
| New invitations | 1 | **0** |
| Initial delivery attempts | 1 | **0** |
| Acceptance successes | 1 | **0** |
| Memberships created | 1 | **0** |
| Provider email deliveries | 1 | **0** |
| Resend | 0 unless separately authorized | **0** |
| Second recipient | 0 | **0** |

---

## 21. Privacy / security requirements

Never in logs/screenshots/evidence/Git/prompt output:

- invitation tokens, passwords, access tokens, provider API keys, raw acceptance secrets, session cookies, storageState, signed sensitive URLs

Evidence may record: invitation UUID, org UUID, role, state, boolean flags, timestamps, safe failure codes; mask recipient.

---

## 22. Known gaps

1. **CB-Q1 membership cleanup disposition unresolved** — no Product remove/suspend member path; Owner must authorize leave-membership or pause before Phase 3.
2. Local `vercel env run` + `.env.local` can false-negative provider secret presence; Production Encrypted list is authoritative.
3. Concurrent double-accept classified **PARTIAL** pending explicit Production-safe verification later.
4. Playwright invite-form validation matrix not expanded in Stage 1 (gates OFF; submit forbidden).

None of the above is a silent Product defect requiring Stage-1 implementation.

---

## 23. Owner action required

```text
OWNER ACTION REQUIRED — OWNER BROWSER SESSION REFRESH FOR B1-C2 MEMBERS QA
```

### Post-acceptance durable verification (PASS)

| Field | Value |
| --- | --- |
| Invitation | `008aa279-c18d-4c7b-97cf-5b90d09a7737` |
| `email_fp` | `dc8bd0d9c066` |
| Org | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Role | `viewer` |
| Status | **accepted** |
| `accepted_at` | `2026-08-20T04:14:32.808182+00` |
| `revoked_at` | null |
| Accepted before expiry | **yes** |
| `accepted_by` | `user_prefix=80352a2f` (sole auth user for recipient) |
| Membership | `04c1e397-f36c-4683-88da-75c8386478b7` · active · viewer · same org/user · created at accept time |
| Members | **6 → 7** |
| Target memberships | **0 → 1** |
| Pending invites | **0** |
| Accepted invites (org) | **4** |
| Delivery attempts | **3** (unchanged; +0 after accept) |
| Auth users for recipient | **1** (no duplicate) |
| Events | `invitation_created` ×1 · `invitation_accepted` ×1 · delivery attempt ×1 |
| Replay contract | fixture/security: `already_member` / terminal accepted; **no second Production accept attempted** |
| Viewer privilege contract | domain tests: Viewer cannot create/manage invitations |
| Acceptance gate OFF | `INVITATIONS_ENABLED=false` · deploy `dpl_EN6cgHzS8JafpWkHzvFp9uhfZGZe` READY |
| Delivery gate | **OFF** (unchanged) |
| Accept route effective | feature-disabled copy (**PASS**) |
| Social | publishing OFF · windows closed=1 consumed=2 · enrollments unchanged |

### Blocker for formal closure

Owner Playwright `storageState` expired (`reason=session_expired`). Members desktop/mobile live UI QA and optional Viewer session bootstrap remain.

**Owner:** locally refresh Owner auth only (do not paste password):

```text
npm run browser:auth:bootstrap
```

Then reply **Owner auth refreshed** so Cursor can finish Members UI QA and close B1-C2.

Do not remove the temporary Viewer. Do not send another invite.

---

## 24. Git state

| Check | Value |
| --- | --- |
| Implementation | `f7b3745` |
| Evidence | this document (post-accept update) |
| Shutdown deploy | `dpl_EN6cgHzS8JafpWkHzvFp9uhfZGZe` |

**B1-C2 is not closed** until Members live QA completes.
