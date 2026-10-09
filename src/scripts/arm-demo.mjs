const ease=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
// Joint-space demonstrations: gripper exercise, reach, wrist orientation, stow.
const keys=[
 [4,0,0,0,0,0],
 [4.65,.12,-.24,.12,.65,0],
 [5.4,-.22,.38,-.16,.25,.18],
 [6.15,.22,-.38,.46,.5,-.22],
 [6.9,.08,-.16,-.3,.3,.12],
 [8,0,0,0,0,0]
];
export function sampleArmDemo(chapter,time=0){
 let i=0;while(i<keys.length-2&&chapter>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],u=ease((chapter-a[0])/(b[0]-a[0]));
 const v=a.slice(1).map((x,j)=>x+(b[j+1]-x)*u);
 const activity=ease((chapter-4)/.45)*(1-ease((chapter-7)/1));
 const reachWeight=ease((chapter-4.5)/.7);
 const wristWeight=ease((chapter-5.5)/.7);
 const cycle=Math.sin(time*Math.PI/4);
 const reach=.105*cycle*activity*reachWeight;
 const wrist=.22*Math.sin(time*Math.PI/5)*activity*wristWeight;
 return {
  shoulder:v[0]+reach,
  elbow:v[1]-reach*1.65,
  wrist:v[2]+reach*.65+wrist,
  grip:Math.max(0,Math.min(1,v[3]+.32*Math.sin(time*Math.PI/3)*activity)),
  yaw:v[4]+.12*Math.sin(time*Math.PI/6)*activity*wristWeight,
  active:activity>.001
 };
}
