import test from 'node:test';
import assert from 'node:assert/strict';
import { beatState, ecgHeight, heroOpacity, PERIOD, setLabMotion, labSeconds } from '../src/scripts/lab-clock.mjs';

test('ECG crosses center once per second and its LED envelope ends at 150ms', () => {
  for (const second of [0, 1, 12, 3600]) {
    assert.equal(beatState(second).offset, 0);
    assert.ok(Math.abs(beatState(second + .075).pulse - 1) < 1e-8);
    assert.ok(beatState(second + .151).pulse === 0);
    assert.ok(Math.abs(beatState(second + .5).offset - PERIOD / 2) < 1e-8);
  }
  assert.ok(beatState(.99).offset > beatState(.1).offset);
});
test('morphology contains distinct P, Q, R, S, and T waves and flat period boundaries', () => {
  assert.ok(ecgHeight(-36) > 2); assert.ok(ecgHeight(-7) < -3);
  assert.ok(ecgHeight(0) > 21); assert.ok(ecgHeight(7) < -6);
  assert.ok(ecgHeight(43) > 5); assert.ok(Math.abs(ecgHeight(-90)) < .001);
  assert.ok(Math.abs(ecgHeight(90)) < .001);
});
test('background never changes within hero and fades monotonically over exactly 400px', () => {
  assert.equal(heroOpacity(0, 2000), 1); assert.equal(heroOpacity(2000, 2000), 1);
  assert.equal(heroOpacity(2200, 2000), .5); assert.equal(heroOpacity(2400, 2000), 0);
  assert.equal(heroOpacity(99999, 2000), 0);
  for(let y = 2000; y < 2400; y++) assert.ok(heroOpacity(y + 1, 2000) <= heroOpacity(y, 2000));
});
test('pausing freezes the shared LED and trace clock', () => {
  setLabMotion(true); setLabMotion(false);
  assert.equal(labSeconds(1000), labSeconds(9000));
});
