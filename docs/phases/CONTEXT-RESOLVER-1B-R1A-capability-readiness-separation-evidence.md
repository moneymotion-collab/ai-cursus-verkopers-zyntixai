# CONTEXT-RESOLVER-1B-R1A — Capability Readiness Separation

| Field | Value |
| --- | --- |
| Phase | **CONTEXT-RESOLVER-1B-R1A — CAPABILITY READINESS SEPARATION REMEDIATION** |
| Parent | CONTEXT-RESOLVER-1B |
| Document type | Pure-domain contract correction evidence |
| Date | 2026-08-26 |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `7651523d71fbe569ae812c56dd4dae49a0a5d199` |

**CAPABILITY RELEVANCE: DOES NOT REQUIRE CAPABILITY READINESS RECORD**

**CAPABILITY READINESS: OPTIONAL METADATA**

**CONTEXT PACK READINESS: REMAINS RESOLUTION-MODE GATE**

---

## A. Issue discovered

CONTEXT-RESOLVER-1B treated a missing `capability_readiness` row as `CATALOG_INTEGRITY_ERROR` for both Core baseline keys and Context-mapped capabilities. That coupled capability existence to capability readiness and incorrectly treated absent maturity metadata as catalog corruption.

## B. Frozen capability/readiness separation

Capability exists ≠ capability readiness exists.

Capability relevance ≠ capability readiness.

Capability readiness ≠ entitlement, authorization, or execution enablement.

The resolver still requires a canonical capability **definition**. Readiness is optional metadata attached to resolved relevance.

## C. Old behavior

`seedSystemBaselineCapabilities` failed if a Core key had no readiness row.

Mapped SET failed if the capability existed but had no readiness row (`"Mapped capability is missing definition or readiness"`).

`EffectiveCapability.readinessStatus` was a required `CapabilityReadinessStatus`. There was no way to represent “unassessed / no row”.

## D. Corrected behavior

If the capability definition exists and the capability is effective (system baseline or Context mapping), missing readiness is valid.

`readinessStatus = null` means no canonical readiness row was supplied.

`readinessStatus = "planned"` means an explicit readiness row with status planned.

The two are not collapsed. Null is not disabled, unsupported, unentitled, or unavailable.

## E. EffectiveCapability contract

```
capabilityKey
effectiveRelevance
lifecycleStatus
readinessStatus: CapabilityReadinessStatus | null
supportedScope: CatalogSupportedScope | null
provenance
```

`supportedScope` is copied from the readiness row when present; otherwise null. It is not an enablement flag. No `isEnabled` / `isAvailable` / `isSupported` fields were added.

## F. Explicit planned vs missing distinction

| Input | Output |
| --- | --- |
| readiness row `status = planned` | `readinessStatus = "planned"` |
| no readiness row | `readinessStatus = null` |

## G. Core behavior

Core membership is unchanged: `core.member-administration`, `core.tasks`, `core.attention`. Definitions remain mandatory. Draft Core remains integrity failure. Readiness rows are optional; Core with no readiness row still appears `required` / `system_baseline` / `readinessStatus null`.

## H. Mapped capability behavior

Mapped capability without a definition still fails (`CAPABILITY_NOT_FOUND`). Draft still fails. Mapped capability with no readiness row resolves with `readinessStatus null`. Explicit `production_verified` or `planned` rows are copied through.

## I. Dependency behavior

Hard dependency coherence remains presence in the Effective Context map, not readiness. A required dependency with no readiness row still satisfies the graph. REMOVE-vs-requires remains fail-closed. Cycles still fail.

## J. CTX readiness unaffected

Leaf Context Pack readiness remains the resolution-mode admission gate:

- `internal_qa`: `context_ready | beta_supported | production_verified`
- missing or `planned` leaf Context readiness still fails

A `context_ready` pack with a capability that has no CAP readiness row may still resolve under `internal_qa`. There is no per-capability readiness admission gate.

## K. QA fixture unchanged

The canonical pure QA fixture still supplies readiness for all 13 capabilities. Observed output remains 13 `relevantCapabilities` and 4 inherited `en` terms. Missing-readiness cases are separate tests.

## L. Tests

`tests/features/context-resolver/capability-readiness-separation.test.ts` covers:

- mapped + `production_verified`
- mapped + explicit `planned`
- mapped + no readiness row → PASS / null
- Core + no readiness row → PASS / required / system_baseline / null
- hard dependency present + no readiness row → coherence PASS
- missing definition still FAIL
- draft still FAIL
- Context leaf missing/planned still FAIL
- QA fixture still 13 + canonical readiness rows

Existing resolver, shuffle, isolation, Control Plane, and ORG-CONTEXT tests remain in the suite.

## M. Isolation

Resolver domain still has zero `server-only`, `@supabase/*`, `next/*`, Social execution, env, and database imports.

## N. Production unchanged

No Production read or write. QA assignment unchanged. No migration. No generated DB types. No server orchestration.

---

CONTEXT-RESOLVER-1B-R1A CLOSED WITH EVIDENCE — CAPABILITY RELEVANCE / READINESS SEPARATION VERIFIED

CONTEXT-RESOLVER-1B = CLOSED WITH EVIDENCE
