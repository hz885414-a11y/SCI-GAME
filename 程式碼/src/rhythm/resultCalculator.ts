import { RHYTHM_RULES, type RhythmJudgement, type RhythmResult, type RhythmScore } from "./types";

export function judgementForDelta(
  deltaMs: number,
  windows: { perfectMs: number; greatMs: number; goodMs: number } = {
    perfectMs: RHYTHM_RULES.windowsMs.perfect,
    greatMs: RHYTHM_RULES.windowsMs.great,
    goodMs: RHYTHM_RULES.windowsMs.good,
  },
): RhythmJudgement {
  const abs = Math.abs(deltaMs);
  if (abs <= windows.perfectMs) return "perfect";
  if (abs <= windows.greatMs) return "great";
  if (abs <= windows.goodMs) return "good";
  return "miss";
}

export function applyJudgement(score: RhythmScore, judgement: RhythmJudgement): RhythmScore {
  const next = { ...score };
  next[judgement] += 1;
  next.score += RHYTHM_RULES.points[judgement];
  if (judgement === "miss") next.combo = 0;
  else {
    next.combo += 1;
    next.maxCombo = Math.max(next.maxCombo, next.combo);
  }
  return next;
}

export function calculateResult(score: RhythmScore, totalNotes: number): RhythmResult {
  const weighted = score.perfect + score.great * 0.8 + score.good * 0.5;
  const accuracy = totalNotes ? Math.round((weighted / totalNotes) * 1000) / 10 : 0;
  const grade = accuracy >= 95 ? "S" : accuracy >= 85 ? "A" : accuracy >= 70 ? "B" : accuracy >= 55 ? "C" : accuracy >= 40 ? "D" : accuracy >= 20 ? "E" : "F";
  const bonusRate = grade === "S" ? 0.1 : grade === "A" ? 0.06 : grade === "B" ? 0.03 : 0;
  const bonusScore = Math.round(score.score * bonusRate);
  return { ...score, score: score.score + bonusScore, totalNotes, accuracy, grade, bonusScore };
}
