// Rotates the hero activity line every five seconds with a 400 ms crossfade (200 ms out, 200 ms in).
const items=[...document.querySelectorAll<HTMLElement>('.activity')];
const reduced=matchMedia('(prefers-reduced-motion: reduce)');
let index=0,timer=0;
function show(next:number){
 const current=items[index];current.classList.remove('is-active');current.setAttribute('aria-hidden','true');
 index=next;window.setTimeout(()=>{items[index].classList.add('is-active');items[index].removeAttribute('aria-hidden');},200);
}
function sync(){
 clearInterval(timer);timer=0;
 if(reduced.matches&&index!==0)show(0);
 if(items.length>1&&!reduced.matches&&!document.hidden)timer=window.setInterval(()=>show((index+1)%items.length),5000);
}
document.addEventListener('visibilitychange',sync);reduced.addEventListener('change',sync);sync();
export {};
