/** One second per beat. The R peak crosses the screen center at integer seconds. */
export const PERIOD = 180;
export const PULSE_SECONDS = .15;
export function beatState(seconds) {
  const phase = ((seconds % 1) + 1) % 1;
  return { phase, offset: phase * PERIOD, pulse: phase < PULSE_SECONDS ? Math.sin(Math.PI * phase / PULSE_SECONDS) ** 2 : 0 };
}
/** Illustrative P–QRS–T morphology, not a patient recording. R is exactly at x=0. */
export function ecgHeight(x) {
  const g = (center, width, height) => height * Math.exp(-.5 * ((x - center) / width) ** 2);
  return g(-36, 6, 3.2) + g(-7, 1.7, -4) + g(0, 1.8, 22) + g(7, 2.1, -7) + g(43, 10, 6);
}
export function heroOpacity(y, end) { const t = Math.max(0, Math.min(1, (y - end) / 400)); return 1 - t * t * (3 - 2 * t); }
let elapsed = 0, origin = 0, enabled = false;
export const labState = { active: false };
export function labSeconds(now = performance.now()) { return elapsed + (enabled ? (now - origin) / 1000 : 0); }
export function setLabMotion(value) {
  if (value === enabled) return;
  const now = performance.now(); elapsed = labSeconds(now); origin = now; enabled = value;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('lab-motion-change'));
}
export function labMotionEnabled() { return enabled; }
