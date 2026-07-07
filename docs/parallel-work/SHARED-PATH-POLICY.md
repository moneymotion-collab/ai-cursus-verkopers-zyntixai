# ZyntixAI Shared Path Coordination Policy

## 1. Shared by Default

The following areas are coordination-required:

- `README.md`
- `.env.example`
- `package.json`
- `package-lock.json`
- `docs/parallel-work/**`
- root configuration files
- CI/CD configuration
- build configuration
- lint configuration
- TypeScript configuration
- generated artifacts
- shared application types
- shared design system code
- global middleware
- global layout/shell files

This classification applies when such paths exist.

## 2. Explicit Release Requirement

A shared file can only be modified by the laptop after explicit release.

Required release record:

- exact path
- current owner
- temporary owner
- purpose
- start point SHA
- completion condition
- return-to-owner condition

## 3. No Simultaneous Editing

The same shared file must not be intentionally edited on both computers simultaneously.

## 4. Dependency Freeze

Laptop product/spec track must not modify:

- package manifest
- lockfile
- dependencies

unless explicitly coordinated.

## 5. Integration Checkpoint

Before integration:

- fetch remote state
- inspect divergence
- inspect changed paths
- compare ownership
- assess collisions
- only then choose merge strategy

No automatic merge or rebase is implied by this policy.

## 6. Conflict Rule

If a conflict touches Computer 1 protected technical work, the laptop must not auto-resolve it.

## 7. `.env.example` Precedence

### Variable classes

| Class | Examples | Authority | Rule |
| ----- | -------- | --------- | ---- |
| Database / Supabase / infrastructure | `NEXT_PUBLIC_SUPABASE_*`, `SUPABASE_*`, `DATABASE_*` | Desktop | Desktop-only without lock |
| Backend contracts, auth, billing, security, remote state | Any var touching server credentials or DB connectivity | Desktop | Desktop precedence |
| Product / frontend-only documentation | Future client-only vars with no backend contract | Laptop (proposed) | Laptop submits names via lock request; desktop reviews and applies |
| Secrets | Any real credential value | **Blocked** | Names only in `.env.example`; never commit real values |

### Conflict rule

If both tracks need `.env.example`:

1. One active shared lock at a time.
2. Desktop precedence for technical and security variables.
3. Laptop submits proposed product-only variable names; desktop integrates.
4. No simultaneous edits.

## 8. `README.md` Rule

- Classification: `SHARED_CONTROLLED` (permanent).
- Default owner: Desktop.
- One track may edit at a time via explicit shared lock (§2).
- Laptop changes require lock acquisition before edit.
- Canonical governance detail: `docs/parallel-work/PARALLEL-WORK-OWNERSHIP.md`.

## 9. `docs/parallel-work/**` Rule

- Classification: `SHARED_CONTROLLED`.
- Laptop may maintain policy documents during the product track.
- Desktop holds normal update authority for canonical execution artifacts:
  - `ACTIVE-PATH-REGISTRY.md`
  - `D2-CONDITIONS-REGISTER.md`
- Lock records: `SHARED-LOCK-REGISTRY.md`.
- Integration owner: Desktop.

## 10. Lock Registry

Lock records are maintained in `SHARED-LOCK-REGISTRY.md`.

Required fields per lock:

- lock ID
- exact path
- lock holder (Desktop | Laptop)
- reason
- start SHA
- release condition

## 11. Bootstrap Transition (One-Time)

D2-R1 governance candidate files were modified on the laptop without prior lock evidence. D2-R2 establishes `BT-20260707-001` and `LOCK-20260707-001` in `SHARED-LOCK-REGISTRY.md`.

This bootstrap:

- does **not** claim retroactive lock compliance for pre-D2-R2 edits;
- applies only to the enumerated D2-R1 candidate file list;
- ends immediately after governance persistence commit;
- does not grant permanent laptop canonical authority.

All subsequent shared-controlled edits require normal lock acquisition first.

