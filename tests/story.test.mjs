import {test} from 'node:test';
import assert from 'node:assert/strict';
import {sampleStory,assemblyOffset,POSES} from '../src/scripts/story.mjs';
const markers=[0,1000,2000,3000,4000,5000,6000,7000,8000];
test('story begins assembled, breaks down, and finishes assembled',()=>{assert.equal(sampleStory(0,markers).progress,1);assert.equal(sampleStory(2000,markers).progress,0);assert.equal(sampleStory(7000,markers).progress,1);});
test('every chapter anchor has its authored assembly and camera phase',()=>markers.forEach((m,i)=>{assert.equal(sampleStory(m,markers).progress,POSES[i]);assert.equal(sampleStory(m,markers).chapter,i);}));
test('direct entry and reversing across section boundaries stay continuous',()=>{for(const y of markers.slice(1,-1)){const a=sampleStory(y-.001,markers),b=sampleStory(y+.001,markers);assert.ok(Math.abs(a.progress-b.progress)<.0001);assert.ok(Math.abs(a.chapter-b.chapter)<.0001);}const before=sampleStory(4500,markers);sampleStory(7200,markers);assert.deepEqual(sampleStory(4500,markers),before);});
test('pickup is completed before disassembly starts',()=>{assert.equal(sampleStory(1000,markers).pickup,1);assert.equal(sampleStory(1000,markers).progress,1);assert.ok(sampleStory(1500,markers).progress<1);});
test('reading holds give each project a stable camera target',()=>{for(let i=3;i<=6;i++)assert.equal(sampleStory(markers[i]+100,markers).chapter,i);});
test('assembly offsets preserve separated and seated homes',()=>{assert.deepEqual(assemblyOffset(0,.3,.5,[1,2,3]),[1,2,3]);assert.deepEqual(assemblyOffset(1,.3,.5,[1,2,3]),[0,0,0]);});
test('out of range scroll stays at complete endpoint poses',()=>{assert.equal(sampleStory(-1000,markers).progress,1);assert.equal(sampleStory(99999,markers).progress,1);assert.equal(sampleStory(99999,markers).chapter,8);});

test('intro responds to the first scroll without nested easing or a dead zone',()=>{const p=sampleStory(10,markers);assert.ok(p.pickup>0);assert.equal(p.pickup,p.chapter);assert.equal(p.pickup,.01);});
