# Beta-1 browser QA matrix (automatable vs human)

Reusable classification for remaining Course Sellers Beta-1 completion phases.
Harness foundation: Playwright Production smoke + Vitest fixtures (B1-C1-R1).

Legend:

- **AUTOMATABLE** — encode in Playwright/Vitest once fixtures/auth exist
- **HUMAN-ASSISTED** — one-time Owner bootstrap or external inbox/provider observation with scripted checks
- **HUMAN-ONLY** — subjective quality / real third-party outcome judgment

| Concern | B1-C2 Invitations | B1-C3 Attention usefulness | B1-C4 Enrollment metadata UI | B1-C5 UX/mobile polish | B1-FV final verification |
| --- | --- | --- | --- | --- | --- |
| Unauthenticated redirect | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE |
| Authenticated entry | AUTOMATABLE* | AUTOMATABLE* | AUTOMATABLE* | AUTOMATABLE* | AUTOMATABLE* |
| Session persistence / reload | AUTOMATABLE* | AUTOMATABLE* | AUTOMATABLE* | AUTOMATABLE* | AUTOMATABLE* |
| Direct URL + internal nav + back | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE |
| Empty / populated / error / loading | AUTOMATABLE (fixtures + Prod where safe) | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE |
| Role / org / forbidden | AUTOMATABLE (fixtures; Prod read-only) | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE |
| Desktop / mobile / intermediate | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE |
| Console / network / hydration | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE |
| Keyboard / semantic a11y basics | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE | AUTOMATABLE |
| Invitation email receipt | HUMAN-ASSISTED | — | — | — | HUMAN-ASSISTED |
| Attention signal usefulness judgment | — | HUMAN-ONLY (plus AUTOMATABLE presence) | — | — | HUMAN-ONLY |
| Metadata field usefulness/copy | — | — | HUMAN-ONLY (plus AUTOMATABLE CRUD) | — | HUMAN-ONLY |
| Premium visual feel / motion | — | — | — | HUMAN-ONLY | HUMAN-ONLY |
| Real Instagram/Social outcome | — | — | — | — | HUMAN-ASSISTED (separate Social track) |

\*Requires local gitignored Playwright storage state from `npm run browser:auth:bootstrap`.

## Checklist template for each customer-facing phase

Copy into phase evidence:

### AUTH
- [ ] unauthenticated redirect
- [ ] authenticated entry
- [ ] session persistence

### ROUTING
- [ ] direct URL
- [ ] internal navigation
- [ ] back
- [ ] refresh

### DATA
- [ ] empty
- [ ] populated (fixture if Prod empty)
- [ ] error (honest, not false empty)
- [ ] loading resolves

### SECURITY
- [ ] role
- [ ] org scope
- [ ] forbidden / cross-tenant

### RESPONSIVE
- [ ] desktop
- [ ] mobile
- [ ] optional intermediate

### HEALTH
- [ ] console
- [ ] network
- [ ] hydration

### A11Y
- [ ] keyboard
- [ ] semantic controls
- [ ] focus

### EVIDENCE CLASSES
- [ ] Automated Production QA separated
- [ ] Fixture QA separated
- [ ] Human UX observation separated
