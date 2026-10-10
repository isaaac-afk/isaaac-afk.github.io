// Fills the top progress line as the page scrolls. No transition, so reduced motion needs no special case.
const bar=document.getElementById('scroll-progress');
let queued=false;
function paint(){queued=false;const range=document.documentElement.scrollHeight-innerHeight;bar?.style.setProperty('transform',`scaleX(${range>0?Math.min(1,Math.max(0,scrollY/range)):0})`);}
function schedule(){if(!queued){queued=true;requestAnimationFrame(paint);}}
addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule,{passive:true});
new ResizeObserver(schedule).observe(document.body);paint();
export {};
