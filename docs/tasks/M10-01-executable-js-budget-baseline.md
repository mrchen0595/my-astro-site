# M10-01 Executable JavaScript Budget Baseline

## Mission

Restore the accepted 6 KiB executable-inline-JavaScript budget by replacing the generic Analytics bootstrap with the exact installed Vercel adapter injection, without changing Search, Theme, CSP, static rendering, or the Analytics privacy boundary.

## Accepted-main evidence

Accepted main emits four executable inline scripts on Search:

| Responsibility                        | Bytes |
| ------------------------------------- | ----: |
| Theme bootstrap                       |   303 |
| ThemeToggle                           | 1,196 |
| Generic `@vercel/analytics` bootstrap | 1,849 |
| Search                                | 3,495 |
| Total                                 | 6,843 |

The 6,843-byte total exceeds the 6,144-byte budget by 699 bytes. Accepted history progressed from 4,407 bytes to 4,994 bytes after Search V2 consumed available headroom, then to 6,843 bytes when Analytics introduced the crossing change.

## Probe evidence

| Candidate | Integration                        | Search inline JS | Headroom | Result                                   |
| --------- | ---------------------------------- | ---------------: | -------: | ---------------------------------------- |
| A         | Current generic `inject()`         |      6,843 bytes |     -699 | JavaScript budget failed                 |
| B         | Official Astro Analytics component |      7,811 bytes |   -1,667 | JavaScript and HTML budgets failed       |
| C         | Vercel adapter `webAnalytics`      |      5,277 bytes |      867 | Build and all performance budgets passed |

The Candidate C byte count and headroom are current evidence, not permanent exact-byte requirements.

## Scope

Authorized files:

- `astro.config.mjs`
- `src/layouts/BaseLayout.astro`
- `docs/tasks/M10-01-executable-js-budget-baseline.md`

Forbidden scope includes Search or Theme changes, budget/checker changes, dependency or lockfile changes, workflows, APIs, environment files, generated output, P10-02, and the maintenance runbook.

## Invariants

- Search behavior and its 3,495-byte script remain unchanged.
- Theme bootstrap and ThemeToggle behavior remain unchanged.
- Automatic full-page Analytics page views remain; no custom event, route, query, `beforeSend`, or Contact tracking is added.
- Search `q` and `type` are not added as custom Analytics data.
- Static-first rendering, `staticHeaders: true`, CSP directives, allowed origins, sitemap configuration, and Production-origin authority remain unchanged.
- `@vercel/analytics` 2.0.1 remains a direct dependency during this implementation.

## Controlled compatibility exception

Current Astro guidance recommends the Analytics component for `@vercel/analytics` 1.4.0 and later. The official component was tested and failed both current executable-JavaScript and HTML budgets. Exact installed `@astrojs/vercel` 11.0.5 types and source still support `webAnalytics`, so Candidate C is a controlled compatibility exception.

Exact-candidate Vercel Preview verification is a merge blocker. Re-evaluate this decision after an `@astrojs/vercel` upgrade, Analytics endpoint or configuration changes, a route-template reporting requirement, View Transitions or SPA-style navigation, or any `beforeSend` or query-redaction requirement.

## Acceptance contract

- Executable inline JavaScript is at most 6,144 bytes.
- Measured headroom is at least 512 bytes.
- Every existing Performance Budget passes.
- Search and Theme output remains attributable and unchanged.
- Exactly one adapter Analytics loader is present; generic and component bootstraps are absent.
- CSP requires no broadening.

## Verification matrix

Local verification includes touched-file formatting, Astro and E2E type checks, unit tests, build, Performance Budget, generated Search script attribution and hashes, generated CSP/static-header inspection, and targeted Search Playwright coverage.

Hosted CI must run the full required quality suite on the accepted exact-LF baseline. The known Windows repository-wide formatting defect does not weaken that hosted requirement.

## Preview gate

Preview has not yet passed. Before merge, the exact candidate must prove:

- the external Analytics script request succeeds;
- exactly one automatic page-view intake request succeeds;
- no CSP error or custom event occurs;
- no Contact content is transmitted;
- Search `q` and `type` are not transmitted as custom data; and
- the actual intake payload is inspected to determine whether the Search query appears in the event URL or another field.

If query data is transmitted, the candidate is not approved for merge under the current privacy contract.

## Rollback conditions

Rollback is required if the budget or headroom contract fails, Search or Theme output changes unexpectedly, more than one Analytics loader or page view appears, the generic and adapter integrations coexist, CSP must be broadened, Preview intake fails, or the Preview privacy checks fail.

## Deferred work

- Direct `@vercel/analytics` dependency cleanup is intentionally separate and must use package-manager-generated lockfile changes.
- The independent Windows EOL/Prettier defect remains deferred.
- Any future checker model that accounts for external runtime JavaScript remains deferred.
