import './performance-probe';
import gsap from 'gsap';
import {setLabMotion} from './lab-clock.mjs';
import {letterPath} from './letter-path.mjs';
import {STAGES,sampleStory} from './story.mjs';
import type {SceneState,NamePose} from './scene';
const $=<T extends HTMLElement>(id:string)=>document.getElementById(id) as T|null;
const canvas=$<HTMLCanvasElement>('arm-canvas'),studio=$('studio'),poster=$<HTMLImageElement>('scene-poster');
const inspectButton=$<HTMLButtonElement>('inspect-arm'),exitButton=$<HTMLButtonElement>('exit-inspect'),panel=$('inspection-panel');
const motionButton=$<HTMLButtonElement>('motion-toggle'),range=$<HTMLInputElement>('assembly-range');
const select=$<HTMLSelectElement>('component-select'),status=$('scene-status');
const componentInfo:Record<string,[string,string]>={base:['Base assembly','The foundation carries the arm and routes power into the shoulder.'],shoulder:['Shoulder drive','A rotary drive and reduction stage position the upper arm.'],elbow:['Elbow joint','A second major pivot folds the arm through its working envelope.'],wrist:['Wrist assembly','Compact rotary stages orient the tool at the end of the arm.'],pcb:['STM32 control board','An illustrative embedded controller connects sensing and actuation. Isaac’s ECG project uses an STM32F411.'],jaws:['End-effector jaws','Paired articulated fingers illustrate controlled tool motion.'],sensors:['Joint sensors','Sensor modules illustrate feedback for position and movement.'],plate:['Titanium tool plate','An illustrative mounting interface connects the tool to the wrist.']};
const reduced=matchMedia('(prefers-reduced-motion: reduce)'),narrow=matchMedia('(max-width: 800px)');
let motion=!reduced.matches;try{motion=motion&&localStorage.getItem('isaac-motion')!=='off';}catch{}
let inspecting=false,loading=false,markers:number[]=[];
let scene:Awaited<ReturnType<typeof import('./scene').createScene>>|undefined;
let pose={...sampleStory(0,[]),side:0};const animated={...pose};let lastPoster='',lastStatus='';
let crossings:{start:number;end:number;from:number;to:number}[]=[];
function sideAtScroll(y:number){let side=0;for(const crossing of crossings){if(y<crossing.start)break;side=crossing.from+(crossing.to-crossing.from)*smooth((y-crossing.start)/(crossing.end-crossing.start));}return side;}
const nameText=$('hero-name-text'),sourceLetter=$('source-letter'),destinationLetter=$('destination-letter'),flyingLetter=$('flying-letter');
const identity=document.querySelector<HTMLElement>('.hero-identity'),bottom=document.querySelector<HTMLElement>('.hero-bottom');
const clamp=(v:number)=>Math.max(0,Math.min(1,v));
const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t);};
let sourcePoint={x:0,y:0},dropPoint={x:0,y:0},sourceSize=100,sourceWidth=60,sourceHeight=100,lastPercent=-1,dockScroll=0,dockContactY=0;
// Hold for the pickup, then let the complete hero travel with the document.
const nameLift=()=>narrow.matches||reduced.matches?0:-clamp((animated.pickup-.5)/.05)*Math.max(0,dockScroll-innerHeight*1.25);
const sourceAnchor=()=>({x:sourcePoint.x,y:sourcePoint.y+nameLift()});
let dropScroll=NaN,cachedDrop={x:0,y:0};
function measureLetters(){
 dropScroll=NaN;
 if(!sourceLetter||!destinationLetter)return;
 const a=sourceLetter.getBoundingClientRect(),b=destinationLetter.getBoundingClientRect();
 sourcePoint={x:a.left+a.width*.16,y:a.top+a.height*.25-nameLift()};
 const experience=document.querySelector('.experience-dock')!;
 const sectionTop=experience.getBoundingClientRect().top+scrollY;
 const dockTop=Math.max(64,innerHeight*.08);
 dockScroll=sectionTop-dockTop;dockContactY=dockTop+b.height*.25;
 dropPoint={x:b.left+b.width*.16,y:narrow.matches?b.top+b.height*.25+scrollY:sectionTop+b.height*.25};
 sourceSize=parseFloat(getComputedStyle(sourceLetter).fontSize);
 sourceWidth=a.width;sourceHeight=a.height;
 if(flyingLetter){flyingLetter.style.fontSize=`${sourceSize}px`;flyingLetter.style.width=`${sourceWidth}px`;flyingLetter.style.height=`${sourceHeight}px`;flyingLetter.style.lineHeight=`${sourceHeight}px`;}
}
function dropAnchor(){if(dropScroll!==scrollY){dropScroll=scrollY;const r=destinationLetter?.getBoundingClientRect();cachedDrop=r?{x:r.left+r.width*.16,y:r.top+r.height*.25}:{x:dropPoint.x,y:Math.max(dockContactY,dropPoint.y-scrollY)};}return cachedDrop;}
function syncLetterOwnership(phase:number){
 const enabled=Boolean(scene)&&!reduced.matches&&!narrow.matches&&!inspecting;
 const carrying=enabled&&phase>=.25&&phase<.96;
 if(sourceLetter)sourceLetter.style.opacity=enabled&&phase>=.25&&phase<1?'0':'1';
 if(destinationLetter)destinationLetter.style.opacity=enabled&&phase<.96?'0':'1';
 if(!carrying&&flyingLetter)flyingLetter.style.opacity='0';
 return carrying;
}
let lastNamePose:NamePose|undefined;
function moveName(p:NamePose){lastNamePose=p;updateLetter();}
function updateLetter(){
 if(!flyingLetter||!lastNamePose)return;
 const phase=animated.pickup;
 if(!syncLetterOwnership(phase))return;
 const point=letterPath(phase,sourceAnchor(),{x:lastNamePose.homeX,y:lastNamePose.homeY},dropAnchor());
 flyingLetter.style.opacity='1';
 flyingLetter.style.transform=`translate3d(${point.x-sourceWidth*.16}px,${point.y-sourceHeight*.25}px,0)`;
}
function style(el:HTMLElement|null,key:string,value:string){if(el&&el.style.getPropertyValue(key)!==value)el.style.setProperty(key,value);}
function composition(){const c=animated.chapter;
 // Captions follow the render viewport; the actual canvas never changes size.
 const lane=smooth((c-1)/.3);
 style(studio,'--caption-left',`${5+52*animated.side*lane}%`);
 style(studio,'--caption-right',`${56-52*animated.side*lane}%`);


 style(nameText,'--name-opacity',String(inspecting?0:1));
 style(nameText,'transform',`translate3d(0,${nameLift()}px,0)`);

 style(identity,'transform',`translate3d(0,${nameLift()}px,0)`);
 style(bottom,'transform',`translate3d(0,${nameLift()}px,0)`);
 syncLetterOwnership(animated.pickup);updateLetter();
 const chapter=STAGES[Math.round(c)]||'overview';if(document.body.dataset.chapter!==chapter)document.body.dataset.chapter=chapter;
}
function selected(id:string){const info=componentInfo[id]||componentInfo.base;$('component-name')!.textContent=info[0];$('component-description')!.textContent=info[1];if(select)select.value=id;}
function measure(){const offset=narrow.matches?Math.min(innerHeight*.34,340)+32:innerHeight*.25;markers=STAGES.map((id,i)=>{const el=document.getElementById(id);return i===0?0:el?el.getBoundingClientRect().top+scrollY+(narrow.matches?parseFloat(getComputedStyle(el).paddingTop):0)-offset:0;});measureLetters();if(!narrow.matches&&!reduced.matches)markers[1]=dockScroll+innerHeight*1.45;
 markers[8]=Math.min(markers[8],document.documentElement.scrollHeight-innerHeight); crossings=[];let from=0;for(let i=2;i<STAGES.length;i++){const previous=document.querySelector<HTMLElement>(`#${STAGES[i-1]} .section-copy`)!,next=document.querySelector<HTMLElement>(`#${STAGES[i]} .section-copy`)!;const to=next.closest('section')?.getAttribute('data-side')==='left'?1:0;if(to!==from){const start=previous.getBoundingClientRect().bottom+scrollY+24,end=Math.max(start+innerHeight*.2,next.getBoundingClientRect().top+scrollY-innerHeight-24);crossings.push({start,end,from,to});}from=to;}
 update();scene?.resize();}
function draw(){if(animated.chapter<1.9)dropAnchor();const lane=smooth((animated.chapter-1)/.3);const state:SceneState={...animated,viewX:-.2*(1-lane)+.52*animated.side*lane,viewWidth:1-.56*lane,progress:inspecting?Number(range?.value||100)/100:animated.chapter>=4?1:animated.chapter>=3.15?smooth((animated.chapter-3.15)/.85):animated.progress,motion:motion&&!reduced.matches,inspect:inspecting};
 setLabMotion(motion&&!reduced.matches&&!inspecting&&!narrow.matches);
 composition();
 const guide=$<HTMLButtonElement>('guide-arm');if(guide){guide.hidden=!scene||animated.chapter<4||inspecting||reduced.matches||narrow.matches;guide.disabled=!motion;}
 scene?.setState(state);scene?.setVisible(true);studio?.classList.toggle('is-ready',Boolean(scene));document.body.classList.toggle('has-webgl',Boolean(scene));
 const percent=Math.round(state.progress*100);if(percent!==lastPercent){$('assembly-percent')!.textContent=`${percent}%`;lastPercent=percent;}
 if(studio)studio.style.setProperty('--scene-opacity','1');
 const chapter=Math.round(animated.chapter);const labels=['LETTER / TRANSFER','EXPERIENCE','SYSTEM BREAKDOWN','ECG / CONTROLLER','EMG / GRIPPER','GAIT / FEEDBACK','ROS 2 / MOTION','SYSTEM COMPLETE','AT REST'];
 const text=inspecting?'MANIPULATOR-V0 // INSPECT':!scene?'MANIPULATOR-V0 // STILL VIEW':`MANIPULATOR-V0 // ${labels[chapter]||labels[0]}`;
 if(status&&text!==lastStatus){status.textContent=text;lastStatus=text;}
}
// Native scrolling owns the page. The arm's timed return never rewinds the document.
function update(){
 gsap.ticker.add(tick);document.body.classList.toggle('past-hero',scrollY>=(markers[1]||950)-50);if(inspecting)return;pose={...sampleStory(scrollY,markers),side:sideAtScroll(scrollY)};if(markers[2]&&scrollY<markers[3])pose.progress=1-clamp((scrollY-markers[2])/(markers[3]-markers[2]));if(!narrow.matches&&!reduced.matches){const pickupEnd=innerHeight*1.25;pose.pickup=scrollY<pickupEnd?.5*clamp(scrollY/pickupEnd):scrollY<dockScroll?.5+.05*clamp((scrollY-pickupEnd)/(dockScroll-pickupEnd)):.55+.45*clamp((scrollY-dockScroll)/(innerHeight*1.45));}
 const image=pose.chapter<1.35||pose.chapter>6.6?'assembled':'hero';if(poster&&image!==lastPoster){poster.src=`${import.meta.env.BASE_URL}images/${image}.webp`;poster.alt='Conceptual six-axis manipulator with blue shells and metal joints.';lastPoster=image;}
 document.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]').forEach(a=>{const id=a.hash.slice(1),chapter=Math.round(pose.chapter);const current=id===STAGES[chapter]||(id==='ecg'&&chapter>=3&&chapter<=6);if(current)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current');});
 // The glyph must share the document's current scroll position, without catch-up inertia.
 animated.pickup=pose.pickup;
 // Later chapters are drawn by the existing ticker, once per animation frame.
 // The letter handoff keeps its immediate native-scroll update.
 if(pose.chapter<1.9||animated.chapter<1.9)draw();
}
function tick(_time:number,delta:number){let changed=false;if(!inspecting){const blend=motion&&!reduced.matches?1-Math.exp(-Math.min(delta,64)/85):1;for(const key of ['progress','chapter','pickup','gesture','fade','side'] as const){const diff=pose[key]-animated[key];if(Math.abs(diff)>.00001){animated[key]+=diff*(key==='pickup'?1:blend);changed=true;}}}if(changed)draw();else gsap.ticker.remove(tick);}
function motionLabel(){if(motionButton){motionButton.hidden=false;motionButton.disabled=reduced.matches;motionButton.textContent=reduced.matches?'Reduced motion':motion?'Pause motion':'Play motion';motionButton.setAttribute('aria-pressed',String(motion&&!reduced.matches));}}
function exit(){inspecting=false;document.body.classList.remove('is-inspecting');if(panel)panel.hidden=true;document.querySelectorAll<HTMLElement>('[data-reading]').forEach(el=>el.inert=false);inspectButton?.setAttribute('aria-expanded','false');update();draw();inspectButton?.focus();}
inspectButton?.addEventListener('click',()=>{if(!scene)return;inspecting=true;if(range)range.value=String(Math.max(0,lastPercent));document.body.classList.add('is-inspecting');if(panel)panel.hidden=false;inspectButton.setAttribute('aria-expanded','true');document.querySelectorAll<HTMLElement>('[data-reading]').forEach(el=>el.inert=true);draw();scene.resize();canvas?.focus();});
exitButton?.addEventListener('click',exit);document.addEventListener('keydown',e=>{if(e.key==='Escape'&&inspecting)exit();});
$('reset-view')?.addEventListener('click',()=>scene?.resetView());range?.addEventListener('input',draw);select?.addEventListener('change',()=>scene?.select(select.value));
motionButton?.addEventListener('click',()=>{motion=!motion;try{localStorage.setItem('isaac-motion',motion?'on':'off');}catch{}motionLabel();update();draw();});
narrow.addEventListener('change',()=>{if(narrow.matches){scene?.dispose();scene=undefined;if(inspectButton){inspectButton.hidden=true;inspectButton.disabled=true;}if(inspecting)exit();}else start();measure();draw();});
reduced.addEventListener('change',()=>{motion=!reduced.matches;motionLabel();if(reduced.matches){scene?.dispose();scene=undefined;if(inspectButton){inspectButton.hidden=true;inspectButton.disabled=true;}if(inspecting)exit();}else start();update();draw();});
window.addEventListener('scroll',update,{passive:true});window.addEventListener('resize',measure,{passive:true});
const sizeObserver=new ResizeObserver(()=>scene?.resize());if(studio)sizeObserver.observe(studio);
document.fonts.ready.then(measure);motionLabel();measure();selected('base');
let lifecycle=0,pageActive=true;
async function start(){if(!pageActive||!canvas||!studio||reduced.matches||narrow.matches||loading||scene){if(inspectButton&&!scene)inspectButton.hidden=true;return;}loading=true;const generation=lifecycle;try{const {createScene}=await import('./scene');const created=await createScene(canvas,selected,moveName,sourceAnchor,dropAnchor);if(generation!==lifecycle||narrow.matches||reduced.matches){created.dispose();return;}scene=created;canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();scene?.dispose();scene=undefined;studio.classList.remove('is-ready');document.body.classList.remove('has-webgl');if(inspecting)exit();if(inspectButton)inspectButton.hidden=true;draw();},{once:true});if(inspectButton){inspectButton.disabled=false;inspectButton.hidden=false;}draw();measure();}catch(error){if(inspectButton)inspectButton.hidden=true;console.warn('The illustrated story remains available because 3D could not load.',error);}finally{loading=false;if(generation!==lifecycle&&pageActive)start();}}
if(inspectButton)inspectButton.disabled=true;start();gsap.ticker.add(tick);
window.addEventListener('pagehide',()=>{pageActive=false;lifecycle++;scene?.dispose();scene=undefined;gsap.ticker.remove(tick);sizeObserver.disconnect();});
window.addEventListener('pageshow',e=>{pageActive=true;if(e.persisted){if(studio)sizeObserver.observe(studio);start();measure();draw();}});
document.querySelectorAll('details').forEach(el=>el.addEventListener('toggle',measure));

































