const ease=(x)=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
const mix=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
// A single monotone screen-space path for both the glyph and inverse kinematics.
export function letterPath(phase,source,home,destination){
 if(phase<=.35)return {...source};
 if(phase<.5)return mix(source,home,ease((phase-.35)/.15));
 if(phase<=.72)return {...home};
 if(phase<.9)return mix(home,destination,ease((phase-.72)/.18));
 return {...destination};
}
