import { RHYTHM_RULES, type RhythmJudgement, type RhythmResult, type RhythmScore } from "./types";

export function judgementForDelta(deltaMs: number): RhythmJudgement {
  const abs = Math.abs(deltaMs);
  if (abs <= RHYTHM_RULES.windowsMs.perfect) return "perfect";
  if (abs <= RHYTHM_RULES.windowsMs.great) return "great";
  if (abs <= RHYTHM_RULES.windowsMs.good) return "good";
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
  const grade = accuracy >= 95 ? "S" : accuracy >= 85 ? "A" : accuracy >= 70 ? "B" : "C";
  return { ...score, totalNotes, accuracy, grade };
}
