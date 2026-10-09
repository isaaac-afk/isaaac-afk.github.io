const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
/** Tool attitude varies with the workspace target, without changing the IK branch. */
export function cursorToolAttitude(x, y) {
  const side = x - 1.25;
  return {
    pitch: clamp(Math.atan2(side, .65 + Math.max(0, .7 - y)), -1.18, 1.18),
    roll: clamp(Math.atan2(side, 1.65) * .8 + (y + .08) * .12, -.65, .65),
  };
}
