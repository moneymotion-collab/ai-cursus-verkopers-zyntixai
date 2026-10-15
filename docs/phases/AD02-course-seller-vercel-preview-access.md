# Course-seller preview access

`/ad02-preview` stays a simulated QA screen. It is not a signed-in workspace and not a runtime access test.

| Runtime | Result |
| --- | --- |
| Local development (`NODE_ENV=development`, no `VERCEL_ENV`) | Existing preview states remain available, including `state=course-seller`. |
| Vercel Preview (`VERCEL_ENV=preview`, including when `NODE_ENV=production`) | Only the exact course-seller allowlist in `src/dev/ad02-preview-access.ts` is available. A missing state, an unknown state, and every state outside that list return 404. |
| Vercel Production (`VERCEL_ENV=production`) | Every `/ad02-preview` request returns 404. |
| Any other production build | Every `/ad02-preview` request returns 404, and the production webpack build replaces the preview body with the disabled module. |

The allowed Vercel Preview request does not refresh a Supabase session. A production webpack build keeps the disabled body unless `VERCEL_ENV=preview` is set at build time.

Do not run `next build` in this worktree while the Development server is using `.next`. No deployment is part of this access change.
