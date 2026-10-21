# SMM-R1-E-R2 — Controlled Provider Failure Root-Cause Verification — Evidence

| Field | Value |
| --- | --- |
| Phase | **SMM-R1-E-R2 — Controlled Provider Failure Root-Cause Verification** |
| Date | 2026-08-19 |
| Formal status | `ACTIVE — SECURITY/SELECTION BINDING INCIDENT; AUTHORIZED TARGET NOT EXECUTED` |
| Parent | **SMM-R1-E** remains **BLOCKED** |
| Predecessor | **SMM-R1-E-R1** remains **CLOSED** (do not reopen) |
| Sub-phase | **SMM-R1-E-R2** post-window binding verification |
| Production | `dmctinrcjvsgmoxwwodw` / `www.zyntixai.com` |

```text
R1-E-R1 CLOSED — DO NOT REOPEN
R1-E BLOCKED — DO NOT CLOSE
R1-E-R2 ACTIVE — SELECTION BINDING INCIDENT; AUTHORIZED UUID NOT EXECUTED
```

---

## 1. Authoritative baseline

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Pre-fix HEAD | `6503872b152492d4f88e462be8efcdd308839c4a` |
| P1 fix commit | `b2d42781d1d4d33165f5584057c2e0e36d040362` |
| Evidence SHA record | `e4954640488e5841710ace2a55dddbb79692320e` |
| Production deploy | `zyntixai-lhmd1sckm…` → `www.zyntixai.com` **Ready** (`dpl_HPu2LLKDxhHqnsMxXySUhitqdddT`) |
| R1-E-R1 implementation | `e82eff9c8406bb7afc8924b426d949ed56227780` |
| Upstream | `origin/core/platform-readiness-20260707` |
| `SOCIAL_PUBLISHING_ENABLED` | OFF (not re-enabled) |
| Publishing GUC | unset · `private.social_publishing_execution_enabled()` = **false** |
| Enrollments | **1** · `publishing_allowed` |
| Instagram connection `24420652-…` | connected · healthy · credential · `publish_image` · reauth **false** |
| Attempts total | **2** (unchanged this phase) |
| Provider-write delta | **0** |

---

## 2. Historical incident preservation

| Item | State |
| --- | --- |
| publication `bdd8a0dc-…` | `manual_intervention` (unchanged) |
| attempt `c2d3cef0-…` | `failed_terminal` · `instagram_http_4xx` |
| Idempotency key on incident | `b18_24420652d0b4_9dc7bd5a8fa228343aeab52aee99c4d930f9c550` |
| Queued leftovers | **3** unchanged: `040e15f3-…`, `1714161a-…`, `9dd4f6ed-…` |

No backfill. No retry. No mutation.

---

## 3. Reproduced Prepare success-copy mismatch

Owner Prepare (multiple times) showed:

```text
Publication prepared. Publishing is temporarily unavailable.
```

Durable Production after `2026-08-19 08:00:00Z`:

| Signal | Count |
| --- | --- |
| New publications | **0** |
| New media assets | **0** |
| New content items | **0** |
| New publication events | **0** |
| Org publication count | still **5** |
| Newest publication | still `bdd8a0dc-…` (`2026-08-19T07:33:52Z`) |

Second attempt used a different photo per owner; still no durable rows.

---

## 4. Diagnosis (SMM-R1-E-R2-P1)

### Prepare request path

| Step | Surface |
| --- | --- |
| Canonical UI | `/social?org=…&section=publish` → `B18InstagramPublishPanel` |
| Legacy | `/social/b18-instagram-publish` → redirects to canonical publish |
| Server action | `prepareB18InstagramImagePublicationAction` |
| Server prepare | `prepareB18ImagePublication` |
| Create RPC | `create_social_publication` |
| Fingerprint | SHA-256 of JPEG bytes (40 hex) · key `b18_{connection12}_{fingerprint}` |

Both surfaces use the same Prepare action.

### Exact root cause (proven)

1. **Prepare idempotency incorrectly reused `manual_intervention`**

   Early reuse used `!isTerminalPublicationStatus(status)`.
   `SOCIAL_PUBLICATION_TERMINAL_STATUSES` = `succeeded | cancelled | failed_terminal` only.
   **`manual_intervention` is not terminal**, so Prepare with the same JPEG as `bdd8a0dc-…` returned:

   - `ok: true`
   - `publicationId = bdd8a0dc-…`
   - `assetId: "reused"`
   - **no upload, no media insert, no content insert, no new publication**

   UI still rendered **"Publication prepared."** (no UUID printed).

2. **Stale UI success from `publication=` query param**

   `initialPublicationId` initialized feedback as `{ kind: "prepared" }`, so the page could show **"Publication prepared."** without any Prepare call.

Either mechanism explains UI success with zero durable rows after 08:00Z. Mechanism (1) is proven against Production key + status of `bdd8a0dc-…`. Mechanism (2) is proven in code and can amplify false confidence.

### What was not the root cause

- Global publishing OFF does **not** block Prepare for `publishing_allowed`.
- No migration/unique-index change required.
- Different byte-distinct JPEGs **must** produce distinct fingerprints; if a second photo truly differed and still produced no rows, stale UI (2) or same-byte export is the remaining explanation — not DB uniqueness of old short keys on queued leftovers.

---

## 5. Fix (application-only; no migration)

| Change | Detail |
| --- | --- |
| Domain | `isPrepareIdempotentReuseStatus` — only `pending` / `queued` / `failed_retryable` |
| Prepare | Early reuse only for those statuses; non-reusable rows (incl. `manual_intervention`) mint a new idempotency key suffix and create a **new** publication |
| Action contract | Returns `created` + `idempotencyOutcome` + durable `publicationId` |
| UI | Shows UUID; distinguishes prepared vs already prepared; URL-bound id is **"Publication selected"** not prepared |

Idempotency for active queued Prepare is preserved. Duplicate Execute protection unchanged. No Meta / Execute path changes.

---

## 6. Tests

| Suite | Result |
| --- | --- |
| Targeted Prepare durability + B1.9 lifecycle + R1 closed-beta + diagnostics + B1.8/B1.9 surface | pass |
| Social feature suite + publishing security + R1 entitlement defense | **29 files / 165 tests** pass |
| `npm run typecheck` | pass |
| `npm run lint` | pass |
| `npm run build` | pass |

---

## 7. Safety state

| Check | Result |
| --- | --- |
| Global publishing | **OFF** (env not flipped this phase; deploy Ready with existing Production env) |
| Publishing GUC | unset · `exec_at_rest=false` |
| Meta provider write | **0** |
| Execute | **not performed** |
| Org publications / attempts | still **5** / **2** |
| Historical incident / queued leftovers | **untouched** |
| Enrollment | `publishing_allowed` · enrollments **1** |
| www alias | `zyntixai-lhmd1sckm…` **Ready** |

---

## 8. Fresh publication readiness

| Item | Status |
| --- | --- |
| Target UUID | `ae6caf94-2fc7-4653-a085-0228d32e0c53` |
| created_at | `2026-08-19T09:33:21.677414Z` |
| status | `queued` · attempts **0** · external id **absent** |
| Sibling excluded | `f584f4bb-…` remains queued · **must not Execute** |
| Execute window | **OPEN** (see §10) |

---

## 9. Pre-window invariants (Stage 1) — PASS

All checks passed before gate flip: target queued/attempts0/no lease/media ready/IG healthy/enrollment publishing_allowed/enrollments=1/gate was OFF/GUC unset/attempts total=2/siblings+history untouched.

---

## 10. Diagnostic window opened (Stage 2)

| Check | Result |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | **true** (Production only) |
| ON deploy | `zyntixai-5rnfbs6ic…` → `www.zyntixai.com` **Ready** (`dpl_D7QjAf2HD6Ry8Qb5Vvanhn3eo86L`) |
| Target after ON | still `queued` · attempts **0** · no new attempt from gate alone |
| Attempts total | still **2** |
| Publishing GUC / exec_at_rest | unset / **false** |
| Agent Execute | **not performed** |

---

## 11. Owner-action-required gate (Stage 3)

```text
OWNER ACTION REQUIRED — HARD REFRESH THEN EXECUTE EXACTLY ONCE
```

```text
publication_id=ae6caf94-2fc7-4653-a085-0228d32e0c53
max_execute_count=1
```

Do **not** Execute: `f584f4bb-…`, historical queued leftovers, or `bdd8a0dc-…`.

After owner click: inspect attempt + diagnostics → **immediately** set `SOCIAL_PUBLISHING_ENABLED=false` and redeploy OFF.

---

## 12. Immediate OFF restoration (Priority 1) — PROVEN

| Check | Result |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | **false** (Production pull verified) |
| OFF deploy | `zyntixai-myk5cjqcu…` → `www.zyntixai.com` **Ready** (`dpl_2uk4ne9Rp8cdW1QdNE4wXHPDZxC1`) |
| Publishing GUC | unset |
| `exec_at_rest` | **false** |
| Further Execute | blocked by gate OFF |

---

## 13. UUID discrepancy / binding investigation (Priority 2)

### Owner-visible UI

```text
Outcome: succeeded
External id present: yes
Publication ID: 1f1fa14e-0208-4c12-b28f-7c185f26eec7
```

### Authorized target `ae6caf94-2fc7-4653-a085-0228d32e0c53`

| Field | Durable result |
| --- | --- |
| status | still **`queued`** |
| attempts | **0** |
| attempt rows | **0** |
| external id | **absent** |
| Execute during window | **NO** |

### Visible UUID `1f1fa14e-0208-4c12-b28f-7c185f26eec7`

| Classification | **internal publication UUID** (not attempt/media) |
| --- | --- |
| created_at | `2026-08-19T09:44:09.345706Z` (**during ON window**, after Stage 3 stop) |
| status | **`succeeded`** |
| attempts | **1** |
| attempt UUID | `b596f6d4-a51f-4268-9913-763419905f75` · outcome **`succeeded`** |
| external id | **present** (value not printed) |
| idempotency_key | `b18_24420652d0b4_9dc7bd5a8fa228343aeab52aee99c4d930f9c550_face2ed3` |
| media | fresh asset · jpeg · 1254×1254 · 460410 B · ready · created `09:44:08Z` |
| events | created → queued → claimed → attempt_started → attempt_succeeded |

Proven: a **new Prepare** during the ON window created `1f1fa14e-…`, then **that** publication was Executed. Execute action returns the client-supplied `publicationId`; UI displayed the executed publication’s UUID correctly for the write that landed — which was **not** the authorized target.

### Sibling / historical Execute check

| UUID | Attempts after window |
| --- | --- |
| `f584f4bb-…` | **0** (still queued) |
| `040e15f3-…` / `1714161a-…` / `9dd4f6ed-…` | **0** |
| `bdd8a0dc-…` / attempt `c2d3cef0-…` | unchanged (`manual_intervention` / `failed_terminal`) |

### Window deltas

| Metric | Value |
| --- | --- |
| New attempts during window | **1** (`b596f6d4-…` on `1f1fa14e-…`) |
| Provider writes | **1** |
| Publications gaining external id this window | **1** (`1f1fa14e-…`) |
| Authorized target attempts | **0** |

### Success-path diagnostics on `b596f6d4-…`

`provider_step`, HTTP/Graph codes, request/response flags: **null** (success path; R1-E-R1 failure diagnostics not required to populate on success).

---

## 14. Production counts (after OFF)

| Metric | After |
| --- | --- |
| Org publications | **8** (was 7 pre-window; +1 Prepare during window) |
| Queued | **5** (includes untouched authorized `ae6caf94-…`) |
| Succeeded | **2** |
| manual_intervention | **1** |
| With external id | **2** |
| Attempts total | **3** (was 2; +1) |
| Enrollments / events | **1** / **2** · status still `publishing_allowed` · `updated_at` unchanged |

---

## 15. Root-cause / phase disposition

```text
SECURITY/SELECTION BINDING INCIDENT — AUTHORIZED PUBLICATION NOT EXECUTED
```

- Authorized `ae6caf94-…` was **not** executed.
- A different durable publication `1f1fa14e-…` (fresh Prepare during ON window) received the single provider write and **succeeded**.
- Prior R1-E 4xx was **not** evaluated against the authorized target; incidental success on a same-fingerprint JPEG does **not** authorize R1-E / R1-E-R2 closure for the controlled single-UUID objective.

```text
ROOT CAUSE NOT REPRODUCED
```

(for the prior 4xx — only as an incidental observation on a non-authorized publication; **do not close**)

```text
R1-E-R2 NOT CLOSED
R1-E REMAINS BLOCKED
```

Do **not** use R1-E or R1-E-R2 success closure strings.

---

## 16. Final safety state

| Check | Result |
| --- | --- |
| Global publishing | **OFF** |
| www | `zyntixai-myk5cjqcu…` **Ready** |
| GUC / exec_at_rest | unset / **false** |
| No further Execute authorized | **yes** |
| R1-F | **not started** |
