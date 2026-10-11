// Ambient monitor traces drawn behind the page: five biosignals drifting right to left.
// Each waveform is a pure function of signal time, so scrolling never shows a seam.

type Trace = { label: string; color: string; alpha: number; amplitude: number; wave: (t: number) => number };

const gauss = (t: number, centre: number, width: number) => Math.exp(-(((t - centre) / width) ** 2));
const fract = (x: number) => x - Math.floor(x);
// Deterministic noise keyed to signal time, so a burst looks the same each time it passes.
const noise = (t: number) => fract(Math.sin(Math.floor(fract(t / 3) * 480) * 12.9898) * 43758.5453) * 2 - 1;

// One beat per second: P wave, PR segment, QRS, ST segment, T wave. Normalised to roughly ±0.5.
function ecg(t: number) {
  const c = fract(t);
  const v = .12 * gauss(c, .2, .028) - .12 * gauss(c, .365, .009) + 1 * gauss(c, .39, .011)
    - .24 * gauss(c, .415, .01) + .26 * gauss(c, .62, .045);
  return (v - .38) / 1.24;
}
// Quiet baseline, then a 400 ms high-frequency burst every three seconds.
function emg(t: number) {
  const c = fract(t / 3) * 3, burst = c < .4 ? Math.sin(Math.PI * c / .4) : 0;
  return noise(t) * (.06 + .44 * burst);
}

const TRACES: Trace[] = [
  { label: 'ECG', color: '#D4A574', alpha: .07, amplitude: 30, wave: ecg },
  { label: 'EMG', color: '#C89B7B', alpha: .06, amplitude: 20, wave: emg },
  { label: 'IMU-X', color: '#8C9B8E', alpha: .05, amplitude: 20, wave: t => .5 * Math.sin(2 * Math.PI * .8 * t) },
  { label: 'IMU-Y', color: '#8C9B8E', alpha: .05, amplitude: 15, wave: t => .5 * Math.cos(2 * Math.PI * .8 * t) },
  { label: 'RESP', color: '#B59872', alpha: .05, amplitude: 25, wave: t => .5 * Math.sin(2 * Math.PI * .2 * t) },
];
const SPEED = 60; // px per second
const STEP = 2; // px between samples
const PERIOD = 15; // s; every waveform repeats within it, keeping the time value small

export class BiosignalBackground {
  private ctx: CanvasRenderingContext2D;
  private width = 0;
  private height = 0;
  private elapsed = 0;
  private last = 0;
  private frame = 0;
  private resizeTimer = 0;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)');

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.fit();
    addEventListener('resize', () => { clearTimeout(this.resizeTimer); this.resizeTimer = window.setTimeout(() => { this.fit(); this.draw(); }, 150); }, { passive: true });
    document.addEventListener('visibilitychange', () => this.sync());
    this.reduced.addEventListener('change', () => this.sync());
    this.sync();
  }

  private fit() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.width = innerWidth; this.height = innerHeight;
    this.canvas.width = Math.round(this.width * dpr); this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private sync() {
    cancelAnimationFrame(this.frame); this.frame = 0;
    if (this.reduced.matches || document.hidden) { this.draw(); return; }
    this.last = performance.now();
    const loop = (now: number) => { this.elapsed = (this.elapsed + Math.min(now - this.last, 100) / 1000) % PERIOD; this.last = now; this.draw(); this.frame = requestAnimationFrame(loop); };
    this.frame = requestAnimationFrame(loop);
  }

  private draw() {
    const { ctx, width, height } = this;
    const traces = width < 768 ? TRACES.slice(0, 3) : TRACES;
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1.5; ctx.lineJoin = 'round';
    ctx.font = "10px 'IBM Plex Mono', monospace"; ctx.textBaseline = 'middle';
    traces.forEach((trace, i) => {
      const baseline = height * (.5 + (i - (traces.length - 1) / 2) * .15);
      ctx.globalAlpha = trace.alpha; ctx.strokeStyle = trace.color;
      ctx.beginPath();
      // Newest signal enters at the right edge and travels left.
      for (let x = 0; x <= width + STEP; x += STEP) {
        const y = baseline - trace.wave(this.elapsed + (x - width) / SPEED) * trace.amplitude;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.globalAlpha = .5; ctx.fillStyle = '#8C9B8E';
      ctx.fillText(trace.label, 16, baseline);
    });
    ctx.globalAlpha = 1;
  }
}

const canvas = document.getElementById('biosignals');
if (canvas instanceof HTMLCanvasElement) new BiosignalBackground(canvas);
