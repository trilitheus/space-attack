import { FIELD } from './waves';

export const FLIGHT_BOUNDS = { left: 28, right: FIELD.width - 28, top: FIELD.height * 2 / 3, bottom: FIELD.height - 54 };

export function movePlayer(x: number, y: number, horizontal: number, vertical: number, dt: number) {
  const length = Math.max(1, Math.hypot(horizontal, vertical));
  return {
    x: Math.max(FLIGHT_BOUNDS.left, Math.min(FLIGHT_BOUNDS.right, x + horizontal / length * 420 * dt)),
    y: Math.max(FLIGHT_BOUNDS.top, Math.min(FLIGHT_BOUNDS.bottom, y + vertical / length * 330 * dt)),
  };
}
