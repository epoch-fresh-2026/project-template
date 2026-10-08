# 怎么改这个仓库

第一次改，按本文档从上往下做。所有改动都从一条 Issue 开始，最后用 PR 并进 main。

## 这几个词

- **Issue**：一件先写下来的事。写清背景、目标和怎样算做完，再动手改代码。
- **main**：正式主线。收进来的代码都在这里。
- **分支**：从 main 拉出来的临时线。改动先写在这里。
- **PR**：把分支上的改动交上去请人看的申请。全称是 Pull Request。
- **Review**：别人阅读你的改动。对方点 approve，表示同意合并。
- **CI**：交上去之后自动跑的检查。
- **合并**：把看过的改动收进 main。

一个人维护自己的仓库时，用下面的做法。

## 第 1 步：在本仓库从主线开一条线

先把 main 更新到最新，再开分支。分支和后来的 PR 都留在这个仓库：

```bash
git checkout main
git pull
git checkout -b feat/routing-sheet-gates
```

这条分支只做对应那条 Issue 里的事，不要顺手改别的。

## 几个人一起做，而且你不能直接改主仓库

这时才 fork：把主仓库复制一份到你自己的账号。把主仓库加为 upstream，表示它是上游。开分支之前，先把上游的新改动拿过来，再基于它开分支，最后向主仓库提 PR：

```bash
git clone git@github.com:<你的账号>/<仓库>.git
cd <仓库>
git remote add upstream git@github.com:<主仓库组织>/<仓库>.git
git fetch upstream
git checkout main
git rebase upstream/main
git checkout -b <分支名>
```

`fetch` 是把上游的新提交下载下来。`rebase` 是让你的分支接在上游最新的 main 后面。一个人维护自己的仓库时，不用这两步。

## 第 2 步：先开一条 Issue

- 每条 Issue 写清背景、目标和验收标准。用仓库里的「缺陷」「功能」或「任务」模板，模板里有一份可以照着写的例子。
- 标题用 `bug:` 开头表示要修一个问题，用 `feat:` 开头表示要做一个功能。新建后会按标题自动标成 Bug 或 Feature。其他标题标成 Task，也就是普通任务。已经有 `bug` 或 `enhancement` 标签时，不会再加一次。
- 每条 Issue 指定一个 owner，也就是负责人。
- 关掉 Issue 时写明原因：被哪个 PR 解决了（写上 PR 编号）、被另一条 Issue 取代了（写上那一条的编号），或者确定不做了。

## 第 3 步：在自己电脑上检查

把 PR 交上去之前，按这个顺序跑完。CI 会再用同一组命令跑一遍：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

`lint` 看代码有没有明显问题，`typecheck` 看类型对不对，`test` 跑测试，`build` 看能不能成功打包。

## 第 4 步：开一个 PR

- 在 GitHub 上新建 PR 时，会自动带上「改动」模板。如果这次只改版本号，在新建页面的地址后面加上 `?template=release.md&expand=1`，改用「发版」模板。
- 说明里写 `Closes #123`。把 123 换成那条 Issue 的编号。PR 合并后，那条 Issue 会自动关掉。没写的话，机器人会在 PR 下面留言提醒；补上以后，这条提醒会标成已解决。
- 这次改的内容和那条 Issue 是同一件事。
- 不能把代码直接推进 main。必须开 PR，要有人点 approve，并且 CI 通过。
- 还没人看过、还没合并的代码，不能当成已经发布的版本。

## 第 5 步：发版

- 根目录的 `VERSION` 文件是给用户看的版本号，写成 `X.Y.Z`。改动会让旧用法不能用时，增加最前面的数字（major）。只是新功能时，增加中间的数字（minor）。修问题或其他小改动，增加最后的数字（patch）。
- 改版本号时单独开一个 PR，这个 PR 里只改 `VERSION`。
- 正式发布时打一个名叫 `vX.Y.Z` 的标签，并写一份 Release。Release 是这一版交付了什么的说明。只有这份 Release 才算发布。main 上平时的更新不算发布。
- `package.json` 里的 `version` 是程序包自己的版本，和 `VERSION` 不是同一件事，发版时不用改它。

本仓库不包含把网站部署到服务器的步骤。正式发布只认 Release。

## 要改这套流程

先开一条 Issue 讨论。大家同意以后，再改本文档。
