import { PERIOD, beatState, ecgHeight, heroOpacity, labSeconds, labState, labMotionEnabled } from './lab-clock.mjs';
const layer = document.getElementById('lab-background')!;
const floorCanvas = document.getElementById('lab-floor') as HTMLCanvasElement;
const trace = document.getElementById('lab-ecg') as HTMLCanvasElement;
const context = trace.getContext('2d');
const mobile = matchMedia('(max-width: 800px)'), reduced = matchMedia('(prefers-reduced-motion: reduce)');
let floor: ReturnType<typeof import('./lab-floor').createLabFloor> | undefined;
let raf = 0, end = 0, opacity = 1, lastBeat = -1, loading = false, failed = false, pageActive = true;
let tile: HTMLCanvasElement | undefined, pixelRatio = 1;
let samples = 0, sampleStart = 0, workTotal = 0;
function draw(now: number) {
  if (!context || !tile) return;
  const seconds = labSeconds(now), beat = beatState(seconds);
  context.clearRect(0, 0, innerWidth, 64);
  const origin = innerWidth / 2 - beat.offset;
  for (let x = origin - Math.ceil(innerWidth / PERIOD) * PERIOD; x < innerWidth + PERIOD; x += PERIOD)
    context.drawImage(tile, x - PERIOD / 2, 0, PERIOD, 64);
  layer.dataset.beatPhase = beat.phase.toFixed(3);
  const index = Math.floor(seconds);
  if (index !== lastBeat) { lastBeat = index; window.dispatchEvent(new Event('lab-heartbeat')); }
}
function frame(now: number) {
  raf = 0; if (!labState.active) return;
  const workStart = performance.now(); draw(now); workTotal += performance.now() - workStart;
  if (!sampleStart) sampleStart = now;
  else if (++samples === 120) {
    layer.dataset.frameMs = ((now - sampleStart) / samples).toFixed(2);
    layer.dataset.drawMs = (workTotal / (samples + 1)).toFixed(3);
    samples = 0; sampleStart = now; workTotal = 0;
  }
  raf = requestAnimationFrame(frame);
}
function sync() {
  labState.active = !!floor && !failed && !mobile.matches && !reduced.matches && labMotionEnabled() && opacity > 0 && !document.hidden && pageActive;
  if (!labState.active) { cancelAnimationFrame(raf); raf = 0; samples = 0; sampleStart = 0; workTotal = 0; }
  else if (!raf) raf = requestAnimationFrame(frame);
}
function scroll() { opacity = heroOpacity(scrollY, end); layer.style.opacity = String(opacity); sync(); }
function measure() {
  const hero = document.getElementById('overview'); end = hero ? hero.getBoundingClientRect().bottom + scrollY : innerHeight;
  if (floor && !mobile.matches && !reduced.matches) {
    const y = floor.resize(); trace.style.top = `${y - 32}px`;
    pixelRatio = Math.min(devicePixelRatio, 1.5); trace.width = Math.round(innerWidth * pixelRatio); trace.height = Math.round(64 * pixelRatio);
    context?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    tile = document.createElement('canvas'); tile.width = Math.round(PERIOD * pixelRatio); tile.height = Math.round(64 * pixelRatio);
    const ctx = tile.getContext('2d')!; ctx.scale(pixelRatio, pixelRatio); ctx.lineWidth = 1; ctx.strokeStyle = '#D4A574';
    // Right of the traveling R peak: an 8px phosphor tail, always at or below 5%.
    for (let x = 0; x < PERIOD; x += .5) {
      const offset = x - PERIOD / 2; ctx.globalAlpha = .05 * (offset > 0 && offset < 8 ? .55 + .45 * (1 - offset / 8) : 1);
      ctx.beginPath(); ctx.moveTo(x, 32 - ecgHeight(offset)); ctx.lineTo(x + .5, 32 - ecgHeight(offset + .5)); ctx.stroke();
    }
    draw(performance.now());
  }
  scroll();
}
async function setup() {
  if (mobile.matches || reduced.matches) { layer.dataset.mode = 'static'; sync(); measure(); return; }
  if (!floor && !failed && !loading) {
    loading = true;
    try { const { createLabFloor } = await import('./lab-floor'); floor = createLabFloor(floorCanvas); }
    catch { failed = true; }
    finally { loading = false; }
  }
  layer.dataset.mode = floor && !failed && !mobile.matches && !reduced.matches ? 'live' : 'static'; measure();
}
floorCanvas.addEventListener('webglcontextlost', event => { event.preventDefault(); failed = true; layer.dataset.mode = 'static'; sync(); });
window.addEventListener('scroll', scroll, { passive: true }); window.addEventListener('resize', measure, { passive: true });
window.addEventListener('lab-motion-change', sync); document.addEventListener('visibilitychange', sync);
mobile.addEventListener('change', setup); reduced.addEventListener('change', setup);
window.addEventListener('pagehide', () => { pageActive = false; sync(); });
window.addEventListener('pageshow', () => { pageActive = true; measure(); });
document.fonts.ready.then(measure); setup();
