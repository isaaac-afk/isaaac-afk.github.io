import test from 'node:test';
import assert from 'node:assert/strict';
import {cursorToolAttitude} from '../src/scripts/cursor-pose.mjs';
test('sideways targets turn and roll the tool in opposing directions',()=>{
  const left=cursorToolAttitude(-.5,0),right=cursorToolAttitude(2.5,0);
  assert.ok(left.pitch<-.7&&right.pitch>.7);
  assert.ok(left.roll<0&&right.roll>0);
  assert.equal(cursorToolAttitude(1.25,-.08).pitch,0);
});
test('attitude is continuous and stays inside tool joint limits',()=>{
  let previous=cursorToolAttitude(-2,1);
  for(let x=-1.99;x<=3;x+=.01){const pose=cursorToolAttitude(x,1);
    assert.ok(Math.abs(pose.pitch)<=1.18&&Math.abs(pose.roll)<=.65);
    assert.ok(Math.abs(pose.pitch-previous.pitch)<.02);
    assert.ok(Math.abs(pose.roll-previous.roll)<.02);previous=pose;
  }
});
