import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const bytes=readFileSync(new URL('../public/models/manipulator.glb',import.meta.url));
const gltf=JSON.parse(bytes.subarray(20,20+bytes.readUInt32LE(12)).toString());
test('original model includes all semantic assemblies with seated defaults',()=>{
 for(const name of ['base','shoulder','elbow','wrist','pcb','jaws','sensors','plate']){
 const node=gltf.nodes.find(n=>n.extras?.assemblyGroup===name);assert.ok(node,name);assert.deepEqual(node.translation||[0,0,0],[0,0,0]);assert.equal(node.extras.explode.length,3);assert.ok(node.extras.assemblyEnd>node.extras.assemblyStart);
 }
});
test('six joint pivots and an authored animation survive export',()=>{for(let i=1;i<=6;i++)assert.ok(gltf.nodes.some(n=>n.name===`J0${i}_pivot`));assert.ok(gltf.animations.length>0);});
test('hero exposes layered internals without losing assembled homes',()=>{const layers=gltf.nodes.filter(n=>Array.isArray(n.extras?.detailExplode));assert.ok(layers.length>=6,'At least six independently exploded mechanical covers');for(const node of layers){assert.equal(node.extras.detailExplode.length,3);assert.ok(node.extras.detailExplode.every(Number.isFinite));}});
test('all fallback chapter renders exist and GLB avoids private path metadata',()=>{for(const name of ['hero','projects','assembled','stage-ecg','stage-emg','stage-gait','stage-ros2'])assert.ok(existsSync(new URL(`../public/images/${name}.webp`,import.meta.url)));assert.ok(!JSON.stringify(gltf).includes('C:\\Users'));});
