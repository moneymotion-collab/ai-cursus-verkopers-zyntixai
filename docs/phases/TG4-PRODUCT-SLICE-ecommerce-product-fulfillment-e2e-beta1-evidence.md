# TG4-PRODUCT-SLICE — E-commerce / Product / Fulfillment End-to-End Beta-1

## Executive verdict

`TG4-PRODUCT-SLICE CLOSED WITH EVIDENCE — PRODUCT OPERATIONS ORGANIZATIONS CAN OPERATE THE FROZEN PRODUCT-TO-ORDER-TO-INVENTORY-TO-FULFILLMENT-TO-COMPLETION BETA-1 WORKFLOW`

`BETA-1 CORE = 100% CLOSED WITH EVIDENCE`

`FOUR-TARGET-GROUP BETA-1 PRODUCT = IMPLEMENTATION IN PROGRESS — NOT YET COMPLETE`

`TG4 SLICE IMPLEMENTED ≠ TG4 FINAL VERIFIED`

`TG4 DOES NOT USE PROJECTS`

`INSUFFICIENT STOCK = FAIL CLOSED`

`ATOMIC INVENTORY IMPACT REQUIRED`

`DEFERRED COMMERCE SCOPE NOT PULLED INTO BETA-1`

## Repository

| Field | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Start HEAD | `42d12704b80a94598eb7d938a3ee8574aea775cb` |
| Final implementation HEAD | `af4bd45caf22920350eeff7c955bec0c89b171dc` |
| Implementation commit | `af4bd45caf22920350eeff7c955bec0c89b171dc` — `feat(beta1): complete product operations slice` |
| Evidence HEAD commit | `docs(beta1): record product slice closure HEAD` (the commit containing this alignment) |
| Upstream | `origin/core/platform-readiness-20260707` |
| Start divergence | `0 0` |
| Final divergence | `0 0` after normal push |
| Worktree | clean before implementation and after push |

## Investigation

The required foundations were inspected before implementation: Customer schema
and detail continuity, shared Attention and Home composition, AppShell/module
registry and direct-route enforcement, CTX terminology, Members/RBAC,
security-definer/RLS conventions, shared Project and TG3 transaction/status
precedents, archive and idempotency patterns, generated types, migration
security tests, CAP mappings, and the current Product target matrix.

No hidden Product, Order, Order Item, Inventory, or Fulfillment implementation
existed. CAP/CTX already seeded the four Product capabilities and terms, but
the module registry correctly treated them as unimplemented before this phase.

## Gap analysis

| Frozen TG4 step | Current state before TG4 | Gap | Required action |
| --- | --- | --- | --- |
| Product | capability and term seeded only | no secure operational catalog | implement Products with normalized org-scoped SKU and archive lifecycle |
| Order | capability and term seeded only | no Customer transaction unit | implement inventory-backed Orders |
| Inventory impact | absent | no on-hand state, audit, atomic deduction, or oversell protection | balance + immutable ledger + transactional RPC |
| Fulfillment | capability and term seeded only | no queue or lifecycle | use one validated status on Order and implement `/fulfillment` |
| Completion visibility | absent | no completion timestamp/history | terminal timestamp + status history + completed queue |
| Attention | shared architecture only | no Product/Order exceptions | out-of-stock and stalled-fulfillment rules |
| Home composition | generic Attention already composed | Product exceptions lacked lawful sources | reuse Home Attention composition with Product/Order titles and links |

Only these gaps were implemented.

## Before state

Product Operations organizations could manage Customers and shared core
surfaces, but no Product workflow existed. Product capabilities were
`context_ready` declarations only. Projects were already hidden in Product
context and remain hidden.

## Product architecture

`public.products` contains the organization, name, normalized uppercase SKU,
optional description, creator Member, archive state, and timestamps.
`(organization_id, sku)` is unique and deterministic across active/archive
states. Creating a Product atomically creates its zero balance. Archived
Products cannot be selected by the Order RPC; historical Order snapshots stay
readable.

Routes: `/products`, `/products/new`, `/products/[productId]`,
`/products/[productId]/edit`.

## Order architecture

`public.orders` belongs to one same-organization Customer and stores a unique
organization reference, one authoritative fulfillment status, terminal
timestamps, request identity, canonical request items, actor, and timestamps.

`public.order_items` requires a positive integer quantity and one Product per
Order. It stores Product name and SKU snapshots so historical Orders do not
depend on a mutable or archived catalog label.

There are no prices, payments, tax, discounts, refunds, or Project references.

## Order Items

The create form supports one or more Product lines. Client validation rejects
nonpositive quantities and duplicate Products; the RPC independently parses
and validates canonical JSON. Composite foreign keys prohibit cross-org Order
or Product references.

## Inventory architecture

`public.inventory_balances` holds one nonnegative integer on-hand quantity per
Product. `public.inventory_movements` is the immutable audit trail for:

- `adjustment`
- `order_deduction`
- `order_restoration`

Every adjustment records a nonzero delta, resulting balance, reason,
authorized Member, timestamp, and idempotency key. This is intentionally not a
warehouse, replenishment, supplier, or purchasing system.

## Atomic inventory behavior

`public.create_inventory_order` performs Customer validation, canonical
multi-item validation, active Product validation, stock locking/checking,
Order creation, Item insertion, balance deduction, movement insertion, and
initial status history in one PostgreSQL transaction.

Any exception rolls back the complete RPC. For on-hand `5`, an Order for `6`
raises `insufficient stock`; no Order, Item, movement, or balance mutation can
commit.

## Concurrency / oversell protection

The RPC locks every affected `inventory_balances` row with `FOR UPDATE` in
deterministic Product-ID order before validating availability. The deduction
occurs while those locks are held and a database check additionally forbids a
negative balance.

Thus, with stock `5`, two concurrent requests for `4` serialize. The first may
commit a balance of `1`; the second then observes `1` and fails. Both cannot
succeed.

Advisory transaction locks serialize equal organization/idempotency keys
before lookup. Unique keys and canonical payload comparison make create
Order, adjustment, and fulfillment retry-safe without accepting a mismatched
payload.

## Fulfillment

Order `fulfillment_status` is the single source of truth:

`pending → in_progress → completed`

`pending|in_progress → cancelled`

`completed` and `cancelled` are terminal. Completion sets `completed_at`.
Cancellation before completion restores each Item quantity in the same
transaction. A unique restoration movement plus terminal transition and
idempotency history prevent double restoration. Completed Orders cannot be
cancelled; no financial refund semantics exist.

`/fulfillment` shows active work and completed history. Order detail exposes
status, Customer, Items, timestamps, and lawful next transitions.

## Product → Order → Inventory → Fulfillment workflow

An operator can create a Product, establish inventory through a reasoned
adjustment, open a Customer-linked multi-item Order, atomically consume stock,
progress the Order in Fulfillment, inspect exceptions in Attention, and
complete the Order while retaining status and movement history.

No step creates, queries, or requires a Project.

## Completion visibility

Completed Orders remain in the Orders list, Order detail, Product usage, and
the completed Fulfillment queue. `order_status_history` retains the auditable
lifecycle. Completion retries cannot create a second transition.

## Attention

The shared architecture now lawfully supports `product` and `order` sources:

- `inventory_out_of_stock`: active Product balance equals zero.
- `fulfillment_stalled`: pending/in-progress Order has not progressed for more
  than 48 hours.

Evaluation reuses the established source/rule dedupe key, appends detection
signals without a parallel inbox, and expires open/acknowledged items when the
Product has stock, is archived, or the Order progresses/completes/cancels.
Detail links lead to the Product/Inventory adjustment or Order/Fulfillment
surface without exposing raw IDs as labels.

## Home composition

No separate commerce dashboard was added. Existing Home composition already
surfaces shared Attention and next-action content. Product and Order
exceptions now enter that lawful shared stream with meaningful titles,
Customer context where applicable, and target links.

## Module registration

Implemented registrations:

- `products` → `/products` → `product.products`
- `orders` → `/orders` → `product.orders`
- `inventory` → `/inventory` → `product.inventory`
- `fulfillment` → `/fulfillment` → `product.fulfillment`

Each page and mutation resolves organization context and capability access
server-side. AppShell visibility is presentation only.

## Navigation/access matrix

| Module | Knowledge | Service | Field | Product | Unresolved |
| --- | --- | --- | --- | --- | --- |
| Projects | hidden | visible | Jobs | hidden | hidden |
| Products | hidden | hidden | hidden | visible | hidden |
| Orders | hidden | hidden | hidden | visible | hidden |
| Inventory | hidden | hidden | hidden | visible | hidden |
| Fulfillment | hidden | hidden | hidden | visible | hidden |

Direct URL access is evaluated by the same fail-closed module access resolver;
capability absence denies all four routes outside Product context.

## Terminology

The implemented modules consume the existing CTX terms `product`, `order`,
`inventory`, and `fulfillment` through `ProductTerminology`. Product context
uses Product/Products, Order/Orders, Inventory, and Fulfillment. Database names
remain stable domain names. No Project wording appears in the TG4 workflow.

## RLS / security

All six new tables have RLS enabled. Authenticated table grants are SELECT
only; mutation policies do not exist. Mutations use security-definer RPCs with
`search_path = ''`, explicitly revoked defaults, authenticated-only execute,
active same-org Member checks, and Owner/Admin/Staff write roles. Archive and
restore require Owner/Admin.

Composite foreign keys enforce same-org Customer, Product, Order, balance,
movement, status history, and Member relationships. Attention Product/Order
foreign keys are also organization-anchored.

Generated types were manually synchronized under the established governed
precedent. `npx supabase status` showed the local services only partially
running and the local schema did not contain this unapplied migration.
No reset, blind db push, migration repair, linked Production mutation, or
Production type-generation side effect was used.

## TG1 preservation

Knowledge retains Programs, Enrollments, Progress, Leads, Customers, Tasks,
Attention, and Members. All Product modules remain hidden/denied. Full-suite
regression contains no new TG1 failure.

## TG2 preservation

Service retains Clients, Projects, Leads, Tasks, Attention, and Members.
Products, Orders, Inventory, Fulfillment, and Field modules remain
hidden/denied. Shared Project behavior was not changed.

## TG3 preservation

Field retains Jobs, Sites, Work Orders, Dispatch, Customers, Tasks, Attention,
and Members. Product modules remain hidden/denied. The focused suite includes
the TG3 end-to-end UI regression.

## Explicitly deferred

No storefront, checkout, payment/Stripe, marketplace, carrier/label, warehouse
allocation, multi-warehouse, return/RMA, refund/replacement, purchase order,
supplier, manufacturing, bundle, promotion, tax, fraud, subscription, pricing,
forecasting, barcode, serial/batch, warehouse route, pick optimization,
Product CMS/image, or external commerce integration was introduced.

## Tests / quality

Focused acceptance:

`npx vitest run tests/security/tg4-product-slice-migration-security.test.ts tests/actions/product-operations-actions.test.ts tests/server/product-attention-read-model.test.ts tests/types/tg4-product-generated-types.test.ts tests/ui/tg4-product-operations.test.tsx tests/features/product-access/beta1-4tg-appshell-gating.test.ts tests/ui/customer-detail-presentation.test.tsx tests/ui/tg3-field-operations.test.tsx --reporter=dot`

Result: `8 files passed; 54 tests passed; 0 failed`.

Concurrency and idempotency are structurally proven in
`tg4-product-slice-migration-security.test.ts`: deterministic `FOR UPDATE`,
atomic deduction, nonnegative constraint, advisory retry lock, payload
comparison, and unique deduction/restoration identities all pass.

Full suite:

`498 test files: 496 passed / 2 failed`

`3551 tests: 3549 passed / 2 failed`

The two failures are exactly the accepted historical baseline:

1. `tests/features/invitations/load-member-administration-page.test.ts`
2. `tests/ui/programs-enrollments-stale-copy-remediation.test.ts`

`NEW REGRESSIONS = 0`

Other gates:

- `npm run typecheck` — PASS
- `npm run lint` — PASS, zero warnings/errors
- `npm run build` — PASS; one pre-existing Social CSS autoprefixer warning
- TG4 migration security — `10/10` PASS
- Product Operations actions — `7/7` PASS
- Product Attention mapping — `2/2` PASS
- Product UI — `5/5` PASS

## Changed files

Implementation commit: `53 files changed, 3048 insertions, 7 deletions`.

The phase adds one migration, ten Product route pages, the
`src/features/product-operations/` domain/server/action/UI/validation slice,
five TG4 tests, and governed updates to AppShell, module access, terminology,
Customer continuity, Attention, generated types, and affected shared fixtures.

Migration: `supabase/migrations/20260905175421_tg4_product_slice.sql`.

Tables: `products`, `inventory_balances`, `orders`, `order_items`,
`inventory_movements`, `order_status_history`.

Public RPCs: `create_product`, `update_product`, `archive_product`,
`restore_product`, `adjust_product_inventory`, `create_inventory_order`,
`transition_order_fulfillment`, `evaluate_product_attention_rules`.

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

`CTX BETA_SUPPORTED PROMOTION = NO`

`CORE REOPENED = NO`

`DATA REOPENED = NO`

## Scope compliance

The diff is TG4-scoped. Product remains `context_ready`; BQA/admission is
unchanged; Projects remain absent from Product domain and navigation; shared
systems are extended only where required for capability gating, cross-links,
and Attention.

## Final verdict

`TG4-PRODUCT-SLICE CLOSED WITH EVIDENCE — PRODUCT OPERATIONS ORGANIZATIONS CAN OPERATE THE FROZEN PRODUCT-TO-ORDER-TO-INVENTORY-TO-FULFILLMENT-TO-COMPLETION BETA-1 WORKFLOW`

All 43 phase success criteria are satisfied at the implementation-slice level.
This does not mark TG4 Final Verified.

## Next required phase

Reconcile the frozen roadmap against repository state and proceed to governed
target Final Verification (`TG2-FV`, `TG3-FV`, `TG4-FV`) in the approved order.
Do not invent another implementation slice and do not mark any target Final
Verified from this closure.
