import { FIELD, DIFFICULTIES, type Difficulty } from './waves';

export const FINAL_LEVEL = 10;

export function bossSettings(difficulty: Difficulty) {
  return {
    health: difficulty === 'easy' ? 24 : difficulty === 'medium' ? 36 : 48,
    defenderRows: 2,
    defenderColumns: 6 + DIFFICULTIES[difficulty].columns,
    attackInterval: 1.8 / DIFFICULTIES[difficulty].speed,
    missileSpeed: 200 * DIFFICULTIES[difficulty].speed,
    score: 5000,
  };
}

export function bossPosition(elapsed: number, difficulty: Difficulty) {
  const speed = DIFFICULTIES[difficulty].speed;
  return {
    x: FIELD.width / 2 + Math.sin(elapsed * .65 * speed) * 350,
    y: 135 + Math.sin(elapsed * 1.1 * speed) * 18,
  };
}

export function bossVolley(origin: { x: number; y: number }, target: { x: number; y: number }, difficulty: Difficulty, healthFraction: number) {
  const { missileSpeed } = bossSettings(difficulty);
  const aim = Math.atan2(target.y - origin.y, target.x - origin.x);
  const count = healthFraction <= .5 ? 5 : 3;
  return Array.from({ length: count }, (_, index) => {
    const angle = aim + (index - (count - 1) / 2) * .17;
    return { vx: Math.cos(angle) * missileSpeed, vy: Math.sin(angle) * missileSpeed };
  });
}

export function nextLevel(level: number): number | null {
  return level < FINAL_LEVEL ? level + 1 : null;
}
