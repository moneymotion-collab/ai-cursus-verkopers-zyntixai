# ZyntixAI Laptop Session Safety Checklist

## Start of Session

- Verify repository root is correct.
- Verify branch is `parallel/laptop-product-track-20260707`.
- Verify working tree is clean (`git status --short`).
- Verify no protected changes are present (no `supabase/**`, migrations, package files, `.env*`, or `README.md` changes).
- Review `ACTIVE-PATH-REGISTRY.md` for current desktop-active paths; confirm planned files do not intersect.
- Identify the exact planned files for this session.
- Confirm the task belongs to the laptop product/specification track.

## During Session

- Avoid broad agent prompts (no “fix everything”).
- No repository-wide formatting.
- No dependency operations.
- No Supabase operations.
- Inspect changed paths after meaningful edits.

## Before Commit

- Run `git status --short`.
- Run `git diff --name-only`.
- Run `git diff --cached --name-only`.
- Verify every changed path is on the laptop allowlist.
- If editing `docs/parallel-work/**` canonical files (`ACTIVE-PATH-REGISTRY.md`, `D2-CONDITIONS-REGISTER.md`), confirm shared lock or desktop authority.
- Verify no protected path appears.
- Review diff content for unintended changes.
- Confirm no secrets are present.

## Before Push

Push is not automatically authorized. A push requires the current phase to explicitly permit it.

## Stop Immediately If

- wrong branch
- unexpected modified file
- Supabase path appears
- migration appears
- package file changes
- env file changes
- merge/rebase state detected
- ownership ambiguity

