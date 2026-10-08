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
    name: "先写下来",
    action:
      "改代码之前，先在 GitHub 上开一条记录，这条记录叫 Issue。写清背景（现在是什么情况）、目标（做成什么样）、验收标准（怎样算做完），并指定 owner，也就是负责人。标题用 bug: 开头表示要修问题，用 feat: 开头表示要做功能，系统会据此分类。其他标题会标成普通任务 Task。",
    command: ["feat: 为流程单补上门禁提示", "bug: 复制命令没有写入剪贴板"].join("\n"),
    skipped:
      "只有一个空标题时，别人不知道要做什么。关掉这条 Issue 时要写明原因：被哪个 PR 解决、被另一条 Issue 取代，或者确定不做了。",
    gates: [
      { id: "background", label: "写了背景", missing: "还没写背景" },
      { id: "goal", label: "写了目标", missing: "还没写目标" },
      { id: "acceptance", label: "写了验收标准", missing: "还没写验收标准" },
    ],
  },
  {
    id: "branch",
    name: "从主线开一条线",
    action:
      "main 是正式主线。先把它更新到最新，再从这次的 main 拉出一条分支，改动先写在分支上。这条分支只做刚才那条 Issue 里的事。个人项目的分支留在本仓库。",
    command: ["git checkout main", "git pull", "git checkout -b feat/routing-sheet-gates"].join(
      "\n",
    ),
    skipped: "主线已经更新了，你还从旧的位置开分支，交上去时会混进别人的改动，或者和主线对不上。",
    gates: [
      { id: "fresh-main", label: "已经更新到最新主线", missing: "还没更新到最新 main" },
      { id: "opened", label: "已经从这次的主线开了分支", missing: "还没从这次的 main 开出分支" },
    ],
  },
  {
    id: "checks",
    name: "自己先检查",
    action:
      "把改动交上去之前，先在自己电脑上按这个顺序跑完。交上去之后，CI 会自动再跑同一组命令。lint 看代码问题，typecheck 看类型，test 跑测试，build 看能不能打包。",
    command: ["npm run lint", "npm run typecheck", "npm run test", "npm run build"].join("\n"),
    skipped: "自己没跑的检查，CI 会拦住，暂时不能并进主线。如果已经并进主线才发现，要修的就是主线上的代码。",
    gates: [
      { id: "lint", label: "跑过代码检查 lint", missing: "还没跑 lint" },
      { id: "typecheck", label: "跑过类型检查 typecheck", missing: "还没跑 typecheck" },
      { id: "test", label: "跑过测试 test", missing: "还没跑 test" },
      { id: "build", label: "跑过打包 build", missing: "还没跑 build" },
    ],
  },
  {
    id: "pr",
    name: "交上去请人看",
    action:
      "在 GitHub 上开一个 PR，也就是请别人看你这次改动的申请。说明里写上 Closes #123，123 换成 Issue 编号，合并后那条 Issue 会自动关掉。这次改的内容要和那条 Issue 是同一件事。不能把分支直接推进 main。",
    command: "Closes #123",
    skipped:
      "没写上对应的 Issue 时，机器人会在 PR 下面留言。补上以后，提醒会标成已解决。还没人看过、还没合并的代码，不能当成已经发布的版本。",
    gates: [
      {
        id: "closes",
        label: "说明里写了 Closes #编号",
        missing: "描述里还没有 Closes # 这样的关闭关键字",
      },
      { id: "scope", label: "改动和那条 Issue 是同一件事", missing: "改动范围和 Issue 不一致" },
    ],
  },
  {
    id: "merge",
    name: "看过再合并",
    action:
      "Review 是别人看你的改动。对方点 approve 表示同意。CI 的自动检查也要通过，才能合并进 main。要发布时，另外开一个 PR，只改 VERSION 里的版本号。打上标签并写出 Release（这一版的发布说明）之后，才算一次正式发布。main 上平时多出来的提交，还不算发布。",
    command: ["# 单独一个 PR，只改版本号", "VERSION=1.1.0"].join("\n"),
    skipped: "没有人点同意，或者自动检查没过，就不能并进主线。还没合并的分支也不能拿去当正式版本。",
    gates: [
      { id: "approve", label: "有人点了同意 approve", missing: "还没有 approve" },
      { id: "ci", label: "自动检查 CI 通过了", missing: "CI 还没通过" },
    ],
  },
];

export const terms = [
  { word: "Issue", meaning: "一件先写下来的事。改代码之前先开这一条。" },
  { word: "main", meaning: "正式主线，收进来的代码都在这里。" },
  { word: "分支", meaning: "从主线拉出来的临时线，改动先写在上面。" },
  { word: "PR", meaning: "把改动交上去请人看的申请。别人同意，才能并进主线。" },
  { word: "CI", meaning: "交上去之后自动跑的检查。" },
  { word: "Review", meaning: "别人看你的改动。点 approve 表示同意合并。" },
] as const;

export const multiPersonNote =
  "一个人维护自己的仓库时，不用 fork。几个人一起做、而你没有主仓库的写权限时，才把主仓库 fork 到自己账号，把主仓库加为 upstream，开分支前先 fetch 再 rebase upstream/main，然后向主仓库提 PR。";

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
