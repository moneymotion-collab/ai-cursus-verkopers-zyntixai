# SMM-B1.4 — Master Content + Platform Variants + Media Foundation — Evidence

## 1. Executive verdict

```text
SMM-B1.4 CLOSED WITH EVIDENCE — MASTER CONTENT, PLATFORM VARIANT AND MEDIA FOUNDATION READY
SMM-B1.4 PRODUCTION SCHEMA VERIFIED — PROVIDER-NEUTRAL CONTENT AND MEDIA FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
```

## 2. Verified Git baseline

| Check | Value |
| --- | --- |
| Worktree | `D:\project ai cursus verkopers.worktrees\parallel__laptop-product-track-20260707-1` |
| Branch | `core/platform-readiness-20260707` |
| Starting HEAD | `82ea4a17116cfc89ec4ae5ffb45429efddd98738` |
| Upstream / origin | aligned `0 0` |
| Worktree | clean at start |
| Prior tip | `docs(smm): close B1.3 brand strategy campaign foundation` |

## 3. Binding A/B/C/D/B1.2/B1.3 state

Preserved. Instagram remains sole runtime connection provider. Brand Brain excludes `ai_inferred`. Planned providers remain strategic-only. B1.2 no-op stub `20260815161759` retained.

## 4. Preflight findings

Inspected D contract §§10–11, B1.3 migration/evidence, Brand/Workspace/Campaign/Pillar schemas, planned providers, RLS/RPC patterns, repo media/storage usage.

## 5. Shared-media-system investigation

**Decision:** no authoritative shared Zyntix file/media domain found (`storage.from` / shared asset tables absent in `src`).

**B1.4 choice:** Social owns `social_media_assets` with `storage_object_key` metadata only. **No** Supabase Storage bucket created. Binary upload deferred. Constant: `SOCIAL_MEDIA_STORAGE_DECISION = social_owns_metadata_storage_object_key_no_bucket_b14`.

## 6. B1.4 scope

In: Master Content, Platform Variants, Media metadata, joins, provenance/lineage, planned-provider targeting, format taxonomy, Staff-capable RPCs, RLS, audit events, tests, production schema.

Out: versioning/approval (B1.5), calendar/scheduling/publishing, analytics, AI repurposing, upload pipeline, new provider OAuth/runtime.

## 7. Files changed

- `supabase/migrations/20260815184059_add_social_master_content_variants_media_foundation.sql`
- `src/features/social-media/domain/content.ts` (new)
- `src/features/social-media/domain/types.ts` / `permissions.ts` / `index.ts`
- `tests/domain/social-content.test.ts` (new)
- `tests/security/social-content-migration-security.test.ts` (new)
- `tests/security/social-content-rpc-live-verification.sql` (new)
- Inventory updates in B1.3 / universal / oauth-client-safety tests
- This evidence document

## 8. Migration(s)

`20260815184059_add_social_master_content_variants_media_foundation.sql`

Applied via `supabase db push --linked` to `dmctinrcjvsgmoxwwodw`. Remote tip aligned. No no-op stub. No drift.

## 9. Master Content definition

`social_content_items`: provider-neutral concept — `internal_title`, optional `concept_summary` / `primary_message`, optional `campaign_id`, optional `primary_pillar_id`, `origin_kind`, optional `source_content_id` lineage, status `draft|ready`, archive. No provider captions.

## 10. Master Content lifecycle

`draft` | `ready` + `archived_at`. No scheduled/published/failed/approved.

## 11. Content provenance

`human_created | ai_assisted | ai_generated | imported | repurposed`. Distinct from Brand Brain truth kinds (which exclude AI inference as canonical brand truth).

## 12. Content lineage

Optional `source_content_id` same-org FK; CHECK prevents self-reference. No repurposing automation.

## 13. Campaign relationship

Optional (`campaign_id` nullable) for evergreen content. Same-org + same-brand required for new assignment; archived campaign rejected on new link; historical FK retained via RESTRICT.

## 14. Pillar / Audience / Goal

- Pillar: optional single `primary_pillar_id` (no JSON array).
- Audience / Goal: **not** duplicated on Master Content — inherit from Campaign Strategy (B1.3).

## 15. Platform Variant model

`social_content_variants`: planned provider + format + copy fields + bounded `provider_config`. Multiple variants per provider allowed (no unique on content+provider).

## 16. Planned provider model

CHECK: instagram/facebook/threads/tiktok/linkedin/youtube/pinterest/x. Connection CHECK remains `provider = 'instagram'` only.

## 17. Content format taxonomy

`text | image | carousel | video | short_video | story | long_video | pin | thread` (provider-neutral; not `instagram_reel`).

## 18. Variant lifecycle

`draft | ready` + `archived_at`. No approval/publication states.

## 19. Variant copy model

Universal nullable: `title`, `caption`, `description`, `cta_text`, `hashtags`, `alt_text` with application size bounds (not provider API limits).

## 20. Provider extension strategy

Bounded `provider_config` object ≤ 8KiB; allowed keys only: `aspect_ratio_hint`, `hook_note`, `language_hint`, `thumbnail_text_hint`. Validated in RPC.

## 21. Media Asset model

`social_media_assets`: org/brand/workspace, storage key, mime, category, size, dimensions, duration, checksum, processing state, optional parent/derivation, origin, archive.

## 22. Object storage decision

Metadata + object key only. No bucket/policy in B1.4. No binaries in Postgres.

## 23. Media metadata

Validated: non-negative size; positive dimensions when set; duration ≥ 0; mime/key length bounds; sha256 hex-64 when set.

## 24. Media processing-state decision

Minimal `pending | ready | failed`. No workers/queues.

## 25. Derived asset model

`parent_asset_id` + `derivation_kind` (`crop|transcode|thumbnail|compress|other`). No transcoding implemented.

## 26. Content-media relationship

`social_content_media`: candidate/supporting assets for Master Content.

## 27. Variant-media relationship

`social_variant_media`: ordered selected assets for a Platform Variant (canonical publish selection later).

## 28. Carousel / order semantics

Unique `(org, parent, sort_order)`; unique asset per parent; atomic replace RPCs.

## 29. Brand / Workspace ownership

Composite FK to `social_workspaces (organization_id, brand_id, id)`. Workspace resolved server-side from brand — browser IDs not trusted independently.

## 30. Cross-tenant integrity

Composite org FKs for content↔campaign/pillar/source, variant↔content, media↔workspace, attachments↔assets. Cross-tenant attaches rejected in RPCs.

## 31. Role authorization

| Action | Owner | Admin | Staff | Viewer | invited/suspended/removed |
| --- | --- | --- | --- | --- | --- |
| View content/media | ✓ | ✓ | ✓ | ✓ | ✗ |
| Create/update/archive content | ✓ | ✓ | ✓ | ✗ | ✗ |
| Variants / media attach | ✓ | ✓ | ✓ | ✗ | ✗ |
| Brand Brain / workspace structure | ✓ | ✓ | ✗ | ✗ | ✗ |

## 32. Staff mutation decision

**Staff may mutate content/variants/media** (operational creative workflow). Brand Brain remains Owner/Admin-only. Documented in `can_manage_social_content` / `canManageSocialContent`.

## 33. RLS

RLS enabled on all new tables. Member SELECT via `private.is_org_member`. Events Owner/Admin SELECT only. Direct INSERT/UPDATE/DELETE revoked from authenticated/anon.

## 34. RPC / SECURITY DEFINER model

10 public RPCs, all `SECURITY DEFINER` + `search_path=''`, authenticated EXECUTE, service_role EXECUTE revoked. Actor via `auth.uid()` + membership re-read.

## 35. Audit model

Append-only `social_content_events` with constrained types; immutability trigger; secret keys rejected in payload helper.

## 36. Archive semantics

Soft archive on content/variant/asset. No restore. FK RESTRICT on core entities; join rows cascade with parent content/variant.

## 37. Client-safe boundary

Domain exports origins/formats/media types/permissions only. No credentials/OAuth/crypto.

## 38. AI truth / content-output boundary

AI may appear as content `origin_kind`; never as Brand Brain canonical truth.

## 39. Multi-provider compatibility

TikTok/etc. variants allowed as planning data; Instagram-only connection CHECK unchanged.

## 40. No-publication proof

No `social_publications`, no scheduled/published statuses, no provider publish RPCs.

## 41. No-approval / versioning proof

No `social_content_versions`, no approved/rejected statuses. B1.5 deferred. Draft edits overwrite until B1.5.

## 42. Local SQL verification

Script: `tests/security/social-content-rpc-live-verification.sql` (BEGIN/ROLLBACK + opt-in GUC). Covers Staff allow, Viewer deny, lineage, foreign campaign, TikTok planning, unknown provider, ordered media, cross-tenant media, archive. Local Docker not required for closure; Production schema verified directly (same pattern as B1.3).

## 43–48. Tests

- Migration security: RLS, search_path, CHECKs, inventory, no publication/version tables
- Domain: origin/lifecycle/format/provider/media/provider_config + Staff role matrix
- Inventories updated across Social tests

## 49. Social regression

Connection permissions, B1.3 brand-brain migration security, universal architecture, oauth-client-safety PASS.

## 50. Targeted test result

6 files / 43 tests PASS (content + inventory + connection permissions sample).

## 51. Full Vitest result

**323 files / 2277 tests PASS** (prior baseline 321 / 2262).

## 52. Typecheck / lint / build

PASS / PASS / PASS

## 53. Security review

Tenant FKs, Brand/Workspace integrity, Staff boundary, RLS, empty search_path, grants (authenticated EXECUTE; service_role revoked), bounded JSON, no secret columns, connection provider CHECK unchanged, no public bucket. Issues found: none blocking.

## 54. Anti-chaos review

| Smell | Status |
| --- | --- |
| Provider-specific content tables | ABSENT |
| Publication/approval/analytics on Master Content | ABSENT |
| Provider credentials in content/media | ABSENT |
| Unrestricted provider/content JSON dumps | ABSENT |
| Duplicated campaign/Brand Brain truth | ABSENT |
| Binary blobs in Postgres | ABSENT |
| Public-by-default private asset storage | ABSENT (no bucket) |
| Remote URL fetch / AI media gen / video editor | ABSENT |
| Service-role shortcut | ABSENT |
| B1.5 / publishing early | ABSENT |

## 55. Migration review

Additive only. Composite FKs. Planned-provider CHECK separate from runtime connection CHECK. Events immutable.

## 56. Production preflight

| Check | Result |
| --- | --- |
| Linked project | `dmctinrcjvsgmoxwwodw` ACTIVE_HEALTHY |
| Prior remote tip | `20260815182703` |
| Drift | none |
| Pending | only `20260815184059` |
| Dry-run | would push that migration only |

## 57. Production migration apply

`supabase db push --linked` applied `20260815184059_add_social_master_content_variants_media_foundation.sql`.

## 58. Production schema verification

Tables present; RLS true on all six new tables; 10 RPCs SECURITY DEFINER + empty search_path; planned-provider CHECK includes tiktok; connection provider CHECK still instagram-only; status CHECKs draft/ready only; self-source CHECK present.

## 59. Production row state

| Entity | Count |
| --- | --- |
| brands / workspaces / campaigns / connections | 0 |
| Master Content / Variants / Media Assets | **0** |
| content_media / variant_media / content_events | **0** |

No production fixtures created.

## 60. Production secret / gate state

Unchanged. No Social credential/encryption/provider secrets configured by B1.4. Feature gates remain OFF.

## 61. External-effect statement

```text
PRODUCTION DATABASE MIGRATIONS APPLIED: 1 (20260815184059)

PRODUCTION MASTER CONTENT ROWS: 0
PRODUCTION PLATFORM VARIANT ROWS: 0
PRODUCTION MEDIA ASSET ROWS: 0

OAUTH AUTHORIZATIONS: 0
INSTAGRAM ACCOUNTS CONNECTED: 0
FACEBOOK ACCOUNTS CONNECTED: 0
THREADS ACCOUNTS CONNECTED: 0
TIKTOK ACCOUNTS CONNECTED: 0
LINKEDIN ACCOUNTS CONNECTED: 0
YOUTUBE ACCOUNTS CONNECTED: 0
PINTEREST ACCOUNTS CONNECTED: 0
X ACCOUNTS CONNECTED: 0

REAL PROVIDER TOKENS RECEIVED: 0
LIVE PROVIDER API CALLS: 0
PROVIDER API MUTATIONS: 0

SOCIAL POSTS: 0
SOCIAL STORIES: 0
WEBHOOK SUBSCRIPTIONS: 0

SMM FEATURE GATES ENABLED: 0
```

## 62. Residual risks

- Generated `database.generated.ts` still lags Social tables (same residual as B1.3); regenerate when convenient via `npm run supabase:types`.
- Upload/MIME sniffing deferred until a bucket pipeline exists.
- Edit history remains overwrite-until-B1.5.

## 63. Closure criteria

All §108 gates met for B1.4.

## 64. Evidence path

`docs/phases/SMM-B1.4-master-content-platform-variants-media-foundation-evidence.md`

## 65. Commits / push

| Full hash | Subject |
| --- | --- |
| `63eea920433f4729fe8397c860701efbde842b57` | `feat(smm): add master content variants and media foundation` |
| *(this evidence commit)* | `docs(smm): close B1.4 content media foundation` |

## 66. Final Git state

Filled after push: HEAD == upstream == origin, divergence `0 0`, clean.

## 67. Final verdict

```text
SMM-B1.4 CLOSED WITH EVIDENCE — MASTER CONTENT, PLATFORM VARIANT AND MEDIA FOUNDATION READY
SMM-B1.4 PRODUCTION SCHEMA VERIFIED — PROVIDER-NEUTRAL CONTENT AND MEDIA FOUNDATION ACTIVE WITH SOCIAL FEATURE GATES OFF
```

## 68. Next boundary

```text
SMM-B1.5 NOT YET AUTHORIZED
```

Expected ownership: Calendar + Content Versioning + Review + Approval.

### Source-of-truth map after B1.4

| Layer | Status |
| --- | --- |
| Social Brand / Brand Brain | Strategic truth (B1.3) |
| Campaign | Strategic campaign context (B1.3) |
| Master Content | Provider-neutral creative concept (**B1.4**) |
| Platform Variant | Provider-native planned representation (**B1.4**) |
| Media Asset | Reusable media metadata/storage reference (**B1.4**) |
| Versioning / Approval / Publication / Analytics / AI optimization | Not yet implemented |
