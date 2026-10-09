import test from 'node:test';
import assert from 'node:assert/strict';
import {letterPath} from '../src/scripts/letter-path.mjs';
const source={x:820,y:420},home={x:560,y:340},end={x:710,y:90};
test('transfer holds still while gripping and releasing',()=>{
 for(const t of [.25,.3,.35])assert.deepEqual(letterPath(t,source,home,end),source);
 for(const t of [.5,.6,.72])assert.deepEqual(letterPath(t,source,home,end),home);
 for(const t of [.9,.95,1])assert.deepEqual(letterPath(t,source,home,end),end);
});
test('each flight segment is monotone, continuous and cannot bounce past its target',()=>{
 for(const [lo,hi,a,b] of [[.35,.5,source,home],[.72,.9,home,end]]){
  let previous=a;
  for(let i=0;i<=1000;i++){
   const point=letterPath(lo+(hi-lo)*i/1000,source,home,end);
   for(const axis of ['x','y']){
    assert.ok(point[axis]>=Math.min(a[axis],b[axis])-1e-8&&point[axis]<=Math.max(a[axis],b[axis])+1e-8);
    assert.ok((point[axis]-previous[axis])*(b[axis]-a[axis])>=-1e-8);
   }
   previous=point;
  }
 }
});
test('release follows a scrolling heading immediately, without a cached render position',()=>{
 assert.deepEqual(letterPath(.94,source,home,{x:710,y:40}),{x:710,y:40});
 assert.deepEqual(letterPath(.94,source,home,{x:710,y:-200}),{x:710,y:-200});
});
