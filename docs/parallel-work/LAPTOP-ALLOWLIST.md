# ZyntixAI Laptop Path Allowlist

## 1. Default Rule

Everything is denied unless explicitly allowed.

## 2. Authorized Laptop Documentation Zones

- `docs/product/**`
- `docs/ux/**`
- `docs/ai/**`
- `docs/qa/**`
- `docs/demo/**`
- `docs/launch/**`
- `docs/business/**`
- `docs/beta/**`
- `docs/marketing/**`
- `docs/parallel-work/**`

## 3. Current L0-C Write Authorization

During L0-C only, exactly these files are authorized for creation/modification:

- `docs/parallel-work/PARALLEL-WORK-OWNERSHIP.md`
- `docs/parallel-work/LAPTOP-ALLOWLIST.md`
- `docs/parallel-work/COMPUTER-1-PROTECTED-ZONES.md`
- `docs/parallel-work/SHARED-PATH-POLICY.md`
- `docs/parallel-work/SESSION-SAFETY-CHECKLIST.md`

## 4. Future Conditional Zones

Future source/frontend paths are not automatically authorized merely because they are frontend-related. Any future code path requires:

- explicit path audit
- ownership assignment
- no overlap confirmation
- technical release decision

## 5. Prohibited Actions

The laptop track must not perform:

- migrations
- SQL
- RLS
- auth
- backend mutations
- dependency changes
- environment changes
- broad formatting
- generated code
- package changes

## 6. Path Review Rule

Before every commit, require:

- `git diff --name-only`
- `git diff --cached --name-only`

Every changed path must be explainable and authorized.

