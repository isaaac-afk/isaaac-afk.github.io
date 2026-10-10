export const STAGES = ['overview','experience','about','ecg','emg','gait','robot','skills','contact'];
// Page sections, in reading order. The arm's choreography is authored on the nine
// STAGES above; the project run (ecg … skills) is stretched across however many
// project sections the page has.
export const SECTIONS = ['overview','experience','about','ecg','emg','lattice','gait','skinsight','skills','contact'];
export function stageMarkers(sectionMarkers) {
  const first=SECTIONS.indexOf('ecg'),last=SECTIONS.indexOf('skills'),firstStage=STAGES.indexOf('ecg'),lastStage=STAGES.indexOf('skills');
  const at=x=>{const i=Math.min(Math.floor(x),sectionMarkers.length-2);return sectionMarkers[i]+(sectionMarkers[i+1]-sectionMarkers[i])*(x-i);};
  return STAGES.map((_,i)=>i<=firstStage?sectionMarkers[i]:i>=lastStage?sectionMarkers[i+last-lastStage]:at(first+(i-firstStage)*(last-first)/(lastStage-firstStage)));
}
export function sectionAt(scroll, sectionMarkers) {
  let index=0;
  while(index < sectionMarkers.length-1 && scroll>=sectionMarkers[index+1]) index++;
  return index;
}
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
