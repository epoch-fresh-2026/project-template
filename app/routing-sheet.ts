export const STATION_IDS = ["issue", "branch", "checks", "pr", "merge"] as const;

export type StationId = (typeof STATION_IDS)[number];

export type StationTone = "blocked" | "current" | "passed" | "waiting";

export type IssueType = "Bug" | "Feature" | "Task";

export type IssueLabel = "bug" | "enhancement";

export type IssueClassification = {
  label: IssueLabel | null;
  issueType: IssueType;
};

export type Gate = {
  id: string;
  label: string;
  missing: string;
};

export type Station = {
  id: StationId;
  name: string;
  action: string;
  command: string;
  skipped: string;
  gates: Gate[];
};

const TITLE_RULES: ReadonlyArray<{
  pattern: RegExp;
  label: IssueLabel;
  issueType: Exclude<IssueType, "Task">;
}> = [
  {
    pattern: /^\s*(?:\[bug\]|bug(?:fix)?|fix)(?:\([^)]*\))?\s*[:：-]/i,
    label: "bug",
    issueType: "Bug",
  },
  {
    pattern: /^\s*(?:\[feature\]|feat(?:ure)?)(?:\([^)]*\))?\s*[:：-]/i,
    label: "enhancement",
    issueType: "Feature",
  },
];

const STATIONS: readonly Station[] = [
  {
    id: "issue",
    name: "提 Issue",
    action:
      "改代码之前先开 Issue。写清背景、目标和验收标准，并指定 owner。标题用 bug: 或 feat: 开头，方便自动标成 Bug 或 Feature；其余标成 Task。",
    command: ["feat: 为流程单补上门禁提示", "bug: 复制命令没有写入剪贴板"].join("\n"),
    skipped:
      "空泛标题进不了计划。关闭 Issue 时要写明原因：被哪个 PR 解决、被哪个 Issue 取代，或确认不再需要。",
    gates: [
      { id: "background", label: "写了背景", missing: "还没写背景" },
      { id: "goal", label: "写了目标", missing: "还没写目标" },
      { id: "acceptance", label: "写了验收标准", missing: "还没写验收标准" },
    ],
  },
  {
    id: "branch",
    name: "从最新 main 开分支",
    action:
      "先把本仓库的 main 更新到最新，再从这次的 main 开分支。分支和 PR 都留在这个仓库，改动范围与 Issue 一致。",
    command: ["git checkout main", "git pull", "git checkout -b feat/routing-sheet-gates"].join(
      "\n",
    ),
    skipped: "基于过期的 main 开分支，PR 会混进无关提交，或者和 main 冲突。",
    gates: [
      { id: "fresh-main", label: "更新到了最新 main", missing: "还没更新到最新 main" },
      { id: "opened", label: "从这次的 main 开了分支", missing: "还没从这次的 main 开出分支" },
    ],
  },
  {
    id: "checks",
    name: "本地检查",
    action: "提 PR 之前按这个顺序在本地跑完。CI 用同一组命令，顺序也不变。",
    command: ["npm run lint", "npm run typecheck", "npm run test", "npm run build"].join("\n"),
    skipped: "本地没跑的检查会在 CI 里拦住合并。合进 main 之后才发现，修的是已经在 main 上的提交。",
    gates: [
      { id: "lint", label: "跑过 lint", missing: "还没跑 lint" },
      { id: "typecheck", label: "跑过 typecheck", missing: "还没跑 typecheck" },
      { id: "test", label: "跑过 test", missing: "还没跑 test" },
      { id: "build", label: "跑过 build", missing: "还没跑 build" },
    ],
  },
  {
    id: "pr",
    name: "提 PR 并关联 Issue",
    action:
      "PR 描述里用关闭关键字关联 Issue，改动范围与 Issue 一致，不夹带无关改动。main 必须走 PR，不能直接推进。",
    command: "Closes #123",
    skipped:
      "没关联 Issue 时，自动化会在 PR 上留言提醒。补上关联后，这条提醒会标成已解决。没 review、没合并的代码不算正式版本。",
    gates: [
      {
        id: "closes",
        label: "描述里写了 Closes #",
        missing: "描述里还没有 Closes # 这样的关闭关键字",
      },
      { id: "scope", label: "改动范围与 Issue 一致", missing: "改动范围和 Issue 不一致" },
    ],
  },
  {
    id: "merge",
    name: "Review 通过后合并",
    action:
      "要有 approve，并且 CI 通过，才能合进 main。发版时单独提一个 PR 修改 VERSION。正式发布只认 Release，普通的 main 更新不会变成一次发布。",
    command: ["# 单独一个 PR，只改版本号", "VERSION=1.1.0"].join("\n"),
    skipped: "没有 approve 或 CI 没过，不能合进 main。部署只认 Release，不认还没合并的分支。",
    gates: [
      { id: "approve", label: "有 approve", missing: "还没有 approve" },
      { id: "ci", label: "CI 通过", missing: "CI 还没通过" },
    ],
  },
];

export const multiPersonNote =
  "多人协作、贡献者没有主仓库写权限时，才 fork 到个人账号，把主仓库加为 upstream，开分支前 fetch 并 rebase upstream/main，再向主仓库提 PR。个人项目不用这一步。";

export function listStations(): readonly Station[] {
  return STATIONS;
}

export function missingGates(stationId: StationId, satisfied: readonly string[]): string[] {
  const station = STATIONS.find((item) => item.id === stationId);
  if (!station) {
    return [];
  }

  const done = new Set(satisfied);
  return station.gates.filter((gate) => !done.has(gate.id)).map((gate) => gate.missing);
}

export function stationTone(
  stationId: StationId,
  currentId: StationId,
  satisfied: readonly string[],
): StationTone {
  if (missingGates(stationId, satisfied).length > 0) {
    return "blocked";
  }

  const index = STATIONS.findIndex((station) => station.id === stationId);
  const current = STATIONS.findIndex((station) => station.id === currentId);
  if (index === current) {
    return "current";
  }
  if (index < current) {
    return "passed";
  }
  return "waiting";
}

export function classifyIssue(
  title: string,
  labelNames: readonly string[] = [],
): IssueClassification {
  const normalized = new Set(labelNames.map((label) => label.toLowerCase()));

  if (normalized.has("bug")) {
    return { label: null, issueType: "Bug" };
  }

  if (normalized.has("enhancement")) {
    return { label: null, issueType: "Feature" };
  }

  const rule = TITLE_RULES.find(({ pattern }) => pattern.test(title));
  if (!rule) {
    return { label: null, issueType: "Task" };
  }

  return {
    label: normalized.has(rule.label) ? null : rule.label,
    issueType: rule.issueType,
  };
}
