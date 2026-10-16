import React, { useEffect, useMemo, useState } from "react";
import { MUSIC_ASSETS } from "../utils/audio";
import type { RhythmNote } from "../rhythm/types";

type WavePoint = { min: number; max: number };
let missionAudio: Promise<AudioBuffer> | null = null;

async function loadMissionAudio(): Promise<AudioBuffer> {
  if (!missionAudio) missionAudio = (async () => {
    const response = await fetch(MUSIC_ASSETS.mission);
    if (!response.ok) throw new Error("無法讀取焊接音樂");
    const data = await response.arrayBuffer();
    const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) throw new Error("AudioContext unavailable");
    const context = new AudioContextClass();
    try { return await context.decodeAudioData(data.slice(0)); }
    finally { await context.close(); }
  })().catch((error) => { missionAudio = null; throw error; });
  return missionAudio;
}

/** Finds the strongest short waveform peak in the local segment surrounding
 * each existing note. This preserves chart density and gameplay structure. */
export async function findLocalWavePeakTimes(notes: RhythmNote[]): Promise<Record<string, number>> {
  const buffer = await loadMissionAudio();
  const data = buffer.getChannelData(0);
  const frameSamples = Math.max(1, Math.round(buffer.sampleRate * .008));
  return Object.fromEntries(notes.map((note, index) => {
    const previous = notes[index - 1]?.time ?? Math.max(0, note.time - .35);
    const next = notes[index + 1]?.time ?? Math.min(buffer.duration, note.time + .35);
    // Midpoints prevent adjacent notes from collapsing onto the same peak.
    const start = Math.max(0, (previous + note.time) / 2);
    const end = Math.min(buffer.duration, (note.time + next) / 2);
    let bestTime = note.time;
    let bestEnergy = -1;
    for (let sample = Math.floor(start * buffer.sampleRate); sample < Math.ceil(end * buffer.sampleRate); sample += frameSamples) {
      let energy = 0;
      const frameEnd = Math.min(data.length, sample + frameSamples);
      for (let cursor = sample; cursor < frameEnd; cursor += 1) energy += Math.abs(data[cursor]);
      if (energy > bestEnergy) { bestEnergy = energy; bestTime = (sample + (frameEnd - sample) / 2) / buffer.sampleRate; }
    }
    return [note.id, Math.round(bestTime * 1000)];
  }));
}

function makeWavePoints(buffer: AudioBuffer, count = 1800): WavePoint[] {
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / count));
  return Array.from({ length: count }, (_, index) => {
    let min = 1; let max = -1;
    const end = Math.min(data.length, (index + 1) * step);
    for (let sample = index * step; sample < end; sample++) { const value = data[sample]; if (value < min) min = value; if (value > max) max = value; }
    return { min, max };
  });
}

export function RhythmWaveform({ viewStart, viewSeconds, playheadTime }: { viewStart: number; viewSeconds: number; playheadTime: number | null }) {
  const [wave, setWave] = useState<WavePoint[] | null>(null);
  const [duration, setDuration] = useState(0);
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const buffer = await loadMissionAudio();
        if (!cancelled) { setWave(makeWavePoints(buffer)); setDuration(buffer.duration); }
      } catch { if (!cancelled) setWave([]); }
    };
    void load();
    return () => { cancelled = true; };
  }, []);
  const visible = useMemo(() => {
    if (!wave?.length || !duration) return [];
    const from = Math.max(0, Math.floor(viewStart / duration * wave.length));
    const to = Math.min(wave.length, Math.ceil((viewStart + viewSeconds) / duration * wave.length));
    return wave.slice(from, Math.max(from + 1, to));
  }, [wave, duration, viewStart, viewSeconds]);
  return <div className="admin-rhythm-waveform" aria-label="焊接音樂波形"><div><b>ACTUAL AUDIO WAVEFORM</b><span>{wave === null ? "載入音波…" : wave.length ? "以實際音檔顯示" : "音波載入失敗"}</span></div><div className="admin-rhythm-wave-track"><div className="admin-rhythm-wave-gutter" aria-hidden="true" /><svg viewBox="0 0 1000 90" preserveAspectRatio="none" role="img" aria-label="音樂音波">{visible.map((point, index) => <line key={index} x1={index / Math.max(1, visible.length - 1) * 1000} x2={index / Math.max(1, visible.length - 1) * 1000} y1={45 + point.min * 41} y2={45 + point.max * 41} />)}{playheadTime !== null && playheadTime >= viewStart && playheadTime <= viewStart + viewSeconds && <line className="wave-playhead" x1={(playheadTime - viewStart) / viewSeconds * 1000} x2={(playheadTime - viewStart) / viewSeconds * 1000} y1="0" y2="90" />}</svg></div></div>;
}
