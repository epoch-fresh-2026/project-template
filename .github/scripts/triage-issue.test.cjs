const assert = require("node:assert/strict");
const test = require("node:test");

const triageIssue = require("./triage-issue.cjs");
const { classifyIssue, selectMilestone } = triageIssue;

test("bug 与 feat 标题分别标成 Bug 和 Feature", () => {
  assert.deepEqual(classifyIssue("bug: 按钮点了没反应"), {
    label: "bug",
    issueType: "Bug",
  });
  assert.deepEqual(classifyIssue("feat: 为流程单补上门禁提示"), {
    label: "enhancement",
    issueType: "Feature",
  });
});

test("已经带了分类标签时不再重复添加", () => {
  assert.deepEqual(classifyIssue("login is broken", ["bug"]), {
    label: null,
    issueType: "Bug",
  });
});

test("没有前缀的标题标成 Task", () => {
  assert.deepEqual(classifyIssue("调整流程单文案"), {
    label: null,
    issueType: "Task",
  });
});

test("选择截止日期不早于创建日、并且最近的 milestone", () => {
  const milestone = selectMilestone(
    [
      { number: 5, due_on: "2026-09-01T00:00:00Z", created_at: "2026-08-10T00:00:00Z" },
      { number: 4, due_on: "2026-08-14T00:00:00Z", created_at: "2026-08-04T00:00:00Z" },
      { number: 3, due_on: "2026-08-01T00:00:00Z", created_at: "2026-07-01T00:00:00Z" },
    ],
    "2026-08-13T12:00:00Z",
  );

  assert.equal(milestone.number, 4);
});

test("没有可用 milestone 时返回 undefined", () => {
  assert.equal(
    selectMilestone(
      [{ number: 3, due_on: "2026-08-01T00:00:00Z", created_at: "2026-07-01T00:00:00Z" }],
      "2026-08-13T12:00:00Z",
    ),
    undefined,
  );
});

test("新 Issue 会挂上 milestone、label 和类型", async () => {
  const calls = [];
  const github = {
    paginate: async () => [
      {
        number: 4,
        title: "MS3",
        due_on: "2026-08-14T00:00:00Z",
        created_at: "2026-08-04T00:00:00Z",
      },
    ],
    rest: {
      issues: {
        listMilestones: () => {},
        update: async (input) => calls.push(["update", input]),
        addLabels: async (input) => calls.push(["addLabels", input]),
      },
    },
    graphql: async (query, variables) => {
      if (query.includes("query IssueTriageMetadata")) {
        return {
          repository: {
            issue: { id: "issue-id", issueType: null },
            issueTypes: {
              nodes: [{ id: "bug-type-id", name: "Bug", isEnabled: true }],
            },
          },
        };
      }
      calls.push(["setIssueType", variables]);
      return { updateIssue: { issue: { id: "issue-id" } } };
    },
  };

  await triageIssue({
    github,
    context: {
      repo: { owner: "owner", repo: "repo" },
      payload: {
        issue: {
          number: 7,
          title: "bug: 页面打不开",
          created_at: "2026-08-13T00:00:00Z",
          labels: [],
          milestone: null,
        },
      },
    },
    core: { info: () => {}, warning: () => {} },
  });

  assert.deepEqual(calls, [
    ["update", { owner: "owner", repo: "repo", issue_number: 7, milestone: 4 }],
    ["addLabels", { owner: "owner", repo: "repo", issue_number: 7, labels: ["bug"] }],
    ["setIssueType", { issueId: "issue-id", issueTypeId: "bug-type-id" }],
  ]);
});
