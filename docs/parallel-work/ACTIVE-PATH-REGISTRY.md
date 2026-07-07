# ZyntixAI Active Path Registry

## 1. Purpose

Canonical record of currently active parallel-work paths. Used for S0/S1 sync checks and path-intersection blocking.

## 2. Authority

| Field | Value |
| ----- | ----- |
| Owner class | `SHARED_CONTROLLED` (parent: `docs/parallel-work/**`) |
| Normal update authority | **Computer 1 — Desktop** |
| Integration owner | Desktop |
| Laptop | Read-only unless holding an explicit shared lock |
| Bootstrap note | Initial creation occurred under `LOCK-20260707-001` (bounded bootstrap); does not grant permanent laptop canonical authority |

Update this file when a wave starts, ends, or ownership changes. Record verification SHAs in §3.

## 3. Baseline Semantics

Distinct baseline types — do not conflate.

### Source / Comparison Baseline

| Field | Value |
| ----- | ----- |
| `origin/main` (Source Main SHA) | `fd9a981` — `chore: untrack superseded foundation migration drafts` |
| Merge Base SHA | `fd9a981` |
| Candidate Parent SHA | `16716f5` — last product-track commit before governance persistence |
| Verification method | `REMOTE MAIN VERIFIED` |

### Governance Persistence Baseline

| Field | Value |
| ----- | ----- |
| Governance Baseline Commit | Introducing commit of this file on `parallel/laptop-product-track-20260707` — locate via `git log --oneline -- docs/parallel-work/ACTIVE-PATH-REGISTRY.md` |
| Persistence message | `docs(governance): close parallel execution persistence gaps` |
| Recorded in | `D2-CONDITIONS-REGISTER.md` §6 |

This registry does not embed its own commit SHA to avoid self-reference churn.

### Verification State (at persistence)

| Field | Value |
| ----- | ----- |
| Branch | `parallel/laptop-product-track-20260707` |
| Divergence vs `origin/main` | Laptop ahead (product docs + governance); 0 behind |
| Exclusive path intersection | **NONE** |
| Shared-controlled candidate touches | `README.md`, `docs/parallel-work/**` — covered by `LOCK-20260707-001` |

## 4. Active Paths — Wave W0

| Path / Family | Track | Machine | Owner Class | Active Now | Conflict Risk | Rule |
| ------------- | ----- | ------- | ----------- | ---------- | ------------- | ---- |
| `supabase/**` | Technical Foundation | Desktop (`main`) | `DESKTOP_OWNED` | Yes | C4 if laptop touches | Desktop only; laptop hard stop |
| `supabase/migrations/**` (30 files) | Technical Foundation | Desktop | `DESKTOP_OWNED` | Yes | C4 | Absolute migration authority |
| `supabase/config.toml` | Technical Foundation | Desktop | `DESKTOP_OWNED` | No laptop delta | Low | Desktop only |
| `supabase/seed.sql` | Technical Foundation | Desktop | `DESKTOP_OWNED` | No laptop delta | Low | Desktop only |
| `package.json` | Technical Foundation | Desktop | `SHARED_CONTROLLED` | No laptop delta | C1 | Desktop lock required |
| `package-lock.json` | Technical Foundation | Desktop | `SHARED_CONTROLLED` | No laptop delta | C1 | Desktop lock required |
| `.env.example` | Technical Foundation | Desktop | `SHARED_CONTROLLED` | No laptop delta | C1 | Desktop precedence; see `SHARED-PATH-POLICY.md` §7 |
| `README.md` | Governance | Desktop (default) | `SHARED_CONTROLLED` | Candidate touch (bootstrap) | C1 | Shared lock required post-bootstrap |
| `.gitignore` | Technical Foundation | Desktop | `SHARED_CONTROLLED` | No laptop delta | C1 | Desktop default |
| `docs/product/**` (9 files) | Product Intelligence | Laptop | `LAPTOP_OWNED` | Yes | Low | Laptop allowlist |
| `docs/ux/**` (17 files) | Product Intelligence | Laptop | `LAPTOP_OWNED` | Yes | Low | Laptop allowlist |
| `docs/parallel-work/**` | Governance | Both | `SHARED_CONTROLLED` | Yes (candidate) | C1 | Lock required; desktop update authority for canonical artifacts |
| `docs/qa/**` | Product Intelligence | Laptop | `LAPTOP_OWNED` | No | Low | Reserved |
| `docs/ai/**` | Product Intelligence | Laptop | `LAPTOP_OWNED` | No | Low | Reserved |
| `docs/demo/**` | Product Intelligence | Laptop | `LAPTOP_OWNED` | No | Low | Reserved |
| `docs/launch/**` | Product Intelligence | Laptop | `LAPTOP_OWNED` | No | Low | Reserved |
| `docs/business/**` | Product Intelligence | Laptop | `LAPTOP_OWNED` | No | Low | Reserved |
| `docs/beta/**` | Product Intelligence | Laptop | `LAPTOP_OWNED` | No | Low | Reserved |
| `docs/marketing/**` | Product Intelligence | Laptop | `LAPTOP_OWNED` | No | Low | Reserved |
| `app/**` | — | Unassigned | `BLOCKED_BY_DEFAULT` | No | High (future) | Path audit before first commit |
| `src/**` | — | Unassigned | `BLOCKED_BY_DEFAULT` | No | High (future) | Path audit before first commit |
| `lib/**` | — | Unassigned | `BLOCKED_BY_DEFAULT` | No | High (future) | Path audit before first commit |
| `components/**` | — | Unassigned | `BLOCKED_BY_DEFAULT` | No | High (future) | Path audit before first commit |
| `tests/**` | — | Unassigned | `BLOCKED_BY_DEFAULT` | No | Medium (future) | Assign per wave |
| `scripts/**` | — | Unassigned | `BLOCKED_BY_DEFAULT` | No | Medium (future) | Assign per wave |

## 5. Intersection Status

### Exclusive Path Intersection

**NONE.** No path is simultaneously active under incompatible exclusive ownership (`DESKTOP_OWNED` vs `LAPTOP_OWNED` on the same file).

### Shared-Controlled Touches (governance persistence)

- `README.md`
- `docs/parallel-work/**` (8 files including this registry)

Basis: `LOCK-20260707-001` bounded bootstrap (`SHARED-LOCK-REGISTRY.md`).

### Concurrent Remote Main Touches

**NONE OBSERVED IN `origin/main`** on shared-controlled candidate paths since merge base `fd9a981`.

### Physical Desktop Observation

`NOT DIRECTLY VERIFIED` — remote main verified at `fd9a981`.

## 6. Update Procedure

1. Desktop fetches `origin/main` and inspects laptop branch delta.
2. Desktop updates this registry with new active paths and verification SHAs.
3. Laptop proposes changes via handoff or explicit shared lock.
4. Commit with normal lock protocol after bootstrap release.
