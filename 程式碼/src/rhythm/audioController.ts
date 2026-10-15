import { MUSIC_ASSETS } from "../utils/audio";

/** Uses the existing mission BGM as the authoritative rhythm clock. */
export class RhythmAudioController {
  private audio: HTMLAudioElement | null = null;
  private fallbackStartedAt = 0;
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

  async start(): Promise<void> {
    this.fallbackStartedAt = performance.now();
    if (!this.audio) this.prime();
    await this.priming;
    const audio = this.audio;
    if (!audio) return;
    audio.currentTime = 0;
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
    return Math.max(0, (performance.now() - this.fallbackStartedAt) / 1000);
  }

  stop(): void {
    if (this.audio) { this.audio.pause(); this.audio.src = ""; this.audio.load(); }
    this.audio = null;
    this.priming = null;
  }
}
