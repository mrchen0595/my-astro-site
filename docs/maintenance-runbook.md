@'

# Maintenance Runbook

本文件记录本项目发生测试、构建、部署和运行时故障时的标准排查流程。

原则：

- 先判断故障发生在哪一层，再修改配置。
- 不用 retry 掩盖 flaky test。
- 不把多个高风险依赖升级混在同一个 PR。
- 不在日志中记录 Contact 表单正文、姓名、邮箱等敏感数据。
- 不因为单个 warning 做无关重构。
- Feature / maintenance branch → PR → CI → GitHub merge；不在本地 merge。

## 1. 日常质量检查

代码和类型检查：

    npm run check:code

Unit Test：

    npm run test:unit

主要质量门槛：

    npm run quality

完整 E2E：

    npm run test:e2e

Accessibility：

    npm run test:a11y

Lighthouse：

    npm run lighthouse

完整验证：

    npm run verify

`verify` 当前包含：

    quality
    → E2E
    → Lighthouse

## 2. CI 失败时如何定位

先看失败 job 和具体 command，不要直接修改代码。

### check:code 失败

分别定位：

    npm run check
    npm run check:e2e
    npm run format:check

对应检查：

- Astro / TypeScript diagnostics
- E2E TypeScript diagnostics
- Prettier

### Unit Test 失败

运行：

    npm run test:unit

需要聚焦单个测试时：

    npx vitest run --config vitest.config.ts <test-file>

Unit Test 失败通常优先检查纯业务逻辑和函数契约，而不是浏览器或 Vercel。

### Build / Performance 失败

运行：

    npm run build
    npm run performance:budget

先区分：

- Astro/Vite build failure
- TypeScript/build-time failure
- Performance Budget regression

不要因为 Performance Budget 失败直接提高 budget；先检查资源为什么增长。

## 3. Playwright E2E 与 flaky test

CI 配置：

    retries = 2
    failOnFlakyTests = true
    workers = 1

诊断资源：

    trace = on-first-retry
    screenshot = only-on-failure
    video = retain-on-failure

Playwright 将结果区分为：

    passed
    flaky
    failed

含义：

    首次 PASS
    → passed

    首次 FAIL，retry PASS
    → flaky

    首次 FAIL，所有 retry 都 FAIL
    → failed

CI 中 flaky 和 failed 都视为需要处理的问题。

retry 的目的包括获取第二次执行和 trace 证据，不是把失败测试变绿。

本地运行：

    npm run test:e2e

单个文件：

    npx playwright test e2e/<file>.spec.ts --reporter=list

查看 HTML report：

    npm run test:e2e:report

CI 已上传 playwright-report artifact。

HTML report 已包含 trace / screenshot / video 等附件，因此当前不额外上传 test-results artifact。

不要通过增加 retries 来“修复” flaky test。

优先检查：

    locator 是否稳定
    是否依赖固定 timeout
    是否存在异步竞态
    是否依赖测试顺序
    是否污染共享状态
    dev server / network 是否尚未 ready

## 4. Preview / Production 运行时故障

先确认 deployment：

    npx vercel ls

需要按 commit 查询时：

    $commit = git rev-parse HEAD

    npx vercel ls `
      -m "githubCommitSha=$commit"

查看 Production error logs：

    npx vercel logs `
      --environment production `
      --no-branch `
      --level error `
      --since 1h `
      --expand `
      --limit 100

当前项目查询跨 deployment 的 Production logs 时使用 `--no-branch`，避免 CLI branch filter 隐藏相关日志。

按状态码检查：

    npx vercel logs `
      --environment production `
      --no-branch `
      --status-code 503 `
      --since 1h `
      --expand

知道 request/log id 时可进一步使用：

    npx vercel logs `
      --request-id <request-id> `
      --expand

不要把“当前查询没有 error log”解释成“系统从未发生过错误”。

## 5. Protected Preview

普通 curl 如果得到：

    401 Protected deployment

优先判断 Vercel Deployment Protection，不要把它误判成 Astro API 401。

访问 protected Preview 可使用：

    npx vercel curl `
      /path `
      --deployment <preview-url>

这样可以在不暴露 bypass token 的情况下验证 Preview。

## 6. Contact API 故障

当前架构：

    Browser
    → Astro /api/contact
    → PostgreSQL
    → Resend

数据库是 source of truth；邮件通知是 secondary side effect。

### HTTP 503

优先查询 Runtime Logs。

如果出现：

    Contact persistence error

优先检查：

    DATABASE_URL
    数据库连接
    Repository insert
    Postgres / Supabase 状态

Preview 当前故意不配置 Production DATABASE_URL，因此 Preview Contact 503 可能是预期的环境隔离结果。

### HTTP 200 不一定代表通知发送成功

业务语义允许：

    DB save 成功
    +
    Resend failure
    =
    HTTP 200

此时检查：

    Contact notification error
    submissionId

再通过：

    submissionId
    → contact_submissions.id
    → notification_status
    → notification_message_id

关联数据库状态。

可能状态：

    pending
    sent
    failed

不要在 console.error 中记录：

    name
    email
    subject
    message

### Expected 4xx

400 / 405 / 415 等客户端契约错误属于预期响应，不应默认作为 server exception 记录。

## 7. Supabase Migration

Migration 已进入 Git，已应用的 migration 不直接修改。

常用检查：

    npx supabase migration list

如果 CLI 提示：

    Cannot find project ref

先判断当前 CLI 是否已经 link 到正确项目，而不是修改 migration 文件。

数据库 schema 变更遵循：

    新 migration
    → local validation
    → diff / reset
    → review
    → remote push

不要把数据库密码、DATABASE_URL、API key 或 token 粘贴进终端输出、Git、issue 或日志。

## 8. Dependency Upgrade

先审计：

    npm outdated
    npm ls --depth=0

理解：

    Current = 实际安装版本
    Wanted  = package.json 当前范围允许的版本
    Latest  = registry latest

升级前检查：

    npm view <package>@<version> version engines peerDependencies

升级原则：

    Framework stack
    Runtime provider
    Type definitions
    Compiler major

按风险分组，独立 branch / PR。

不要默认执行：

    npm update
    npm audit fix --force

不要主动接管 Astro 的 transitive Vite 版本。

Major upgrade 必须单独评估 ecosystem compatibility 和 breaking changes。

如果 Current == Wanted，但 Latest 跨 major：

    不代表 maintenance 未完成。

可以明确 DEFER。

## 9. Dependency Upgrade 回滚

如果尚未 merge：

    git restore package.json package-lock.json

或者直接放弃 maintenance branch。

如果已经 merge，需要回滚：

    git switch main
    git fetch origin --prune
    git reset --hard origin/main
    git switch -c revert/<change>

然后：

    git revert <merge-commit-sha>

Push 新 branch，通过新的 PR 回滚。

不要在共享 main 上使用 reset 改写远端历史。

## 10. Git 同步基线

PR merge 后：

    git switch main
    git fetch origin --prune
    git reset --hard origin/main

确认：

    git status -sb
    git rev-list --left-right --count main...origin/main

理想结果：

    ## main...origin/main
    0    0

## 11. Known Warnings

以下已知 warning 不应在无关 maintenance PR 中顺手处理：

- StructuredData / is:inline 相关提示。
- Shiki / CSP build warning。
- emitted JPG 较大、但 referenced-image Performance Budget 仍通过的提示。
- Windows core.autocrlf 造成的 LF / CRLF 差异。

如果 warning 的性质、频率或影响发生变化，再建立独立 issue / PR 分析。

## 12. 何时升级 Observability

当前不引入 Sentry、Datadog 或分布式 tracing。

重新评估的触发条件包括：

- 出现真实用户独有、难以复现的浏览器异常。
- 客户端 JavaScript / islands 显著增长。
- Server runtime API 数量明显增加。
- 外部 provider 明显增加。
- 需要主动异常告警。
- Vercel Runtime Logs 的保留、检索或聚合能力不足。

升级 observability 前仍先做 scope audit，不因为工具流行就引入工具。

## 13. Privacy Boundary

当前维护原则：

- 不自行存储 IP。
- 不自行存储 User-Agent。
- 不记录精确地理位置。
- 不建立 fingerprint。
- Contact 日志不记录用户提交正文和身份信息。
- Analytics 不作为 Contact 内容或用户身份追踪系统。

发生新的 analytics / monitoring / logging 需求时，重新做 privacy audit。
'@ | Set-Content `  .\docs\maintenance-runbook.md`
-Encoding utf8
