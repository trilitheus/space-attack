export const FIELD = { width: 1200, height: 720, playerY: 650 };
export type AlienKind = 'scout' | 'crab' | 'manta' | 'squid';

// Each silhouette has a different flight profile; colour remains reserved for health.
export const ALIENS: Record<AlienKind, { pixels: string[]; speed: number; weave: number }> = {
  scout: { speed: 1, weave: 65, pixels: [
    '00000100000', '00001110000', '00011111000', '01111111110',
    '11101110111', '11001110011', '10000100001', '00001010000',
  ] },
  crab: { speed: .85, weave: 110, pixels: [
    '00100000100', '00010001000', '00111111100', '01101110110',
    '11111111111', '10111111101', '10100000101', '00011011000',
  ] },
  manta: { speed: 1.2, weave: 155, pixels: [
    '10000100001', '11001110011', '11111111111', '11101110111',
    '01111111110', '00111111100', '00001110000', '00000100000',
  ] },
  squid: { speed: .95, weave: 85, pixels: [
    '00011111000', '00111111100', '01111111110', '01101110110',
    '01111111110', '00101010100', '01001010010', '10010001001',
  ] },
};

export function waveSettings(wave: number) {
  return {
    columns: Math.min(10, 6 + Math.floor(wave / 2)),
    rows: Math.min(5, 2 + Math.floor((wave - 1) / 2)),
    formationRate: Math.min(1.4, .35 + (wave - 1) * .1),
    formationSwing: Math.min(200, 90 + (wave - 1) * 14),
    attackInterval: Math.max(.45, 3.2 - (wave - 1) * .3),
    diveSpeed: Math.min(300, 75 + (wave - 1) * 18),
    shotSpeed: Math.min(350, 105 + (wave - 1) * 22),
  };
}

export function formationPosition(homeX: number, homeY: number, phase: number, elapsed: number, wave: number) {
  const tuning = waveSettings(wave);
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

export function alienKind(wave: number, row: number, col: number): AlienKind {
  const kinds: AlienKind[] = wave >= 4 ? ['scout', 'crab', 'manta', 'squid']
    : wave >= 2 ? ['scout', 'crab', 'manta'] : ['scout', 'crab'];
  return kinds[(row + col) % kinds.length];
}
