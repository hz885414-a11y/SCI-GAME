import React, { useEffect, useMemo, useRef, useState } from "react";
import { addCustomNote, clearNoteAdjustments, deleteRhythmNote, getRhythmChart, getRhythmEditsSnapshot, getSourceNoteCount, restoreRhythmEditsSnapshot, saveNoteAdjustment, saveRhythmTimeAdjustments } from "../rhythm/charts";
import { RhythmAudioController } from "../rhythm/audioController";
import { findLocalWavePeakTimes, RhythmWaveform } from "./RhythmWaveform";
import { RHYTHM_KEY_LABELS, RHYTHM_LANES, type RhythmDifficulty, type RhythmLane, type RhythmNote } from "../rhythm/types";

const DIFFICULTIES: Array<{ id: RhythmDifficulty; label: string }> = [{ id: "easy", label: "EASY" }, { id: "normal", label: "NORMAL" }, { id: "hard", label: "HARD" }];
const DEFAULT_WINDOW_SECONDS = 16;
type Snapshot = ReturnType<typeof getRhythmEditsSnapshot>;
type DragState = { note: RhythmNote; time: number; lane: RhythmLane; before: Snapshot };
type ResizeState = { note: RhythmNote; edge: "start" | "end"; time: number; duration: number; before: Snapshot };

export function RhythmChartAdmin({ onChanged }: { onChanged: () => void }) {
  const [difficulty, setDifficulty] = useState<RhythmDifficulty>("normal");
  const [revision, setRevision] = useState(0);
  const [viewStart, setViewStart] = useState(0);
  const [windowSeconds, setWindowSeconds] = useState(DEFAULT_WINDOW_SECONDS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dragging, setDragging] = useState<DragState | null>(null);
  const [resizing, setResizing] = useState<ResizeState | null>(null);
  const [isTestingAudio, setIsTestingAudio] = useState(false);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const [isAutoAligning, setIsAutoAligning] = useState(false);
  const [playbackTime, setPlaybackTime] = useState<number | null>(null);
  const [notice, setNotice] = useState("點擊空白軌道新增音符；直接拖曳音符可左右調時間、上下換軌。Ctrl/Cmd+Z 可復原。 ");
  const timelineRef = useRef<HTMLDivElement | null>(null);
  const audioRef = useRef(new RhythmAudioController());
  const historyRef = useRef<Array<{ difficulty: RhythmDifficulty; snapshot: Snapshot }>>([]);
  const chart = useMemo(() => getRhythmChart(difficulty), [difficulty, revision]);
  const visibleNotes = chart.notes.filter((note) => note.time >= viewStart && note.time <= viewStart + windowSeconds);
  const selected = chart.notes.find((note) => note.id === selectedId) ?? null;
  const refresh = (message: string) => { setRevision((value) => value + 1); onChanged(); setNotice(`${message} 請按右上角「儲存到 Firebase」發布。`); };
  const remember = () => { historyRef.current.push({ difficulty, snapshot: getRhythmEditsSnapshot(difficulty) }); if (historyRef.current.length > 50) historyRef.current.shift(); };

  const undo = () => {
    const previous = historyRef.current.pop();
    if (!previous) { setNotice("沒有可復原的譜面操作。 "); return; }
    restoreRhythmEditsSnapshot(previous.difficulty, previous.snapshot);
    setDifficulty(previous.difficulty); setSelectedId(null); setDragging(null); refresh("已復原上一個譜面操作。 ");
  };
  useEffect(() => {
    const keydown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z" && !["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName || "")) { event.preventDefault(); undo(); }
      if ((event.key === "Delete" || event.key === "Backspace") && selected && !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target?.tagName || "")) {
        event.preventDefault();
        remember(); deleteRhythmNote(difficulty, selected.id); setSelectedId(null); setResizing(null); refresh(`已移除 ${selected.id}。`);
      }
      if (event.code === "Space" && !event.ctrlKey && !event.metaKey && !event.altKey && !["INPUT", "TEXTAREA", "SELECT", "BUTTON"].includes(target?.tagName || "")) {
        event.preventDefault();
        if (!isTestingAudio) void toggleAudio(); else void togglePause();
      }
    };
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  });
  useEffect(() => () => audioRef.current.stop(), []);
  useEffect(() => {
    if (!isTestingAudio || isAudioPaused) return;
    let frame = 0;
    const tick = () => {
      const time = audioRef.current.getTime();
      setPlaybackTime(time);
      // Keep the alignment cursor in view while the song advances. Without
      // this, it appears to disappear once playback leaves the edited window.
      setViewStart((current) => {
        if (time >= current && time <= current + windowSeconds) return current;
        const next = time - windowSeconds / 2;
        return Math.max(0, Math.min(Math.max(0, chart.duration - windowSeconds), next));
      });
      if (time >= chart.duration) { audioRef.current.stop(); setIsTestingAudio(false); return; }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [isTestingAudio, isAudioPaused, chart.duration]);

  const addAt = (event: React.MouseEvent<HTMLDivElement>, lane: RhythmLane) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const timeMs = Math.round((viewStart + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * windowSeconds) * 1000 / 10) * 10;
    remember(); const note = addCustomNote(difficulty, lane, timeMs); setSelectedId(note.id); refresh(`已在 ${RHYTHM_KEY_LABELS[lane]} 軌道的 ${(timeMs / 1000).toFixed(2)} 秒新增音符。`);
  };
  const save = (note: RhythmNote, patch: { timeMs?: number; lane?: RhythmLane }) => { remember(); saveNoteAdjustment(difficulty, note.id, { timeMs: Math.round(note.time * 1000), lane: note.lane, ...patch }); refresh(`已更新 ${note.id}。`); };
  const dragMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (resizing) { resizeMove(event); return; }
    if (!dragging || !timelineRef.current) return;
    const surfaces = Array.from(timelineRef.current.querySelectorAll(".admin-rhythm-track-surface")) as HTMLElement[];
    const index = surfaces.findIndex((surface) => { const rect = surface.getBoundingClientRect(); return event.clientY >= rect.top && event.clientY <= rect.bottom; });
    const surface = surfaces[Math.max(0, index)]; if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const rawTime = Math.round((viewStart + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * windowSeconds) * 100) / 100;
    const time = snapToPlayhead(rawTime);
    setDragging({ ...dragging, time, lane: RHYTHM_LANES[Math.max(0, index)] });
  };
  const finishDrag = () => {
    if (!dragging) return;
    const original = dragging.note;
    if (original.time !== dragging.time || original.lane !== dragging.lane) {
      historyRef.current.push({ difficulty, snapshot: dragging.before });
      saveNoteAdjustment(difficulty, original.id, { timeMs: Math.round(dragging.time * 1000), lane: dragging.lane });
      setSelectedId(original.id); refresh(`已拖曳到 ${dragging.time.toFixed(2)} 秒的 ${RHYTHM_KEY_LABELS[dragging.lane]} 軌。`);
    }
    setDragging(null);
  };
  const resizeMove = (event: React.PointerEvent<HTMLButtonElement>) => {
    if (!resizing || !timelineRef.current) return;
    const surface = timelineRef.current.querySelector(".admin-rhythm-track-surface") as HTMLElement | null;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    const rawPointerTime = Math.round((viewStart + Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)) * windowSeconds) * 100) / 100;
    const pointerTime = snapToPlayhead(rawPointerTime);
    const end = resizing.note.time + (resizing.note.duration ?? 0);
    if (resizing.edge === "end") {
      // Pulling the right edge back to the start restores an ordinary tap.
      setResizing({ ...resizing, duration: Math.max(0, pointerTime - resizing.note.time) });
    } else {
      const time = Math.min(pointerTime, end);
      setResizing({ ...resizing, time, duration: Math.max(0, end - time) });
    }
  };
  const finishResize = () => {
    if (!resizing) return;
    historyRef.current.push({ difficulty, snapshot: resizing.before });
    const type = resizing.duration <= .03 ? "tap" : "hold";
    saveNoteAdjustment(difficulty, resizing.note.id, { timeMs: Math.round(resizing.time * 1000), type, durationMs: Math.round(resizing.duration * 1000) });
    setSelectedId(resizing.note.id); setResizing(null); refresh(type === "tap" ? "已還原為一般點按音符。" : `已調整長按音符：${resizing.duration.toFixed(2)} 秒。`);
  };
  const toggleAudio = async () => {
    if (isTestingAudio) { audioRef.current.stop(); setIsTestingAudio(false); setIsAudioPaused(false); setPlaybackTime(null); setNotice("已停止音樂測試。 "); return; }
    const startAt = playbackTime ?? viewStart;
    audioRef.current.prime(); await audioRef.current.start(startAt); setPlaybackTime(startAt); setIsAudioPaused(false); setIsTestingAudio(true); setNotice(`正在從 ${startAt.toFixed(1)} 秒播放音樂測試。`);
  };
  const togglePause = async () => {
    if (!isTestingAudio) return;
    if (isAudioPaused) { await audioRef.current.resume(); setIsAudioPaused(false); setNotice("已繼續播放，可跟著游標對齊音符。 "); }
    else { audioRef.current.pause(); setPlaybackTime(audioRef.current.getTime()); setIsAudioPaused(true); setNotice("已暫停；現在可以直接拖動音符對齊游標。 "); }
  };
  const seekAudio = (time: number) => {
    audioRef.current.seek(time);
    setPlaybackTime(time);
    setNotice(`播放位置已跳至 ${time.toFixed(2)} 秒。`);
  };
  const autoAlignToWavePeaks = async () => {
    if (!window.confirm(`要依照實際音波峰值重排 ${difficulty.toUpperCase()} 的 ${chart.notes.length} 顆音符嗎？\n\n會保留軌道、雙押與長按設定，只調整時間。可用「復原」還原，完成後請儲存到 Firebase。`)) return;
    setIsAutoAligning(true);
    try {
      const before = getRhythmEditsSnapshot(difficulty);
      const peakTimes = await findLocalWavePeakTimes(chart.notes);
      historyRef.current.push({ difficulty, snapshot: before });
      saveRhythmTimeAdjustments(difficulty, peakTimes);
      setSelectedId(null);
      refresh(`已將 ${chart.notes.length} 顆音符對齊各自小區段的音波峰值。`);
    } catch (error) {
      setNotice(error instanceof Error ? `自動對齊失敗：${error.message}` : "自動對齊失敗，請確認音樂檔可讀取。");
    } finally { setIsAutoAligning(false); }
  };
  const displayNote = (note: RhythmNote) => {
    if (resizing?.note.id === note.id) return resizing.duration <= .03 ? { ...note, type: "tap" as const, time: resizing.time, duration: undefined } : { ...note, type: "hold" as const, time: resizing.time, duration: resizing.duration };
    return dragging?.note.id === note.id ? { ...note, time: dragging.time, lane: dragging.lane } : note;
  };
  const startResize = (event: React.PointerEvent<HTMLSpanElement>, note: RhythmNote, edge: ResizeState["edge"]) => {
    event.preventDefault(); event.stopPropagation();
    (event.currentTarget.parentElement as HTMLButtonElement | null)?.setPointerCapture(event.pointerId);
    setSelectedId(note.id); setDragging(null);
    setResizing({ note, edge, time: note.time, duration: note.duration ?? .1, before: getRhythmEditsSnapshot(difficulty) });
  };
  const movePlayhead = (event: React.PointerEvent<HTMLButtonElement>) => {
    const surface = timelineRef.current?.querySelector(".admin-rhythm-track-surface") as HTMLElement | null;
    if (!surface) return;
    const rect = surface.getBoundingClientRect();
    seekAudio(Math.max(0, Math.min(chart.duration, viewStart + (event.clientX - rect.left) / rect.width * windowSeconds)));
  };
  const snapToPlayhead = (time: number) => playbackTime !== null && Math.abs(time - playbackTime) <= .1 ? playbackTime : time;
  const zoomTimeline = (event: React.WheelEvent<HTMLDivElement>) => {
    if (!(event.ctrlKey || event.metaKey)) return;
    event.preventDefault();
    const next = Math.max(3, Math.min(32, windowSeconds * (event.deltaY < 0 ? .8 : 1.25)));
    // When music has been started, zoom around its playhead so the paused
    // section stays under inspection instead of jumping to the viewport center.
    const center = playbackTime ?? (viewStart + windowSeconds / 2);
    setWindowSeconds(next);
    setViewStart(Math.max(0, Math.min(Math.max(0, chart.duration - next), center - next / 2)));
  };

  return <div className="admin-rhythm-editor">
    <section className="admin-rhythm-intro"><div><span>RHYTHM SOLDERING</span><h3>焊接音樂時間軸</h3><p>點擊新增、拖曳排點、即時播放測試。每條軌道對應一個焊接按鍵；空白鍵可播放／暫停。</p></div><b>{getSourceNoteCount(difficulty)} BASE NOTES</b></section>
    <div className="admin-rhythm-toolbar"><label>譜面難度<select value={difficulty} onChange={(event) => { audioRef.current.stop(); setIsTestingAudio(false); setIsAudioPaused(false); setDifficulty(event.target.value as RhythmDifficulty); setViewStart(0); setSelectedId(null); refresh("已切換譜面。 "); }}>{DIFFICULTIES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label><span>判定窗：Perfect ±{chart.timing?.perfectMs}ms ／ Great ±{chart.timing?.greatMs}ms ／ Good ±{chart.timing?.goodMs}ms</span><div className="admin-rhythm-audio-controls"><button type="button" className={isTestingAudio ? "admin-rhythm-audio playing" : "admin-rhythm-audio"} onClick={() => void toggleAudio()}>{isTestingAudio ? "■ 停止" : "▶ 播放此段"}</button>{isTestingAudio && <button type="button" className="admin-rhythm-audio" onClick={() => void togglePause()}>{isAudioPaused ? "▶ 繼續" : "Ⅱ 暫停"}</button>}</div><button type="button" className="admin-rhythm-auto-align" disabled={isAutoAligning} onClick={() => void autoAlignToWavePeaks()}>{isAutoAligning ? "分析音波中…" : "⌁ 依音波峰值自動對齊"}</button><button type="button" className="admin-delete" onClick={() => { remember(); clearNoteAdjustments(difficulty); setSelectedId(null); refresh(`已還原 ${difficulty.toUpperCase()} 原始譜面。`); }}>還原此難度</button></div>
    <div className="admin-rhythm-timeline-controls"><button type="button" onClick={() => setViewStart((time) => Math.max(0, time - windowSeconds / 2))}>← 前半段</button><b>{viewStart.toFixed(1)}s — {Math.min(chart.duration, viewStart + windowSeconds).toFixed(1)}s</b><button type="button" onClick={() => setViewStart((time) => Math.min(Math.max(0, chart.duration - windowSeconds), time + windowSeconds / 2))}>後半段 →</button><span className="admin-rhythm-zoom">Ctrl/⌘ + 滾輪：{windowSeconds.toFixed(1)} 秒視窗</span><button type="button" className="admin-rhythm-undo" onClick={undo}>↶ 復原 <kbd>Ctrl Z</kbd></button></div>
    {isTestingAudio && <div className="admin-rhythm-seek"><span>PLAYHEAD</span><input aria-label="音樂播放進度" type="range" min="0" max={chart.duration} step="0.01" value={Math.min(chart.duration, playbackTime ?? viewStart)} onChange={(event) => seekAudio(Number(event.target.value))} /><b>{(playbackTime ?? viewStart).toFixed(2)}s / {chart.duration.toFixed(2)}s</b></div>}
    <div className="admin-rhythm-timeline-wrap" onWheel={zoomTimeline}>
      <div className="admin-rhythm-ruler">{Array.from({ length: Math.ceil(windowSeconds) + 1 }, (_, second) => <span key={second} style={{ left: `${second / windowSeconds * 100}%` }}>{(viewStart + second).toFixed(0)}s</span>)}</div>
      <div ref={timelineRef} className="admin-rhythm-timeline">
        {playbackTime !== null && playbackTime >= viewStart && playbackTime <= viewStart + windowSeconds && (() => { const position = (playbackTime - viewStart) / windowSeconds; return <button type="button" className="admin-rhythm-playhead" style={{ left: `calc(${60 - position * 60}px + ${position * 100}%)` }} aria-label="拖動播放對齊線" title="直接拖動對齊線跳至指定時間" onPointerDown={(event) => { event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); movePlayhead(event); }} onPointerMove={(event) => { if (event.currentTarget.hasPointerCapture(event.pointerId)) movePlayhead(event); }} onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)} />; })()}
        {RHYTHM_LANES.map((lane) => <div key={lane} className="admin-rhythm-track" onClick={(event) => addAt(event, lane)}><b><small>KEY</small>{RHYTHM_KEY_LABELS[lane]}</b><div className="admin-rhythm-track-surface" style={{ backgroundSize: `${100 / windowSeconds}% 100%` }}>{visibleNotes.map((source) => { const note = displayNote(source); const belongs = note.type === "double" ? note.lanes?.includes(lane) : note.lane === lane; if (!belongs) return null; const width = note.type === "hold" ? `${Math.max(2, note.duration! / windowSeconds * 100)}%` : undefined; return <button key={`${note.id}-${lane}`} type="button" onClick={(event) => event.stopPropagation()} onPointerDown={(event) => { if ((event.target as HTMLElement).classList.contains("admin-rhythm-resize-handle")) return; if (note.type === "double") { setSelectedId(note.id); setNotice("雙音符可從下方欄位調整；目前拖曳支援單軌與長按音符。 "); return; } event.stopPropagation(); event.currentTarget.setPointerCapture(event.pointerId); setSelectedId(note.id); setResizing(null); setDragging({ note: source, time: note.time, lane: note.lane, before: getRhythmEditsSnapshot(difficulty) }); }} onPointerMove={dragMove} onPointerUp={(event) => { event.stopPropagation(); if (resizing) finishResize(); else finishDrag(); }} onPointerCancel={() => { if (resizing) finishResize(); else finishDrag(); }} className={`admin-rhythm-note-block ${selectedId === note.id ? "selected" : ""} ${note.type} ${dragging?.note.id === note.id ? "dragging" : ""}`} style={{ left: `${(note.time - viewStart) / windowSeconds * 100}%`, width }} title="拖曳移動；滑入後拖曳左右把手可做成長按音符"><span className="admin-rhythm-resize-handle start" onPointerDown={(event) => startResize(event, source, "start")} /><span className="admin-rhythm-note-symbol">{note.type === "double" ? "×2" : note.type === "hold" ? "━" : "●"}</span><span className="admin-rhythm-resize-handle end" onPointerDown={(event) => startResize(event, source, "end")} /></button>; })}</div></div>)}
      </div>
    </div>
    <RhythmWaveform viewStart={viewStart} viewSeconds={windowSeconds} playheadTime={playbackTime} />
    <p className="admin-rhythm-notice">{notice}</p>
    {selected ? <section className="admin-rhythm-inspector"><div><span>SELECTED NOTE</span><b>{selected.type.toUpperCase()} · {selected.id}</b></div><label>時間（秒）<input type="number" min="0" step="0.01" value={selected.time.toFixed(2)} onChange={(event) => save(selected, { timeMs: Math.max(0, Number(event.target.value) || 0) * 1000 })} /></label>{selected.type !== "double" && <label>軌道<select value={selected.lane} onChange={(event) => save(selected, { lane: event.target.value as RhythmLane })}>{RHYTHM_LANES.map((lane) => <option key={lane} value={lane}>{RHYTHM_KEY_LABELS[lane]} 軌</option>)}</select></label>}<button type="button" className="admin-delete" onClick={() => { remember(); deleteRhythmNote(difficulty, selected.id); setSelectedId(null); refresh(`已移除 ${selected.id}。`); }}>刪除音符</button></section> : <section className="admin-rhythm-empty">尚未選取音符。直接點擊時間軸即可新增一顆 TAP 音符。</section>}
  </div>;
}
