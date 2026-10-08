# 流程单

个人项目的 Issue 驱动开发模板。页面按一次改动的顺序讲清：提 Issue、从最新 `main` 开分支、本地检查、提 PR 并关联 Issue、Review 通过后合并。

这是个纯前端仓库，目录用 Next.js 默认的 App Router。个人项目直接在本仓库开分支，不用 fork。

## 本地开发

需要 Node.js 20.9 或更高版本。

```bash
npm ci
npm run dev
```

打开 http://localhost:3000 。

## 检查

提 PR 之前按这个顺序跑，CI 用同一组命令：

```bash
npm run lint
npm run typecheck
npm run test
npm run build
```

## 怎么改这个仓库

先看 [CONTRIBUTING.md](CONTRIBUTING.md)。改动从 Issue 出发，代码经 PR 合入 `main`。仓库里有 Issue 模板和 PR 模板，打开新建页面就能看到一份写好的例子。
# project-template
# project-template
