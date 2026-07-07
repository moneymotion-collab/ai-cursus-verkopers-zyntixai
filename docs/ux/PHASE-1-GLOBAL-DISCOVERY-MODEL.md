# ZyntixAI Phase 1 Global Discovery Model

## 1. Discovery Mission

Enable a course seller to find operational information quickly when they know **who** or **what** they need — without navigating the full hierarchy. Discovery complements navigation; it does not replace object-centric structure.

---

## 2. Searchable Concept Categories

| Category | Searchable | Rationale |
| -------- | ---------- | --------- |
| Leads | Yes | High identity lookup (name, email, company) |
| Customers | Yes | High identity lookup |
| Programs | Yes | Lower frequency but distinct names |
| Enrollments | Yes | By customer name or program name |
| Tasks | Yes | By title, linked entity name |
| Notes | Contextual | Search within Lead/Customer; global search may surface note matches linked to entity |
| Attention items | Partial | Search by entity name; queue is primary browse |
| NBA recommendations | Queue browse via RI-NBA-QUEUE | Accessed via More menu review queue |
| AI outputs | No | Ephemeral drafts — not discovery index |

---

## 3. Global Search Boundary

**Product intent:** Unified search returning Leads, Customers, Programs, Enrollments, Tasks with clear type labels.

**Not in scope at L3:**

- Full-text search infrastructure specification
- Search indexing technology
- Fuzzy matching algorithms

**Boundary:** Global search returns **entity matches** with drill-down to authoritative object detail — not operational state duplicates.

---

## 4. Contextual Search Boundary

Within Lead or Customer detail:

- Search/filter notes
- Filter linked tasks
- Filter enrollments

Contextual search does not cross tenant or object boundaries.

---

## 5. AI Command Access

Bounded AI command is a **discovery and preparation accelerator**, not a navigation replacement.

| Invocation Context | Permitted AI Intents |
| ------------------ | -------------------- |
| Lead detail | Summarize lead, draft follow-up, prepare sales conversation, explain attention |
| Customer detail | Summarize customer, prepare answer, prepare conversation, explain progress |
| Task detail | Suggest next step after completion |
| Attention detail | Explain evidence, suggest intervention approach |
| Command Center | Daily briefing summary from referenced items |
| NBA review | Explain recommendation rationale |

AI command requires current object context. No "ask anything about anyone" without selecting context first (permission-aware).

---

## 6. Current Context Preservation

When AI command is invoked:

- Current object ID remains active
- Prepared output attaches to that context
- Navigation away prompts save/discard of draft (L4 behavior)
- Returning restores object — not a blank AI session

---

## 7. Permission Awareness

Discovery and AI access respect:

- Organization tenant boundary
- User authorization to view entity (implementation on Computer 1)
- No surfacing of entities user cannot access via search or AI

---

## 8. No AI Permission Bypass

AI must not:

- Retrieve Customer B context while viewing Customer A
- Infer hidden data from aggregate statistics
- Bypass blocked or unauthorized objects

If context insufficient, AI discloses limitation — does not fabricate.

---

## 9. Search Result Intent

| Result Type | On Select |
| ----------- | --------- |
| Lead | RI-LEAD-DETAIL |
| Customer | RI-CUSTOMER-DETAIL |
| Program | RI-PROGRAM-DETAIL |
| Enrollment | RI-ENROLLMENT-DETAIL |
| Task | RI-TASK-DETAIL |
| Note match | RI-LEAD-DETAIL or RI-CUSTOMER-DETAIL (anchored to note) |

---

## 10. Command-to-Destination Handoff

| AI Command Outcome | Handoff |
| ------------------ | ------- |
| Draft follow-up | Task or message preparation — human sends |
| Prepare answer | RI-ANSWER-PREP context on Customer/Lead |
| Prepare conversation | RI-CONV-PREP |
| Explain attention | Stay on RI-ATTENTION-DETAIL with expanded rationale |
| Suggest NBA | Link to RI-NBA-QUEUE or RI-NBA-REVIEW — not auto-accepted |

---

## 11. Draft and Preparation Context

AI-prepared drafts are Context Objects:

- Visible in invoking object context
- Not a separate "Drafts inbox" at L3 (deferred to L4 if needed)
- Linked to the request that produced them (follow-up, question, conversation)

---

## 12. Attention Explanation Access

From Attention item:

- Evidence section is primary
- AI may explain why item surfaced (Analyze mode)
- Explanation does not replace evidence display
- Dismissal remains human action

---

## 13. NBA Explanation Access

From NBA review:

- Rationale and evidence chain visible before accept/defer/dismiss
- AI may elaborate explanation — not change recommendation authority
- OD-015: accepting does not auto-generate new review loop

---

## 14. Discovery Failure States

| State | Product Behavior |
| ----- | ---------------- |
| No results | Clear empty state; suggest browse Leads/Customers |
| Insufficient AI context | Visible message; no fabricated answer |
| Unauthorized result | Not shown in search |
| Ambiguous match | Disambiguation list (multiple customers same name) |

---

## 15. Deferred Technical Questions

| Question | Deferred To |
| -------- | ----------- |
| Search backend (Postgres FTS, external index) | Computer 1 / technical integration |
| AI streaming UX | L4 |
| Command palette keyboard shortcut | L4 |
| Offline search | Later phase |
