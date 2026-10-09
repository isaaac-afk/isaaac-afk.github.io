import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleArmDemo} from '../src/scripts/arm-demo.mjs';
test('demonstration begins and ends at rest',()=>{for(const c of [0,4,8,12]){const p=sampleArmDemo(c,3);for(const key of ['shoulder','elbow','wrist','grip','yaw'])assert.equal(p[key],0);assert.equal(p.active,false);}});
test('all demonstration poses are continuous and bounded',()=>{for(let c=0;c<8;c+=.002){const a=sampleArmDemo(c,2),b=sampleArmDemo(c+.002,2);for(const key of ['shoulder','elbow','wrist','grip','yaw']){assert.ok(Number.isFinite(a[key]));assert.ok(Math.abs(a[key]-b[key])<.015);}assert.ok(Math.abs(a.shoulder)<.4&&Math.abs(a.elbow)<.6&&Math.abs(a.wrist)<.8);assert.ok(a.grip>=0&&a.grip<=1);}});
test('reverse scroll restores the same calibration pose',()=>{const chapters=[4,4.7,5.5,6.2,7,8];assert.deepEqual(chapters.map(c=>sampleArmDemo(c,4)),[...chapters].reverse().map(c=>sampleArmDemo(c,4)).reverse());});

test('later sections visibly articulate while remaining smooth over time',()=>{
 for(const chapter of [4.7,5.4,6.2,7]){
  const poses=Array.from({length:241},(_,i)=>sampleArmDemo(chapter,i/20));
  const span=key=>Math.max(...poses.map(p=>p[key]))-Math.min(...poses.map(p=>p[key]));
  assert.ok(span('grip')>.3);
  if(chapter>5)assert.ok(span('elbow')>.15);
  for(let i=1;i<poses.length;i++)for(const key of ['shoulder','elbow','wrist','yaw'])assert.ok(Math.abs(poses[i][key]-poses[i-1][key])<.025);
 }
});
