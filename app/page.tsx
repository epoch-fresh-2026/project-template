"use client";

import { useState } from "react";
import {
  classifyIssue,
  listStations,
  missingGates,
  multiPersonNote,
  stationTone,
  type StationId,
  type StationTone,
} from "./routing-sheet";

function copyWithSelection(value: string) {
  const area = document.createElement("textarea");
  area.value = value;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.left = "-9999px";
  document.body.appendChild(area);
  area.select();
  const copied = document.execCommand("copy");
  area.remove();
  if (!copied) {
    throw new Error("copy failed");
  }
}

const TONE_LABEL: Record<StationTone, string> = {
  blocked: "拦住",
  current: "当前",
  passed: "已通过",
  waiting: "未到",
};

const TONE_CLASS: Record<StationTone, string> = {
  blocked: "border-blocked text-blocked",
  current: "border-current text-ink",
  passed: "border-passed text-passed",
  waiting: "border-line text-waiting",
};

function initialSatisfied(): Record<StationId, string[]> {
  const satisfied = {} as Record<StationId, string[]>;
  for (const station of listStations()) {
    satisfied[station.id] = station.gates.map((gate) => gate.id);
  }
  satisfied.issue = satisfied.issue.filter((id) => id !== "acceptance");
  return satisfied;
}

export default function Home() {
  const stations = listStations();
  const [currentId, setCurrentId] = useState<StationId>("issue");
  const [satisfied, setSatisfied] = useState(initialSatisfied);
  const [title, setTitle] = useState("feat: 为流程单补上门禁提示");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");

  const current = stations.find((station) => station.id === currentId) ?? stations[0];
  const missing = missingGates(current.id, satisfied[current.id]);
  const tone = stationTone(current.id, currentId, satisfied[current.id]);
  const classification = classifyIssue(title);

  async function copyCommand() {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(current.command);
      } else {
        copyWithSelection(current.command);
      }
      setCopied(true);
      setCopyError("");
    } catch {
      try {
        copyWithSelection(current.command);
        setCopied(true);
        setCopyError("");
      } catch {
        setCopied(false);
        setCopyError("复制失败，请手动选中命令。");
      }
    }
  }

  function toggleGate(gateId: string) {
    setSatisfied((previous) => {
      const currentGates = previous[current.id];
      const nextGates = currentGates.includes(gateId)
        ? currentGates.filter((id) => id !== gateId)
        : [...currentGates, gateId];
      return { ...previous, [current.id]: nextGates };
    });
    setCopied(false);
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-8 sm:py-12">
      <header className="flex flex-col gap-3">
        <p className="font-display text-sm font-semibold tracking-[0.18em] text-waiting uppercase">
          Routing sheet
        </p>
        <h1 className="font-display text-4xl font-semibold tracking-tight sm:text-5xl">流程单</h1>
        <p className="max-w-2xl text-lg leading-8">
          个人项目的一次改动，从 Issue 走到合并。选中的工位带黑框。门禁没齐是红色，齐了并且正停在这里是黄色，前面已经通过的是绿色。
        </p>
      </header>

      <nav aria-label="开发流程">
        <ol className="flex flex-col gap-3 md:flex-row md:items-stretch">
          {stations.map((station, index) => {
            const stationMissing = missingGates(station.id, satisfied[station.id]);
            const stationToneValue = stationTone(station.id, currentId, satisfied[station.id]);
            const selected = station.id === current.id;
            return (
              <li key={station.id} className="md:flex-1">
                <button
                  type="button"
                  aria-current={selected ? "step" : undefined}
                  onClick={() => {
                    setCurrentId(station.id);
                    setCopied(false);
                    setCopyError("");
                  }}
                  className={`flex h-full w-full items-start gap-3 rounded-sm border-2 bg-card px-3 py-3 text-left ${TONE_CLASS[stationToneValue]} ${selected ? "ring-2 ring-ink ring-offset-2 ring-offset-bench" : ""}`}
                >
                  <span
                    aria-hidden="true"
                    className={`mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 font-display text-xs font-semibold ${TONE_CLASS[stationToneValue]}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="flex min-w-0 flex-col gap-1">
                    <span className="font-display text-base leading-5 font-semibold break-keep text-ink">
                      {station.name}
                    </span>
                    <span className="text-xs tracking-wide">
                      {TONE_LABEL[stationToneValue]}
                      {stationMissing.length > 0 ? ` · 缺 ${stationMissing.length}` : ""}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <section className="flex flex-col gap-6 rounded-sm border border-line bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">{current.name}</h2>
          <p className={`font-display text-sm font-semibold tracking-wide ${TONE_CLASS[tone]}`}>
            {TONE_LABEL[tone]}
          </p>
        </div>

        <p className="max-w-3xl leading-7">{current.action}</p>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-sm font-semibold tracking-wide">命令</h3>
            <button
              type="button"
              onClick={copyCommand}
              className="rounded-sm border border-ink bg-ink px-3 py-1.5 font-display text-sm font-semibold text-card"
            >
              {copied ? "已复制" : "复制命令"}
            </button>
          </div>
          <pre className="overflow-x-auto rounded-sm bg-bench px-4 py-3 font-mono text-sm leading-6 text-ink">
            {current.command}
          </pre>
          {copyError ? <p className="text-sm text-blocked">{copyError}</p> : null}
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="font-display text-sm font-semibold tracking-wide">门禁</legend>
          {current.gates.map((gate) => (
            <label key={gate.id} className="flex items-center gap-3 text-base">
              <input
                type="checkbox"
                checked={satisfied[current.id].includes(gate.id)}
                onChange={() => toggleGate(gate.id)}
                className="h-4 w-4 accent-ink"
              />
              {gate.label}
            </label>
          ))}
        </fieldset>

        {missing.length > 0 ? (
          <div className="border-l-4 border-blocked pl-4">
            <h3 className="font-display text-sm font-semibold text-blocked">还差这些</h3>
            <ul className="mt-2 flex flex-col gap-1">
              {missing.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-passed">这一工位的门禁都满足了。</p>
        )}

        <div>
          <h3 className="font-display text-sm font-semibold tracking-wide">跳过会怎样</h3>
          <p className="mt-2 max-w-3xl leading-7">{current.skipped}</p>
        </div>

        {current.id === "issue" ? (
          <div className="flex flex-col gap-3 border-t border-line pt-5">
            <h3 className="font-display text-sm font-semibold tracking-wide">试试标题</h3>
            <label className="flex flex-col gap-2">
              <span className="text-sm text-waiting">输入 Issue 标题，看它会被标成哪一类</span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="rounded-sm border border-line bg-bench px-3 py-2 font-mono text-sm"
              />
            </label>
            <p>
              {classification.issueType}
              {classification.label
                ? ` · 添加 ${classification.label}`
                : " · 不新增 label"}
            </p>
          </div>
        ) : null}
      </section>

      <aside className="max-w-3xl text-sm leading-6 text-waiting">
        <h2 className="font-display text-sm font-semibold tracking-wide text-ink">多人项目</h2>
        <p className="mt-2">{multiPersonNote}</p>
        <p className="mt-3">
          新建 Issue 和 PR 时用仓库里的模板，打开就能看到一份写好的例子。
        </p>
      </aside>
    </div>
  );
}
