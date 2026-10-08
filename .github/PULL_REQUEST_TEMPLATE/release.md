这个 PR 只用来改版本号。PR 是把改动交上去请人看的申请。Release 是合并并打上版本标签之后，写给使用者的发布说明。

## 关联的 Issue

Issue 是改代码之前写下来的那件事。把编号填在下面。

Closes #

## 版本

只改根目录 `VERSION`。

- 当前版本：
- 新版本：

破坏性变更进 major，新功能进 minor，其余进 patch。

## 这一版交付了什么

按上一版到这次提交，列出用户能看到的变化。

## 检查

- [ ] 这个 PR 只改了 `VERSION`
- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run test`
- [ ] `npm run build`

发布以 Release 为准。这个 PR 合入并打上 `vX.Y.Z` 之前，不算一次发布。
