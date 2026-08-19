# SMM-R1-E-R2 — Controlled Provider Failure Root-Cause Verification — Evidence

| Field | Value |
| --- | --- |
| Phase | **SMM-R1-E-R2 — Controlled Provider Failure Root-Cause Verification** |
| Date | 2026-08-19 |
| Formal status | `IN PROGRESS — PREPARE PATH FIXED; FRESH OWNER PREPARE NOT YET MATERIALIZED` |
| Parent | **SMM-R1-E** remains **BLOCKED** |
| Predecessor | **SMM-R1-E-R1** remains **CLOSED** (do not reopen) |
| Sub-phase | **SMM-R1-E-R2-P1** Prepare durability / UI success contract |
| Production | `dmctinrcjvsgmoxwwodw` / `www.zyntixai.com` |

```text
R1-E-R1 CLOSED — DO NOT REOPEN
R1-E BLOCKED — DO NOT FALSELY CLOSE
R1-E-R2 ACTIVE — PREPARE PATH FIXED; AWAITING FRESH OWNER PREPARE
```

---

## 1. Authoritative baseline

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Pre-fix HEAD | `6503872b152492d4f88e462be8efcdd308839c4a` |
| P1 fix commit | `b2d42781d1d4d33165f5584057c2e0e36d040362` |
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
| Global publishing | **OFF** |
| Publishing GUC | unset · `exec_at_rest=false` |
| Meta provider write | **0** |
| Execute | **not performed** |
| Historical incident / queued leftovers | **untouched** |
| Enrollment | `publishing_allowed` · enrollments **1** |

---

## 8. Fresh publication readiness

| Item | Status |
| --- | --- |
| New R2 publication UUID | **absent** (owner Prepare after fix not yet verified) |
| Execute window | **not authorized** |

---

## 9. Owner-action-required gate

```text
OWNER ACTION REQUIRED — R1-E-R2 PREPARE PATH FIXED; PREPARE ONE FRESH IMAGE
```

Do **not** open the diagnostic Execute window until a **new** publication UUID exists with attempts **0**.

**Exact owner next action:**

1. Hard-refresh (no `publication=` param):  
   `https://www.zyntixai.com/social?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb&section=publish`
2. Prepare **one** JPEG (may be the same photo as R1-E — fix now creates a new row; a new export is still preferred).
3. Confirm success copy includes a **new** Publication ID (not `bdd8a0dc-…`).
4. Confirm the same UUID appears in Social Activity.
5. Reply with that UUID.
6. Do **not** Execute.
