import { useState } from "react";
import type { GameConfig } from "../config/types";
import { CHAPTER_ONE_TO_TWO, type ChapterTransitionBeat } from "../data/chapterTransitions";
import { MAIN_STORY_SCENES } from "../data/mainStory";
import { STORY_BRANCHES, STORY_ENDINGS } from "../data/storyBranches";
import { BOSS_COMBAT_TUTORIAL_LINES, FIRST_MISSION_LIGHT_GUIDE_LINES } from "../data/tutorialStory";
import { tutorialSteps } from "../data/tutorial";
import "./story-timeline.css";

type Entry = { key: string; label: string; original: string };
type Group = { title: string; entries: Entry[] };
type Node = { id: string; title: string; when: string; groups: Group[]; prologueIndex?: number };

const SPEAKER: Record<string, string> = { narrator: "旁白", researcher: "研究員", claire: "Claire", ethan: "Ethan", leo: "Leo" };
const line = (key: string, label: string, original: string): Entry => ({ key, label, original });

function beatEntries(prefix: string, label: string, beat: ChapterTransitionBeat): Entry[] {
  return [
    line(prefix, label, beat.text),
    ...(beat.choice || []).map((option) => line(`${prefix}.option.${option.id}`, `選項｜${option.id}`, option.label)),
    ...(beat.clue ? [
      line(`${prefix}.clue.title`, `${label}｜線索標題`, beat.clue.title),
      line(`${prefix}.clue.detail`, `${label}｜線索說明`, beat.clue.detail),
    ] : []),
  ];
}

function storyNodes(config: GameConfig): Node[] {
  const nodes: Node[] = [
    ...config.prologue.map((page, index) => ({ id: `prologue-${index}`, title: `序章｜${page.title}`, when: "開始遊戲後播放", groups: [], prologueIndex: index })),
    ...tutorialSteps.map((step, index) => ({
      id: `base-tutorial-${step.id}`,
      title: `新手教學 ${index + 1}｜${step.title}`,
      when: "首次進入基地的角色導覽",
      groups: [{ title: "角色對話", entries: [
        line(`tutorial.base.${step.id}.title`, "教學段落標題", step.title),
        ...step.dialogue.map((dialogue, lineIndex) => line(`tutorial.base.${step.id}.${lineIndex}`, `${lineIndex + 1}｜${SPEAKER[dialogue.speaker] || "小隊"}`, dialogue.text)),
      ] }],
    })),
    { id: "light-tutorial", title: "新手教學｜工作燈", when: "第一章初次出勤", groups: [{ title: "逐步教學", entries: FIRST_MISSION_LIGHT_GUIDE_LINES.map((text, index) => line(`tutorial.light.${index}`, `步驟 ${index + 1}`, text)) }] },
    { id: "boss-tutorial", title: "新手教學｜機器人戰鬥", when: "首次 C2-932 Boss 作戰", groups: [{ title: "逐步教學", entries: BOSS_COMBAT_TUTORIAL_LINES.map((text, index) => line(`tutorial.boss.${index}`, `步驟 ${index + 1}`, text)) }] },
    { id: "chapter-1", title: "第一章 → 第二章", when: "避難所撤離後", groups: [{ title: "角色對話與線索", entries: CHAPTER_ONE_TO_TWO.flatMap((beat, index) => beatEntries(`transition.1to2.${index}`, `${index + 1}｜${SPEAKER[beat.speaker]}`, beat)) }] },
  ];
  for (const chapter of [2, 3, 4, 5] as const) {
    const scene = MAIN_STORY_SCENES[chapter];
    const branch = STORY_BRANCHES[chapter];
    const common = scene.beats.flatMap((beat, index) => index <= branch.after || index > (branch.omitAfter ?? branch.after)
      ? beatEntries(`chapter.${chapter}.common.${index}`, `${index + 1}｜${SPEAKER[beat.speaker]}`, beat)
      : []);
    nodes.push({
      id: `chapter-${chapter}`, title: scene.title, when: "本章任務完成、返回基地時",
      groups: [
        { title: "共同劇情", entries: common },
        { title: "玩家選擇", entries: beatEntries(`chapter.${chapter}.prompt`, SPEAKER[branch.prompt.speaker], branch.prompt) },
        ...branch.choices.map((choice) => ({ title: `選擇後｜${choice.label}`, entries: choice.beats.flatMap((beat, index) => beatEntries(`chapter.${chapter}.choice.${choice.id}.${index}`, `${index + 1}｜${SPEAKER[beat.speaker]}`, beat)) })),
      ],
    });
  }
  nodes.push({
    id: "chapter-6", title: MAIN_STORY_SCENES[6].title, when: "第六章 Boss 勝利後",
    groups: [
      { title: "中央核心對話", entries: MAIN_STORY_SCENES[6].beats.slice(0, 7).flatMap((beat, index) => beatEntries(`chapter.6.common.${index}`, `${index + 1}｜${SPEAKER[beat.speaker]}`, beat)) },
      { title: "最後行動", entries: [
        line("chapter.6.prompt", "Leo｜選擇前對話", "核心只剩一次操作機會；我們現在要怎麼做？"),
        line("chapter.6.prompt.option.purge", "行動｜清除", "啟動光能淨化，阻斷擴散"),
        line("chapter.6.prompt.option.coexist", "行動｜共存", "啟動分段穩定，讓情緒逐步回來"),
        line("chapter.6.prompt.option.seal", "行動｜封存", "封閉核心，爭取研究時間"),
      ] },
    ],
  });
  for (const [id, title] of [["purge", "無影之日"], ["coexist", "繁星時代"], ["seal", "封存之環"]]) {
    nodes.push({ id: `ending-${id}`, title: `結局｜${title}`, when: "中央核心最後行動後", groups: [{ title: "結局對話", entries: STORY_ENDINGS[id].flatMap((beat, index) => beatEntries(`ending.${id}.${index}`, `${index + 1}｜${SPEAKER[beat.speaker]}`, beat)) }] });
  }
  return nodes;
}

export function StoryTimelineAdmin({ config, onChange }: { config: GameConfig; onChange: (next: GameConfig) => void }) {
  const nodes = storyNodes(config);
  const [selectedId, setSelectedId] = useState("prologue-0");
  const selected = nodes.find((node) => node.id === selectedId) || nodes[0];
  const setText = (key: string, text: string, original: string) => {
    const next = { ...config.storyText };
    if (text === original) delete next[key]; else next[key] = text;
    onChange({ ...config, storyText: next });
  };
  const setPrologue = (index: number, patch: Partial<GameConfig["prologue"][number]>) => onChange({
    ...config, prologue: config.prologue.map((page, pageIndex) => pageIndex === index ? { ...page, ...patch } : page),
  });
  return <div className="story-timeline">
    <p className="story-timeline-hint">點選時間線節點即可查看與修改遊戲目前使用的文字。修改後請按右上角「儲存到 Firebase」。分支條件與觸發時機維持現有設定。</p>
    <div className="story-timeline-layout">
      <nav className="story-timeline-track" aria-label="劇情時間線">
        {nodes.map((node, index) => <button key={node.id} type="button" className={`story-timeline-node ${selected.id === node.id ? "active" : ""}`} onClick={() => setSelectedId(node.id)} aria-current={selected.id === node.id ? "step" : undefined}>
          <span className="story-timeline-number">{String(index + 1).padStart(2, "0")}</span><span><b>{node.title}</b><small>{node.when}</small></span>
        </button>)}
      </nav>
      <section className="story-timeline-editor" aria-label={`${selected.title}編輯`}>
        <header><span>STORY TIMELINE</span><h3>{selected.title}</h3><p>{selected.when}</p></header>
        {selected.prologueIndex !== undefined ? (() => {
          const index = selected.prologueIndex;
          const page = config.prologue[index];
          return <div className="story-timeline-group">
            <label>頁面標題<input value={page.title} onChange={(event) => setPrologue(index, { title: event.target.value })} /></label>
            <label>背景圖片網址<input value={page.backgroundImage || ""} onChange={(event) => setPrologue(index, { backgroundImage: event.target.value || null })} /></label>
            {(page.segments || [{ paragraphs: page.paragraphs }]).map((segment, segmentIndex) => segment.paragraphs.map((paragraph, paragraphIndex) => <label key={`${segmentIndex}-${paragraphIndex}`}>第 {segmentIndex + 1} 段・第 {paragraphIndex + 1} 句<textarea value={paragraph.text} onChange={(event) => {
              const segments = structuredClone(page.segments || [{ paragraphs: page.paragraphs }]);
              segments[segmentIndex].paragraphs[paragraphIndex].text = event.target.value;
              setPrologue(index, { segments });
            }} /></label>))}
          </div>;
        })() : selected.groups.map((group) => <div className="story-timeline-group" key={group.title}><h4>{group.title}</h4>{group.entries.map((entry) => <label key={entry.key}>{entry.label}<textarea value={config.storyText[entry.key] ?? entry.original} onChange={(event) => setText(entry.key, event.target.value, entry.original)} /><small>{config.storyText[entry.key] !== undefined ? "已修改，尚需儲存" : "目前遊戲預設文字"}</small></label>)}</div>)}
      </section>
    </div>
  </div>;
}
