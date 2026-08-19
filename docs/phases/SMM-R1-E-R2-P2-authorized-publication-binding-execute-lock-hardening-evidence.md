# SMM-R1-E-R2-P2 — Authorized Publication Binding & Execute Lock Hardening — Evidence

| Field | Value |
| --- | --- |
| Phase | **SMM-R1-E-R2-P2 — Authorized Publication Binding & Execute Lock Hardening** |
| Date | 2026-08-19 |
| Formal status | `SMM-R1-E-R2-P2 CLOSED WITH EVIDENCE — AUTHORIZED PUBLICATION BINDING & ONE-SHOT EXECUTE LOCK VERIFIED` |
| Parent | **SMM-R1-E-R2** remains **ACTIVE / NOT CLOSED** |
| Grandparent | **SMM-R1-E** remains **BLOCKED** |
| Production project | `dmctinrcjvsgmoxwwodw` |

```text
SMM-R1-E-R2-P2 CLOSED WITH EVIDENCE — AUTHORIZED PUBLICATION BINDING & ONE-SHOT EXECUTE LOCK VERIFIED
SMM-R1-E-R2 ACTIVE / NOT CLOSED — correctly bound authorized provider-write still required
SMM-R1-E BLOCKED — CONTROLLED PROVIDER WRITE NOT YET VERIFIED
```

---

## 1. Executive verdict

Server-authoritative controlled publish windows now bind Execute to an exact publication UUID. Mismatch `B != A` fails closed before claim/attempt/provider. One-shot consumption is transactional (`FOR UPDATE`). Prepare is disabled while a window is active. Global `SOCIAL_PUBLISHING_ENABLED` remains an independent dominant gate. P2 performed **zero** Meta provider writes. Production schema is live; publishing remains **OFF**.

---

## 2. Incident baseline

| Field | Value |
| --- | --- |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` (ZyntixAI Production QA) |
| Enrollment | `publishing_allowed` (total enrollments = 1) |
| Owner-authorized UUID | `ae6caf94-2fc7-4653-a085-0228d32e0c53` |
| Intended max_execute_count | 1 |
| Actually Executed UUID | `1f1fa14e-0208-4c12-b28f-7c185f26eec7` |
| Successful attempt | `b596f6d4-…` |
| Provider writes in incident window | exactly 1 · duplicates 0 |
| Global publishing after incident | restored **OFF** |

---

## 3. Authorized vs executed UUID discrepancy

| UUID | Role | Durable state after incident |
| --- | --- | --- |
| `ae6caf94-2fc7-4653-a085-0228d32e0c53` | Authorized | still **queued**, attempts **0**, no external id, never Executed |
| `1f1fa14e-0208-4c12-b28f-7c185f26eec7` | Incidental Execute | **succeeded**, attempts **1**, external id present |

P2 post-verify: same durable states preserved; org attempts still **3**.

---

## 4. Root cause of selection/binding failure

Execute target UUID was **client-authoritative**:

1. UI / query `publication=` / Prepare response set React `publicationId`
2. Execute form/action passed that UUID
3. `executeB18InstagramImagePublicationAction` → `executeB18ImagePublication` → `b18_start_controlled_publication_attempt` trusted the requested UUID
4. No server/DB “authorized publication for this window” contract existed

During the global ON window, a fresh Prepare created `1f1fa14e-…`, overwrote selection, and Execute published that UUID instead of `ae6caf94-…`.

---

## 5. Threat model

| Case | Expected after P2 |
| --- | --- |
| 1 Authorize A → Execute A | Allowed if all other gates pass |
| 2 UI selects B | B blocked (UI + server + DB) |
| 3 Prepare creates B | Prepare disabled while window active; authorization unchanged |
| 4 URL `publication=B` | Display only; Execute bound to A / server rejects B |
| 5 Stale tab → B | Server/DB reject B |
| 6 Forged action payload B | App assert + DB assert reject B; zero attempt |
| 7 Concurrent Execute A ×2 | `FOR UPDATE` + one-shot quota → at most one consume |
| 8 Execute B while A queued | Reject before attempt/provider |
| 9 Window closed/expired → Execute A | No active window path / exhausted / closed |
| 10 Global OFF → Execute A | App `feature_disabled` wins before provider |

---

## 6. Server-authoritative binding design

New durable tables + private assert/consume + operator open/close RPCs + member-readable active-window RPC.

When an **active** window exists for an org:

- `requested_publication_id` must equal `authorized_publication_id`
- match consumes one Execute slot atomically **before** claim
- mismatch returns `publication_not_authorized_for_window`, writes audit, **does not** consume, **does not** claim

When **no** active window: assert returns `ok` (closed-beta + global gate + lifecycle still apply). Controlled R1 Execute requires an operator-opened window.

---

## 7. Data model / migration

Local source file:

`supabase/migrations/20260819120000_add_social_controlled_publish_window_binding.sql`

Production applied via MCP `apply_migration` in three additive parts (payload sizing; same SQL content):

| Remote version | Name |
| --- | --- |
| `20260819100906` | `add_social_controlled_publish_window_binding` |
| `20260819100943` | `add_social_controlled_publish_window_operator_rpcs` |
| `20260819101032` | `harden_b18_start_controlled_publish_window_binding` |

Tables:

- `social_controlled_publish_windows` (unique one `active` per org)
- `social_controlled_publish_window_events`

RLS: Owner/Admin SELECT only; no tenant INSERT/UPDATE/DELETE. Operator mutations via `service_role` RPCs.

Note: pre-existing local vs remote timestamp divergence for B1.8/B1.9/R1-E-R1 remains (CLI `db push` blocked); P2 followed R1-A-R1 targeted MCP apply pattern. No destructive migration. Historical rows untouched.

---

## 8. Operator authority

Platform operator (service-role session + closed-beta operator gate) may:

- open a window for a specific org + publication (`max_execute_count` 1–5)
- close an active window

Tenants cannot self-authorize, replace UUID, increase quota, open global publishing, or reopen consumed windows.

App entry: `mutateControlledPublishWindowAction`.

---

## 9. Customer authority

Owner/Admin may Execute an **already authorized** publication when:

- enrollment = `publishing_allowed`
- controlled window active and matched
- global publishing ON
- lifecycle/connection/capability gates pass

Staff/viewer/member do not gain Execute. Owner/Admin cannot authorize another publication.

---

## 10. Execute validation order (implemented)

1. Authenticated user  
2. Organization membership  
3. Owner/Admin (`canManageSocialConnections`)  
4. Closed-beta `publishing_allowed`  
5. Active controlled window exists (when used for controlled R1)  
6. Window active  
7. `requested_publication_id == authorized_publication_id`  
8. Execute quota not exhausted (consume at start boundary)  
9. Publication same org + lifecycle claimable  
10. Connection healthy + `publish_image`  
11. Global publishing ON (app env gate; session GUC armed only on authenticated start path)  
12. B1.9 lease/idempotency claim+start  
13. Provider boundary  

App checks global OFF **before** deeper work; DB re-checks binding inside `b18_start` **before claim**. Mismatch → zero attempt rows.

---

## 11. Prepare-during-window behavior

**Prepare is disabled** while an active controlled window exists.

Copy:

> A controlled publication is currently authorized for execution. Finish or close that window before preparing another publication.

Server code: `controlled_window_prepare_blocked`. UI does not retarget authorization from Prepare even if Prepare were somehow invoked.

---

## 12. URL / query-param behavior

`publication=<uuid>` is **display/selection only**. It never grants authorization. Execute target prefers server `authorizedPublicationId` when a window is active. Selection ≠ authorized → fail-closed UI state; forged Execute still rejected server-side.

---

## 13. One-shot consumption

`max_execute_count=1` consumed atomically in `private.assert_and_consume_controlled_publish_window` under `FOR UPDATE` when Execute crosses the authoritative start boundary for the **authorized** publication — regardless of later success/failure/ambiguous outcome. Mismatch does **not** consume. Failed attempt does **not** reopen the window.

---

## 14. DB defense-in-depth

`b18_start_controlled_publication_attempt` calls assert/consume **before** claim / `start_social_publication_attempt`. Direct authenticated RPC with forged UUID B cannot arm provider execution for B while window authorizes A.

---

## 15. Audit contract

Event types:

- `window_authorized`
- `execute_consumed`
- `window_closed`
- `execute_denied_mismatch`

P2 verification window `ac66e6ea-49c6-4cf8-8eb6-ab136517b605` recorded:

1. `window_authorized` → `ae6caf94-…`
2. `execute_denied_mismatch` → authorized `ae6caf94-…`, requested `1f1fa14e-…`
3. `window_closed` (verification complete; consumed_execute_count remained 0)

No secrets in audit details.

---

## 16. UI contract

- Shows **Authorized publication: \<UUID\>** when window active
- Execute bound to authorized UUID
- Prepare gated off / blocked reason shown
- Mismatch selection shows fail-closed state (no silent retarget)

---

## 17. Test matrix

Automated coverage includes domain binding, incident reconstruction A vs B, Prepare-block helper, migration allowlist wiring, and source-wiring assertions in:

`tests/features/social-media/r2-p2-controlled-publish-window-binding.test.ts`

Regression (this phase):

| Suite | Result |
| --- | --- |
| Social feature + publishing/lifecycle security | **29 files / 165 tests** pass |
| typecheck (`tsc --noEmit`) | pass |
| lint (`next lint`) | pass (0 errors) |
| `npm run build` | pass (exit 0) |

---

## 18. Regression results

Covered by the Social + security suite above (B1.8/B1.9/B1.10/R1-A/R1-B/R1-C/R1-D/R1-E-R1/R1-E-R2-P1/oauth safety/adapter tests included in `tests/features/social-media` and related security migration tests). No concurrent builds.

---

## 19. Production deployment

| Item | Value |
| --- | --- |
| Schema | P2 migrations applied (see §7) |
| Deploy id | `dpl_4uwXvE3auPp5UWPcf4BjiqR7ubUt` |
| Deployment URL | `https://zyntixai-5148o8z3f-guus-projects-ai.vercel.app` |
| Alias | `https://www.zyntixai.com` |
| readyState | **READY** |
| Git SHA on deploy | `f229bfe` (implementation) |
| `SOCIAL_PUBLISHING_ENABLED` | **false** (Production env pull verified) |

---

## 20. Global OFF proof

- App gate remains fail-closed when env is false
- Publishing GUC at rest: **null/unset**
- `private.social_publishing_execution_enabled()` at rest: **false**
- No provider-write window opened in P2

---

## 21. Non-provider binding verification

Fixture window (closed after verify):

| Field | Value |
| --- | --- |
| window_id | `ac66e6ea-49c6-4cf8-8eb6-ab136517b605` |
| authorized A | `ae6caf94-2fc7-4653-a085-0228d32e0c53` |
| denied B | `1f1fa14e-0208-4c12-b28f-7c185f26eec7` |
| deny result | `publication_not_authorized_for_window` |
| window after deny | still `active`, `consumed_execute_count=0` |
| attempts delta | **0** (still 3) |
| A lifecycle | remains `queued` / attempt_count 0 |
| close | success; `active_windows=0`; consumed never incremented |

No call to provider boundary; global publishing remained OFF.

---

## 22. Incident reconstruction

Old scenario after fix:

1. Authorize `ae6caf94-…`
2. Prepare would be **blocked** (cannot mint `1f1fa14e-…` into the Execute path during the window)
3. Even if Execute(`1f1fa14e-…`) were forged → **DENIED** `publication_not_authorized_for_window`
4. Zero attempt / zero provider request for B
5. Only `ae6caf94-…` remains eligible

Automated regression: `r2-p2-controlled-publish-window-binding.test.ts` incident reconstruction case.

---

## 23. Historical preservation

Untouched evidence rows (not rewritten):

- `ae6caf94-…` (authorized-not-executed)
- `1f1fa14e-…` / attempt `b596f6d4-…` (incidental success — valid provider success, **not** controlled-authorization proof)
- `bdd8a0dc-…` / `c2d3cef0-…` (historical 4xx)
- queued leftovers `040e15f3…`, `1714161a…`, `9dd4f6ed…`
- sibling `f584f4bb-…`

Incidental Instagram success does **not** close R1-E / R1-E-R2. Prior Graph 4xx was not reproduced on the authorized UUID; no proven root cause claimed for that 4xx beyond R1-E-R1 diagnostics.

---

## 24. Provider-write delta

**0** Meta publish writes during P2. Org attempts remained **3**.

---

## 25. Known limitations

- Local migration filename `20260819120000_…` vs remote three-part timestamps (documented; same pattern as prior phases)
- When **no** active window exists, closed-beta orgs can still Execute any eligible publication if global ON — controlled R1 must open a window
- App-layer binding is advisory relative to DB; DB is authoritative for consume/deny
- Direct `b18_start` still arms session GUC (pre-existing B1.8 pattern); Production safety relies on app env kill-switch + not calling Execute when OFF

---

## 26. Recommendation for resuming R1-E-R2

Do **not** reuse `ae6caf94-…` as the final controlled success target unless a later explicit plan says so.

Preferred next sequence (separate owner gate):

1. Prepare **one** new publication; capture exact UUID  
2. Operator-open controlled window for **that** UUID (`max_execute_count=1`)  
3. Verify mismatch protections with global **OFF**  
4. Owner authorize one global ON window  
5. Execute **exactly** that UUID once  
6. Immediately restore OFF  

P2 closure does **not** close R1-E-R2 or R1-E. Do **not** start R1-F.

---

## 27. Git state

| Item | Value |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Implementation SHA | `f229bfe3150420559d35a28fdf67022e34f63ac9` |
| Evidence SHA | `30ae92366055eff844bf4a08c7e33d5c694fb139` |
| Authoritative HEAD | `30ae923` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Divergence at P2 start | `0 0` |
| Worktree | clean after evidence commit |
| Production migrations tip | `20260819101032_harden_b18_start_controlled_publish_window_binding` |
