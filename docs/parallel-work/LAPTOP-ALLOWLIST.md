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

## 3. Active Laptop Documentation Authorization

The following zones are authorized for laptop creation and modification on branch `parallel/laptop-product-track-20260707`:

| Zone | Status | Owner Class |
| ---- | ------ | ----------- |
| `docs/product/**` | **Authorized now** | `LAPTOP_OWNED` |
| `docs/ux/**` | **Authorized now** | `LAPTOP_OWNED` |
| `docs/parallel-work/**` | **Authorized with lock rules** | `SHARED_CONTROLLED` |

Within `docs/parallel-work/**`, laptop may edit policy documents (this file, ownership manifest, checklists). Canonical execution artifacts (`ACTIVE-PATH-REGISTRY.md`, `D2-CONDITIONS-REGISTER.md`) are normally updated by desktop unless laptop holds an explicit shared lock.

## 4. Reserved Future Laptop Zones

Authorized when populated; not active until first file is created:

- `docs/qa/**`
- `docs/ai/**`
- `docs/demo/**`
- `docs/launch/**`
- `docs/business/**`
- `docs/beta/**`
- `docs/marketing/**`

## 5. Blocked Implementation Roots

The following paths are `BLOCKED_BY_DEFAULT` until an explicit implementation ownership audit assigns exact subpaths:

- `app/**`
- `src/**`
- `lib/**`
- `components/**`
- `tests/**`
- `scripts/**`

No broad frontend root is authorized without subpath assignment, path-intersection check (S1), and registry update.

## 6. Future Conditional Zones

Future source paths beyond the blocked roots require:

- explicit path audit
- ownership assignment
- no overlap confirmation
- technical release decision
- registry update in `ACTIVE-PATH-REGISTRY.md`

## 7. Prohibited Actions

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

## 8. Path Review Rule

Before every commit, require:

- `git diff --name-only`
- `git diff --cached --name-only`

Every changed path must be explainable and authorized.

