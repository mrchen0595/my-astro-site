# Repository Engineering Authority

These rules apply repository-wide. Prefer repository evidence and the smallest
change that satisfies the current task.

## Baseline and Evidence

- Use **Evidence First**: inspect the relevant source, tests, configuration, and
  documentation before proposing or making changes.
- Tasks must start from an accepted `origin/main` baseline. Refresh
  remote-tracking refs with `git fetch origin --prune` when appropriate; fetching
  is a normal pre-flight operation and does not require special authorization.
- Before risky work, understand the current branch, working tree, `HEAD`,
  `origin/main`, merge-base, and any required predecessor work. The task branch
  must descend from the accepted baseline.
- Stop when the accepted baseline or required predecessor work is stale,
  missing, or cannot be verified. Do not overwrite unexplained working-tree
  changes.
- A task branch may legitimately advance beyond `origin/main`. Require
  `HEAD == origin/main` only when verifying synchronized local `main` after an
  accepted PR has merged.

## Authority and Git Safety

- Do not expose secrets, request secret values, or place secrets in source,
  logs, issues, or command output.
- Do not install or upgrade dependencies unless the current task explicitly
  authorizes it. Do not use `npm update` or `npm audit fix --force` by default.
- Do not commit, push, merge, force-push, or modify remote resources unless the
  current task explicitly authorizes that action.
- Use the integration path: feature or maintenance branch -> GitHub PR ->
  GitHub merge. Do not merge PRs locally.
- Restore or recover only from understood Git evidence. Without explicit
  current-task authorization, do not run `git reset --hard`, `git clean -fd`,
  overwrite or restore unknown user work, force-push, or perform destructive
  remote operations.
- The runbook's local-main synchronization sequence is reserved for explicit
  post-merge synchronization when the worktree is known safe; it is not a
  general recovery procedure.

## Change Discipline

- Use **Minimum Surface**: change only what is necessary and preserve existing
  boundaries unless evidence justifies changing them.
- Diagnose the failing layer before changing configuration. Do not hide flaky
  behavior with retries or fold unrelated warnings and refactors into a task.
- Format only touched files.
- Use **Targeted Before Full**: run the smallest relevant checks first, then
  expand validation in proportion to the change and risk.

## Architecture Direction

- Astro remains static-first with selective runtime. Do not introduce runtime
  rendering without a demonstrated need.
- Reusable multi-site use and internationalization are accepted future
  requirements, but this does not authorize implementing them preemptively.
- Preserve the current pages, components, library, and configuration boundaries
  unless evidence justifies a change.
- `astro.config.mjs` `site` remains the Production-origin authority. Evolve the
  existing URL, SEO, and structured-data utilities rather than creating parallel
  systems without evidence.
- A monorepo, formal Design System, and complex SSR are not currently
  authorized. Auth, Admin UI, Turnstile, and Redis require explicit future
  tasks.

## Environment and Data

- Preview must not inherit the Production `DATABASE_URL` by default.
- Applied database migrations are immutable history; make later schema changes
  through new migrations.
- Keep secrets server-side.
- Do not add Contact names, email addresses, subjects, message bodies, or other
  Contact PII to logs.

## Contact Contract

PostgreSQL persistence is the source of truth. Resend is a secondary
notification side effect.

- Database failure -> HTTP 503; do not call Resend.
- Database success + Resend success -> HTTP 200 with notification `sent`.
- Database success + Resend failure -> still HTTP 200 with notification
  `failed`.

## Development

On Windows and PowerShell, start the Astro development server in background
mode:

```powershell
astro dev --background
```

Manage it with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Repository References

- Commands and dependency declarations: [`package.json`](package.json)
- Failure diagnosis, validation, deployment, database, and recovery procedures:
  [`docs/maintenance-runbook.md`](docs/maintenance-runbook.md)
- Astro deployment and Production-origin configuration:
  [`astro.config.mjs`](astro.config.mjs)
- Browser-test behavior: [`playwright.config.ts`](playwright.config.ts)
- Required CI checks: [`.github/workflows/`](.github/workflows/)
- Astro documentation: <https://docs.astro.build>
- Routing: <https://docs.astro.build/en/guides/routing/>
- Components: <https://docs.astro.build/en/basics/astro-components/>
- Framework components:
  <https://docs.astro.build/en/guides/framework-components/>
- Content Collections:
  <https://docs.astro.build/en/guides/content-collections/>
- Styling: <https://docs.astro.build/en/guides/styling/>
- Internationalization:
  <https://docs.astro.build/en/guides/internationalization/>
