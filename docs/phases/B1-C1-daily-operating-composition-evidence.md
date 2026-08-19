# B1-C1 — Daily Operating Composition — Evidence

| Field | Value |
| --- | --- |
| Phase | **B1-C1 — Daily Operating Composition** (+ **B1-C1-R1** browser automation) |
| Date | 2026-08-19 |
| Formal status | `OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP` |
| Branch | `core/platform-readiness-20260707` |
| Implementation commit (B1-C1 product) | `fbc9e0c29c25ee7dedc4b36c0cf1337e89b34a19` |
| Browser harness commit (B1-C1-R1) | *(this implementation commit)* |
| Evidence commit | *(this evidence commit)* |
| Production deploy | `dpl_3PyraG19nn8pdfZymNzJbbBEKJhH` (`zyntixai-m934z6xre-…`) |
| www alias | `https://www.zyntixai.com` |
| Migrations | **NONE** |

```text
OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP
```

---

## 1. Executive verdict

B1-C1 product composition remains Production-deployed and fixture-verified.

B1-C1-R1 added the reusable authenticated Playwright Production browser harness.
**Authenticated Production desktop/mobile/tablet specs are implemented but skipped** until the Owner completes the one-time local auth bootstrap (no credentials in chat/Git).

Do **not** close B1-C1 until `npm run browser:auth:bootstrap` succeeds and `npm run test:browser:b1-c1` passes.

---

## 2. Authoritative baseline

| Check | Result |
| --- | --- |
| Branch | `core/platform-readiness-20260707` |
| Product implementation | `fbc9e0c` |
| Prior evidence | `d5bbefe` |
| B1-MA | NEAR READY / P0 NONE |
| R1-F | remains cohort-blocked (untouched) |

---

## 3. Product problem

Start-of-day question answered by `/home` composition over Attention + Tasks.

---

## 4. Existing domain reuse

Unchanged from B1-C1: `listAttentionItems`, `listTasks`, org resolution, landing → `/home`.

---

## 5. Architecture

### Product (unchanged in R1)

Server composition + `/home` UI. No migration. No AI ranking.

### Browser QA architecture (B1-C1-R1 discovery result)

| Layer | Authoritative tool |
| --- | --- |
| Unit / composition / role / tenant / UI fixtures | **Vitest** (existing) |
| Authenticated Production desktop/mobile/tablet | **Playwright** `@playwright/test` (new, authorized by B1-C1-R1) |
| Historical phase browsers | Cursor IDE browser MCP (manual/agent evidence) |

**Prior state:** no in-repo Playwright config; `package.json` historically forbade Playwright during D6-QA; PX2 noted e2e harness needs governance approval. **B1-C1-R1 is that authorization.**

Auth strategy selected (hierarchy):

1. ~~reuse existing secure fixture~~ — none existed  
2. ~~reuse existing storage state~~ — none existed  
3. **Owner interactive login → local gitignored Playwright storageState** ← implemented  
4. Stop for owner action if bootstrap not completed ← **current stop**

Path: `playwright/.auth/production-owner.json` (gitignored). Never printed/committed.

---

## 6. Composition contract

Unchanged. Sections: Organization attention, Assigned Attention, Overdue, Due today, calm empty.

---

## 7. Priority model

Deterministic severity/date ordering. Fixture test covers critical→high + overdue/due-today mix without duplicates.

---

## 8. Role contract

Vitest loader/compose: Owner/Admin see org Attention; Staff does not.

---

## 9. Tenant isolation

Vitest loader/compose: resolver-bound org; cross-tenant rows excluded; client org param cannot override reads.

---

## 10–13. Attention / Task / Program / Activity

Unchanged boundaries. Activity still omitted.

---

## 14. UX states

Honest empty / partial failure / full error / loading preserved.

---

## 15. Mobile/a11y

CSS + semantic headings. Playwright mobile/tablet specs ready (pending auth).

---

## 16–17. Security / functional fixture tests

Daily-operating Vitest suite expanded (compose priority, honest task failure, due-today links, a11y heading ids).

Loader + role + tenant coverage retained.

---

## 18. Regression

| Suite | Result |
| --- | --- |
| daily-operating + leads-scope-boundary | **25 passed** |
| Playwright B1-C1 Production | **3 skipped** (no auth state) |

---

## 19. Browser QA evidence classes

### A. AUTOMATED AUTHENTICATED PRODUCTION QA

| Check | Result |
| --- | --- |
| Framework | Playwright Chromium |
| Auth | local storageState (missing → skip) |
| Desktop `/home` empty-state | **SKIPPED — awaiting bootstrap** |
| Mobile | **SKIPPED — awaiting bootstrap** |
| Tablet | **SKIPPED — awaiting bootstrap** |
| Unauthenticated redirect (prior) | PASS (`/home` → `/login?next=…`) |

### B. FIXTURE / TEST ENVIRONMENT QA

| Check | Result |
| --- | --- |
| Empty calm state | PASS (Vitest UI) |
| Populated Attention + overdue Task links | PASS |
| Due-today Task link | PASS |
| Staff hides org Attention | PASS |
| Fetch failure ≠ empty success | PASS |
| Priority / mixed / no duplicates | PASS |
| Cross-tenant exclusion | PASS |
| Completed/resolved/archived exclusion | PASS |

**Not Production data.**

### C. HUMAN UX OBSERVATION

| Observation | Classification |
| --- | --- |
| Brief “Loading today’s brief…” then content | **B1-C5 POLISH** (functional, bounded; `home/loading.tsx`) |
| Natural empty Assigned/Overdue/Due today | Expected Production empty (not a B1-C1 defect) |

---

## 20. Production verification

| Check | Result |
| --- | --- |
| Deploy | `dpl_3PyraG19nn8pdfZymNzJbbBEKJhH` on www |
| `/home` route | Present |
| Authenticated automated empty-state | **PENDING bootstrap** |

---

## 21. Social safety

| Check | Result |
| --- | --- |
| `SOCIAL_PUBLISHING_ENABLED` | `"false"` / fail-closed |
| Enrollments | 1 (`publishing_allowed`) |
| Windows | closed=1, consumed=2; **no active** |
| R1-F | untouched |
| Provider-write / windows created by R1 | **NONE** |

---

## 22. Known limitations / unblock

1. Authenticated Playwright Production suite requires Owner bootstrap.
2. Populated-state browser navigation against live Production not claimed (fixtures cover links/semantics).
3. Loading transition polish deferred to B1-C5.

### Exact Owner bootstrap steps (no credentials in chat)

```text
1. In the repo root, run:  npm run browser:auth:bootstrap
2. A Chromium window opens to Production login.
3. Sign in there with the legitimate Owner account (not in Cursor chat).
4. Wait until /home shows the “Today” heading for org 2fc07699-ece5-44b9-bbb3-abbc23e9fffb.
5. The script writes gitignored playwright/.auth/production-owner.json and exits.
6. Run:  npm run test:browser:b1-c1
7. Tell the agent the suite finished so evidence can close B1-C1.
```

---

## 23. Git state

Harness + matrix + evidence commits published; auth storage never committed. Expected after push: HEAD = origin, divergence `0 0`, clean except ignored auth file if present.

---

## 24. Closure verdict

```text
OWNER ACTION REQUIRED — AUTHENTICATED BROWSER SESSION BOOTSTRAP
```

**STOP before B1-C2.**
