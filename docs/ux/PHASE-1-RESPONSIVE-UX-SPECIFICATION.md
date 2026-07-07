# ZyntixAI Phase 1 Responsive UX Specification

## 1. Purpose

Desktop and mobile adaptation rules for all Phase 1 screens. No pixel dimensions.

---

## 2. Responsive Principle

Mobile prioritizes essential work (UX-010). Desktop exposes more parallel context. Same authoritative ownership on both.

---

## 3. Desktop Navigation Context

Persistent sidebar: Command Center, Leads, Customers, Tasks, Attention, More. Main content area for list/detail. Optional split view for queue+review where width allows.

---

## 4. Mobile Navigation Context

Bottom bar: Home, Leads, Customers, Tasks, Attention. More for Enrollments, NBA Review, Programs, Settings. Header search on lists.

---

## 5. Workspace Adaptation

| Screen | Desktop | Mobile |
| ------ | ------- | ------ |
| Leads, Customers | Table or wide cards; filters inline | Cards; filters in sheet |
| Enrollments | Wide columns for progress/onboarding state | Essential columns; drill for detail |
| Programs | Simple list | List in More |

---

## 6. Queue Adaptation

Tasks, Attention: full queue on mobile bottom nav. NBA: More menu. List → detail navigation; no hover-only actions.

---

## 7. Detail Adaptation

Single column on mobile. Sections collapsible. Primary action fixed or prominent. Desktop may use two-column summary + tabs.

---

## 8. Filter Adaptation

Desktop: inline or side panel. Mobile: bottom sheet. Active filter chips visible on both.

---

## 9. Search Adaptation

Header search icon on mobile list screens. Desktop: header or list toolbar. Results → SCR-018.

---

## 10. Action Adaptation

Primary action visible without hover. Secondary in overflow menu on mobile. Consequential actions use confirmation dialogs.

---

## 11. Context Preservation

Object context in header on detail. Back preserves list state. Deep links restore target after auth.

---

## 12. Deep-Link Recovery

Invalid ID → error screen. Expired session → auth then restore target.

---

## 13. Loading and Error Adaptation

Full-screen loading on mobile for initial detail. Inline errors on desktop sections. Retry always reachable.

---

## 14. AI Surface Adaptation

Overlay or bottom sheet on mobile. Side panel on desktop. Current object context always visible.

---

## 15. Accessibility Intent

Touch targets adequate on mobile. Focus order logical. No information conveyed by color alone.

---

## 16. Screen-by-Screen Responsive Matrix

| Screen ID | Desktop | Mobile |
| --------- | ------- | ------ |
| SCR-001 | Multi-region dashboard | Stacked sections; tap to drill |
| SCR-002–004 | Workspace table/cards | Cards + filters sheet |
| SCR-005 | Tabbed/sectioned detail | Collapsible sections |
| SCR-006–008 | Queue list; split optional | Full-screen list |
| SCR-009, SCR-013 | Review panel | Full-screen review |
| SCR-010 | Operational workspace columns | More → filtered list |
| SCR-011 | Enrollment detail sections | Collapsible |
| SCR-012 | NBA queue in More | More → queue |
| SCR-014–015 | Secondary in More | More |
| SCR-016–017 | Prep layout dual sections | Stacked operator/readiness |
| SCR-018 | Search overlay | Search header |
| SCR-019 | Contextual panel | Bottom sheet |
| SCR-020 | Sidebar More | Hamburger More |
| SCR-021 | Settings pages | Settings in More |

Mobile bottom nav unchanged: Home, Leads, Customers, Tasks, Attention.
