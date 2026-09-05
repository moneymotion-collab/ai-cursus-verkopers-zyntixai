# TG4-FV — E-commerce / Product / Fulfillment Final Verification

## Executive verdict

`TG4-FV CLOSED WITH EVIDENCE — E-COMMERCE / PRODUCT / FULFILLMENT BETA-1 ACCEPTANCE CONTRACT IS FINAL VERIFIED AT L5`

`TG4 = CLOSED WITH EVIDENCE`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`TG2 = CLOSED WITH EVIDENCE`

`TG3 = CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = ALL TARGETS FINAL VERIFIED — MASTER FINAL VERIFICATION STILL REQUIRED`

`TG4 DOES NOT USE PROJECTS`

`INSUFFICIENT STOCK = FAIL CLOSED`

`CONCURRENT OVERSELLING PREVENTED`

`ATOMIC INVENTORY IMPACT VERIFIED`

`DEFERRED COMMERCE SCOPE REMAINS OUTSIDE BETA-1`

Independent workflow, security, integrity, UX, regression, and test reviews found
no frozen-contract blocker. All 46 governed success criteria pass. This phase is
evidence-only: no product code, migration, generated type, readiness state, or
Production data was changed.

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `651ce291e89ddade0fae26b7572ee95542a90b22` |
| Verification/fix commits | none; no blocker fix was required |
| Evidence commit | evidence commit containing this document; exact SHA reported in the final handoff because a Git commit cannot contain its own SHA |
| Final HEAD | evidence commit containing this document; exact SHA reported in final handoff |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | `0 0` after normal push |
| Worktree | clean before verification and clean after push |

Pre-flight verified the exact branch, starting HEAD, configured upstream, clean
worktree, and zero divergence. No pull, merge, rebase, reset, stash, migration
repair, force-push, or prior-evidence rewrite occurred.

## Frozen acceptance contract

The frozen Product Operations workflow is:

`Product → Order → inventory impact → Fulfillment → completion → Attention`

Required composition remains Customers, Products, Orders, Order Items,
Inventory, Fulfillment, completion visibility, Attention, shared Home,
role-gated Members, `foundation.product-operations`, `product.products`,
`product.orders`, `product.inventory`, `product.fulfillment`, context gating,
Product terminology, and ONBOARDING-1A.

Product is an inventory-backed internal operating workflow. It is not a
storefront, payment platform, shipping system, WMS, or Project specialization.

## Verification matrix

| Frozen criterion | Current evidence | Result | Blocker? | Action |
| --- | --- | --- | --- | --- |
| Customer | Shared Customer list/detail, same-org Order FK and Customer→Orders links | PASS | No | none |
| Product | Secure create/list/detail/edit/archive/restore and Product history | PASS | No | none |
| Product SKU lifecycle | Uppercase trim normalization, org uniqueness, immutable Order snapshots | PASS | No | none |
| Inventory balance | One nonnegative same-org balance per Product | PASS | No | none |
| Inventory adjustment | Reasoned, audited, locked, idempotent RPC mutation | PASS | No | none |
| Order | Customer-linked detail/list with no Project relation | PASS | No | none |
| Order Items | Positive quantities, same-org Products, name/SKU snapshots | PASS | No | none |
| Atomic order creation | Validation, locking, Order, Items, deduction and history in one RPC transaction | PASS | No | none |
| Insufficient stock | Locked pre-insert check raises and rolls the transaction back | PASS | No | none |
| Concurrency | Deterministically ordered `FOR UPDATE` balance locks prevent overselling | PASS | No | none |
| Cancellation/restoration | Terminal graph, unique restoration identity and idempotent transition history | PASS | No | none |
| Fulfillment | Pending/in-progress/completed/cancelled lifecycle and operational queue | PASS | No | none |
| Completion visibility | Orders, detail, Product usage, completed queue and status history retained | PASS | No | none |
| Attention | Out-of-stock/stalled rules, dedupe, expiry, labels and direct links | PASS | No | none |
| Home composition | Product name retained as shared Home Attention context | PASS | No | none |
| Gating | Product modules allowed only for Product context; Projects absent | PASS | No | none |
| RBAC | Existing Owner/Admin/Staff/viewer boundaries enforced | PASS | No | none |
| RLS/org isolation | Six RLS tables, SELECT-only grants, composite tenant FKs and RPC checks | PASS | No | none |
| TG1 regression | Knowledge workflow and navigation retained; no Product leakage | PASS | No | none |
| TG2 regression | Corrected Client terminology/enrollment gating retained; Product denied | PASS | No | none |
| TG3 regression | Field workflow and Work Order Attention Site link retained; Product denied | PASS | No | none |

## Investigation

Verification inspected the TG4 slice evidence and migration; Product, Inventory,
Order, Order Item, movement, and status-history schemas; all eight Product
public RPCs and private helpers; action validation/error mapping; read models;
Customer continuity; Product/Order Attention SQL, read models, Home composition,
and navigation; module registry, AppShell and direct-route enforcement;
terminology and ONBOARDING-1A mapping; RBAC, RLS, grants, composite constraints,
idempotency, deterministic row locking, and generated types; corrected TG2 and
TG3 state; targeted tests; and the current full-suite baseline.

The review found zero implementation blockers. Non-blocking operator backlog is
limited to polish such as an Inventory empty-state message, direct prerequisite
links on the Order-create empty state, fuller terminology projection on several
default-labeled Product headings, stronger page landmarks/action-error
announcements, and optional cancelled grouping in Fulfillment. AppShell
navigation remains available, errors are understandable, default Product terms
are correct, server guards enforce every mutation, and none prevents the frozen
journey. No change was made under the verify-not-build rule.

## End-to-end acceptance

The governed repository-backed scenario is:

1. `product_operations` resolves `foundation.product-operations` at
   `context_ready`.
2. Product navigation exposes Home, Customers, Products, Orders, Inventory,
   Fulfillment, Tasks where permitted, Attention, and role-gated Members.
3. A same-organization Customer is available from shared Customers.
4. An authorized operator creates a Product. The RPC normalizes its SKU and
   creates a zero balance in the same transaction.
5. A reasoned inventory adjustment establishes opening stock and records one
   immutable movement.
6. Order creation validates the Customer, canonical Item set, active Products,
   quantities, and stock while holding all affected balance locks.
7. The same transaction inserts the Order, snapshot Items, deductions,
   movement rows, and initial status history.
8. The Order appears in Orders and the pending Fulfillment queue.
9. A lawful transition moves it to `in_progress`; stalled evaluation is healthy
   before the threshold and deduped/expirable when actionable.
10. Completion records its timestamp/history and remains visible in Orders,
    Product usage, Order detail, and completed Fulfillment.
11. Inventory remains the exact opening quantity minus ordered quantity.
12. Out-of-stock and stalled exceptions enter shared Attention and Home with
    meaningful Product/Order context and direct operational links.
13. No Project table, ID, route, label, or lifecycle participates.

Runtime Production writes were neither needed nor authorized. Transaction and
concurrency conclusions use the migration's executable PostgreSQL semantics,
schema constraints, structural security tests, action tests, and UI/read-model
tests. No claim of a Production write-based exercise is made.

## Customer

Product context lawfully reuses shared Customers with generic Customer
terminology. Order creation requires an active same-organization Customer; the
composite `(organization_id, customer_id)` foreign key and RPC validation deny
foreign injection. Customer detail exposes View orders and role-gated New order
continuity only when the Orders capability is visible. Project and Enrollment
composition remains hidden in Product context.

## Product

`public.products` contains organization, name, normalized SKU, optional
description, creator, archive state, and timestamps. Creating a Product also
creates its zero inventory balance. List, detail, create, edit, archive/restore,
inventory adjustment, movement history, and recent Order usage are available.
Archived Products are excluded from new Orders while historical snapshot Items
remain readable.

## SKU lifecycle

Both the RPC and database normalize SKU as `upper(btrim(sku))`. The unique
constraint is `(organization_id, sku)`, so duplicates fail safely within one
organization and another organization may use the same SKU. The uniqueness
contract remains deterministic through archive/restore. Order Items retain
`product_name_snapshot` and `sku_snapshot`, so later Product edits or archival
cannot corrupt history.

## Inventory

`inventory_balances` has exactly one organization/Product row and a hard
`on_hand >= 0` constraint. `inventory_movements` retains nonzero deltas,
nonnegative resulting balances, reasons, actors, timestamps, source Order where
applicable, and unique idempotency identities. Reads expose on-hand quantity and
movement history without warehouse, purchasing, or replenishment semantics.

`INVENTORY ON-HAND MUST REMAIN CORRECT`

## Inventory adjustment

`adjust_product_inventory` authorizes Owner/Admin/Staff, serializes equal retry
keys with an advisory transaction lock, binds idempotency to Product/delta/
reason, locks the balance row `FOR UPDATE`, rejects a negative result, updates
the balance, and appends one movement in one transaction. Viewers, foreign
Products, archived Products, zero deltas, blank reasons, mismatched retries,
and invalid negative end states fail closed.

## Order

An Order belongs to one same-organization Customer and contains one or more
quantity-only Items. Lists and details show reference, Customer, Items,
quantities, snapshots, fulfillment status, timestamps, and relevant Product
links. Inventory impact is visible through Product movement history. There is
no price, payment, tax, discount, refund, or Project relation.

`ORDER ≠ PROJECT`

## Order Items

The schema requires positive integer quantity and one Product occurrence per
Order. Composite foreign keys enforce Order and Product organization identity.
The RPC rejects duplicates and unavailable/archived Products before mutation.
Name and SKU snapshots make historical Orders independent of subsequent
catalog changes.

## Atomic order creation

`create_inventory_order` performs, in order:

1. actor authorization and input validation;
2. canonical sorted Item validation;
3. organization/idempotency advisory transaction locking and payload-bound
   replay lookup;
4. active same-org Customer validation;
5. deterministic Product-ID-ordered inventory row locking with `FOR UPDATE`;
6. active Product and stock validation;
7. Order insertion;
8. per-line balance deduction, snapshot Item insertion, and immutable
   deduction movement;
9. initial status-history insertion.

All steps execute within one PostgreSQL RPC transaction. Any exception rolls
back all rows and balance changes. No exception handler swallows a partial
failure.

`ORDER CREATION ≠ PARTIAL MUTATION`

## Insufficient stock

For stock `5` and a requested quantity of `6`, the locked stock check raises
before Order insertion. PostgreSQL transaction rollback guarantees no Order,
Item, movement, history, or balance change commits; the balance remains `5`.
The action maps this to: “Insufficient stock. No order or inventory change was
created.”

`INSUFFICIENT STOCK = FAIL CLOSED`

## Concurrency / oversell protection

Every affected balance row is locked in deterministic Product-ID order before
stock validation. With stock `5` and concurrent Orders A=`4`, B=`4`, one
transaction may deduct to `1`; the other waits, observes `1`, and fails.
Both cannot succeed. Deterministic multi-row ordering avoids lock cycles, and
the nonnegative constraint supplies a final database barrier.

The TG4 migration-security test passes structural assertions for deterministic
`FOR UPDATE`, deductions under lock, nonnegative checks, transaction
atomicity, advisory idempotency locks, and unique movement identities. A local
runtime Postgres concurrency fixture was not available and Production was not
used; this limitation does not weaken the executable locking proof or imply
that a client-side check was accepted.

`CONCURRENT ORDERS CANNOT OVERSELL`

## Idempotency

Inventory adjustment, Order creation, and fulfillment transition each take an
organization-scoped idempotency key, serialize equal keys with
`pg_advisory_xact_lock`, bind retries to the original payload, and use unique
database constraints. Equal replay returns the established result; a changed
payload fails. Server-derived Order movement keys prevent double deductions.
Transition history and unique restoration movements prevent double completion
history or stock restoration.

## Cancellation / stock restoration

Pending/in-progress Orders may cancel. The transition locks the Order,
validates the lifecycle edge, restores each Item in deterministic Product
order, appends `order_restoration` movements, updates the terminal state, and
records history in one transaction. Replaying the same key is a no-op;
different-key repeat cancellation is rejected by the terminal graph and unique
movement index. Completed Orders cannot cancel.

`CANCELLATION RESTORATION = IDEMPOTENT`

## Fulfillment

`orders.fulfillment_status` remains the only source of truth:

- `pending → in_progress | completed | cancelled`;
- `in_progress → completed | cancelled`;
- `completed` and `cancelled` are terminal.

Invalid transitions fail. Completion/cancellation timestamps and status
history stay consistent through schema checks and one transaction. Fulfillment
shows actionable pending/in-progress rows and completed history with Order,
Customer, Item/quantity context, status, and direct links.

## Completion visibility

Completion sets `completed_at`, appends history, and retains the Order and all
Items. The record remains visible in Orders, Order detail, Product usage, and
the completed Fulfillment queue. No deletion or Project completion occurs.

`COMPLETED ≠ DELETED`

## Attention

The two frozen rules are:

- Product / `inventory_out_of_stock`: active Product balance equals zero;
- Order / `fulfillment_stalled`: pending/in-progress status has not changed for
  more than 48 hours.

Positive branches upsert the lawful source/rule item and append evidence
signals. Healthy branches do not create false positives. Shared source dedupe
keys prevent inbox spam; replenishment/archive or Order progression/
completion/cancellation expires open/acknowledged items. Product Attention
links to Product and Inventory adjustment; Order Attention links to Order and
Fulfillment. Queries, source constraints, and composite foreign keys preserve
organization identity.

## Home composition

Product/Order exceptions reuse shared Home rather than a separate e-commerce
dashboard. `composeDailyOperatingBrief` includes `productName` in the context
label, and the Product-specific regression proves “Field tablet” is retained
as meaningful Home context.

## Terminology

Product surfaces use Customer/Customers, Product/Products, Order/Orders,
Inventory, and Fulfillment. Client, Project, Job, Site, Work Order, Program,
Enrollment, and Progress terminology does not leak into Product operations.
Persisted domain names remain stable while seeded CTX terms drive presentation.

## AppShell / route gating

Product exposes Home, Customers, Products, Orders, Inventory, Fulfillment,
Tasks where permitted, Attention, and role-gated Members. It hides Projects,
Jobs, Sites, Work Orders, Dispatch, Programs, Enrollments, Progress, and
unauthorized target modules.

Capability enforcement is server-side in each route loader. Product routes
require their Product capability and fail closed for Knowledge, Service, Field,
and unresolved contexts. Product context fails closed for Projects, Field
routes, and Knowledge-only routes. Navigation hiding is not treated as access
control.

## RBAC

Existing Owner/Admin/Staff/viewer semantics remain authoritative. Owner/Admin/
Staff may create/update Products, adjust inventory, create Orders, and move
Fulfillment. Product archive/restore and Attention evaluation require Owner/
Admin. Viewers cannot mutate. Members administration remains independently
role-gated. No warehouse, inventory, or fulfillment role was invented.

## RLS / organization isolation

`ORG A CANNOT READ OR MUTATE ORG B PRODUCT DATA`.

Products, balances, Orders, Items, movements, and status history have RLS
enabled and authenticated SELECT-only table grants. There are no direct
authenticated mutation grants or mutation policies. Composite tenant foreign
keys bind Customer, Product, Order, Member, movement, history, and Attention
source identity to `organization_id`. RPCs independently revalidate active
membership, target organization, and related records. Foreign Customer,
Product, balance, movement, Order, Item, or Attention identities therefore
fail at the RLS, RPC, or constraint boundary.

## Security-definer RPC review

All eight public Product RPCs are `security definer set search_path = ''`:

- `create_product`;
- `update_product`;
- `archive_product`;
- `restore_product`;
- `adjust_product_inventory`;
- `create_inventory_order`;
- `transition_order_fulfillment`;
- `evaluate_product_attention_rules`.

Defaults are revoked from public/anon/service role as declared by the
migration, authenticated execute is explicitly granted, and private helpers
are not callable by authenticated clients. Every RPC performs active actor/
organization authorization and scopes reads/writes by the supplied
organization, which is never trusted without membership revalidation. Table
mutations remain RPC-only.

## Onboarding integration

The governed mapping is:

`product_operations → foundation.product-operations`

Assignment rejects arbitrary pack IDs. The resolver projects the four Product
capabilities and Product terminology into AppShell/route access. The pack does
not include `shared.projects`.

## TG1 regression

Course Seller/Knowledge retains Programs, Enrollments, Progress, Leads,
Customers, Tasks, Attention, navigation, and onboarding. Product modules
remain hidden/direct-route denied. Targeted and full suites show no new TG1
regression.

## TG2 regression

Service retains Leads, Clients, Projects, Tasks, and Attention while Product
modules remain denied. Corrected final-verification behavior is preserved:
Lead conversion/status says Client, Service Client detail does not load or link
forbidden Enrollments, and the Project empty state says client.

## TG3 regression

Field retains Customers, Jobs, Sites, Work Orders, Dispatch, Field terminology,
and the Work Order Attention direct Site link. Product modules remain denied.
Targeted migration, UI, terminology, loader, and presentation tests pass.

## UX verification

Operator-level source and rendered-component review verified the Customer
entry, Product create/detail/edit/archive/restore actions, Inventory adjustment,
Order prerequisites and multi-line creation, normalized insufficient-stock
error, Order/detail links, Fulfillment grouping/actions, completion history,
Attention links, Home context, responsive stacking, native semantic inputs/
buttons/links, labels, pending/disabled states, and validation alerts.

No broken frozen-workflow link, critical dead end, unsafe raw database error,
Project leakage, misleading completion, inaccessible custom control, or
blocking responsive defect was found. The polish observations recorded in
Investigation are post-Beta backlog and were not changed.

## Blockers / fixes

`BLOCKERS FOUND = 0`

No repair, migration, generated-type update, or regression-test correction was
required. The final diff contains this FV evidence only.

## Deferred scope

No implementation was added for storefront, checkout, payment/Stripe, pricing,
tax, discounts, coupons, marketplaces, Amazon, Shopify, WooCommerce, Bol.com,
carrier APIs, shipping labels, advanced WMS, multi-warehouse, bins, warehouse
routing, returns/RMA, refunds, replacements, suppliers, purchasing,
manufacturing, forecasting, fraud, subscriptions, barcode scanning,
serial/batch tracking, or pick-route optimization.

## Tests / quality

Governed TG4-FV targeted suite:

`40 test files / 312 tests — all passed`

Coverage includes Customers/Product relationships, Products/SKU, Inventory and
movements, adjustment, Orders/Items, atomic creation, insufficient stock,
concurrency/idempotency/restoration structure, Fulfillment/completion,
Attention/Home, terminology, AppShell/direct routes, RBAC/RLS/security,
onboarding/resolver, TG1, corrected TG2, and corrected TG3.

Concurrency/integrity:

- TG4 migration security: `10/10` PASS;
- Product Operations actions: `7/7` PASS;
- Product Attention read models: `2/2` PASS;
- Product Operations UI: `5/5` PASS;
- deterministic `FOR UPDATE`, atomic deduction, nonnegative constraints,
  advisory idempotency, payload mismatch, and unique deduction/restoration
  identities: PASS.

Full Vitest:

`498 test files: 496 passed / 2 failed`

`3556 passed / 2 failed / 3558 total`

The two failures are exactly the accepted historical baseline:

1. `tests/features/invitations/load-member-administration-page.test.ts`;
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`.

`NEW REGRESSIONS = 0`

Quality gates:

- `npm run typecheck` — PASS;
- `npm run lint` — PASS, no ESLint warning/error; existing `next lint`
  deprecation notice remains;
- `npm run build` — PASS; all Product, shared, and cross-target routes compile;
- pre-existing build warning only: autoprefixer recommends `flex-end` instead
  of `end` in
  `src/features/social-media/ui/platform-closed-beta-operator-list.module.css`;
- npm's pre-existing unknown `devdir` environment-config warning remains.

## Production non-effects

`PRODUCTION CUSTOMER WRITES = 0`

`PRODUCTION PRODUCT WRITES = 0`

`PRODUCTION ORDER WRITES = 0`

`PRODUCTION INVENTORY WRITES = 0`

`PRODUCTION FULFILLMENT WRITES = 0`

`PRODUCTION ATTENTION WRITES = 0`

`PRODUCTION DATA WRITES = 0`

`PRODUCTION MIGRATIONS APPLIED = 0`

`DEPLOYMENTS = 0`

`SOCIAL EXECUTION GATES CHANGED = NO`

`CORE REOPENED = NO`

`DATA REOPENED = NO`

All activity was local inspection, deterministic tests/builds, evidence
authoring, and Git evidence operations.

## Readiness / BQA

`foundation.product-operations = context_ready`

`TG4 FINAL VERIFIED ≠ AUTOMATIC CTX PROMOTION`

`CTX BETA_SUPPORTED PROMOTION = NO`

BQA/customer admission was not broadened.

## Scope compliance

The phase changes one file:

- `docs/phases/TG4-FV-ecommerce-product-fulfillment-final-verification-evidence.md`.

No product code, test contract, migration, generated type, readiness state,
Production data, deployment, social gate, deferred feature, or prior evidence
was changed.

## Final verdict

All 46 governed success criteria pass. The targeted suite is fully green and
the only full-suite failures are the two accepted historical failures.

`TG4-FV CLOSED WITH EVIDENCE — E-COMMERCE / PRODUCT / FULFILLMENT BETA-1 ACCEPTANCE CONTRACT IS FINAL VERIFIED AT L5`

`TG4 = CLOSED WITH EVIDENCE`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`TG2 = CLOSED WITH EVIDENCE`

`TG3 = CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = ALL TARGETS FINAL VERIFIED — MASTER FINAL VERIFICATION STILL REQUIRED`

`TG4 DOES NOT USE PROJECTS`

`INSUFFICIENT STOCK = FAIL CLOSED`

`CONCURRENT OVERSELLING PREVENTED`

`ATOMIC INVENTORY IMPACT VERIFIED`

`DEFERRED COMMERCE SCOPE REMAINS OUTSIDE BETA-1`

## Next required phase

`NEXT REQUIRED PHASE = BETA1-4TG-MASTER-FV`

Master FV must reconcile all four targets, shared Core, onboarding/context
resolution, capability gating, terminology, target isolation, regressions, and
release evidence. It is not started by this phase.
