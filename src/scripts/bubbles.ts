/** Lightweight cursor response: transform-only, asleep when the bubbles settle. */
const layer=document.createElement('div');layer.className='background-bubbles';layer.setAttribute('aria-hidden','true');document.body.prepend(layer);
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
const bubbles=Array.from({length:56},(_,i)=>{const el=document.createElement('span');const x=((i*37+11)%97)/100,y=((i*29+7)%93)/100,size=1.5+(i*13)%4*.45;el.style.cssText=`left:${x*100}%;top:${y*100}%;width:${size}px;height:${size}px`;layer.append(el);return {el,x,y,dx:0,dy:0};});
let mouseX=-1000,mouseY=-1000,raf=0,last=0;
function frame(time:number){raf=0;const blend=1-Math.exp(-Math.min(40,time-last||16)/110);last=time;let moving=false;
 for(const b of bubbles){const x=b.x*innerWidth,y=b.y*innerHeight,dx=x-mouseX,dy=y-mouseY,d=Math.hypot(dx,dy),push=Math.max(0,1-d/210)*42;const tx=dx/Math.max(d,1)*push,ty=dy/Math.max(d,1)*push;b.dx+=(tx-b.dx)*blend;b.dy+=(ty-b.dy)*blend;b.el.style.transform=`translate3d(${b.dx.toFixed(2)}px,${b.dy.toFixed(2)}px,0)`;if(Math.abs(tx-b.dx)+Math.abs(ty-b.dy)>.1)moving=true;}
 if(moving&&!document.hidden)raf=requestAnimationFrame(frame);
}
function wake(){if(!raf&&!reduced.matches&&!document.hidden)raf=requestAnimationFrame(frame);}
window.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;mouseX=e.clientX;mouseY=e.clientY;wake();},{passive:true});
document.documentElement.addEventListener('pointerleave',()=>{mouseX=mouseY=-1000;wake();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else wake();});
reduced.addEventListener('change',()=>{cancelAnimationFrame(raf);raf=0;for(const b of bubbles){b.dx=b.dy=0;b.el.style.transform='none';}});
window.addEventListener('pagehide',()=>{cancelAnimationFrame(raf);raf=0;});
window.addEventListener('pageshow',()=>wake());

