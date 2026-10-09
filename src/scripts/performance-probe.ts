/** Opt-in local verification only; never runs for normal visitors. */
if (new URLSearchParams(location.search).has('profile')) {
 const frames: number[] = [], scrolling: number[] = [];
 let last = 0, lastScroll = -Infinity, raf = 0, samples = 0;
 let sweepStart=0,sweepY=0,sweeping=false;
 const run=document.createElement('button');run.textContent='Run scroll diagnostic';run.style.cssText='position:fixed;right:12px;bottom:12px;z-index:100;padding:10px;background:white;color:black';document.body.append(run);
 run.addEventListener('click',()=>{frames.length=0;scrolling.length=0;samples=0;last=0;sweepStart=performance.now();sweepY=scrollY;sweeping=true;run.textContent='Measuring scroll';});
 const onScroll = () => { lastScroll = performance.now(); };
 window.addEventListener('scroll', onScroll, { passive: true });
 const percentile = (values: number[], q: number) => { const sorted = [...values].sort((a,b)=>a-b); return +(sorted[Math.floor((sorted.length-1)*q)] || 0).toFixed(2); };
 function frame(now: number) {
  if(sweeping){const elapsed=now-sweepStart;window.scrollTo({top:sweepY+Math.min(elapsed,6000)*.6,behavior:'instant'});if(elapsed>=6000){sweeping=false;run.textContent='Run scroll diagnostic';document.body.dataset.scrollResult=JSON.stringify({frames:scrolling.length,p50:percentile(scrolling,.5),p95:percentile(scrolling,.95)});}}

  if (last && now-last < 500 && !document.hidden) {
   frames.push(now-last); if(frames.length>1200)frames.shift();
   if(now-lastScroll<150){scrolling.push(now-last);if(scrolling.length>1200)scrolling.shift();}
   if(++samples%60===0)document.body.dataset.performance=JSON.stringify({frames:frames.length,p50:percentile(frames,.5),p95:percentile(frames,.95),scrollFrames:scrolling.length,scrollP50:percentile(scrolling,.5),scrollP95:percentile(scrolling,.95)});
  }
  last=now;raf=requestAnimationFrame(frame);
 }
 raf=requestAnimationFrame(frame);
 window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);window.removeEventListener('scroll',onScroll);});
}
