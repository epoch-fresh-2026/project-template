const assert = require("node:assert/strict");
const test = require("node:test");

const checkPullRequestIssue = require("./check-pr-issue.cjs");
const { RESOLVED_WARNING_MARKER, WARNING_MARKER } = checkPullRequestIssue;

function createContext() {
  return {
    repo: { owner: "owner", repo: "repo" },
    payload: {
      pull_request: {
        number: 42,
        user: { login: "octocat" },
      },
    },
  };
}

test("已关联 issue 时，把尚未解决的提醒标成已解决", async () => {
  const calls = [];
  const github = {
    graphql: async () => ({
      repository: {
        pullRequest: { closingIssuesReferences: { totalCount: 1 } },
      },
    }),
    paginate: async () => [
      { id: 98, body: `${WARNING_MARKER}\nFirst warning` },
      { id: 99, body: `${WARNING_MARKER}\nSecond warning` },
      { id: 100, body: `${RESOLVED_WARNING_MARKER}\nResolved warning` },
    ],
    rest: {
      issues: {
        listComments: () => {},
        createComment: async () => {
          throw new Error("comment should not be created");
        },
        updateComment: async (input) => calls.push(input),
      },
    },
  };

  await checkPullRequestIssue({
    github,
    context: createContext(),
    core: { info: () => {}, warning: () => {} },
  });

  assert.deepEqual(calls, [
    {
      owner: "owner",
      repo: "repo",
      comment_id: 98,
      body: `${RESOLVED_WARNING_MARKER}\n此 PR 已关联 issue，之前的提醒已自动标记为已解决。`,
    },
    {
      owner: "owner",
      repo: "repo",
      comment_id: 99,
      body: `${RESOLVED_WARNING_MARKER}\n此 PR 已关联 issue，之前的提醒已自动标记为已解决。`,
    },
  ]);
});

test("未关联 issue 时提醒作者，并只提醒一次", async () => {
  const calls = [];
  const github = {
    graphql: async () => ({
      repository: {
        pullRequest: { closingIssuesReferences: { totalCount: 0 } },
      },
    }),
    paginate: async () => [{ body: `${WARNING_MARKER}\nExisting warning` }],
    rest: {
      issues: {
        listComments: () => {},
        createComment: async (input) => calls.push(input),
      },
    },
  };

  await checkPullRequestIssue({
    github,
    context: createContext(),
    core: { info: () => {}, warning: () => {} },
  });

  assert.deepEqual(calls, []);
});

test("还没有任何提醒时，留言要求使用关闭关键字", async () => {
  const calls = [];
  const github = {
    graphql: async (query, variables) => {
      assert.match(query, /closingIssuesReferences/);
      assert.deepEqual(variables, { owner: "owner", repo: "repo", number: 42 });
      return {
        repository: {
          pullRequest: { closingIssuesReferences: { totalCount: 0 } },
        },
      };
    },
    paginate: async () => [],
    rest: {
      issues: {
        listComments: () => {},
        createComment: async (input) => calls.push(input),
      },
    },
  };

  await checkPullRequestIssue({
    github,
    context: createContext(),
    core: { info: () => {}, warning: () => {} },
  });

  assert.deepEqual(calls, [
    {
      owner: "owner",
      repo: "repo",
      issue_number: 42,
      body: `${WARNING_MARKER}\n@octocat，此 PR 尚未关联 issue。请在 PR 描述中使用 \`Closes #123\` 等关闭关键字；更新描述后，此提醒将自动标记为已解决。`,
    },
  ]);
});
