// Web Audio API procedural sound synthesizer for retro VN sound effects.
// Runs completely locally and doesn't require any downloaded files.

let audioCtx: AudioContext | null = null;
let isMuted = false;

function getAudioContext(): AudioContext | null {
  if (isMuted) return null;
  if (!audioCtx) {
    // Standard cross-browser compatibility
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  // Resume context if suspended (browser security policies)
  if (audioCtx && audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function setMuteState(muted: boolean) {
  isMuted = muted;
  if (muted) {
    stopAmbientHum();
    if (audioCtx) {
      audioCtx.close().then(() => {
        audioCtx = null;
      });
    }
  } else {
    // Resume or start
    const ctx = getAudioContext();
    if (ctx) {
      startAmbientHum();
    }
  }
}

export function getMuteState(): boolean {
  return isMuted;
}

export function playSound(type: string) {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    const tone = (frequency: number, duration: number, volume: number, wave: OscillatorType = "square", endFrequency?: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = wave;
      osc.frequency.setValueAtTime(frequency, now);
      if (endFrequency) osc.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration);
    };

    const noiseBurst = (duration: number, volume: number, cutoff: number) => {
      const size = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, size, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < size; i++) data[i] = Math.random() * 2 - 1;
      const source = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      source.buffer = buffer;
      filter.type = "lowpass";
      filter.frequency.setValueAtTime(cutoff, now);
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(now);
      source.stop(now + duration);
    };

    switch (type) {
      case "click": {
        // Short high-pitched woody pop
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);

        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);

        osc.start(now);
        osc.stop(now + 0.08);
        break;
      }

      case "hit":
      case "hit1": {
        tone(180, 0.055, 0.035, "square", 85);
        noiseBurst(0.035, 0.02, 1300);
        break;
      }
      case "hit2": {
        tone(245, 0.06, 0.032, "triangle", 105);
        noiseBurst(0.04, 0.018, 1800);
        break;
      }
      case "hit3": {
        tone(135, 0.075, 0.04, "sawtooth", 65);
        noiseBurst(0.05, 0.022, 900);
        break;
      }
      case "enemyDeath":
      case "explosion": {
        tone(150, 0.16, 0.045, "sawtooth", 45);
        noiseBurst(0.14, 0.035, 1100);
        break;
      }
      case "bossImpact": {
        tone(105, 0.12, 0.055, "square", 42);
        noiseBurst(0.09, 0.04, 700);
        break;
      }
      case "bossDeath": {
        tone(120, 0.32, 0.06, "sawtooth", 32);
        noiseBurst(0.3, 0.055, 850);
        break;
      }
      case "coinCollect": {
        tone(880, 0.09, 0.035, "square", 1320);
        break;
      }
      case "materialCollect": {
        tone(420, 0.16, 0.04, "triangle", 980);
        break;
      }
      case "batteryCollect": {
        tone(330, 0.11, 0.03, "sine", 660);
        break;
      }
      case "experienceCollect": {
        tone(620, 0.07, 0.022, "triangle", 820);
        break;
      }
      case "upgrade":
      case "upgradeSuccess": {
        [440, 660, 880].forEach((frequency, index) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "square";
          osc.frequency.setValueAtTime(frequency, now + index * 0.055);
          gain.gain.setValueAtTime(0.03, now + index * 0.055);
          gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.055 + 0.11);
          osc.start(now + index * 0.055);
          osc.stop(now + index * 0.055 + 0.11);
        });
        break;
      }
      case "shoot": {
        tone(720, 0.045, 0.018, "square", 320);
        break;
      }
      case "power": {
        tone(180, 0.18, 0.035, "sine", 720);
        break;
      }
      case "low_battery":
      case "game_over": {
        tone(210, 0.2, 0.035, "square", 80);
        break;
      }
      case "victory": {
        [523, 659, 784, 1047].forEach((frequency, index) => {
          const startAt = now + index * 0.055;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "triangle";
          osc.frequency.setValueAtTime(frequency, startAt);
          gain.gain.setValueAtTime(0.035, startAt);
          gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.18);
          osc.start(startAt);
          osc.stop(startAt + 0.18);
        });
        break;
      }

      case "typewriter": {
        // Very soft white-noise like tick
        const bufferSize = ctx.sampleRate * 0.02; // 20ms
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
          data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = "bandpass";
        filter.frequency.setValueAtTime(1000, now);
        filter.Q.setValueAtTime(5, now);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.02);
        break;
      }

      case "chime": {
        // Gentle double-bell chime (e.g. +1 affection)
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain1 = ctx.createGain();
        const gain2 = ctx.createGain();

        osc1.connect(gain1);
        gain1.connect(ctx.destination);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);

        osc1.type = "sine";
        osc1.frequency.setValueAtTime(523.25, now); // C5
        osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5

        osc2.type = "sine";
        osc2.frequency.setValueAtTime(783.99, now); // G5
        osc2.frequency.setValueAtTime(1046.50, now + 0.1); // C6

        gain1.gain.setValueAtTime(0.05, now);
        gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        gain2.gain.setValueAtTime(0.04, now);
        gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

        osc1.start(now);
        osc1.stop(now + 0.35);
        osc2.start(now);
        osc2.stop(now + 0.35);
        break;
      }

      case "success": {
        // Upward electronic arpeggio
        const frequencies = [330, 440, 550, 660, 880];
        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.03, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.15);

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.15);
        });
        break;
      }

      case "bubble": {
        // High bubbly pop when clicking characters
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = "sine";
        osc.frequency.setValueAtTime(300, now);
        osc.frequency.exponentialRampToValueAtTime(900, now + 0.1);

        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.start(now);
        osc.stop(now + 0.12);
        break;
      }

      case "fortune": {
        // Majestic glittering sound
        const duration = 0.8;
        const count = 12;
        for (let i = 0; i < count; i++) {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.type = "sine";
          const randomFreq = 400 + Math.random() * 1200;
          osc.frequency.setValueAtTime(randomFreq, now + i * 0.05);

          gain.gain.setValueAtTime(0.02, now + i * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.2);

          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.2);
        }
        break;
      }
    }
  } catch (e) {
    console.warn("Failed to play sound: ", e);
  }
}

let ambientSources: {
  osc1: OscillatorNode;
  osc2: OscillatorNode;
  noise: AudioBufferSourceNode;
  filter: BiquadFilterNode;
  lfo: OscillatorNode;
  filterLfoGain: GainNode;
  masterGain: GainNode;
} | null = null;

export function startAmbientHum() {
  if (isMuted) return;
  try {
    const ctx = getAudioContext();
    if (!ctx || ambientSources) return;

    const now = ctx.currentTime;
    
    // 1. Create nodes
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const lfo = ctx.createOscillator();
    const filterLfoGain = ctx.createGain();
    const masterGain = ctx.createGain();

    // 2. Configure Oscillators (beating low frequency transformers)
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(55, now); // A1 (very low industrial hum)
    
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(55.3, now); // Slight detune for beautiful slow pulsing/beating

    // LFO to slowly modulate air filter cutoff frequency
    lfo.type = "sine";
    lfo.frequency.setValueAtTime(0.12, now); // 0.12 Hz (very slow organic wave)

    // 3. Create Ventilation Fan / gas hum (Bandpass filtered white noise)
    const bufferSize = ctx.sampleRate * 2; // 2 seconds of noise buffer
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(140, now); // Muffled air system flow
    filter.Q.setValueAtTime(2.0, now);

    // Filter modulation hook up
    filterLfoGain.gain.setValueAtTime(30, now); // Modulation range
    lfo.connect(filterLfoGain);
    filterLfoGain.connect(filter.frequency);

    // 4. Hook up to master gain
    osc1.connect(masterGain);
    osc2.connect(masterGain);
    
    noise.connect(filter);
    filter.connect(masterGain);

    masterGain.connect(ctx.destination);

    // Fade-in ambient hum smoothly to avoid abrupt pops
    masterGain.gain.setValueAtTime(0, now);
    masterGain.gain.linearRampToValueAtTime(0.04, now + 3.0); // Extremely soft, perfect immersive level (4% volume)

    // Start audio elements
    osc1.start(now);
    osc2.start(now);
    lfo.start(now);
    noise.start(now);

    ambientSources = {
      osc1,
      osc2,
      noise,
      filter,
      lfo,
      filterLfoGain,
      masterGain
    };
  } catch (e) {
    console.warn("Failed to initialize procedural ambient lab sound:", e);
  }
}

export function stopAmbientHum() {
  if (!ambientSources) return;
  try {
    const { osc1, osc2, noise, lfo, filterLfoGain, masterGain } = ambientSources;
    const ctx = audioCtx;
    const now = ctx ? ctx.currentTime : 0;

    if (ctx && masterGain) {
      // Fade-out beautifully
      masterGain.gain.setValueAtTime(masterGain.gain.value, now);
      masterGain.gain.linearRampToValueAtTime(0, now + 0.5);
      
      setTimeout(() => {
        try {
          osc1.stop();
          osc2.stop();
          lfo.stop();
          noise.stop();
          osc1.disconnect();
          osc2.disconnect();
          lfo.disconnect();
          noise.disconnect();
          filterLfoGain.disconnect();
          masterGain.disconnect();
        } catch (err) {}
      }, 600);
    } else {
      osc1.stop();
      osc2.stop();
      lfo.stop();
      noise.stop();
    }
  } catch (e) {
    console.warn("Failed to stop ambient hum:", e);
  }
  ambientSources = null;
}

let bgmAudio: HTMLAudioElement | null = null;
let bgmVolume = 50; // 0 to 100, default 50
let isBgmPlaying = false;
let isBgmMuted = false;
let currentMusicTrack: MusicTrack | null = null;
let requestedMusicTrack: MusicTrack = "normal";
let musicFadeTimer: ReturnType<typeof setInterval> | null = null;
let musicFadeGeneration = 0;

export const MUSIC_ASSETS = {
  normal: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/4.MUSIC/STAR-8BIT-BGM.mp3",
  theme: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/4.MUSIC/Theme%20Song.mp3?v=a8bda172a58a3d3af53ce3c877669350d88c60d8",
  mission: "https://raw.githubusercontent.com/hz885414-a11y/sci-app-assets/refs/heads/main/4.MUSIC/DDDD-8bit%20BGM.mp3"
} as const;

export type MusicTrack = keyof typeof MUSIC_ASSETS;

const MUSIC_FADE_DURATION_MS = 360;
const MUSIC_FADE_STEPS = 12;

function getMusicTargetVolume() {
  return (bgmVolume / 100) * 0.4;
}

function cancelMusicFade() {
  if (musicFadeTimer) {
    clearInterval(musicFadeTimer);
    musicFadeTimer = null;
  }
  musicFadeGeneration += 1;
}

function fadeMusicTo(targetVolume: number, onComplete?: () => void) {
  if (!bgmAudio) return;
  cancelMusicFade();
  const generation = musicFadeGeneration;
  const startVolume = bgmAudio.volume;
  let step = 0;
  musicFadeTimer = setInterval(() => {
    if (!bgmAudio || generation !== musicFadeGeneration) return;
    step += 1;
    const progress = Math.min(1, step / MUSIC_FADE_STEPS);
    bgmAudio.volume = startVolume + (targetVolume - startVolume) * progress;
    if (progress >= 1) {
      cancelMusicFade();
      onComplete?.();
    }
  }, MUSIC_FADE_DURATION_MS / MUSIC_FADE_STEPS);
}

// Initial sync on module load
try {
  const savedVolume = localStorage.getItem("light_crew_music_volume");
  if (savedVolume !== null) {
    bgmVolume = parseInt(savedVolume, 10);
  }
  const savedMute = localStorage.getItem("light_crew_music_mute");
  if (savedMute !== null) {
    isBgmMuted = savedMute === "true";
  }
} catch (e) {
  console.warn("localStorage sync failed in audio.ts:", e);
}

export function setMusicVolume(vol: number) {
  bgmVolume = vol;
  if (bgmAudio && !musicFadeTimer) {
    bgmAudio.volume = getMusicTargetVolume();
  }
}

export function setMusicMuteState(muted: boolean) {
  isBgmMuted = muted;
  if (muted) {
    cancelMusicFade();
    bgmAudio?.pause();
  } else if (isBgmPlaying) {
    startBackgroundMusic(requestedMusicTrack);
  }
}

export function startBackgroundMusic(track: MusicTrack = requestedMusicTrack) {
  isBgmPlaying = true;
  requestedMusicTrack = track;
  if (isBgmMuted) return;

  if (!bgmAudio) {
    bgmAudio = new Audio();
    bgmAudio.loop = true;
    bgmAudio.preload = "auto";
    bgmAudio.volume = 0;
    bgmAudio.onerror = () => {
      if (requestedMusicTrack !== "normal") {
        console.warn("Theme music failed to load; returning to the normal music fallback.");
        currentMusicTrack = null;
        startBackgroundMusic("normal");
      }
    };
  }

  if (currentMusicTrack === track && bgmAudio.src) {
    if (bgmAudio.paused) {
      bgmAudio.play().catch(err => {
        console.warn("Background music play blocked or failed:", err);
      });
    }
    fadeMusicTo(getMusicTargetVolume());
    return;
  }

  const switchTrack = () => {
    if (!bgmAudio || requestedMusicTrack !== track || isBgmMuted) return;
    cancelMusicFade();
    bgmAudio.pause();
    bgmAudio.src = MUSIC_ASSETS[track];
    bgmAudio.currentTime = 0;
    bgmAudio.volume = 0;
    currentMusicTrack = track;
    bgmAudio.load();
    bgmAudio.play()
      .then(() => fadeMusicTo(getMusicTargetVolume()))
      .catch(err => {
        console.warn("Background music play blocked or failed:", err);
      });
  };

  if (!bgmAudio.paused && bgmAudio.volume > 0.01) {
    fadeMusicTo(0, switchTrack);
  } else {
    switchTrack();
  }
}

export function stopBackgroundMusic() {
  isBgmPlaying = false;
  if (bgmAudio) {
    fadeMusicTo(0, () => bgmAudio?.pause());
  }
}
