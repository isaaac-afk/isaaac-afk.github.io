export const STAGES = ['overview','experience','about','ecg','emg','gait','robot','skills','contact'];
export const POSES = [1,1,0,0,0,0,0,1,1];
export const clamp = (x,min=0,max=1) => Math.min(max,Math.max(min,x));
export const smoothstep = x => { const t=clamp(x); return t*t*t*(t*(t*6-15)+10); };
export function sampleStory(scroll, markers) {
  if (!markers.length) return {progress:1,chapter:0,gesture:0,fade:0,pickup:0};
  let index=0;
  while(index < markers.length-1 && scroll>=markers[index+1]) index++;
  if(index>=markers.length-1) return {progress:1,chapter:index,gesture:0,fade:1,pickup:1};
  const t=clamp((scroll-markers[index])/Math.max(1,markers[index+1]-markers[index]));
  // Hold each subject while it is being read, then move continuously to the next.
  const blend=index===0?t:smoothstep(clamp((t-.16)/.78));
  const chapter=index+blend;
  return {progress:POSES[index]+(POSES[index+1]-POSES[index])*blend,chapter,gesture:index===7?1-smoothstep(t):0,fade:index===7?smoothstep(t):0,pickup:clamp(chapter)};
}
export function assemblyOffset(progress,start,end,explode) {
 const amount=1-smoothstep((progress-start)/Math.max(.001,end-start));
 return explode.map(value=>value*amount);
}
