import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Original, lightweight bench geometry. Static details are batched by material. */
export function createWorkbench(floor:number){
 const group=new THREE.Group();group.name='Electronics workbench';
 const materials:THREE.MeshStandardMaterial[]=[];const textures:THREE.Texture[]=[];
 const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();
 function mat(color:number,metalness=0,roughness=.5){const m=new THREE.MeshStandardMaterial({color,metalness,roughness});materials.push(m);return m;}
 const wood=mat(0xffffff,0,.66),navy=mat(0x203e51,.3,.42),silver=mat(0xaab7bf,.8,.3),black=mat(0x18242b,.1,.48),green=mat(0x23695c,.2,.48),gold=mat(0xd2b66b,.7,.32),blue=mat(0x387da1,.25,.4),rubber=mat(0x303a40,0,.9);
 function texture(w:number,h:number,paint:(c:CanvasRenderingContext2D)=>void){const el=document.createElement('canvas');el.width=w;el.height=h;paint(el.getContext('2d')!);const t=new THREE.CanvasTexture(el);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;textures.push(t);return t;}
 wood.map=texture(512,256,c=>{c.fillStyle='#957b59';c.fillRect(0,0,512,256);for(let i=0;i<300;i++){c.strokeStyle=`rgba(78,65,44,${.035+(i%5)*.012})`;c.beginPath();c.moveTo(0,i*.86);c.bezierCurveTo(120,i*.86+Math.sin(i)*3,330,i*.86-2,512,i*.86+1);c.stroke();}});
 function add(g:THREE.BufferGeometry,m:THREE.Material,x:number,y:number,z:number,rx=0,ry=0,rz=0){const matrix=new THREE.Matrix4().compose(new THREE.Vector3(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new THREE.Vector3(1,1,1));g.applyMatrix4(matrix);const flat=g.index?g.toNonIndexed():g;if(flat!==g)g.dispose();buckets.set(m,[...(buckets.get(m)||[]),flat]);}
 function box(w:number,h:number,d:number,m:THREE.Material,x:number,y:number,z:number,ry=0){add(new RoundedBoxGeometry(w,h,d,2,Math.min(.028,w/5,h/5,d/5)),m,x,y,z,0,ry);}
 function cylinder(r:number,h:number,m:THREE.Material,x:number,y:number,z:number,rx=0){add(new THREE.CylinderGeometry(r,r,h,16),m,x,y,z,rx);}
 function cable(points:number[][],r=.015){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p as [number,number,number])));add(new THREE.TubeGeometry(curve,36,r,6,false),rubber,0,0,0);}
 function topLabel(text:string,w:number,d:number,x:number,y:number,z:number,bg='#215c51'){
  const m=mat(0xffffff,0,.65);m.map=texture(512,256,c=>{c.fillStyle=bg;c.fillRect(0,0,512,256);c.strokeStyle='#82b7a7';c.lineWidth=3;c.strokeRect(12,12,488,232);c.fillStyle='#ecf3df';c.font='bold 40px monospace';c.fillText(text,28,65);c.font='20px monospace';c.fillText('ENGINEERING / PROTOTYPE',28,220);});
  add(new THREE.PlaneGeometry(w,d),m,x,y,z,-Math.PI/2);
 }
 const y=floor;
 box(5.4,.22,4.5,wood,-.5,y-.115,.45);
 box(5.45,.07,4.55,navy,-.5,y-.27,.45);
 // A continuous desktop fills the foreground; no miniature table legs.
 box(5.2,.24,.08,navy,-.5,y-.38,2.64);
 const pegboard=mat(0xffffff,0,.82);
 pegboard.map=texture(1024,512,c=>{
  c.fillStyle='#58605b';c.fillRect(0,0,1024,512);
  for(let row=0;row<11;row++)for(let col=0;col<25;col++){
   const x=22+col*41,z=18+row*46;c.fillStyle='rgba(215,225,215,.18)';c.beginPath();c.roundRect(x-1,z-1,10,26,4);c.fill();
   c.fillStyle='#252c28';c.beginPath();c.roundRect(x,z,8,24,4);c.fill();c.fillStyle='#171d1a';c.fillRect(x+2,z+3,4,16);
  }
 });
 box(5.3,2.25,.095,pegboard,-.5,y+1.2,-1.78);
 box(5.38,.08,.17,silver,-.5,y+.075,-1.73);
 // Shelves, component bins, a compact keyboard, and hanging precision tools.
 const ivory=mat(0xdfe4dc,0,.58);
 for(const x of [-2.35,-1.2]){
  box(.93,.055,.38,ivory,x,y+1.08,-1.53);
  box(.82,.34,.31,ivory,x,y+1.28,-1.53);
  box(.65,.20,.008,navy,x,y+1.3,-1.365);
  for(let i=0;i<6;i++)box(.065,.045,.03,i%2?green:gold,x-.25+i*.095,y+1.25,-1.35);
 }
 box(1.62,.6,.09,navy,1.25,y+1.68,-1.66);
 for(let row=0;row<4;row++)for(let col=0;col<12;col++){
  box(.105,.095,.04,row===3?blue:ivory,.53+col*.13,y+1.89-row*.135,-1.59);
 }
 for(let i=0;i<4;i++){
  cylinder(.036,.25,i%2?blue:navy,.10+i*.19,y+.65,-1.55);
  cylinder(.012,.25,silver,.10+i*.19,y+.90,-1.55);
  add(new THREE.TorusGeometry(.035,.006,6,12),silver,.10+i*.19,y+.43,-1.56);
 }
 const cutting=mat(0xffffff,0,.85);
 cutting.map=texture(1024,512,c=>{c.fillStyle='#234b4c';c.fillRect(0,0,1024,512);for(let i=0;i<=1024;i+=24){c.strokeStyle=i%120===0?'#78958b':'#486a64';c.lineWidth=i%120===0?1.5:.6;c.beginPath();c.moveTo(i,0);c.lineTo(i,512);c.stroke();}for(let i=0;i<=512;i+=24){c.beginPath();c.moveTo(0,i);c.lineTo(1024,i);c.stroke();}c.strokeStyle='#b6cec9';c.strokeRect(12,12,1000,488);c.fillStyle='#c7ded6';c.font='16px monospace';for(let i=0;i<20;i++)c.fillText(String(i*10),18+i*50,493);});
 box(4.7,.025,3.50,cutting,-.32,y+.02,.58);
 // Baked contact shadows ground the tools without a per-frame shadow pass.
 const shade=mat(0xffffff);shade.transparent=true;shade.depthWrite=false;
 shade.map=texture(1024,512,c=>{
  const shadows=[[-1,0,.58,.40],[.32,.69,.45,.25],[1.28,.52,.49,.36],[1.38,-.68,.45,.4],[.58,-.65,.23,.38],[-.12,-.68,.2,.18],[-.5,.72,.32,.35]];
  for(const [x,z,w,d] of shadows){const px=(x+.1+2.11)/4.22*1024,pz=(1.125-z)/2.25*512;c.save();c.translate(px,pz);c.scale(w*1024/4.22,d*512/2.25);const g=c.createRadialGradient(0,0,.1,0,0,1);g.addColorStop(0,'rgba(15,32,39,.38)');g.addColorStop(.6,'rgba(15,32,39,.18)');g.addColorStop(1,'rgba(15,32,39,0)');c.fillStyle=g;c.fillRect(-1,-1,2,2);c.restore();}
 });
 add(new THREE.PlaneGeometry(4.22,2.25),shade,.08,y+.035,.06,-Math.PI/2);
 // Two deliberately recognizable development boards: MCU breakout and SBC.
 function board(x:number,z:number,w:number,d:number,label:string){
  box(w,.035,d,green,x,y+.065,z);topLabel(label,w*.93,d*.91,x,y+.084,z);
  box(w*.3,.045,d*.3,black,x,y+.115,z);
  for(let i=0;i<10;i++)for(const side of [-1,1]){box(.018,.016,.06,silver,x-w*.18+i*w*.04,y+.101,z+side*d*.19);}
  for(let i=0;i<12;i++)for(const side of [-1,1]){box(.034,.07,.034,gold,x-w*.42+i*w*.075,y+.125,z+side*d*.42);}
  for(let i=0;i<5;i++){box(.045,.025,.08,black,x+w*.3,y+.102,z-d*.23+i*d*.1);box(.055,.018,.02,silver,x+w*.3,y+.107,z-d*.23+i*d*.1);}
  for(const dx of [-1,1])for(const dz of [-1,1])cylinder(.025,.012,gold,x+dx*w*.45,y+.09,z+dz*d*.44);
 }
 board(.32,.69,.73,.43,'STM32');board(1.28,.52,.83,.64,'Raspberry Pi');
 for(let i=0;i<2;i++)box(.15,.13,.19,silver,1.7,y+.16,.38+i*.22);
 box(.14,.11,.15,silver,1.22,y+.15,.18);
 // Soldering station: enclosure, display, dial, vents and an iron in its cradle.
 box(.72,.42,.65,navy,1.38,y+.24,-.68);
 box(.48,.16,.022,black,1.35,y+.32,-.34);
 const screen=mat(0xffffff,0,.4);screen.map=texture(256,80,c=>{c.fillStyle='#102f36';c.fillRect(0,0,256,80);c.fillStyle='#a6dfda';c.font='40px monospace';c.fillText('320 °C',17,54);});
 add(new THREE.PlaneGeometry(.39,.115),screen,1.32,y+.33,-.325);
 cylinder(.065,.045,silver,1.59,y+.16,-.33,Math.PI/2);
 for(let i=0;i<7;i++)box(.025,.10,.005,black,1.10+i*.07,y+.13,-.345);
 box(.35,.05,.6,black,.58,y+.07,-.65);
 for(let i=0;i<8;i++)add(new THREE.TorusGeometry(.08,.011,6,16),silver,.58,y+.16+i*.019,-.83+i*.04,Math.PI/2-.5);
 add(new THREE.CylinderGeometry(.034,.046,.43,16),blue,.58,y+.30,-.69,-.5);
 add(new THREE.ConeGeometry(.021,.23,12),silver,.58,y+.48,-.8,-.5);
 cable([[1.64,y+.1,-.37],[1.96,y+.05,-.1],[.78,y+.05,-.10],[.6,y+.12,-.5]]);
 // Solder spool, brass cleaning cup, tweezers and precision driver.
 cylinder(.15,.10,navy,-.12,y+.09,-.68);cylinder(.11,.14,silver,-.12,y+.15,-.68);cylinder(.15,.025,navy,-.12,y+.23,-.68);
 cylinder(.12,.09,gold,.0,y+.1,.6);
 for(let i=0;i<14;i++)add(new THREE.TorusGeometry(.045,.005,4,10),gold,Math.sin(i*2)*.05,y+.15, .6+Math.cos(i*2)*.05,Math.PI/2,i);
 box(.028,.018,.55,silver,-.48,y+.06,.73,.12);box(.028,.018,.55,silver,-.42,y+.06,.73,-.12);
 add(new THREE.CylinderGeometry(.045,.045,.32,12),blue,-.72,y+.08,.61,Math.PI/2);
 add(new THREE.CylinderGeometry(.014,.014,.3,10),silver,-.72,y+.08,.90,Math.PI/2);
 for(const [m,geometries] of buckets){const merged=mergeGeometries(geometries);geometries.forEach(g=>g.dispose());if(merged)group.add(new THREE.Mesh(merged,m));}
 return {group,dispose(){group.traverse(n=>{if(n instanceof THREE.Mesh)n.geometry.dispose();});materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}};
}
