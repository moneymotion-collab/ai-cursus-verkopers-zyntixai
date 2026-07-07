# ZyntixAI Computer 1 Protected Zones

## 1. Absolute Protected Paths

Known protected paths:

- `supabase/**`
- `supabase/migrations/**`
- `supabase/config.toml`
- `supabase/seed.sql`
- `package.json`
- `package-lock.json`
- `.env*`

## 2. Protected Technical Responsibilities

Computer 1 also owns protection by responsibility, even if future file paths change:

- SQL
- schema
- migrations
- RLS
- JWT/auth behavior
- membership resolution
- membership isolation
- Programs backend
- Enrollments backend
- Customers backend remediation
- Leads backend remediation
- remote migration state
- local/remote migration parity
- Supabase link/configuration behavior
- generated database types
- backend security tests
- technical remediation migrations

## 3. Functional Protection Rule

Protection is based on technical responsibility, not only path name. A new file does not become laptop-safe merely because it is outside `supabase/**`.

## 4. Absolute Migration Rule

The laptop must never:

- create a migration
- edit a migration
- rename a migration
- delete a migration
- reorder a migration
- repair migration history
- apply migrations
- dry-run database pushes
- inspect remote state through mutating operations

## 5. Incident Rule

If a protected file is modified accidentally:

- stop work
- do not commit
- do not stash
- do not reset
- do not restore automatically
- record exact changed paths
- escalate for explicit review

