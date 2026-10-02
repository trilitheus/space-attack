export const FIELD = { width: 1200, height: 720, playerY: 650 };
export type AlienKind = 'scout' | 'crab' | 'manta' | 'squid';
export type Difficulty = 'easy' | 'medium' | 'hard';
export const DIFFICULTIES: Record<Difficulty, { speed: number; columns: number; description: string }> = {
  easy: { speed: .8, columns: -1, description: 'Fewer invaders. Slower attacks. Room to regroup.' },
  medium: { speed: 1, columns: 0, description: 'The original mission. A balanced fight for Earth.' },
  hard: { speed: 1.25, columns: 1, description: 'More invaders. Faster missiles. Relentless attacks.' },
};

// Each silhouette has a different flight profile; colour remains reserved for health.
export const ALIENS: Record<AlienKind, { speed: number; weave: number }> = {
  scout: { speed: 1, weave: 65 },
  crab: { speed: .85, weave: 110 },
  manta: { speed: 1.2, weave: 155 },
  squid: { speed: .95, weave: 85 },
};

export function waveSettings(wave: number, difficulty: Difficulty = 'medium') {
  const profile = DIFFICULTIES[difficulty];
  return {
    columns: Math.min(10, 6 + Math.floor(wave / 2) + profile.columns),
    rows: Math.min(5, 2 + Math.floor((wave - 1) / 2)),
    formationRate: Math.min(1.4, .35 + (wave - 1) * .1) * profile.speed,
    formationSwing: Math.min(200, 90 + (wave - 1) * 14),
    attackInterval: Math.max(.45, 3.2 - (wave - 1) * .3) / profile.speed,
    diveSpeed: Math.min(300, 75 + (wave - 1) * 18) * profile.speed,
    shotSpeed: Math.min(350, 105 + (wave - 1) * 22) * profile.speed,
    speedMultiplier: profile.speed,
  };
}

export function formationPosition(homeX: number, homeY: number, phase: number, elapsed: number, wave: number, difficulty: Difficulty = 'medium') {
  const tuning = waveSettings(wave, difficulty);
  return {
    x: Math.max(24, Math.min(FIELD.width - 24,
      homeX + Math.sin(elapsed * tuning.formationRate) * tuning.formationSwing
      + Math.sin(elapsed * 1.1 + phase) * 22)),
    y: homeY + Math.sin(elapsed * (.8 + wave * .15) + phase) * 4,
  };
}

export function sweepStep(x: number, velocity: number, dt: number) {
  const nextX = x + velocity * dt;
  const left = 24, right = FIELD.width - 24;
  if (nextX > right) return { x: 2 * right - nextX, velocity: -Math.abs(velocity) };
  if (nextX < left) return { x: 2 * left - nextX, velocity: Math.abs(velocity) };
  return { x: nextX, velocity };
}

export function approach(value: number, target: number, distance: number) {
  return value + Math.max(-distance, Math.min(distance, target - value));
}

export const WORMHOLE = { x: 140, y: 80, leadIn: .4, stagger: .055, travel: 1.6 };

export function wormholeAppearance(elapsed: number, deploymentDuration: number) {
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const expansion = smooth(elapsed / WORMHOLE.leadIn)
    * (1 - smooth((elapsed - deploymentDuration) / .9));
  const pulse = Math.sin(elapsed * 5) * .025 * expansion;
  const size = .48 + .62 * expansion + pulse;
  return { scaleX: size, scaleY: size * .6, alpha: .55 + .45 * expansion };
}

export function arrivalPosition(index: number, elapsed: number, home: { x: number; y: number }) {
  const progress = Math.max(0, Math.min(1,
    (elapsed - WORMHOLE.leadIn - index * WORMHOLE.stagger) / WORMHOLE.travel));
  const t = progress * progress * (3 - 2 * progress);
  const controlX = Math.max(24, Math.min(FIELD.width - 24,
    home.x + (home.x - WORMHOLE.x) * .35 + Math.sin(index) * 35));
  return {
    x: (1-t)**2 * WORMHOLE.x + 2*(1-t)*t * controlX + t*t * home.x,
    y: (1-t)**2 * WORMHOLE.y + 2*(1-t)*t * (home.y + 75) + t*t * home.y,
    scale: .15 + .85 * progress,
    alpha: Math.min(1, progress * 5),
    visible: elapsed >= WORMHOLE.leadIn + index * WORMHOLE.stagger,
    done: progress === 1,
  };
}

export function alienKind(wave: number, row: number, col: number): AlienKind {
  const kinds: AlienKind[] = wave >= 4 ? ['scout', 'crab', 'manta', 'squid']
    : wave >= 2 ? ['scout', 'crab', 'manta'] : ['scout', 'crab'];
  return kinds[(row + col) % kinds.length];
}
