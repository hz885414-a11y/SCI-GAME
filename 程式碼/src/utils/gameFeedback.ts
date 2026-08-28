export interface FeedbackParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  maxLife: number;
  alpha: number;
  text?: string;
}

export interface FeedbackTarget {
  x: number;
  y: number;
  radius: number;
  hitFlashUntil?: number;
  hitOffsetX?: number;
  hitOffsetY?: number;
}

export interface FeedbackState {
  particles: FeedbackParticle[];
  screenShake: number;
  lastHitSoundAt?: number;
  lastDeathSoundAt?: number;
}

type SoundPlayer = (sound: string) => void;

const particleLimit = () => (typeof window !== "undefined" && window.innerWidth < 640 ? 48 : 128);

export function addFeedbackParticle(state: FeedbackState, particle: FeedbackParticle) {
  const limit = particleLimit();
  if (state.particles.length < limit) state.particles.push(particle);
}

export function triggerCameraShake(state: FeedbackState, strength: number) {
  state.screenShake = Math.max(state.screenShake || 0, strength);
}

export function playRandomSound(playSound: SoundPlayer, sounds: string[]) {
  if (sounds.length === 0) return;
  playSound(sounds[Math.floor(Math.random() * sounds.length)]);
}

export function applyHitFeedback(
  state: FeedbackState,
  target: FeedbackTarget,
  playSound: SoundPlayer,
  options: { strength?: number; angle?: number; color?: string; heavy?: boolean } = {},
) {
  const now = performance.now();
  const strength = options.strength ?? 1;
  const angle = options.angle ?? Math.random() * Math.PI * 2;
  const heavy = options.heavy ?? false;
  target.hitFlashUntil = now + (heavy ? 130 : 95);
  target.hitOffsetX = Math.cos(angle) * Math.min(5, 1.2 + strength * 0.7);
  target.hitOffsetY = Math.sin(angle) * Math.min(5, 1.2 + strength * 0.7);
  triggerCameraShake(state, heavy ? 8 : Math.min(3.2, 0.8 + strength));

  const count = heavy ? 9 : 4;
  for (let i = 0; i < count; i++) {
    const burstAngle = Math.random() * Math.PI * 2;
    const speed = 1.5 + Math.random() * (heavy ? 4.5 : 2.5);
    addFeedbackParticle(state, {
      x: target.x,
      y: target.y,
      vx: Math.cos(burstAngle) * speed,
      vy: Math.sin(burstAngle) * speed,
      radius: heavy ? 2.5 + Math.random() * 2 : 1.5 + Math.random(),
      color: options.color ?? "#ffffff",
      life: 0,
      maxLife: heavy ? 18 : 11,
      alpha: 1,
    });
  }

  if (!state.lastHitSoundAt || now - state.lastHitSoundAt > 55) {
    state.lastHitSoundAt = now;
    playRandomSound(playSound, heavy ? ["bossImpact", "hit2", "hit3"] : ["hit1", "hit2", "hit3"]);
  }
}

export function applyDeathFeedback(
  state: FeedbackState,
  target: FeedbackTarget,
  playSound: SoundPlayer,
  boss = false,
) {
  const now = performance.now();
  triggerCameraShake(state, boss ? 24 : 6);
  const count = boss ? 28 : 12;
  const colors = boss ? ["#ffffff", "#fbbf24", "#fb7185"] : ["#ffffff", "#c084fc", "#60a5fa"];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.2;
    const speed = (boss ? 3.5 : 2) + Math.random() * (boss ? 7 : 4);
    addFeedbackParticle(state, {
      x: target.x,
      y: target.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 2 + Math.random() * (boss ? 4 : 2),
      color: colors[i % colors.length],
      life: 0,
      maxLife: boss ? 32 : 20,
      alpha: 1,
    });
  }
  if (!state.lastDeathSoundAt || now - state.lastDeathSoundAt > 80) {
    state.lastDeathSoundAt = now;
    playSound(boss ? "bossDeath" : "enemyDeath");
  }
}

export function applyCollectFeedback(
  state: FeedbackState,
  x: number,
  y: number,
  type: "coin" | "material" | "battery" | "experience",
  playSound: SoundPlayer,
  target?: { x: number; y: number },
) {
  const colors = {
    coin: "#fbbf24",
    material: "#22d3ee",
    battery: "#34d399",
    experience: "#60a5fa",
  } as const;
  const sounds = {
    coin: "coinCollect",
    material: "materialCollect",
    battery: "batteryCollect",
    experience: "experienceCollect",
  } as const;
  playSound(sounds[type]);

  const count = type === "material" ? 12 : 7;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    addFeedbackParticle(state, {
      x,
      y,
      vx: Math.cos(angle) * (2 + Math.random() * 2.5),
      vy: Math.sin(angle) * (2 + Math.random() * 2.5),
      radius: type === "material" ? 3 : 2,
      color: colors[type],
      life: 0,
      maxLife: 20,
      alpha: 1,
    });
  }

  if (target && (type === "coin" || type === "material")) {
    const travelFrames = 24;
    for (let i = 0; i < 3; i++) {
      addFeedbackParticle(state, {
        x: x + (Math.random() - 0.5) * 8,
        y: y + (Math.random() - 0.5) * 8,
        vx: (target.x - x) / travelFrames,
        vy: (target.y - y) / travelFrames,
        radius: type === "coin" ? 3 : 3.5,
        color: colors[type],
        life: 0,
        maxLife: travelFrames,
        alpha: 1,
      });
    }
  }
}

export function getHitRenderOffset(target: FeedbackTarget) {
  const active = (target.hitFlashUntil || 0) > performance.now();
  return {
    active,
    x: active ? target.hitOffsetX || 0 : 0,
    y: active ? target.hitOffsetY || 0 : 0,
  };
}
