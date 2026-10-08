# 参与贡献 / Contributing

这个仓库按 `Issue → 分支 → PR → Review → 合并` 推进。所有改动从 Issue 出发，代码经 PR 合入 `main`。第一次参与，按本文档顺序读下来就行。

这里只保留纯前端、个人仓库用得上的流程。检查命令是这个 Next.js 项目自己的。

## 个人项目：在本仓库开分支

先把本仓库的 `main` 更新到最新，再开分支。分支和 PR 都留在这个仓库：

```bash
git checkout main
git pull
git checkout -b feat/routing-sheet-gates
```

改动范围要和对应 Issue 一致，不夹带无关改动。

## 多人项目才 fork

贡献者没有主仓库写权限时，才 fork 到个人账号，把主仓库加为 `upstream`，开分支前同步上游再 rebase，然后向主仓库提 PR：

```bash
git clone git@github.com:<你的账号>/<仓库>.git
cd <仓库>
git remote add upstream git@github.com:<主仓库组织>/<仓库>.git
git fetch upstream
git checkout main
git rebase upstream/main
git checkout -b <分支名>
```

个人项目不用这一步。

## 提 Issue

- 每个 Issue 写清背景、目标和验收标准。用仓库里的缺陷、功能或任务模板。模板里有一份可以直接对照的例子。
- 标题用 `bug:` 或 `feat:` 开头。新 Issue 会按标题标成 Bug 或 Feature；其余标成 Task。已经带了 `bug` 或 `enhancement` 标签时不再重复添加。
- 每个 Issue 都要指定 owner。
- 关闭 Issue 时写明原因：已被 PR 解决（注明 PR 号）、被其他 Issue 取代（注明替代者），或确认不再需要。

## 本地检查

提 PR 之前按这个顺序跑完。CI 用同一组命令：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 提 PR

- 新建 PR 会带上「改动」模板。只改版本号时，在新建 PR 的地址后加上 `?template=release.md&expand=1`，选用「发版」模板。
- 描述里用 `Closes #123` 这类关闭关键字关联 Issue。没关联时，自动化会在 PR 上留言提醒；补上关联后，这条提醒会标成已解决。
- 改动范围要和 Issue 一致。
- `main` 必须走 PR，必须有 approve，CI 必须通过。
- 没 review、没合并的代码不算正式版本。

## 发版

- 根目录 `VERSION` 是产品版本，用 `X.Y.Z`。破坏性变更进 major，新功能进 minor，其余进 patch。
- 改版本号时单独提一个 PR，只改 `VERSION`。
- 正式发布打 tag `vX.Y.Z` 并创建 Release，说明列清这一版交付了什么。发布只认 Release。
- `package.json` 里的 `version` 是包版本，和 `VERSION` 是两件事，不随发版改动。

本仓库不包含生产部署。正式发布只认 Release。

## 规范本身

要改这套流程，先开 Issue 讨论，达成一致后再改本文档。
