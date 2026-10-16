import { MUSIC_ASSETS } from "../utils/audio";

/** Uses the existing mission BGM as the authoritative rhythm clock. */
export class RhythmAudioController {
  private audio: HTMLAudioElement | null = null;
  private fallbackStartedAt = 0;
  private fallbackPausedAt = 0;
  private fallbackIsPaused = false;
  private priming: Promise<void> | null = null;

  /**
   * Must be called from the start-button gesture. Mobile browsers otherwise
   * reject the first play() call after the three-second count-in.
   */
  prime(): void {
    this.stop();
    const audio = new Audio(MUSIC_ASSETS.mission);
    audio.preload = "auto";
    audio.loop = false;
    audio.volume = 0.48;
    audio.muted = true;
    this.audio = audio;
    this.priming = audio.play()
      .then(() => {
        if (this.audio !== audio) return;
        audio.pause();
        audio.currentTime = 0;
        audio.muted = false;
      })
      .catch(() => {
        if (this.audio === audio) audio.muted = false;
      });
  }

  async start(startAt = 0): Promise<void> {
    this.fallbackStartedAt = performance.now() - startAt * 1000;
    this.fallbackPausedAt = startAt;
    this.fallbackIsPaused = false;
    if (!this.audio) this.prime();
    await this.priming;
    const audio = this.audio;
    if (!audio) return;
    audio.currentTime = Math.max(0, startAt);
    audio.muted = false;
    try {
      await audio.play();
    } catch {
      // The rhythm game remains playable when a device blocks remote audio;
      // its fallback clock is only used for this explicit failure case.
    }
  }

  getTime(): number {
    if (this.audio && !this.audio.paused && Number.isFinite(this.audio.currentTime)) return this.audio.currentTime;
    if (this.audio && Number.isFinite(this.audio.currentTime)) return this.audio.currentTime;
    if (this.fallbackIsPaused) return this.fallbackPausedAt;
    return Math.max(0, (performance.now() - this.fallbackStartedAt) / 1000);
  }

  /** True when the real music element reached its end, even if its decoded
   * duration differs slightly from the chart metadata. */
  hasEnded(): boolean {
    return this.audio?.ended ?? false;
  }

  pause(): void {
    this.fallbackPausedAt = this.getTime();
    this.fallbackIsPaused = true;
    this.audio?.pause();
  }

  async resume(): Promise<void> {
    if (this.audio) {
      try { await this.audio.play(); return; } catch { /* use fallback clock */ }
    }
    this.fallbackStartedAt = performance.now() - this.fallbackPausedAt * 1000;
    this.fallbackPausedAt = 0;
    this.fallbackIsPaused = false;
  }

  seek(time: number): void {
    const next = Math.max(0, time);
    if (this.audio) this.audio.currentTime = next;
    this.fallbackPausedAt = next;
    this.fallbackStartedAt = performance.now() - next * 1000;
  }

  stop(): void {
    if (this.audio) { this.audio.pause(); this.audio.src = ""; this.audio.load(); }
    this.audio = null;
    this.priming = null;
    this.fallbackPausedAt = 0;
    this.fallbackIsPaused = false;
  }
}
