# ZyntixAI Phase 1 Mobile Navigation Principles

## 1. Mobile Mission

Enable core operational review and action on mobile — morning prioritization, lead/customer lookup, task completion, and attention review — without compressing an unusable desktop menu.

---

## 2. Mobile IA Is Not Desktop Shrinkage

Desktop primary navigation has 5 items + More. Mobile does not expose all desktop groupings at equal priority.

Mobile prioritizes:

1. Frequency of access (C1)
2. Actionability in the field (C4)
3. Cognitive load limit (max 5 bottom nav items)

Programs, Enrollments, NBA Review, and Settings move to secondary "More" — not bottom bar.

Enrollments and NBA Review are **operational workspaces** in More — ordered before Programs for discoverability.

---

## 3. Highest-Frequency Access

| Destination | Mobile Treatment |
| ----------- | ---------------- |
| Command Center | Bottom nav — Home |
| Leads | Bottom nav |
| Customers | Bottom nav |
| Tasks | Bottom nav |
| Attention | Bottom nav |

These five constitute the mobile bottom navigation bar.

---

## 4. Secondary Access

| Destination | Mobile Treatment |
| ----------- | ---------------- |
| Programs | More menu |
| Enrollments | More menu (first item); Command Center drill-down; Customer detail |
| Next Best Action Review | More menu (second item); Command Center drill-down; object contextual |
| Settings | More menu |
| Conversation Preparation | Object detail, Command Center |
| Progress aggregate review | More → Enrollments (filtered); Command Center drill-down |

---

## 5. Object Context Preservation

When viewing Lead or Customer detail on mobile:

- Header shows entity name and key status
- Back returns to list preserving scroll/filter position (L4)
- Switching Leads → Customers does not lose in-progress detail without confirmation if draft active

---

## 6. Back Navigation Intent

| From | Back Goes To |
| ---- | ------------ |
| Lead detail | Lead list (same filters) |
| Customer detail | Customer list |
| Attention item | Attention queue |
| Task detail | Task list or originating object |
| Command Center drill-down | Command Center (not primary nav reset) |
| More → Programs | More menu |

System back (Android) follows same logical hierarchy.

---

## 7. Deep-Link Recovery

Mobile deep links to Lead, Customer, Task, or Attention item open detail directly.

If session expired: authenticate → restore deep link target.

Invalid ID: deterministic error — not silent redirect to Home.

---

## 8. Command Center Access

Command Center is default mobile entry (RI-HOME).

Must remain usable on small screens:

- Scannable sections (L5 defines order)
- Tap targets for drill-down
- No horizontal scroll for core actions

---

## 9. Lead/Customer Lookup Access

| Method | Mobile Support |
| ------ | -------------- |
| Bottom nav lists | Primary |
| Global search | Header search icon — critical on mobile |
| Command Center references | Tap through |

Lookup is high priority — search icon always visible in header on list views.

---

## 10. Tasks and Attention Access

Both are bottom nav items — equal priority to Leads/Customers.

Rationale: P1-07 (forgotten tasks) and P1-02 (needs attention) require field access without deep navigation.

Attention item review must be completable on mobile (dismiss, snooze, escalate).

---

## 11. Contextual Actions

On mobile object detail, contextual actions appear as:

- Primary action button (e.g., "Prepare for call")
- Overflow menu for secondary (AI command, add note, create task)
- Linked sections (tasks, attention) as tappable rows

Avoid hiding critical actions in desktop-only hover patterns.

---

## 12. Cross-Lifecycle Thread Access

| Thread | Mobile Path |
| ------ | ----------- |
| Recurring Q&A | Customer → AI prepare answer |
| Conversation prep | Customer/Lead → Prepare section |
| NBA | Attention or object → Review |
| Notes | Customer/Lead detail section |
| AI command | Floating or header action on detail views |

No separate mobile app section for cross-lifecycle threads.

---

## 13. Navigation Depth

Mobile maximum: 3 taps from bottom nav to contextual action.

Example: Customers → Jane Doe → Prepare conversation = 3 taps. Acceptable.

Example: More → Programs → Program → Enrollment → Onboarding = 4 taps. Acceptable for secondary path only.

---

## 14. Mobile Cognitive Load

- One primary action per screen where possible
- Filters collapse to sheet — not permanent sidebar
- Attention evidence readable without horizontal scroll
- Command Center sections limited in count on mobile (L5) — IA requires scannable chunks

---

## 15. L4 Handoff

L4 designs mobile layouts respecting:

- 5-item bottom nav
- More menu for secondary
- Header search on list views
- Contextual action placement rules
- Back behavior and deep-link recovery

No pixel dimensions or component specs at L3.
