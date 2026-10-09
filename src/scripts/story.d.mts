export const STAGES: readonly string[];
export const POSES: readonly number[];
export type StoryPose={progress:number;chapter:number;gesture:number;fade:number;pickup:number};
export function clamp(x:number,min?:number,max?:number):number;
export function smoothstep(x:number):number;
export function sampleStory(scroll:number,markers:number[]):StoryPose;
export function assemblyOffset(progress:number,start:number,end:number,explode:number[]):number[];
