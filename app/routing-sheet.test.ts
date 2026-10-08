import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  classifyIssue,
  listStations,
  missingGates,
  multiPersonNote,
  stationTone,
} from "./routing-sheet.ts";

describe("listStations", () => {
  it("按个人项目的顺序给出五个工位，不包含 fork", () => {
    const stations = listStations();

    assert.deepEqual(
      stations.map((station) => station.name),
      [
        "先写下来",
        "从主线开一条线",
        "自己先检查",
        "交上去请人看",
        "看过再合并",
      ],
    );
    assert.deepEqual(
      stations.map((station) => station.id),
      ["issue", "branch", "checks", "pr", "merge"],
    );
    const ids: string[] = stations.map((station) => station.id);
    assert.equal(ids.includes("fork"), false);
  });

  it("每个工位都写了要做的事、可复制的命令，以及跳过的后果", () => {
    for (const station of listStations()) {
      assert.ok(station.action.length > 0, station.id);
      assert.ok(station.command.length > 0, station.id);
      assert.ok(station.skipped.length > 0, station.id);
    }

    const branch = listStations().find((station) => station.id === "branch");
    assert.ok(branch);
    assert.match(branch.command, /git checkout main/);
    assert.match(branch.command, /git pull/);
    assert.match(branch.command, /git checkout -b /);
    assert.match(branch.action, /开分支/);
    assert.match(branch.action, /fork/);
    assert.match(branch.action, /写权限/);
    assert.match(branch.action, /复制一份到你自己的账号/);
    assert.match(branch.action, /还是要在自己的那份上开分支/);

    const checks = listStations().find((station) => station.id === "checks");
    assert.ok(checks);
    assert.equal(
      checks.command,
      ["npm run lint", "npm run typecheck", "npm run test", "npm run build"].join(
        "\n",
      ),
    );

    const pr = listStations().find((station) => station.id === "pr");
    assert.ok(pr);
    assert.match(pr.command, /Closes #123/);
  });
});

describe("missingGates", () => {
  it("Issue 没写背景、目标和验收标准时，按这个顺序指出缺失项", () => {
    assert.deepEqual(missingGates("issue", []), [
      "还没写背景",
      "还没写目标",
      "还没写验收标准",
    ]);
  });

  it("门禁都满足时没有缺失项", () => {
    const issue = listStations().find((station) => station.id === "issue");
    assert.ok(issue);
    assert.deepEqual(
      missingGates(
        "issue",
        issue.gates.map((gate) => gate.id),
      ),
      [],
    );
  });

  it("只指出还没满足的门禁", () => {
    assert.deepEqual(missingGates("checks", ["lint", "typecheck"]), [
      "还没跑 test",
      "还没跑 build",
    ]);
  });

  it("无关的门禁 id 不会被当成已满足", () => {
    assert.deepEqual(missingGates("issue", ["lint", ""]), [
      "还没写背景",
      "还没写目标",
      "还没写验收标准",
    ]);
  });
});

describe("stationTone", () => {
  it("有缺失门禁时标成拦住，即使它是当前工位", () => {
    assert.equal(stationTone("issue", "issue", []), "blocked");
  });

  it("门禁满足且是当前工位时标成当前", () => {
    assert.equal(
      stationTone("checks", "checks", ["lint", "typecheck", "test", "build"]),
      "current",
    );
  });

  it("门禁满足且位于当前工位之前时标成已通过", () => {
    const issue = listStations().find((station) => station.id === "issue");
    assert.ok(issue);
    assert.equal(
      stationTone(
        "issue",
        "checks",
        issue.gates.map((gate) => gate.id),
      ),
      "passed",
    );
  });

  it("门禁满足且位于当前工位之后时标成未到", () => {
    const merge = listStations().find((station) => station.id === "merge");
    assert.ok(merge);
    assert.equal(
      stationTone(
        "merge",
        "checks",
        merge.gates.map((gate) => gate.id),
      ),
      "waiting",
    );
  });
});

describe("classifyIssue", () => {
  it("bug 与 feat 前缀分别标成 Bug 和 Feature", () => {
    assert.deepEqual(classifyIssue("bug: 按钮点了没反应"), {
      label: "bug",
      issueType: "Bug",
    });
    assert.deepEqual(classifyIssue("  feat: 为流程单补上门禁提示"), {
      label: "enhancement",
      issueType: "Feature",
    });
    assert.deepEqual(classifyIssue("fix(ui): 命令错位"), {
      label: "bug",
      issueType: "Bug",
    });
    assert.deepEqual(classifyIssue("feature: 增加多人协作说明"), {
      label: "enhancement",
      issueType: "Feature",
    });
    assert.deepEqual(classifyIssue("[bug]: 页面打不开"), {
      label: "bug",
      issueType: "Bug",
    });
  });

  it("没有前缀的标题标成 Task，不再加 label", () => {
    assert.deepEqual(classifyIssue("调整流程单文案"), {
      label: null,
      issueType: "Task",
    });
  });

  it("已经带了 bug 或 enhancement 标签时不再重复添加", () => {
    assert.deepEqual(classifyIssue("随便写的标题", ["bug"]), {
      label: null,
      issueType: "Bug",
    });
    assert.deepEqual(classifyIssue("feat: 复制命令", ["enhancement"]), {
      label: null,
      issueType: "Feature",
    });
  });

  it("空标题、空白标题、缺少分隔符和非字符串标题标成 Task", () => {
    assert.deepEqual(classifyIssue(""), { label: null, issueType: "Task" });
    assert.deepEqual(classifyIssue("   "), { label: null, issueType: "Task" });
    assert.deepEqual(classifyIssue("feat"), { label: null, issueType: "Task" });
    assert.deepEqual(classifyIssue(null as unknown as string), {
      label: null,
      issueType: "Task",
    });
  });
});

describe("multiPersonNote", () => {
  it("说明 fork 只在没有主仓库写权限时使用", () => {
    assert.match(multiPersonNote, /fork/);
    assert.match(multiPersonNote, /upstream/);
    assert.match(multiPersonNote, /写权限/);
  });
});
