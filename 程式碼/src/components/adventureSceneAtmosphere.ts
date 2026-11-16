type SceneAtmosphereOptions = {
  width: number;
  height: number;
  cameraX: number;
  cameraY: number;
  viewportWidth: number;
  viewportHeight: number;
  playerX: number;
  playerY: number;
  ticks: number;
  lampStrength: number;
};

/** Lightweight world-space lighting pass. It changes no collision or gameplay geometry. */
export function drawAdventureSceneAtmosphere(ctx: CanvasRenderingContext2D, scene: SceneAtmosphereOptions) {
  const { width, height, cameraX, cameraY, viewportWidth, viewportHeight, playerX, playerY, ticks, lampStrength } = scene;
  const left = Math.max(0, cameraX - 80);
  const top = Math.max(0, cameraY - 80);
  const right = Math.min(width, cameraX + viewportWidth + 80);
  const bottom = Math.min(height, cameraY + viewportHeight + 80);
  ctx.save();

  // A cool ambient wash holds the distant terrain together without lowering
  // the contrast of sprites or the walkable ground.
  ctx.fillStyle = "rgba(14, 32, 54, 0.12)";
  ctx.fillRect(left, top, right - left, bottom - top);

  // Light spills from a few fixed structures. Its footprints stay in world
  // space as the camera moves, so the scene has depth rather than a HUD glow.
  const beacons: ReadonlyArray<readonly [number, number, number]> = [
    [360, 300, 138], [1380, 320, 148], [450, 930, 120], [1360, 930, 128],
  ];
  for (const [x, y, radius] of beacons) {
    if (x + radius < left || x - radius > right || y + radius < top || y - radius > bottom) continue;
    const shimmer = 1 + Math.sin(ticks * 0.032 + x) * 0.025;
    const light = ctx.createRadialGradient(x, y, 4, x, y, radius * shimmer);
    light.addColorStop(0, "rgba(255, 210, 117, 0.30)");
    light.addColorStop(0.45, "rgba(130, 180, 190, 0.09)");
    light.addColorStop(1, "rgba(130, 180, 190, 0)");
    ctx.fillStyle = light;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
    // Directional spill and a soft contact shadow give the existing terrain a
    // little height without drawing fake walls over the playable route.
    ctx.fillStyle = "rgba(255, 228, 167, 0.045)";
    ctx.beginPath();
    ctx.moveTo(x - 12, y - 15);
    ctx.lineTo(x + 62, y - 54);
    ctx.lineTo(x + 102, y - 35);
    ctx.lineTo(x + 12, y + 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "rgba(2, 8, 20, 0.22)";
    ctx.beginPath();
    ctx.ellipse(x + 12, y + 19, 38, 9, -0.22, 0, Math.PI * 2);
    ctx.fill();
  }

  // The squad lamp is part of the scenery: a warm near-ground bounce and
  // restrained reflections follow the character, even at low battery.
  const lampRadius = 105 + lampStrength * 85;
  const lamp = ctx.createRadialGradient(playerX, playerY + 20, 7, playerX, playerY + 20, lampRadius);
  lamp.addColorStop(0, `rgba(255, 222, 145, ${0.16 + lampStrength * 0.12})`);
  lamp.addColorStop(0.48, "rgba(97, 219, 230, 0.065)");
  lamp.addColorStop(1, "rgba(97, 219, 230, 0)");
  ctx.fillStyle = lamp;
  ctx.fillRect(playerX - lampRadius, playerY - lampRadius, lampRadius * 2, lampRadius * 2);
  ctx.fillStyle = "rgba(3, 13, 24, 0.19)";
  ctx.beginPath();
  ctx.ellipse(playerX + 13, playerY + 26, 31, 8, -0.2, 0, Math.PI * 2);
  ctx.fill();

  // Sparse water and dust highlights are deterministic; no particle objects
  // or per-frame random values are allocated.
  for (let i = 0; i < 18; i++) {
    const x = (i * 337 + 191) % width;
    const y = (i * 271 + 143) % height;
    if (x < left || x > right || y < top || y > bottom) continue;
    const glint = 0.025 + (Math.sin(ticks * 0.045 + i * 2.1) + 1) * 0.022;
    ctx.fillStyle = `rgba(149, 239, 246, ${glint})`;
    ctx.fillRect(x, y, 18 + (i % 3) * 9, 2);
    const drift = Math.sin(ticks * 0.015 + i * 1.7) * 5;
    ctx.fillStyle = "rgba(232, 241, 226, 0.14)";
    ctx.fillRect(Math.round(x + drift), Math.round(y - 14 - (ticks * 0.12 + i * 21) % 48), 2, 2);
  }
  ctx.restore();
}

/** Screen-space near layer, kept at the edges so play targets stay clear. */
export function drawAdventureSceneForeground(ctx: CanvasRenderingContext2D, width: number, height: number, cameraX: number, ticks: number) {
  ctx.save();
  const edgeWidth = Math.min(54, width * 0.09);
  const haze = ctx.createLinearGradient(0, 0, 0, height);
  haze.addColorStop(0, "rgba(110, 157, 174, 0.11)");
  haze.addColorStop(0.32, "rgba(110, 157, 174, 0)");
  haze.addColorStop(1, "rgba(7, 18, 31, 0.06)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, 0, width, height);

  for (const side of [0, 1]) {
    const x = side === 0 ? 0 : width - edgeWidth;
    const edge = ctx.createLinearGradient(x, 0, x + edgeWidth, 0);
    if (side === 0) { edge.addColorStop(0, "rgba(8, 19, 29, 0.30)"); edge.addColorStop(1, "rgba(8, 19, 29, 0)"); }
    else { edge.addColorStop(0, "rgba(8, 19, 29, 0)"); edge.addColorStop(1, "rgba(8, 19, 29, 0.30)"); }
    ctx.fillStyle = edge;
    ctx.fillRect(x, 0, edgeWidth, height);
    // Foreground leaves drift at a different speed from the terrain. Their
    // narrow footprint avoids covering enemies and interaction prompts.
    for (let i = 0; i < 4; i++) {
      const drift = Math.sin(ticks * 0.014 + i + cameraX * 0.002) * 5;
      const leafX = side === 0 ? 7 + i * 8 + drift : width - 7 - i * 8 - drift;
      const leafY = height * (0.17 + i * 0.19) + Math.sin(ticks * 0.011 + i * 2) * 9;
      ctx.fillStyle = i % 2 ? "rgba(80, 132, 126, 0.24)" : "rgba(95, 147, 112, 0.21)";
      ctx.fillRect(leafX, leafY, 8, 3);
      ctx.fillRect(leafX + 3, leafY - 3, 6, 3);
    }
  }
  ctx.restore();
}
