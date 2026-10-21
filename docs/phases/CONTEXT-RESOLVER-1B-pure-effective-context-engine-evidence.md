# CONTEXT-RESOLVER-1B — Pure Effective Context Engine

| Field | Value |
| --- | --- |
| Phase | **CONTEXT-RESOLVER-1B — PURE DETERMINISTIC EFFECTIVE CONTEXT ENGINE** |
| Parent | CONTEXT-RESOLVER-1A |
| Document type | Pure-domain implementation evidence |
| Date | 2026-08-25 |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `ce835728a98235732f0fadd3c8d92e646324e45c` |
| Formal status | `CONTEXT-RESOLVER PURE ENGINE: IMPLEMENTED` |

**CONTEXT-RESOLVER PURE ENGINE: IMPLEMENTED**

**SERVER ORCHESTRATION: NOT IMPLEMENTED**

**PRODUCTION CONTEXT RESOLUTION: NOT VERIFIED**

**QA ASSIGNMENT: UNCHANGED**

---

## A. 1A source

Implementation follows the frozen CONTEXT-RESOLVER-1A architecture/security contract (design-only; no 1A commit). Binding runtime semantics are those recorded in 1A and the two clarifications below. ORG-CONTEXT-1FV remains the Production tenant/RLS floor; this phase does not call Production.

## B. Two binding clarifications

**Clarification A — parent TAX ancestry.** Every parent→child edge requires (1) explicit `parent_version_id`, (2) parent pack kind rank strictly less specific than child, (3) parent TAX target equal to the canonical ancestor node of that kind on the supplied path. Skipping intermediate kinds is allowed. TAX never discovers or replaces the pinned parent. Product Operations Foundation → Online Course Business Niche fails even though Foundation→Niche rank is valid.

**Clarification B — locale.** Locale candidates first (exact → base language when different → leaf `default_locale`), then Context inheritance for **one** chosen locale. No mixed-language terminology. No per-term English fill. No AI translation. No TAX-label substitution.

## C. Baseline

Proven before implementation:

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Upstream | `origin/core/platform-readiness-20260707` |
| HEAD | `ce835728a98235732f0fadd3c8d92e646324e45c` |
| Divergence | `0 0` |
| Worktree | clean |

## D. Pure/domain boundary

Authorized code lives only under `src/features/context-resolver/domain/**`.

The domain does **not** import `server-only`, `@supabase/*`, `next/*`, Social execution, ORG-CONTEXT server/mutation services, or `process.env`. Isolation is asserted by `tests/security/context-resolver-domain-isolation.test.ts`.

Allowed reuse: `control-plane/domain` (types + `computeCapabilityClosure`) and `org-context/domain` (`types`, `validation.isExactTaxContextCompatible`). No circular imports. No `src/features/context-resolver/server/`.

## E. Domain types

Stable resolver types in `types.ts`: `ContextResolutionMode`, `ContextResolutionInput`, `ContextChainEntry`, `EffectiveCapability`, `EffectiveCapabilityProvenance`, `EffectiveTerminology`, `EffectiveTerminologyProvenance`, `EffectiveContext`, `ResolverBusinessActivity`, `ResolverContextVersion`, `ResolverContextPack`, `ResolverCapabilityDefinition`, `ResolverCapabilityReadiness`.

`TaxonomyPath` is reused from control-plane rather than duplicated as `ResolverTaxonomyPath`. Generated Supabase Row types are not the resolver contract.

## F. Errors

Typed fail-closed codes: `NO_PRIMARY_ACTIVITY`, `ACTIVITY_UNCLASSIFIED`, `CONTEXT_UNASSIGNED`, `CONTEXT_NOT_RESOLVABLE_FOR_MODE`, `CONTEXT_VERSION_NOT_FOUND`, `PARENT_CONTEXT_NOT_FOUND`, `PARENT_CONTEXT_CYCLE`, `CONTEXT_TAXONOMY_MISMATCH`, `CAPABILITY_NOT_FOUND`, `CAPABILITY_DEPENDENCY_CYCLE`, `CATALOG_INTEGRITY_ERROR`.

`NO_PRIMARY_ACTIVITY` and `CONTEXT_UNASSIGNED` are reserved for 1C orchestration. The pure engine never selects an Activity or assignment. No fallback after error.

## G. Chain algorithm

`buildPinnedContextChain` walks **only** supplied `parentVersionId` pointers from the exact leaf, then reverses to root→leaf.

- max depth 8
- cycle / self-parent → `PARENT_CONTEXT_CYCLE`
- missing parent → `PARENT_CONTEXT_NOT_FOUND`
- duplicate pack, kind-rank regression, depth overflow → `CATALOG_INTEGRITY_ERROR`
- draft leaf/chain version rejected; published and superseded pins allowed
- extra later versions in the input array are ignored (no latest lookup)
- input arrays are not mutated

## H. Real TAX ancestry validation

For each parent→child edge, parent kind rank must be lower and `taxonomyPathNodeId(path, parent.packKind)` must equal the parent pack TAX target id. Wrong-foundation ancestry fails even when rank ordering is valid.

## I. Core baseline

Always seeded:

- `core.member-administration`
- `core.tasks`
- `core.attention`

Each is `required`, `sourceKind=system_baseline`, pack key/version null. Pack SET or REMOVE of any Core key → `CATALOG_INTEGRITY_ERROR`. Missing Core CAP definition → `CAPABILITY_NOT_FOUND`. No fourth Core key is invented.

If a future Core CAP `requires` edge is missing from the effective map, that is catalog integrity (option B). The system baseline is not silently expanded.

## J. Mapping merge

Root→leaf. ABSENT+SET adds. PRESENT+SET same/stronger replaces. PRESENT+SET weaker fails. PRESENT required+REMOVE fails. PRESENT recommended/optional+REMOVE removes. ABSENT+REMOVE is a no-op. Source mapping arrays are not mutated. Output sorted by `capabilityKey`.

## K. Relevance strength

Numeric ranks: required=3, recommended=2, optional=1. Lexical string comparison is not used.

## L. CAP dependency coherence

Reuses `computeCapabilityClosure`. Graph cycle → `CAPABILITY_DEPENDENCY_CYCLE`. After inheritance, every hard `requires` reachable from an effective capability must already be present. Missing dependencies are **never** inserted → `CATALOG_INTEGRITY_ERROR`.

## M. REMOVE-vs-requires

Fail closed. If child REMOVE deletes B while A remains and A requires B, the engine returns `CATALOG_INTEGRITY_ERROR`. B is not reintroduced.

## N. Capability lifecycle

`active`, `deprecated`, and `superseded` mapped capabilities are included with `lifecycleStatus`. `draft` → `CATALOG_INTEGRITY_ERROR`. No successor auto-follow. No key rewriting.

## O. Capability readiness metadata

Canonical `readinessStatus` is attached as metadata, not as enabled/available/authorized/entitled. Missing Core or mapped-capability readiness is treated as catalog integrity corruption for this governed v1 catalog. `supportedScope` may be supplied on input; v1 output keeps readiness status only.

## P. Context resolution mode

Type includes `internal_qa | beta | production`. Runtime policies:

| Mode | Allowed leaf readiness |
| --- | --- |
| `internal_qa` | `context_ready`, `beta_supported`, `production_verified` |
| `beta` | `beta_supported`, `production_verified` |
| `production` | `production_verified` |

`planned` or missing leaf readiness → `CONTEXT_NOT_RESOLVABLE_FOR_MODE`. There is no `ignoreReadiness` flag.

**Leaf is the admission gate.** Parent versions must be published or superseded structurally. Parent readiness is **not** independently blocking (a planned parent with a `context_ready` leaf still resolves in `internal_qa`). CTX governance still requires parents as immutable pinned dependencies; it does not currently require each ancestor's readiness row to satisfy the caller's mode.

## Q. Terminology merge

Duplicate `(versionId, locale, termKey)` → `CATALOG_INTEGRITY_ERROR`. There is no terminology REMOVE. For the chosen locale, rows are merged root→leaf by `termKey`; child replaces parent. Sorted by `termKey`.

## R. Global deterministic locale selection

`normalizeLocaleTag` is deterministic (`nl-nl` → `nl-NL`, `EN_US` → `en-US`). Candidates: exact, base language if different, leaf default. First candidate whose merged map has ≥1 term wins. Empty result: `terminology=[]`, `resolvedLocale` = leaf `defaultLocale`, `fallbackUsed` = requested locale is present and differs from that default.

## S. Effective Context shape

Output includes organization id, Activity metadata, supplied TAX path, leaf context + ancestry, `relevantCapabilities`, terminology, and resolution locale metadata. No permissions, entitlements, `can*`, `enabledCapabilities`, execution gates, or Social state.

## T. Provenance

Capability provenance: `sourceKind`, pack key/version, `establishedBy: set`, optional `overriddenFromPackKey` (previous effective source only). Terminology provenance: requested/resolved locale, `fallbackUsed`, pack key/version of the winning row.

## U. Deterministic ordering

Ancestry root→leaf. Capabilities by `capabilityKey`. Terminology by `termKey`. Taxonomy path is the supplied canonical object (Foundation→… only nodes that exist). No `Date.now`, no random ids. Shuffle tests prove identical semantic output.

## V. No permissions/entitlement

`relevantCapabilities` means Context-relevant. Comments, types, and tests state this is not subscribed/licensed/enabled/accessible/authorized.

## W. Social safety

`horizontal.social.*` may appear as optional relevance. Domain code does not import Social execution modules. Isolation test forbids `features/social-media`.

## X. No DB/server/auth/cache

No Supabase, RLS, auth, HTTP, cache, fingerprint, snapshot write, or `last_resolved_at`. No module-level memo.

## Y. Tests

- `tests/features/context-resolver/context-chain.test.ts`
- `tests/features/context-resolver/capability-resolution.test.ts`
- `tests/features/context-resolver/terminology-resolution.test.ts`
- `tests/features/context-resolver/context-resolution.test.ts`
- `tests/security/context-resolver-domain-isolation.test.ts`

Coverage includes Core baseline, SET/REMOVE/weaken, collisions, shuffle, dependency presence/transitivity/strength, REMOVE-vs-requires, cycles, lifecycle, chain/TAX ancestry, classification exact-match, readiness policies, locale algorithm, QA semantic fixture, and static isolation.

## Z. No Production effect

This phase does not read or write Production. The retained QA assignment is unchanged. Resolver is not running against Production.

---

## QA semantic fixture (observed, not an architecture constant)

Pure fixture (no Production UUIDs): Knowledge Foundation v1 → Online Course Business Niche v1, 3 Core keys, 4 Knowledge required mappings, 1 recommended leads mapping, 5 optional Social mappings, 7 CAP edges, 4 `en` Knowledge terms, `internal_qa`, requested locale `en`.

Observed `relevantCapabilities.length` = **13** (3 Core + 4 Knowledge + 6 Niche). Observed terminology = **4** inherited `en` terms. Social entries are optional relevance only.

---

## Explicit close statements

CONTEXT-RESOLVER PURE ENGINE: IMPLEMENTED

SERVER ORCHESTRATION: NOT IMPLEMENTED

PRODUCTION CONTEXT RESOLUTION: NOT VERIFIED

QA ASSIGNMENT: UNCHANGED
