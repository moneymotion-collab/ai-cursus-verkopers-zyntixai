# ZyntixAI Phase 1 Interaction State Model

## 1. Purpose

Universal UX states for lists, details, queues, reviews, and AI surfaces. Product behavior intent — not implementation.

---

## 2. State Principles

- Visible failure (UXP-05)
- Unknown is valid (UXP-06)
- Empty ≠ error (UX-009)
- Recovery first-class (UXP-07)
- Evidence before confidence (UXP-14)

---

## 3. UXS-01 through UXS-15

### UXS-01 — Initial Loading

**Meaning:** First fetch in progress.  
**Message intent:** "Loading [screen purpose]…"  
**Actions:** Wait; cancel navigation allowed.  
**Forbidden:** Show empty or zero count.  
**Recovery:** Auto-resolve on load.  
**A11y:** Loading region announced.

### UXS-02 — Incremental Loading

**Meaning:** More items loading (pagination).  
**Actions:** Continue scrolling; optional load-more.  
**Recovery:** Auto on complete.

### UXS-03 — Empty System State

**Meaning:** No objects exist in system for this screen.  
**Message:** "No customers yet" with create/import guidance if in scope.  
**Actions:** Primary create path where allowed.  
**Not:** Error state.

### UXS-04 — Empty Filtered State

**Meaning:** Objects exist but filters exclude all.  
**Message:** "No matches" + clear filters.  
**Actions:** Clear filters.

### UXS-05 — Recoverable Error

**Meaning:** Load failed; retry may succeed.  
**Actions:** Retry; return.  
**Recovery:** Retry reloads.

### UXS-06 — Blocking Error

**Meaning:** Cannot render primary work (auth failure, critical missing).  
**Actions:** Re-authenticate or contact support intent.  
**Recovery:** User-initiated retry after fix.

### UXS-07 — Partial Data

**Meaning:** Some sections loaded; others failed.  
**Actions:** Show available; retry failed sections.  
**Forbidden:** Fabricate missing sections.

### UXS-08 — Stale Data

**Meaning:** Data may be outdated.  
**Actions:** Refresh; proceed with caution label.  
**Recovery:** Refresh updates.

### UXS-09 — Permission Denied

**Meaning:** User cannot access entity or action.  
**Actions:** Return; no data leak.  
**Message:** Clear unauthorized message.

### UXS-10 — No Evidence

**Meaning:** Insufficient context for inference or AI output.  
**Actions:** Gather context; narrow question.  
**Forbidden:** Present guess as fact.

### UXS-11 — Conflicting Evidence

**Meaning:** Sources disagree.  
**Actions:** Surface conflict; human reconciles.  
**Forbidden:** Silent resolution.

### UXS-12 — Interrupted Flow

**Meaning:** User navigated away mid-flow.  
**Actions:** Resume or discard on return.  
**Recovery:** Re-open flow with context if ID preserved.

### UXS-13 — Pending Consequential Action

**Meaning:** Confirmation before high-impact action.  
**Actions:** Confirm or cancel with consequence summary.  
**Recovery:** Cancel returns to prior state.

### UXS-14 — Success With Continued Work

**Meaning:** Action succeeded; more work remains.  
**Actions:** Next item, return to queue, related drill-down.

### UXS-15 — Terminal Success

**Meaning:** Flow complete (handoff done, item dismissed).  
**Actions:** Return to list/queue.

---

## 4. State Transition Principles

Loading → content, empty, or error. Never skip to misleading content. Error may transition to loading on retry.

---

## 5. Recovery Principles

Every error state offers path forward except permission denied. Preserve user context where safe.

---

## 6. Retry Principles

Retry re-fetches authoritative source. Does not duplicate local-only state.

---

## 7. Permission Principles

Hide or disable unauthorized actions. Search excludes unauthorized entities.

---

## 8. Stale Information Principles

Show staleness on evidence-backed screens. Refresh before consequential action recommended.

---

## 9. Conflicting Evidence

Dedicated presentation on Attention, NBA, progress — not buried in footnotes.

---

## 10. Consequential Action Pending

Dismiss attention, accept NBA, mark terminal enrollment, handoff — use UXS-13 pattern.

---

## 11. Success States

Confirm outcome recorded. Show what changed in plain language.

---

## 12. Screen-State Applicability Matrix

| UX State | Lists | Details | Queues | Reviews | AI Surfaces | Recovery Required? |
| -------- | ----- | ------- | ------ | ------- | ----------- | ------------------ |
| UXS-01 | Yes | Yes | Yes | Yes | Yes | No |
| UXS-02 | Yes | No | Yes | No | No | No |
| UXS-03 | Yes | Rare | Yes | No | No | Optional CTA |
| UXS-04 | Yes | No | Yes | No | No | Clear filters |
| UXS-05 | Yes | Yes | Yes | Yes | Yes | Retry |
| UXS-06 | Yes | Yes | Yes | Yes | Yes | Re-auth/support |
| UXS-07 | Yes | Yes | Yes | Yes | Yes | Partial retry |
| UXS-08 | Yes | Yes | Yes | Yes | Yes | Refresh |
| UXS-09 | Yes | Yes | Yes | Yes | Yes | Return |
| UXS-10 | No | Yes | No | Yes | Yes | Gather context |
| UXS-11 | No | Yes | No | Yes | Yes | Human reconcile |
| UXS-12 | No | Yes | No | Yes | Yes | Resume/discard |
| UXS-13 | No | Yes | No | Yes | No | Confirm/cancel |
| UXS-14 | No | Yes | No | Yes | Yes | Continue work |
| UXS-15 | No | Yes | No | Yes | Yes | Navigate away |

---

## 13. AI Failure States

Missing context → UXS-10. Low confidence → disclose uncertainty. Contradictory → UXS-11. Generation failure → UXS-05 with retry.

---

## 14. Accessibility Intent

States communicated with text labels + icons. Loading announced. Errors associated with relevant region. Focus returns sensibly after dialogs.
