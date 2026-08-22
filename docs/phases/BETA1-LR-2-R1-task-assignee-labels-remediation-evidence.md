# BETA1-LR-2-R1 — Task Assignee Labels Remediation Evidence

## M. Final Verdict

```text
BETA1-LR-2-R1 IMPLEMENTED AND DEPLOYED — OWNER VISUAL REVERIFICATION REQUIRED
```

This is **not** a close. The Tasks assignee selector now uses an org-scoped display-label RPC so colleagues are distinguishable. Owner visual recheck on Production is still required.

Do not treat the following as true until the owner supplies the exact line in §L:

```text
BETA1-LR-2-R1 CLOSED WITH EVIDENCE — TASK ASSIGNEE LABELS PRODUCTION VERIFIED
```

The parent later received an explicit owner line (not inferred here):

```text
BETA1-LR-2 FIRST-USER DESKTOP VISUAL SMOKE = PASS
```

That parent line does **not** substitute for the R1-specific confirmation in §L.

---

## A. Defect

Observed during the real first-user desktop smoke on Production:

| Item | Value |
| --- | --- |
| Route | `https://www.zyntixai.com/tasks?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA) |
| Selector | `Cessionaris` (Dutch UI for `Assignee`) |
| First option | `Elke cessionaris` (`Any assignee`) — correct |
| Defect | Multiple later options showed only `Teamlid` (`Team member`) |

The Tasks page, navigation, tenant URL, and assignment identity were otherwise working. Several different members were visually identical, so a tester could not tell which person they were selecting.

---

## B. Severity

Initial and current classification:

```text
P1 — launch-readiness usability/data-honesty defect
```

Investigation did **not** find cross-tenant leakage, deleted/revoked users incorrectly listed as default assignees, or a HIGH/CRITICAL authorization defect. Assignment values remained `organization_members.id`. Severity was not inflated.

---

## C. Root Cause

Two cooperating causes:

1. **Primary — `profiles_select_own` RLS.** Authenticated users can `SELECT` only their own `public.profiles` row. Tasks loaded assignee labels with a user-scoped `profiles.display_name` query. Colleague profile names were omitted, so the UI fell through to `"Team member"`. This is the same B1.5 production shape already documented in `src/features/enrollments/server/resolve-enrollment-labels.ts`.

2. **Secondary — empty profile names for invite-mode users.** In the QA org, 4 of 8 **active** members have an empty `profiles.display_name` but a non-empty `auth.users.raw_user_meta_data->>'display_name'`. Invite-mode users often never received a written profile name. The previous helper was effectively `displayName ?? "Team member"` and never consulted metadata.

The option **value** was already the membership id. Only the display label was dishonest.

---

## D. Data Investigation

Counts only for org `2fc07699-ece5-44b9-bbb3-abbc23e9fffb`. No names, emails, or auth IDs dumped.

| Check | n |
| --- | --- |
| Active members | 8 |
| Active with non-empty `profiles.display_name` | 4 |
| Active nameless profile, but metadata `display_name` present | 4 |
| Active with no name in profile or metadata | 0 |
| Distinct best names (`profile` else `metadata`) | 8 |
| Non-active memberships (excluded from default selector) | 2 |

The repeated `Teamlid` rows were **legitimate active same-org members**, not deleted users, not foreign-org members, and not placeholder memberships. Four of them are invite/legacy users whose profile row has no display name. Safe distinguishable names already exist in metadata for every active member.

---

## E. Fix

Smallest display-label fix. Assignment identity, role permissions, invite flow, and Members admin were not redesigned.

Chosen hierarchy (matches SQL and `resolveMemberDisplayLabel`):

1. non-empty `profiles.display_name`
2. otherwise non-empty `auth.users.raw_user_meta_data.display_name`
3. only then the existing English fallback `"Team member"`

Email is **not** used. Membership/auth UUIDs are **not** shown.

| File | Change |
| --- | --- |
| `supabase/migrations/20260822124924_add_organization_member_labels_rpc.sql` | `public.list_organization_member_labels` SECURITY DEFINER RPC; fail-closed via `private.is_org_member`; returns only `membership_id` + `display_label` |
| `src/features/tasks/domain/member-display-label.ts` | Shared helper + fallback constant |
| `src/features/tasks/server/list-organization-member-labels.ts` | Authenticated RPC client; maps rows; swallows RPC errors to `[]` |
| `src/features/tasks/ui/load-task-form-options.ts` | Selector options still keyed by membership id; labels from RPC |
| `src/features/tasks/ui/resolve-task-display-labels.ts` | Task list/detail member labels from the same RPC |

RPC contract:

* Caller must be an **active** member of `p_organization_id`.
* `p_membership_ids` null → **active** members only.
* `p_membership_ids` provided → those memberships **in that org** (any status, for historical assignees).
* Foreign org / no session → empty set.
* `EXECUTE` granted to `authenticated` only (plus default owner/service_role). `anon` / `public` revoked.

Implementation commit: `e7db52c59bb187e059be7739dd20dc54b5897b3a`

---

## F. Privacy / Security

Members administration already states: no email as a user-visible identifier (`src/features/invitations/domain/member-administration-read-types.ts`). Email fallback was therefore rejected.

Displayed fields are already user-visible names: the profile display name the product already shows when RLS allows it, or the invite/user metadata display name the member supplied. No auth IDs, membership UUIDs, provider credentials, or emails are returned by the RPC.

`raw_user_meta_data.display_name` is used **only as a display label**, never as an authorization claim.

---

## G. Tenant Safety

Unchanged invariants:

* Default selector still lists `organization_members` for the active org with `status=active`.
* Option **value** remains `organization_members.id`.
* RPC additionally requires `private.is_org_member(p_organization_id)` (`user_id = auth.uid()` and `status = 'active'`).
* Extra RPC rows that are not in the active org member list are not rendered as options.
* Session-less / foreign-org RPC calls return 0 rows (verified on Production after apply).
* Two non-active memberships in the QA org remain excluded from the default selector.

No assignment mutation, role, or tenant-scoping change.

---

## H. Regression Coverage

New / updated:

| Test | File | Coverage |
| --- | --- | --- |
| A | `tests/features/tasks/member-display-label.test.ts` | Named member shows display/full name |
| B | same | Missing profile name uses metadata fallback |
| C | same + `tests/ui/task-form-options.test.ts` | Multiple nameless-profile members stay distinguishable |
| D | `tests/features/tasks/list-organization-member-labels.test.ts` + form-options | Option/membership id stays the assignment identity |
| E | list-organization-member-labels + form-options | Foreign/extra memberships are not surfaced |
| F | list-organization-member-labels | Inactive same-org member can still be **labeled** when requested; default options remain active-only |

Also updated: `tests/ui/task-display-labels.test.ts`. Existing `tests/ui/tasks-ui-integration.test.ts` still passes.

---

## I. Validation Results

| Command | Result |
| --- | --- |
| Focused vitest (5 files) | **20 passed / 5 files** |
| `npx tsc --noEmit` | PASS |
| Targeted ESLint (4 Tasks files) | 0 errors |
| `npx next build` | PASS (pre-existing Social operator CSS warning; unrelated) |

Known historical global failures were not re-run and are not reclassified:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

---

## J. Production Deployment

| Item | Value |
| --- | --- |
| Deployment ID | `dpl_3J99ggB892zvWqJaSVFEAKq6Sh5u` |
| Ready state | READY |
| Alias | `https://www.zyntixai.com` (also `zyntixai.com`, `zyntixai.vercel.app`) |
| Created | `2026-08-22 12:51:49 UTC` (`14:51:49` local GMT+0200) |
| Deployed commit | `e7db52c59bb187e059be7739dd20dc54b5897b3a` |
| Remote migration | `20260822124924` `add_organization_member_labels_rpc` |
| Rollback | Promote `dpl_6mJFRdGUDFfmMyutk9EwQaM47BDX`; RPC is additive and unused by the previous deploy |

Post-deploy live checks:

* `/register` → `307 Location: /login?registration=disabled`
* `/login` → `200`, copy “Sign in”, `showRegistrationLink=false`
* `/invite/accept` → UnavailableState (gate ON, no token): “This invitation link is unavailable.”
* Latest Social tick `2026-08-22 12:50:00+00` `mode=dry-run` `schedulingEnabled=false` `publishingEnabled=false` `claimed=0` `providerWriteAttempted=false`

---

## K. Production Gate State

No invitation / Social / registration env mutation in R1.

| Gate | After R1 deploy |
| --- | --- |
| Public registration | OFF — `PUBLIC_REGISTRATION_ENABLED` still absent; live `/register` disabled |
| Invitation delivery | Unchanged — `INVITATION_EMAIL_DELIVERY_ENABLED` + allowlist still present Encrypted |
| Invitation acceptance | Unchanged — live UnavailableState (invitations ON, no token) |
| Social scheduling | OFF — latest tick dry-run, `schedulingEnabled=false` |
| Social publishing | OFF — `publishingEnabled=false`, `providerWriteAttempted=false` |

---

## L. Owner Visual Verification

```text
PENDING
```

Recorded `2026-08-22` `14:59` local / `12:59 UTC`: the owner supplied the **parent** desktop smoke PASS after this R1 deploy. The exact R1 confirmation below was **not** received and is not invented.

Minimum remaining R1 checkpoint. Use `https://www.zyntixai.com` only. Tester: `testtest34567810@gmail.com`. Do not enroll Social. Do not publish.

1. Open `https://www.zyntixai.com/tasks?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb`.
2. Open **Cessionaris** / Assignee.
3. Confirm `Elke cessionaris` remains first.
4. Confirm member entries are meaningfully distinguishable.
5. Confirm there are no repeated ambiguous `Teamlid` entries where a real name exists.
6. Confirm selecting/filtering still works and the layout remains usable.

Required PASS wording:

```text
BETA1-LR-2-R1 TASK ASSIGNEE LABELS VISUAL CONFIRMATION = PASS
```

---

## Residual (intentionally not changed)

The same `"Team member"` / `profiles_select_own` pattern still exists in:

* Attention assignee options
* Members administration list
* Enrollment member labels / create options
* Customer member filter
* Invitation inviter fallback

Those surfaces have different product semantics and were left alone. This remediation is Tasks assignee/filter + task display labels only.

---

## Publication

| Item | Value |
| --- | --- |
| Evidence path | `docs/phases/BETA1-LR-2-R1-task-assignee-labels-remediation-evidence.md` |
| Implementation commit | `e7db52c59bb187e059be7739dd20dc54b5897b3a` |
| Evidence commit | this commit |
| Branch | `core/platform-readiness-20260707` |
| Parent | `docs/phases/BETA1-LR-2-closed-beta-support-first-user-smoke-evidence.md` |
