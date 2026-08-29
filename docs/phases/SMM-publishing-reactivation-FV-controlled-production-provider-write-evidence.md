# SMM-PUBLISHING-REACTIVATION-FV — Controlled Production Provider Write

| Field | Value |
| --- | --- |
| Phase | **SMM-PUBLISHING-REACTIVATION-FV** |
| Document type | Controlled Production provider-write + execution-gate verification |
| Dates | Publication created 2026-08-28; provider write and gate restore 2026-08-29 |
| Formal technical status | `SMM-PUBLISHING-REACTIVATION-FV PROVIDER PASS — OWNER VISUAL CONFIRMATION REQUIRED` |
| Prior preflight | `docs/phases/SMM-publishing-reactivation-preflight-evidence.md` |
| Prior R1 | `docs/phases/SMM-publishing-reactivation-R1-stale-QA-queue-disposition-evidence.md` |
| R1 closure HEAD | `e02196ba6e8877ee9d19d1d9f84fe72629a8a0ba` |
| Branch | `core/platform-readiness-20260707` |
| Production project | `dmctinrcjvsgmoxwwodw` |
| Production app | `https://www.zyntixai.com` |

This phase performed exactly one NEW Production Instagram IMAGE write through the governed Owner Execute path, then returned publishing OFF. It did **not** enable scheduling, reuse historical publications, permanently enable publishing, or change application code.

`SMM-PUBLISHING-REACTIVATION-FV OWNER AUTHORIZATION = PROVEN`

`SMM-PUBLISHING-REACTIVATION-FV CONTROLLED PRODUCTION PROVIDER WRITE = AUTHORIZED`

`CONTROLLED PROVIDER WRITE COUNT = 1`

`DUPLICATE PROVIDER WRITE = FALSE`

`PUBLISHING EXECUTION = OFF`

`SCHEDULING EXECUTION = OFF`

`SOCIAL TARGETED TEST SUCCESS RATE = 100%`

`INSTAGRAM CONTROLLED REACTIVATION VISUAL CONFIRMATION = OWNER CONFIRMATION REQUIRED`

---

## 1. Executive verdict

The controlled Production publishing path held:

safe repository → gates OFF → clean queue → healthy Instagram connection → one new QA IMAGE publication → one exact one-shot window → publishing ON / scheduling OFF → one Owner-governed claim → exactly one provider write → Instagram success → provider ID persisted → publication `succeeded` → window consumed → no second attempt → publishing returned OFF → post-OFF worker dry-run with no claim.

Technical/provider execution succeeded. Owner visual confirmation of the Instagram Business account is still outstanding. Permanent publishing enablement was **not** executed and is **not** recommended from this document alone.

---

## 2. Owner authorization

Exact string present in this run’s owner prompt:

`SMM-PUBLISHING-REACTIVATION-FV CONTROLLED PRODUCTION PROVIDER WRITE = AUTHORIZED`

Scope for this run only:

- one NEW Production QA Social publication;
- one exact new controlled execution window;
- temporary `SOCIAL_PUBLISHING_ENABLED=true`;
- exactly one Instagram provider write;
- verification of that publication;
- immediate return of publishing to OFF.

Not authorized: the five cancelled historical QA rows; multiple posts; scheduling enablement; permanent publishing activation; bulk queue execution; unrelated retries; DATA mutations; unrelated Production product changes.

Printed before the first Production mutation:

`SMM-PUBLISHING-REACTIVATION-FV OWNER AUTHORIZATION = PROVEN`

and the exact authorization string above.

---

## 3. Prior preflight dependency

`SMM-PUBLISHING-REACTIVATION-PREFLIGHT CLOSED WITH EVIDENCE — OWNER QUEUE DISPOSITION REQUIRED BEFORE REACTIVATION`

Evidence: `docs/phases/SMM-publishing-reactivation-preflight-evidence.md`

Commit: `fd0ce53310b6efd0f99044e5790c7f5a42ffca50`

---

## 4. R1 queue-disposition dependency

`SMM-PUBLISHING-REACTIVATION-R1 CLOSED WITH EVIDENCE — STALE QA QUEUE SAFELY DISPOSED`

Evidence: `docs/phases/SMM-publishing-reactivation-R1-stale-QA-queue-disposition-evidence.md`

Authoritative R1 HEAD: `e02196ba6e8877ee9d19d1d9f84fe72629a8a0ba`

Post-R1 readiness: `SMM PUBLISHING REACTIVATION READINESS = READY`

---

## 5. Repository start state

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `e02196ba6e8877ee9d19d1d9f84fe72629a8a0ba` |
| Subject | `docs(social): verify stale QA queue disposition` |
| Upstream | `origin/core/platform-readiness-20260707` |
| Upstream SHA | `e02196ba6e8877ee9d19d1d9f84fe72629a8a0ba` |
| Divergence | `0 0` |
| Status | clean |
| Staged / unstaged / untracked | none |
| `git diff --check` | clean |

No implementation change. No migration. `DB-MIGRATION-DRIFT-01` untouched. Unexpected repository mutation: none.

---

## 6. Production identity

| Surface | Value |
| --- | --- |
| Application | `https://www.zyntixai.com` |
| Supabase project | `dmctinrcjvsgmoxwwodw` |
| QA organization | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Instagram connection | `24420652-d0b4-4237-9a75-51d89be50c65` |
| Connection label | `zyntixai` Business |

Tokens and credentials were not printed.

---

## 7. Provider health

Re-proved immediately before the new publication and after FV:

| Check | Result |
| --- | --- |
| Status | `connected` |
| Health | `healthy` |
| Professional type | `business` |
| Reconnect required | no (`reauthorization_required_at` null) |
| Token expiry | `2026-10-27 08:44:23+00` (refreshed `2026-08-28 08:44:24+00`) |
| Required capability | `publish_image` present (also video/carousel/story/short; unused) |

Provider health did not change. No stop.

---

## 8. Gate pre-state

Inspected actual runtime, not documentation alone.

| Control | Pre-write |
| --- | --- |
| Vercel `SOCIAL_PUBLISHING_ENABLED` | present, Encrypted; runtime **not** exact `true` |
| Vercel `SOCIAL_SCHEDULING_ENABLED` | present, Encrypted; runtime **not** exact `true` |
| GUC `zyntix.social_publishing_enabled` | NULL |
| `private.social_publishing_execution_enabled()` | **false** (fail-closed) |
| Live worker HTTP **1931** `2026-08-28 09:35:00+00` | `mode=dry-run`, `publishingEnabled=false`, `schedulingEnabled=false`, `claimed=0` |

`PUBLISHING EXECUTION = OFF`

`SCHEDULING EXECUTION = OFF`

Scheduling helper is env-only (`parseSocialSchedulingEnabled`). Worker claim requires **both** gates exact `true`; otherwise mode is `dry-run`.

---

## 9. Scheduler state

| Check | Result |
| --- | --- |
| Cron job | `zyntixai_social_publication_scheduler_5m` |
| jobid | **1** |
| Schedule | `*/5 * * * *` |
| Active | true |
| Duplicate Social Cron | **0** |
| `vercel.json` `"crons"` | `[]` (native Vercel Social Cron = **0**) |
| Command | `select private.invoke_social_publication_scheduler();` |

Scheduling execution remained OFF throughout FV. Cron continued invoking the worker in dry-run.

---

## 10. Queue pre-state

Immediately before creating the new publication (2026-08-28 ~09:35 UTC):

| Status × mode | Count |
| --- | --- |
| cancelled × immediate | 5 |
| succeeded × immediate | 4 |
| succeeded × scheduled | 2 |
| manual_intervention × immediate | 2 |
| queued / pending / claimed | **0** |
| Total publications | **13** |
| Open controlled windows | **0** (`consumed` 5, `closed` 1 historically) |
| Scheduled due list | empty |
| Global attempts | **8** |

`STALE QA IMMEDIATE QUEUED PUBLICATIONS = 0`

`IMMEDIATE ELIGIBLE PUBLICATIONS IF PUBLISHING IS ENABLED = 0`

`OPEN CONTROLLED EXECUTION WINDOWS = 0`

---

## 11. Historical cancelled-row verification

All five R1 IDs remained `cancelled`, `attempt_count=0`, no external publication ID, before and after FV:

| ID | Cancelled at (UTC) |
| --- | --- |
| `040e15f3-22f7-4b94-a16a-d30ee7ce24d4` | 2026-08-28 09:21:07 |
| `1714161a-29dd-4070-a1f0-6e2411ff363b` | 2026-08-28 09:21:22 |
| `9dd4f6ed-5d99-4cb9-9297-1051a5ed8564` | 2026-08-28 09:21:23 |
| `7da29316-5e4f-40ef-86d8-6695afb55793` | 2026-08-28 09:21:25 |
| `f584f4bb-c90b-4f19-865b-c066408368c6` | 2026-08-28 09:23:19 |

Not reopened. Not reused.

---

## 12. New controlled publication definition

Safest already Production-verified format: **IMAGE** (B1.7-R2 / B1.8 path). Not carousel, video, reel/short, story, or multi-format.

Created through existing governed Owner RPCs in one transaction (JWT claim impersonation of QA Owner `928bbcaf-6117-4fef-84a3-d1d8611373e9`, same pattern as R1 cancel):

1. `create_social_content_item`
2. `create_social_content_variant` (`image` / Instagram)
3. `set_social_variant_media_attachments`
4. `create_social_content_variant_version`
5. `submit_social_approval_decision` (`approved`)
6. `evaluate_social_variant_version_workflow_readiness` (`workflow_ready=true`)
7. `create_social_publication` (`execution_mode=immediate`)

All step result codes: `success`.

---

## 13. Publication ID

`7ae5f7fd-c4cf-4fcf-877f-6cc0431ed185`

This is the **only** publication authorized for execution in this phase.

Related identities (not executable leftovers):

| Object | ID |
| --- | --- |
| Content item | `51267d30-8ecd-4750-85e6-0278da815b18` |
| Variant | `d2072c6a-02ec-4560-9206-e8b084aa28ee` |
| Version | `3dae3f98-70fd-4e2f-a204-5f25185ed021` |
| Idempotency key | `smm_pub_react_fv_20260828_img1` |

---

## 14. Safe asset / content identity

| Field | Value |
| --- | --- |
| Asset | `46080b38-068a-45db-91b9-90cbc329721a` |
| Kind | existing synthetic QA JPEG already on the governed Social asset path (1254×1254, used previously for B1.7-R2; **publication row not reused**) |
| Brand | `75c299c2-dae2-4b76-8ad9-f92308d7440a` |
| Workspace | `4ce070a9-d1bc-40f3-a44a-061274bca9cb` |
| Title | `SMM-PUBLISHING-REACTIVATION-FV controlled IMAGE` |
| Caption | `ZYNTIXAI SMM-PUBLISHING-REACTIVATION-FV controlled IMAGE — safe to delete` |
| Alt text | `ZyntixAI controlled publishing reactivation verification image` |
| Org | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| Connection | `24420652-d0b4-4237-9a75-51d89be50c65` |

No customer PII. No secrets. Private storage URLs not printed.

---

## 15. Pre-execution publication state

| Field | Value |
| --- | --- |
| Created | `2026-08-28 09:37:56.057407+00` |
| Organization | QA org |
| Connection | intended Instagram connection |
| Provider | `instagram` |
| Mode | `immediate` |
| Status | `queued` |
| Attempt count | **0** |
| External publication ID | absent |
| Claimed | no |
| Publishing | still OFF |
| Scheduling | still OFF |
| Open windows | still **0** |

---

## 16. Controlled window creation

Opened **while both gates were still OFF** via `operator_open_social_controlled_publish_window`.

| Field | Value |
| --- | --- |
| result_code | `success` |
| window_id | `4f8571ad-50cb-487f-86c1-e692aa70f10b` |
| publication_id | `7ae5f7fd-c4cf-4fcf-877f-6cc0431ed185` |
| organization_id | `2fc07699-ece5-44b9-bbb3-abbc23e9fffb` |
| connection_id | `24420652-d0b4-4237-9a75-51d89be50c65` |
| max_execute_count | **1** |
| consumed_execute_count at open | **0** |
| status at open | `active` |
| reason | `SMM-PUBLISHING-REACTIVATION-FV controlled IMAGE` |
| created_by_actor_user_id | `928bbcaf-6117-4fef-84a3-d1d8611373e9` |
| created_at | `2026-08-28 09:39:08.407032+00` |

Not a wildcard, org-wide, multi-window, historical, or permanent authorization.

---

## 17. Exact window scope

Window publication binding = exactly `7ae5f7fd-c4cf-4fcf-877f-6cc0431ed185`.

Immediately after open:

`OPEN CONTROLLED EXECUTION WINDOWS = 1`

---

## 18. Final pre-enable checks

| Check | Result |
| --- | --- |
| Connection | connected / healthy; reconnect no |
| Scheduling | OFF |
| Open windows | **1**, bound to the new ID |
| Publication attempts | 0 |
| Provider ID | absent |
| Other immediate eligible | **0** besides this one authorized candidate |
| Scheduled due / executable scheduled | **0** |
| Worker | Bearer `CRON_SECRET` only; query-secret still rejected in route |
| Historical cancelled IDs | still cancelled |
| Global attempts | still **8** |

`AUTHORIZED PROVIDER WRITE CANDIDATES = 1`

---

## 19. Publishing enablement

Authoritative Production path (Vercel project `zyntixai`, scope `guus-projects-ai`):

1. `vercel env rm SOCIAL_PUBLISHING_ENABLED production`
2. stdin `true` → `vercel env add SOCIAL_PUBLISHING_ENABLED production`

`SOCIAL_SCHEDULING_ENABLED` was **not** removed or rewritten.

Then Production was redeployed from the then-canonical Ready deployment `dpl_F3PMxGPuf38fcSDAuopteuL1v7oV` so the Next.js process actually received the new env.

| Field | ON deployment |
| --- | --- |
| id | `dpl_GLFcQgGEwaHJWFm3aKActpLyEmsh` |
| URL | `https://zyntixai-dahrcdgic-guus-projects-ai.vercel.app` |
| Alias | `https://www.zyntixai.com` |
| Created | 2026-08-28 11:47:25 CEST |
| State | Ready |

Env values were not printed. Unrelated secrets were not pulled.

---

## 20. Runtime gate verification

Automatic Cron worker JSON (headers not selected):

| HTTP id | Created UTC | mode | publishingEnabled | schedulingEnabled | claimed | providerWriteAttempted | dueDiscovered |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 1933 | 2026-08-28 09:45:00 | dry-run | false | false | 0 | false | 0 |
| **1934** | **2026-08-28 09:50:00** | **dry-run** | **true** | **false** | **0** | **false** | **0** |
| 2350 | 2026-08-29 20:30:00 | dry-run | true | false | 0 | false | 0 |
| 2351 | 2026-08-29 20:35:00 | dry-run | true | false | 0 | false | 0 |

After configuration propagation:

`PUBLISHING EXECUTION = ON`

`SCHEDULING EXECUTION = OFF`

Worker remained `dry-run` because scheduling stayed OFF. Enable/redeploy alone performed **0** provider writes.

Operational note: Owner Execute occurred on 2026-08-29, so the ON deployment remained aliased for more than one day. Throughout that interval Cron ticks stayed dry-run, `claimed=0`, and global attempts stayed **8** until the single Owner Execute. No unauthorized write occurred. This is **not** permanent enablement; the gate was restored OFF after the write.

---

## 21. Controlled execution

Cursor browser could not authenticate as Owner (`/login?next=/social%3Fsection%3Dpublish`). `b18_start` was **not** invoked from SQL (that would claim without a provider write).

Governed path used: Owner signed in and clicked **Execute image publish** once on `/social?org=2fc07699-ece5-44b9-bbb3-abbc23e9fffb&section=publish` for publication `7ae5f7fd-…`.

Action: `executeB18InstagramImagePublicationAction` → `executeB18ImagePublication` → `b18_start_controlled_publication_attempt` → Instagram adapter → `b18_complete_controlled_publication_attempt`.

Required conjunction: Owner/Admin session, exact publication ID, publishing gate ON, scheduling OFF, valid connection, queued publication, exact one-shot window.

---

## 22. Claim result

| Field | Value |
| --- | --- |
| Claimed publications | **1** (`7ae5f7fd-c4cf-4fcf-877f-6cc0431ed185`) |
| Claimed at | `2026-08-29 20:30:15.202508+00` |
| claimed_by | `b18_d7d1ceff202c46f1` |
| claim_generation | 1 |
| Other publications claimed | **0** |

---

## 23. Provider write count

`CONTROLLED PROVIDER WRITE COUNT = 1`

Adapter invoked exactly once on the success path. No other publication was claimed. Cron did not write.

---

## 24. Provider result

| Field | Value |
| --- | --- |
| API outcome | success |
| Publication status after complete | `succeeded` |
| Completed at | `2026-08-29 20:31:25.04402+00` |
| Duration | **69.84 s** (matches prior IMAGE ~70.69 s container-poll path) |
| last_failure_class | null |
| Retry scheduled | no (`next_attempt_at` unchanged leftover of create; status terminal) |
| manual_intervention | no |

Success-path diagnostic columns on the attempt (`provider_http_status`, `provider_step`, `provider_request_dispatched`) remain null by existing design (failure-only persistence). Persistence proof is the publication-level external ID + attempt `outcome=succeeded`.

Access tokens were not exposed.

---

## 25. Provider publication ID

| Check | Result |
| --- | --- |
| Returned by provider | yes |
| Persisted on publication (`external_publication_id`) | **present** |
| Length | 17 characters |
| Printed | **no** (presence + length only) |

---

## 26. Publication final status

`succeeded`

`attempt_count = 1`

No second attempt. No `manual_intervention`.

---

## 27. Attempt final status

| Field | Value |
| --- | --- |
| Attempt id | `17a9fadc-e9a6-48a8-a656-418d0e79062b` |
| attempt_number | **1** |
| outcome | `succeeded` |
| retryable | false |
| failure_class | null |
| started_at | `2026-08-29 20:30:15.202508+00` |
| finished_at | `2026-08-29 20:31:25.04402+00` |
| worker_id | `b18_d7d1ceff202c46f1` |

Attempts for this publication after FV: **1**.

---

## 28. Window consumption

Window consumed **at claim** (same timestamp as start):

| Field | After execute |
| --- | --- |
| window_id | `4f8571ad-50cb-487f-86c1-e692aa70f10b` |
| status | `consumed` |
| consumed_execute_count | **1** |
| max_execute_count | 1 |
| consumed_at | `2026-08-29 20:30:15.202508+00` |
| closed_at | null |
| Open windows | **0** |

`OPEN CONTROLLED EXECUTION WINDOWS = 0`

The consumed window cannot authorize a second write. `operator_open` also refuses `succeeded` (allowed start statuses are only `pending|queued|failed_retryable`).

---

## 29. Replay / duplicate prevention

Safest no-op verification used (no forced second provider write):

- Succeeded publication has `attempt_count=1` and exactly one attempt row after all later ticks.
- Active window count returned to 0; consumed window is not `active`.
- Execute action asserts window **before** `b18_start`. After consume, `get_active_social_controlled_publish_window` returns no active row.
- `b18_start` / claim excludes terminal `succeeded`.
- Adapter was not invoked again (global attempts **9** = prior 8 + this 1).

`TOTAL PROVIDER WRITE ATTEMPTS FOR CONTROLLED PUBLICATION = 1`

`DUPLICATE PROVIDER WRITE = FALSE`

Owner was instructed not to click Execute twice. A second Owner click was not requested after success.

Note: `evaluateControlledPublishWindowBinding` treats “no active window” as `ok_no_window` for the **manual** Execute UI. Replay safety after success is therefore the **terminal succeeded exclusion** plus inability to open a new window on a succeeded row — not an indefinite “missing window denies Execute” rule. Scheduler path remains fail-closed without a window (`CONTROLLED_SCHEDULED_ROLLOUT_REQUIRED`). Scheduling stayed OFF.

---

## 30. Publishing disablement

Immediately after success verification:

1. `vercel env rm SOCIAL_PUBLISHING_ENABLED production`
2. stdin `false` → `vercel env add SOCIAL_PUBLISHING_ENABLED production`
3. Redeploy `dpl_GLFcQgGEwaHJWFm3aKActpLyEmsh` → new Ready production

| Field | OFF deployment |
| --- | --- |
| id | `dpl_987D3AXjtukGydaSk9z5HCMHrgH7` |
| URL | `https://zyntixai-8lw780juv-guus-projects-ai.vercel.app` |
| Alias | `https://www.zyntixai.com` |
| Created | 2026-08-29 22:34:00 CEST |
| State | Ready |

`SOCIAL_SCHEDULING_ENABLED` untouched.

---

## 31. Post-disable runtime verification

Automatic Cron worker HTTP **2352** `2026-08-29 20:40:00.111667+00`:

| Field | Value |
| --- | --- |
| status_code | 200 |
| mode | `dry-run` |
| publishingEnabled | **false** |
| schedulingEnabled | **false** |
| claimed | 0 |
| providerWriteAttempted | **false** |
| dueDiscovered | 0 |

DB at rest: GUC unset / `private.social_publishing_execution_enabled()` remains fail-closed unless a worker transaction sets it locally after the env gate.

`PUBLISHING EXECUTION = OFF`

`SCHEDULING EXECUTION = OFF`

---

## 32. Post-disable dry-run

`POST-FV PROVIDER WRITE ATTEMPTED = FALSE`

Worker path after restore: dry-run, publishing false, scheduling false, no claim, no provider write. Publication remained `succeeded` with the same single attempt.

---

## 33. Queue final state

| Status × mode | After FV |
| --- | --- |
| cancelled × immediate | 5 (unchanged historical) |
| succeeded × immediate | **5** (was 4; +1 controlled) |
| succeeded × scheduled | 2 (unchanged) |
| manual_intervention × immediate | 2 (unchanged) |
| queued / pending / claimed / processing | **0** |
| Total publications | **14** |
| Open windows | **0** |
| Global attempts | **9** |

`IMMEDIATE ELIGIBLE PUBLICATIONS AFTER FV = 0`

`OPEN CONTROLLED EXECUTION WINDOWS AFTER FV = 0`

---

## 34. Provider-write accounting

| Metric | Before | After | Delta |
| --- | --- | --- | --- |
| New publication rows | 13 | 14 | **+1** (`7ae5f7fd-…`) |
| Controlled provider attempts | 0 on new ID | 1 | **+1** |
| Succeeded immediate | 4 | 5 | **+1** |
| Global attempts | 8 | 9 | **+1** |
| Duplicates | 0 | 0 | **0** |
| Unrelated provider attempts during the write | — | — | **0** |

---

## 35. Security verification

No permission broadening. No migration. Automated Social security suite 219/219 plus feature coverage:

- Owner/Admin governed Execute (`canManageSocialConnections` + closed-beta publish entitlement + window assert).
- Staff/Viewer remain forbidden on the Execute action (existing tests).
- Foreign organization cannot satisfy QA-org context.
- `service_role` remains the infrastructure executor for Cron (`createSocialSchedulerDatabaseClient`); member Execute uses the user session.
- Window authorization is exact-ID scoped (`publication_id` + `max_execute_count=1`).
- Cron secret handling unchanged: Vault-backed Bearer only; `?secret=` / `?cron_secret=` still rejected as `missing_credentials`.
- Connection remains tenant-scoped (`organization_id` on publication and connection).

---

## 36. Unrelated Social non-effects

| Surface | Result |
| --- | --- |
| Five cancelled historical IDs | still cancelled, attempts 0 |
| Prior succeeded rows | still succeeded (immediate 4 historical + 2 scheduled unchanged) |
| manual_intervention | still 2 |
| authorization_pending shells | still **6** |
| Connection health | unchanged connected/healthy |
| Expected new Social state | one publication, one window (now consumed), one attempt |

---

## 37. Unrelated product non-effects

Counts after FV match the R1 non-effect baseline except Social (+1 publication, +1 attempt):

| Surface | Count |
| --- | --- |
| Customers | 116 |
| Memberships | 22 |
| Invitations | 16 |
| DATA sessions | 4 |
| mappings / staging | 0 / 0 |
| TAX releases | 1 |
| capabilities | 13 |
| context packs | 2 |

No DATA / Customers / BQA / TAX / CAP / CTX / memberships / invitations / Path B / billing / onboarding mutation attributable to FV.

---

## 38. Targeted Social tests

`npx vitest run` on Social feature + domain + security (PowerShell required explicit domain/security file lists; feature directory glob worked):

| Slice | Files | Tests |
| --- | --- | --- |
| `tests/features/social-media` | 40 | 280 |
| `tests/domain/social-*.test.ts` + `tests/security/social-*.test.ts` | 36 | 219 |
| **Total** | **76** | **499** |

**499 passed / 499.** No implementation tests added (no code change).

Coverage includes publishing gate behavior, scheduling gate independence, immediate controlled windows, claim, provider adapter, success persistence, retry/idempotency, duplicate prevention, succeeded/cancelled terminal behavior, worker auth, tenant isolation, authorization.

---

## 39. Targeted success rate

`SOCIAL TARGETED TEST SUCCESS RATE = 100%`

`499 / 499 = 100%`

---

## 40. Typecheck

`npx tsc --noEmit` — PASS

---

## 41. Lint

`npx next lint` — PASS (`✔ No ESLint warnings or errors`)

---

## 42. Build

`next build` is not required by the current Social closure convention (same as R1). Not run.

---

## 43. Full suite

`npx vitest run`

**3247 passed, 2 failed, 3249 total**

---

## 44. Full-suite percentage

`3247 / 3249 = 99.94%`

Do not call this 100%.

`FULL REPOSITORY 100% RESTORATION REMAINS A SEPARATE QUALITY OBJECTIVE`

---

## 45. Historical failures

Unchanged:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

`HISTORICAL FAILURES = 2`

Not repaired inside this Social FV.

---

## 46. New regressions

`NEW REGRESSIONS = 0`

---

## 47. Visual confirmation requirement

A successful API/provider result is necessary but not sufficient for FV closure.

Owner should inspect the intended Instagram Business account (`zyntixai` / connection `24420652-…`) and confirm:

- exactly one intended QA IMAGE is visible for this FV;
- caption/content match `ZYNTIXAI SMM-PUBLISHING-REACTIVATION-FV controlled IMAGE — safe to delete`;
- no duplicate of this FV post;
- no unintended extra publication appeared.

Do not require owner credentials in Cursor.

`INSTAGRAM CONTROLLED REACTIVATION VISUAL CONFIRMATION = OWNER CONFIRMATION REQUIRED`

This document does **not** mark visual confirmation PASS.

---

## 48. Permanent enablement recommendation

Do **not** permanently leave publishing enabled. FV ended with publishing OFF.

Next decision is a **separate** governed phase. Options prepared, not executed:

**A.** Keep publishing disabled except owner-authorized one-shot windows (current safe default).

**B.** Move to a separate permanent publishing enablement phase that must separately decide: publishing ON default; whether scheduling stays OFF or becomes ON; queue policies; operator controls; kill switch; monitoring; alerting; rollback.

This FV does **not** choose A or B as policy. Safer operational posture until visual confirmation and a dedicated enablement phase: **A**.

---

## 49. Residual risks

Known residual (not introduced here; present in `executeB18ImagePublication`):

If `adapter.publish` succeeds and the process dies **before** `b18_complete_controlled_publication_attempt` persists the provider ID, Instagram may already have the media while the row is still `processing`/`claimed`. Window is already consumed at start, so that window cannot retry. A later `failed_retryable` transition plus a **new** window could theoretically risk a duplicate if the provider ID was never persisted. This FV’s write completed and persisted; no material new duplicate bug was discovered.

Other residuals:

- Manual Execute `ok_no_window` is permissive when no active window exists; terminal-state exclusion is the post-success claim lock.
- Publishing was ON between 2026-08-28 09:47 UTC and 2026-08-29 ~20:36 UTC while waiting for Owner Execute. Cron could not write (scheduling OFF). Immediate Execute still required Owner session + window. No extra attempts occurred. Future FV should keep the ON interval as short as Owner availability allows.

No material defect requiring a silent patch was found. FV is not BLOCKED on the technical path.

---

## 50. Final Git state

Evidence-only commit expected after this file:

Suggested: `docs(social): verify controlled Production publishing reactivation`

No implementation files. Normal push only. Never force-push.

Required after push:

- branch `core/platform-readiness-20260707`
- upstream `origin/core/platform-readiness-20260707`
- divergence `0 0`
- worktree clean
