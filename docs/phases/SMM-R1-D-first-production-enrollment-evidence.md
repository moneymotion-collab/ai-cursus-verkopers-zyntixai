# SMM-R1-D — First Production Enrollment Evidence

**Phase:** `SMM-R1-D — FIRST PRODUCTION CLOSED-BETA ENROLLMENT`  
**Date:** 2026-08-19  
**Authoritative branch:** `core/platform-readiness-20260707`  
**Production Supabase project:** `dmctinrcjvsgmoxwwodw` (`https://dmctinrcjvsgmoxwwodw.supabase.co`)

---

## 1. Executive verdict

```text
SMM-R1-D CLOSED WITH EVIDENCE — FIRST PRODUCTION ENROLLMENT APPROVED (PUBLISHING REMAINS OFF)
```

Exactly one Production organization was enrolled: **ZyntixAI Production QA**  
`2fc07699-ece5-44b9-bbb3-abbc23e9fffb`  
**not_enrolled → approved** only.

Global publishing remains OFF. No `publishing_allowed` promotion. No Meta/provider writes. No second organization enrolled. Historical Social inventory unchanged. **Stop before R1-E.**

---

## 2. Owner authorization (exact)

```text
R1-D AUTHORIZE FIRST PRODUCTION ENROLLMENT
organization_id=2fc07699-ece5-44b9-bbb3-abbc23e9fffb
target_state=approved
```

Constraints honored:

- Do not promote to `publishing_allowed`
- Do not enroll a second organization
- Do not enable global publishing
- Do not perform Meta/provider write
- Do not reconnect/disconnect Instagram
- Do not mutate historical pending/queued/publication evidence

---

## 3. Preflight context (Stage 1 → Stage 2)

| Item | Value |
| --- | --- |
| Prior milestone | `SMM-R1-C CLOSED WITH EVIDENCE` |
| Code HEAD at mutation | `c142e82bcfa289827f7c9a5b42741b8f89136aa7` |
| Operator list RPC | Verified healthy (`HTTP 200`) after service-role key correction |
| Operator UI | `/operator/social-beta` live; allowlisted operator verified |
| Pre-mutation enrollments / events | `0` / `0` |
| Pre-mutation target status | absent (`not_enrolled`) |
| `SOCIAL_PUBLISHING_ENABLED` | Remains OFF (owner constraint + GUC unset) |
| Publishing GUC | unset/null |

**Operator list incident (resolved before enrollment):** Production briefly returned `operator_list_failed` because Vercel Production `SUPABASE_SERVICE_ROLE_KEY` presented an invalid `sb_secret` (`401` / `UNAUTHORIZED_INVALID_API_KEY` / `bad_checksum`). After a valid project secret was injected and Production redeployed, list RPC returned `200` with a new apikey fingerprint. Enrollment was not attempted until that fix was verified.

---

## 4. Mutation executed (exactly one)

| Field | Value |
| --- | --- |
| RPC | `public.operator_enroll_social_closed_beta_organization(uuid, text, uuid)` |
| Organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA) |
| Action | `enroll_approved` (wrapper → `private.transition_social_closed_beta_enrollment`) |
| Actor user id | `null` (platform operator path; `actor_source=platform_operator`) |
| Reason (prefix) | `R1-D AUTHORIZE FIRST PRODUCTION ENROLLMENT — not_enrolled→approved; publishing r…` |

**Result:**

| Field | Value |
| --- | --- |
| `result_code` | `success` |
| `enrollment_id` | `864a7d27-ea96-49c3-892f-858413013dbb` |
| `previous_status` | `null` (absent) |
| `next_status` | `approved` |

No `allow_publishing`, pause, resume, or revoke call was made.

---

## 5. Post-mutation database verification

| Check | Expected | Observed |
| --- | --- | --- |
| Total enrollments | exactly `1` | **`1`** |
| Other-org enrollments | `0` | **`0`** |
| Target status | `approved` | **`approved`** |
| `publishing_allowed` rows | `0` | **`0`** |
| `publishing_allowed_at` on target | unset | **unset** |
| Total enrollment events | exactly `1` | **`1`** |
| Target events | exactly one `social_beta_enrolled_approved` | **`1`** / type match |
| Event previous → next | `null` → `approved` | **match** |
| Event `actor_source` | `platform_operator` | **match** |
| Duplicate enrollment/event | none | **none** |
| Publishing GUC | false/unset | **null/unset** |

---

## 6. Historical Social inventory — unchanged

| Metric | Before | After |
| --- | --- | --- |
| `social_publications` total | `4` | `4` |
| pending | `0` | `0` |
| queued | `3` | `3` |
| succeeded | `1` | `1` |
| `social_publication_attempts` | `1` | `1` |
| Instagram connected | `1` | `1` |
| `social_connection_events` total | `8` | `8` |

Publication attempt count unchanged. Provider-write delta **0**. No connect/disconnect/reauth performed.

---

## 7. Customer UX / authority contract (approved + global OFF)

Derived from R1-C read model + permissions (no live browser session required for this closure):

| Actor / surface | Expected for `approved` + global publishing OFF | Status |
| --- | --- | --- |
| Owner/Admin — Social nav | Visible (`Social — Closed Beta`) | Contract satisfied |
| Owner/Admin — `/social` | Workspace + “Social Beta access approved” copy | Contract satisfied |
| Owner/Admin — Connect / Prepare | Allowed by closed-beta matrix (still subject to connection feature gates) | Contract satisfied |
| Owner/Admin — Execute / provider publish | **Blocked** (`closed_beta_publish_not_allowed` until `publishing_allowed`; global OFF also blocks) | Contract satisfied |
| Staff / Viewer / non-manager | **No** Social management authority (`canManageSocialConnections` = Owner/Admin only; `/social` loader returns `forbidden`) | Contract satisfied |
| Global kill switch | Remains OFF; publishing GUC unset | Verified |

Nav visibility is enrollment-based (presentation). Mutation authority remains Owner/Admin + server/SQL gates.

---

## 8. Explicit non-goals (not performed)

- No promotion to `publishing_allowed` (R1-E territory)
- No second organization enrollment
- No `SOCIAL_PUBLISHING_ENABLED=true`
- No Meta/Instagram provider HTTP
- No Instagram reconnect/disconnect
- No mutation of historical publications/attempts/queued evidence
- No R1-E start

---

## 9. Security notes

- Mutation used Production operator wrapper (`SECURITY DEFINER`, `search_path=""`, arms `zyntix.social_closed_beta_operator` in-transaction).
- `operator_*` EXECUTE remains **service_role** only (authenticated/anon not granted) per R1-B contract.
- No service-role key, JWT, or customer PII payloads recorded in this evidence.

---

## 10. Formal status

```text
SMM-R1-D CLOSED WITH EVIDENCE — FIRST PRODUCTION ENROLLMENT APPROVED (PUBLISHING REMAINS OFF)

Production enrollments = 1 (approved only)
Production enrollment events = 1 (social_beta_enrolled_approved)
publishing_allowed count = 0
SOCIAL_PUBLISHING_ENABLED = OFF
publishing GUC = unset
provider-write delta = 0

STOP BEFORE R1-E
```

---

## 11. Next phase boundary (not started)

**R1-E** (out of scope here) would cover promoting an approved org to `publishing_allowed` and/or enabling global publishing under separate explicit owner authorization.
