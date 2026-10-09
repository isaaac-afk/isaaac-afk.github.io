import { createGpuProfile } from './gpu-profile';
import * as THREE from 'three';
import {beatState,labSeconds,labState} from './lab-clock.mjs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createMaterialFinisher } from './materials';
import {letterPath} from './letter-path.mjs';
import { createWorkbench } from './workbench';
import { sampleArmDemo } from './arm-demo.mjs';
import { cursorToolAttitude } from './cursor-pose.mjs';

export type SceneState={progress:number;chapter:number;pickup:number;gesture:number;fade:number;motion:boolean;inspect:boolean;viewX?:number;viewWidth?:number};
export type NamePose={homeX:number;homeY:number;x:number;y:number;angle:number;grip:number;opacity:number;phase:number;sourceError:number;dropError:number;reachable:boolean};
export async function createScene(canvas:HTMLCanvasElement,onSelect:(id:string)=>void,onNamePose?:(pose:NamePose)=>void,getNameAnchor?:()=>{x:number;y:number},getDropAnchor?:()=>{x:number;y:number}) {
 const renderer=new THREE.WebGLRenderer({canvas,alpha:true,premultipliedAlpha:false,antialias:true,powerPreference:'high-performance'});
 const profiling=new URLSearchParams(location.search).has('profile');
 const gpuProfile=createGpuProfile(renderer.getContext(),profiling,canvas);
 let cpuTotal=0,cpuFrames=0,animationTotal=0,renderTotal=0;
 renderer.setPixelRatio(1);
 renderer.outputColorSpace=THREE.SRGBColorSpace; renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.82;
 renderer.shadowMap.enabled=false;
 renderer.info.autoReset=false;
 const scene=new THREE.Scene();
 const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const environment=pmrem.fromScene(room,.025);scene.environment=environment.texture;scene.environmentIntensity=.58;room.dispose();pmrem.dispose();
 scene.add(new THREE.HemisphereLight(0xe8f0ff,0x263d58,.38));
 const key=new THREE.DirectionalLight(0xfff3dd,2.4);key.position.set(-3,7,5);scene.add(key);
 const shadowData=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4;const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);shadowData[i]=90;shadowData[i+1]=80;shadowData[i+2]=64;shadowData[i+3]=Math.round(Math.max(0,1-r)**2*50);}
 const contactTexture=new THREE.DataTexture(shadowData,64,64);contactTexture.needsUpdate=true;contactTexture.magFilter=THREE.LinearFilter;
 const ground=new THREE.Mesh(new THREE.PlaneGeometry(2.3,1.8),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}));ground.rotation.x=-Math.PI/2;scene.add(ground);
 const fill=new THREE.DirectionalLight(0xdce8ff,.55);fill.position.set(5,2,4);scene.add(fill);
 const rim=new THREE.DirectionalLight(0xbdd9ff,1.5);rim.position.set(3,5,-5);scene.add(rim);
 const camera=new THREE.PerspectiveCamera(34,1,.1,100);
 const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.dampingFactor=.08;controls.enablePan=false;controls.enableZoom=true;controls.enabled=false;controls.minDistance=1.2;controls.maxDistance=22;
 const gltf=await new GLTFLoader().loadAsync(`${import.meta.env.BASE_URL}models/manipulator.glb`).catch(error=>{controls.dispose();ground.geometry.dispose();ground.material.dispose();contactTexture.dispose();environment.dispose();renderer.dispose();throw error;});
 const finishes=createMaterialFinisher(renderer);finishes.apply(gltf.scene);
 const root=new THREE.Group();root.add(gltf.scene);scene.add(root);
 const box=new THREE.Box3().setFromObject(gltf.scene);const center=box.getCenter(new THREE.Vector3());gltf.scene.position.sub(center);const groundHome=box.min.y-center.y-.025;
 const bench=createWorkbench(groundHome);scene.add(bench.group);
 const groups:{node:THREE.Object3D;home:THREE.Vector3;explode:THREE.Vector3;start:number;end:number}[]=[];
 const detailLayers:{node:THREE.Object3D;home:THREE.Vector3;offset:THREE.Vector3}[]=[];
 const joints:THREE.Object3D[]=[]; const leds:THREE.MeshStandardMaterial[]=[];
 gltf.scene.traverse(node=>{
   if(node.userData.assemblyGroup) groups.push({node,home:node.position.clone(),explode:new THREE.Vector3(...(node.userData.explode as [number,number,number]||[0,0,0])),start:Number(node.userData.assemblyStart||0),end:Number(node.userData.assemblyEnd||1)});
   if(Array.isArray(node.userData.detailExplode)) detailLayers.push({node,home:node.position.clone(),offset:new THREE.Vector3(...node.userData.detailExplode as [number,number,number])});
   if(/^(J0[456]_pivot|left_jaw_pivot|right_jaw_pivot)$/i.test(node.name)) joints.push(node);
   if(node instanceof THREE.Mesh){let parent:THREE.Object3D|null=node;while(parent&&!parent.userData.assemblyGroup)parent=parent.parent;const materials=Array.isArray(node.material)?node.material:[node.material];node.receiveShadow=true;node.castShadow=materials.some(m=>/shell|ceramic|alumin|chassis|steel|titanium/i.test(m.name));for(const material of materials){if(material instanceof THREE.MeshStandardMaterial){if(/led|signal|indicator/i.test(material.name))leds.push(material);}}}
 });
 let needle:THREE.Object3D|undefined;gltf.scene.traverse(node=>{if(/Conceptual.*curved.*surgical.*needle/i.test(node.name))needle=node;});
 const baseAssembly=groups.find(g=>g.node.userData.assemblyGroup==='base');const baseCenter=baseAssembly?new THREE.Box3().setFromObject(baseAssembly.node).getCenter(new THREE.Vector3()):new THREE.Vector3();
 const baseLED=new THREE.MeshStandardMaterial({color:0xD4A574,emissive:0xD4A574,emissiveIntensity:.35,roughness:.45});
 const indicator=gltf.scene.getObjectByName('Terracotta_status_light')||gltf.scene.getObjectByName('Terracotta status light');
 if(indicator instanceof THREE.Mesh)indicator.material=baseLED;
 canvas.dataset.baseLed=String(indicator instanceof THREE.Mesh);
 let state:SceneState={progress:1,chapter:0,pickup:0,gesture:0,fade:0,motion:true,inspect:false};let running=true,visible=true,raf=0;
 let sampleFrames=0,sampleStart=0,settling=0,inFrame=false;
 let lastScrollAt=-Infinity,nextScrollFrame=0;
 const noteScroll=()=>{lastScrollAt=performance.now();};
 window.addEventListener('scroll',noteScroll,{passive:true});
 function request(){if(running&&visible&&!document.hidden&&!raf){if(!inFrame){sampleFrames=0;sampleStart=0;lastTime=0;delete canvas.dataset.frameMs;}raf=requestAnimationFrame(frame);}}
 const wake=()=>request();document.addEventListener('visibilitychange',wake);window.addEventListener('lab-heartbeat',wake);controls.addEventListener('change',wake);
 let selected:THREE.Object3D|undefined;const initialRotations=new Map(joints.map(j=>[j,j.rotation.clone()]));
 let focusTarget:THREE.Vector3|null=null,focusCamera:THREE.Vector3|null=null;
 controls.addEventListener('start',()=>{focusTarget=null;focusCamera=null;});
 const target=new THREE.Vector3(0,0,0); let distance=8;
 let bufferWidth=0,bufferHeight=0;
 function resize(){const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return;canvasRect=r;frameRect=r;if(bufferWidth!==r.width||bufferHeight!==r.height){bufferWidth=r.width;bufferHeight=r.height;renderer.setPixelRatio(Math.min(devicePixelRatio,1,Math.sqrt(1400000/(r.width*r.height))));renderer.setSize(r.width,r.height,false);canvas.dataset.bufferResizes=String(Number(canvas.dataset.bufferResizes||0)+1);}camera.aspect=r.width/Math.max(1,r.height);camera.updateProjectionMatrix();distance=innerWidth<=800?11:8;request();}
 function resetView(){focusTarget=null;focusCamera=null;target.set(0,innerWidth<=800?.8:-.05,0);camera.position.set(2.3,1.1+target.y,distance);controls.target.copy(target);controls.update();request();}
 function select(id:string){selected=groups.find(g=>g.node.userData.assemblyGroup===id||g.node.name===id)?.node;if(selected&&state.inspect){const bounds=new THREE.Box3().setFromObject(selected);focusTarget=bounds.getCenter(new THREE.Vector3());const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;focusCamera=focusTarget.clone().add(camera.position.clone().sub(controls.target).normalize().multiplyScalar(THREE.MathUtils.clamp(radius*4,2,8)));}onSelect(id);request();}
 const raycaster=new THREE.Raycaster();const pointer=new THREE.Vector2();let down={x:0,y:0};
 const cursorGoal=new THREE.Vector2(),cursorPosition=new THREE.Vector2();let cursorActive=false,trackingMix=0;const trackingTarget=new THREE.Vector3();
 const guide=document.getElementById('guide-arm');
 function followPointer(e:PointerEvent){if(e.pointerType==='touch'||state.inspect||!state.motion||state.chapter<4)return;cursorGoal.set(THREE.MathUtils.clamp(e.clientX/innerWidth*2-1,-1,1),THREE.MathUtils.clamp(1-e.clientY/innerHeight*2,-1,1));cursorActive=true;request();}
 function leavePointer(){cursorActive=false;request();}
 function guideKeys(e:KeyboardEvent){if(!state.motion||state.inspect)return;const step=.13;if(e.key==='ArrowLeft')cursorGoal.x-=step;else if(e.key==='ArrowRight')cursorGoal.x+=step;else if(e.key==='ArrowUp')cursorGoal.y+=step;else if(e.key==='ArrowDown')cursorGoal.y-=step;else if(e.key==='Escape'){leavePointer();guide?.blur();return;}else return;e.preventDefault();cursorGoal.clampScalar(-1,1);cursorActive=true;request();}
 function guideStart(){cursorGoal.set((frameRect.left+frameRect.width*.64)/innerWidth*2-1,0);cursorActive=true;request();}
 window.addEventListener('pointermove',followPointer,{passive:true});document.documentElement.addEventListener('pointerleave',leavePointer);window.addEventListener('blur',leavePointer);guide?.addEventListener('keydown',guideKeys);guide?.addEventListener('click',guideStart);guide?.addEventListener('blur',leavePointer);
 function pointerDown(e:PointerEvent){focusTarget=null;focusCamera=null;down={x:e.clientX,y:e.clientY};}
 function pointerUp(e:PointerEvent){if(!state.inspect||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const r=canvas.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObject(root,true)[0];let node:THREE.Object3D|null=hit?.object||null;while(node&&!node.userData.assemblyGroup)node=node.parent;if(node)select(node.userData.assemblyGroup);}
 canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointerup',pointerUp);
 function keydown(e:KeyboardEvent){if(!state.inspect)return;const offset=camera.position.clone().sub(controls.target);const spherical=new THREE.Spherical().setFromVector3(offset);if(e.key==='ArrowLeft')spherical.theta-=.12;else if(e.key==='ArrowRight')spherical.theta+=.12;else if(e.key==='ArrowUp')spherical.phi=Math.max(.15,spherical.phi-.10);else if(e.key==='ArrowDown')spherical.phi=Math.min(Math.PI-.15,spherical.phi+.10);else if(e.key==='+'||e.key==='=')spherical.radius*=.9;else if(e.key==='-')spherical.radius*=1.1;else return;focusTarget=null;focusCamera=null;e.preventDefault();camera.position.copy(controls.target).add(new THREE.Vector3().setFromSpherical(spherical));controls.update();}
 canvas.addEventListener('keydown',keydown);
 // Runtime kinematic chain. Exported story groups are siblings, so transforms must
 // propagate shoulder rotation to every downstream assembly, not empty pivot nodes.
 const shoulderAnchor=new THREE.Vector3(-1,-1.13,0),elbowAnchor=new THREE.Vector3(-.65,.78,0);
 const axisY=new THREE.Vector3(0,1,0);
 const shoulderMatrix=new THREE.Matrix4(),forearmMatrix=new THREE.Matrix4(),toolMatrix=new THREE.Matrix4();
 const pivotMatrix=(p:THREE.Vector3,a:number)=>new THREE.Matrix4().makeTranslation(p.x,p.y,p.z).multiply(new THREE.Matrix4().makeRotationZ(a)).multiply(new THREE.Matrix4().makeTranslation(-p.x,-p.y,-p.z));
 const smooth=(x:number)=>{x=THREE.MathUtils.clamp(x,0,1);return x*x*x*(x*(x*6-15)+10);};
 const segment=(x:number,a:number,b:number)=>smooth((x-a)/(b-a));
 // Contact lies between the jaw pads, inside the needle silhouette.
 const jawTip=new THREE.Vector3(1.45,-.62,0);
 // Three connected planar joints: shoulder, elbow, compensated tool wrist.
 const wristAnchor=new THREE.Vector3(1.42,.89,0),toolVector=jawTip.clone().sub(wristAnchor);
 const first=elbowAnchor.clone().sub(shoulderAnchor),second=wristAnchor.clone().sub(elbowAnchor);
 const lengthA=first.length(),lengthB=second.length(),angleA=Math.atan2(first.y,first.x),angleB=Math.atan2(second.y,second.x);
 const restCamera=new THREE.PerspectiveCamera(34,1,.1,100),ikRay=new THREE.Raycaster(),ikPlane=new THREE.Plane(new THREE.Vector3(0,0,1),0);
 function anchorPoint(getAnchor:(()=>{x:number;y:number})|undefined,fallback:THREE.Vector3){
  if(!getAnchor)return fallback.clone();
  const anchor=getAnchor(),rect=frameRect;
  restCamera.aspect=rect.width/Math.max(1,rect.height);restCamera.updateProjectionMatrix();restCamera.position.set(2.3,1.1+(innerWidth<=800?.8:-.05),distance);restCamera.lookAt(0,innerWidth<=800?.8:-.05,0);restCamera.updateMatrixWorld();
  ikRay.setFromCamera(new THREE.Vector2((anchor.x-rect.left)/rect.width*2-1,-(anchor.y-rect.top)/rect.height*2+1),restCamera);
  return ikRay.ray.intersectPlane(ikPlane,new THREE.Vector3())?.add(center)||fallback.clone();
 }
 function solveTool(point:THREE.Vector3,orientation:number){
  const wrist=point.clone().sub(toolVector.clone().applyAxisAngle(new THREE.Vector3(0,0,1),orientation)).sub(shoulderAnchor);
  const radius=wrist.length(),minReach=Math.abs(lengthA-lengthB)+.0001,maxReach=lengthA+lengthB-.0001;
  const reachable=radius>=minReach&&radius<=maxReach;
  const d=THREE.MathUtils.clamp(radius,minReach,maxReach);
  // One continuous elbow-up branch for the whole motion on every viewport.
  const elbow=-Math.acos(THREE.MathUtils.clamp((d*d-lengthA*lengthA-lengthB*lengthB)/(2*lengthA*lengthB),-1,1));
  const shoulder=Math.atan2(wrist.y,wrist.x)-Math.atan2(lengthB*Math.sin(elbow),lengthA+lengthB*Math.cos(elbow))-angleA;
  const forearm=elbow-(angleB-angleA);
  return {shoulder,elbow:forearm,wrist:orientation-shoulder-forearm,reachable};
 }
 let canvasRect=canvas.getBoundingClientRect();let frameRect=canvasRect;
 let landingStart=-1,previousPickup=0;
 let simulationTime=0,lastTime=0,armShoulder=0,armElbow=0,grip=0,yaw=0,armWrist=0,armRoll=0;
 const rollMatrix=new THREE.Matrix4(),rollRotation=new THREE.Matrix4(),rollBack=new THREE.Matrix4().makeTranslation(-wristAnchor.x,-wristAnchor.y,-wristAnchor.z),rollAxis=toolVector.clone().normalize();

 const homeQuaternions=new Map(groups.map(g=>[g.node,g.node.quaternion.clone()]));
 // Split the three merged sensor housings by their authored link position.
 // Each housing then follows its real link while the parent still explodes as one project.
 const sensorRoot=groups.find(g=>g.node.userData.assemblyGroup==='sensors')?.node;
 const sensorLinks=[new THREE.Group(),new THREE.Group()];
 if(sensorRoot){gltf.scene.updateMatrixWorld(true);const originalChildren=[...sensorRoot.children];
  for(const child of originalChildren){if(!(child instanceof THREE.Mesh))continue;const geom=child.geometry.index?child.geometry.toNonIndexed():child.geometry.clone();const pos=geom.getAttribute('position');const partitions:number[][]=[[],[]];
   for(let i=0;i<pos.count;i+=3){const v=new THREE.Vector3().fromBufferAttribute(pos,i).applyMatrix4(child.matrixWorld).add(center);const part=v.x<0?0:1;partitions[part].push(i,i+1,i+2);}
   for(let side=0;side<2;side++){if(!partitions[side].length)continue;const split=new THREE.BufferGeometry();for(const name of Object.keys(geom.attributes)){const attr=geom.getAttribute(name);const values=new Float32Array(partitions[side].length*attr.itemSize);partitions[side].forEach((index,j)=>{for(let k=0;k<attr.itemSize;k++)values[j*attr.itemSize+k]=attr.array[index*attr.itemSize+k];});split.setAttribute(name,new THREE.BufferAttribute(values,attr.itemSize));}
    const mesh=new THREE.Mesh(split,child.material);mesh.position.copy(child.position);mesh.quaternion.copy(child.quaternion);mesh.scale.copy(child.scale);mesh.castShadow=child.castShadow;mesh.receiveShadow=true;sensorLinks[side].add(mesh);}
   geom.dispose();child.geometry.dispose();sensorRoot.remove(child);
  }sensorLinks.forEach(link=>sensorRoot.add(link));
 }
 const positionTmp=new THREE.Vector3(),rotationTmp=new THREE.Quaternion(),scaleTmp=new THREE.Vector3();
 // Cache object-space envelopes once: camera updates no longer traverse 425k triangles.
 root.updateMatrixWorld(true);
 const localBounds=new Map<THREE.Object3D,THREE.Box3>();
 for(const object of [...groups.map(g=>g.node),...sensorLinks])localBounds.set(object,new THREE.Box3().setFromObject(object).applyMatrix4(object.matrixWorld.clone().invert()));
 const boundsFor=(object:THREE.Object3D)=>localBounds.get(object)!.clone().applyMatrix4(object.matrixWorld);
 function frame(time:number){const cpuStart=performance.now();raf=0;if(!running||!visible||document.hidden){lastTime=time;return;}
  // Reserve compositor time for native scrolling on high-refresh displays.
  // Geometry, pixel resolution and elapsed-time animation remain unchanged.
  if(time-lastScrollAt<180){if(time<nextScrollFrame-.75){raf=requestAnimationFrame(frame);return;}nextScrollFrame=Math.max(nextScrollFrame+1000/60,time);}else nextScrollFrame=time;
  inFrame=true;
  const full=canvasRect,vx=state.inspect?0:(state.viewX??-.2)*full.width,vw=state.inspect?full.width:(state.viewWidth??1)*full.width;
  frameRect=new DOMRect(full.left+vx,full.top,vw,full.height);camera.aspect=vw/Math.max(1,full.height);camera.updateProjectionMatrix();
  const dt=Math.min(.05,(time-lastTime)*.001||.016);lastTime=time;if(state.motion&&!state.inspect)simulationTime+=dt;const t=simulationTime;const ease=1-Math.exp(-dt*6);
  const chapter=state.chapter||0;
  const benchReveal=segment(chapter,4,4.35);
  bench.group.visible=!state.inspect&&benchReveal>0;
  bench.group.position.set(-.8,.18*benchReveal-3.5*(1-benchReveal),0);
  root.position.y=.18*benchReveal;

  // A single reversible scroll choreography: reach, grasp, carry, release.
  const rawPhase=THREE.MathUtils.clamp(state.pickup,0,1);
  if(rawPhase<.96)landingStart=-1;
  if(rawPhase>=.96&&previousPickup<.96&&chapter<1.3&&state.motion)landingStart=t;
  const landing=landingStart>=0&&t-landingStart<1&&chapter<1.3;
  const phase=landing?.96+.04*smooth(t-landingStart):landingStart>=0&&rawPhase>=.96?1:rawPhase;previousPickup=rawPhase;canvas.dataset.landing=landing?'lowering':'complete';if(needle)needle.visible=false;
  const source=chapter<1.9?anchorPoint(getNameAnchor,jawTip):jawTip.clone(),drop=chapter<1.9?anchorPoint(getDropAnchor,jawTip):jawTip.clone();
  const homeScreenPoint=jawTip.clone().sub(center).project(restCamera);
  const homeScreen={x:frameRect.left+(homeScreenPoint.x+1)*frameRect.width/2,y:frameRect.top+(1-homeScreenPoint.y)*frameRect.height/2};
  const letter=chapter<1.9?letterPath(phase,getNameAnchor?.()||homeScreen,homeScreen,getDropAnchor?.()||homeScreen):homeScreen;
  const approach=source.clone().add(new THREE.Vector3(-.18,.15,0));
  const desired=jawTip.clone();
  if(phase<.18)desired.lerp(approach,segment(phase,0,.18));
  else if(phase<.25)desired.copy(approach).lerp(source,segment(phase,.18,.25));
  else if(phase<.35)desired.copy(source);
  else if(phase<.50)desired.copy(anchorPoint(()=>letter,jawTip));
  else if(phase<.72)desired.copy(jawTip);
  else if(phase<.90)desired.copy(anchorPoint(()=>letter,jawTip));
  else if(phase<.96)desired.copy(drop);
  else desired.copy(drop).lerp(jawTip,segment(phase,.96,1));
  const closed=segment(phase,.25,.35)*(1-segment(phase,.90,.96));
  const activity=smooth((state.progress-.8)/.2),storyActivity=1-segment(chapter,1.2,2);
  const gesture=0;
  // Return the complete joint chain home before the text transition begins.
  const orientation=.65*segment(phase,0,.18)*(1-segment(phase,.35,.50))+1.95*segment(phase,.72,.90)*(1-segment(phase,.96,1));
  const solved=solveTool(desired,orientation);
  let shoulderGoal=solved.shoulder*activity*storyActivity+Math.sin(t*.55)*.12*gesture*activity;
  let elbowGoal=solved.elbow*activity*storyActivity+Math.sin(t*.55+.7)*.15*gesture*activity;
  let wristGoal=solved.wrist*activity*storyActivity;
  let gripGoal=closed*activity*storyActivity,yawGoal=0,rollGoal=0;
  const demonstration=sampleArmDemo(chapter,t);
  if(chapter>=4){shoulderGoal=demonstration.shoulder;elbowGoal=demonstration.elbow;wristGoal=demonstration.wrist;gripGoal=demonstration.grip;}
  yawGoal=demonstration.yaw;
  const trackingAllowed=chapter>=4&&state.motion&&!state.inspect;
  if(state.motion&&!state.inspect){cursorPosition.lerp(cursorGoal,1-Math.exp(-dt*18));trackingMix=THREE.MathUtils.damp(trackingMix,trackingAllowed&&cursorActive?segment(chapter,4,4.25):0,7,dt);}
  if(chapter>=4){
   // A higher tool rest and a bounded task-space target keep the elbow on one branch.
   const rest=solveTool(new THREE.Vector3(1.25,-.08,0),0);
   const lift=segment(chapter,4,4.3);
   shoulderGoal+=rest.shoulder*lift;elbowGoal+=rest.elbow*lift;wristGoal+=rest.wrist*lift;
   // Project the actual pointer through the live camera onto the tool's working plane.
   const sx=(cursorPosition.x+1)*innerWidth*.5,sy=(1-cursorPosition.y)*innerHeight*.5;
   ikRay.setFromCamera(new THREE.Vector2((sx-frameRect.left)/frameRect.width*2-1,1-(sy-frameRect.top)/frameRect.height*2),camera);
   const workingPlane=new THREE.Plane(new THREE.Vector3(0,0,1),center.z-root.position.z);
   const aim=ikRay.ray.intersectPlane(workingPlane,new THREE.Vector3())?.add(center).sub(root.position)||jawTip.clone();
   // Keep the real joints above the work surface and within the illustrated workspace.
   aim.x=THREE.MathUtils.clamp(aim.x,-1.8,2.6);aim.y=THREE.MathUtils.clamp(aim.y,box.min.y+.18,1.5);aim.z=0;
   trackingTarget.copy(aim);canvas.dataset.toolTarget=aim.toArray().map(v=>v.toFixed(3)).join(',');
   const attitude=cursorToolAttitude(aim.x,aim.y);
   const follow=solveTool(aim,attitude.pitch);
   rollGoal=attitude.roll*trackingMix;
   canvas.dataset.toolAttitude=[attitude.pitch,rollGoal].map(v=>v.toFixed(3)).join(',');
   shoulderGoal=THREE.MathUtils.lerp(shoulderGoal,follow.shoulder,trackingMix);
   elbowGoal=THREE.MathUtils.lerp(elbowGoal,follow.elbow,trackingMix);
   wristGoal=THREE.MathUtils.lerp(wristGoal,follow.wrist,trackingMix);
   yawGoal=THREE.MathUtils.lerp(yawGoal,0,trackingMix);
   gripGoal=THREE.MathUtils.lerp(gripGoal,.2,trackingMix);
  }
  canvas.dataset.cursorTracking=trackingMix>.01?'active':'rest';
  canvas.dataset.cursorTarget=cursorPosition.toArray().map(v=>v.toFixed(3)).join(',');
  canvas.dataset.demonstration=chapter>=4?'joint-calibration':'assembly';
  if(!state.inspect){armShoulder=shoulderGoal;armElbow=elbowGoal;armWrist=wristGoal;grip=gripGoal;yaw=yawGoal;armRoll=rollGoal;}
  shoulderMatrix.copy(pivotMatrix(shoulderAnchor,armShoulder));forearmMatrix.copy(shoulderMatrix).multiply(pivotMatrix(elbowAnchor,armElbow));toolMatrix.copy(forearmMatrix).multiply(pivotMatrix(wristAnchor,armWrist));
  // Rotate the instrument about its own shaft. Its contact point stays on the axis,
  // so roll changes the two pincers' attitude without dragging the tip off target.
  rollMatrix.makeTranslation(wristAnchor.x,wristAnchor.y,wristAnchor.z)
   .multiply(rollRotation.makeRotationAxis(rollAxis,armRoll))
   .multiply(rollBack);
  toolMatrix.multiply(rollMatrix);
  for(const g of groups){const id=g.node.userData.assemblyGroup;let a=smooth(state.progress);
   if(!state.inspect&&chapter>=3.4){if(id==='pcb')a=Math.max(a,segment(chapter,3.4,3.9));if(id==='jaws'||id==='wrist')a=Math.max(a,segment(chapter,3.7,4.15));}
   const matrix=id==='elbow'?shoulderMatrix:['wrist','pcb'].includes(id)?forearmMatrix:['jaws','plate'].includes(id)?toolMatrix:null;
   g.node.position.copy(g.home);g.node.quaternion.copy(homeQuaternions.get(g.node)!);
   if(matrix){matrix.decompose(positionTmp,rotationTmp,scaleTmp);g.node.position.applyMatrix4(matrix);g.node.quaternion.premultiply(rotationTmp);}
   g.node.position.addScaledVector(g.explode,1-a);
  }
  sensorLinks.forEach((link,i)=>{(i===0?shoulderMatrix:forearmMatrix).decompose(link.position,link.quaternion,link.scale);});
  for(const layer of detailLayers)layer.node.position.copy(layer.home).addScaledVector(layer.offset,1-smooth(state.progress));
  ground.position.set(baseCenter.x,groundHome+.18*benchReveal+(baseAssembly?baseAssembly.node.position.y-baseAssembly.home.y:0),baseCenter.z+.04);
  for(const joint of joints){joint.rotation.copy(initialRotations.get(joint)!);if(/^(left|right)_jaw_pivot$/.test(joint.name)){const direction=/right/.test(joint.name)?-1:1;joint.rotation.z+=direction*(-.22+.26*grip);}}
  if(!state.inspect){root.rotation.y=yaw;root.rotation.z=0;}
  root.updateMatrixWorld(true);
  const held=jawTip.clone().applyMatrix4(toolMatrix).sub(center).applyAxisAngle(axisY,root.rotation.y).add(root.position);
  if(trackingMix>.99){
   const targetScreen=trackingTarget.clone().sub(center).add(root.position).project(camera),toolScreen=held.clone().project(camera);
   canvas.dataset.trackingError=Math.hypot((targetScreen.x-toolScreen.x)*frameRect.width*.5,(targetScreen.y-toolScreen.y)*frameRect.height*.5).toFixed(2);
  }
  for(const led of leds)led.emissiveIntensity=.65;
  const heartbeat=beatState(labSeconds(time));
  baseLED.emissiveIntensity=.35+(labState.active&&state.motion&&!state.inspect?.22*heartbeat.pulse:0);
  canvas.dataset.ledPulse=String(baseLED.emissiveIntensity.toFixed(3));
  if(!state.inspect){
   // Section camera targets are evaluated from live world bounds after the pose.
   const ids=['','', '', 'pcb','','','','',''];
   const view=(index:number)=>{const id=ids[index];const group=groups.find(g=>g.node.userData.assemblyGroup===id);if(!group){
    // Reserve space for the exploded envelope above/below the seated silhouette.
    // Only overview shots widen; subsystem close-ups retain their own framing.
    const spread=1-smooth(state.progress);const overviewTarget=new THREE.Vector3(0,innerWidth<=800?.8:-.05,0);
    const envelope=groups.reduce((bounds,g)=>bounds.union(boundsFor(g.node)),new THREE.Box3());
    // Keep the demonstration camera stable while joints articulate.
    if(chapter>=4){envelope.min.set(-2.15,-2.5,-1.35);envelope.max.set(2.45,2.2,1.35);}
    const framing=Math.max(spread,segment(chapter,3.8,4.15));
    if(framing>.001)overviewTarget.lerp(envelope.getCenter(new THREE.Vector3()),framing);
    const halfFov=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
    const size=envelope.getSize(new THREE.Vector3());
    const vertical=THREE.MathUtils.degToRad(camera.fov/2);
    const tightFit=Math.max(size.y/(2*Math.tan(vertical)),(size.x+size.z*.3)/(2*Math.tan(vertical)*camera.aspect))*1.2+size.z*.5;
    const fit=THREE.MathUtils.lerp(tightFit,envelope.getBoundingSphere(new THREE.Sphere()).radius/Math.sin(halfFov)*1.08,smooth(spread/.15));
    const offset=new THREE.Vector3(2.3,1.1,distance).multiplyScalar(1+.38*spread);
    if(framing>.001)offset.setLength(THREE.MathUtils.lerp(offset.length(),Math.max(offset.length(),fit),framing));
    return {target:overviewTarget,offset};
   }
    const focusObject=id==='sensors'&&sensorLinks[0].children.length?sensorLinks[0]:group.node;const bounds=boundsFor(focusObject);const focus=bounds.getCenter(new THREE.Vector3());const radius=bounds.getBoundingSphere(new THREE.Sphere()).radius;
    const halfFov=Math.min(THREE.MathUtils.degToRad(camera.fov/2),Math.atan(Math.tan(THREE.MathUtils.degToRad(camera.fov/2))*camera.aspect));
    const d=Math.max(id==='sensors'?.85:3.2,radius/Math.sin(halfFov)*1.25);return {target:focus,offset:new THREE.Vector3(id==='sensors'?.04:.25,.06,d)};};
   const lo=Math.floor(THREE.MathUtils.clamp(chapter,0,8)),hi=Math.min(8,lo+1),blend=lo===2?smooth((chapter-lo-.8)/.2):smooth(chapter-lo);const a=view(lo),b=view(hi);const goalTarget=a.target.lerp(b.target,blend);const goalCamera=goalTarget.clone().add(a.offset.lerp(b.offset,blend));
   settling=controls.target.distanceTo(goalTarget)+camera.position.distanceTo(goalCamera);controls.target.lerp(goalTarget,chapter<1?1:ease);camera.position.lerp(goalCamera,chapter<1?1:ease);
  }else if(focusTarget&&focusCamera){controls.target.lerp(focusTarget,ease);camera.position.lerp(focusCamera,ease);if(camera.position.distanceTo(focusCamera)<.005){focusTarget=null;focusCamera=null;}}
  const orbitChanged=controls.update();
  if(onNamePose&&chapter<1.9){const projected=held.clone().project(camera),r=frameRect,x=r.left+(projected.x+1)*r.width/2,y=r.top+(1-projected.y)*r.height/2;
   const sourceScreen=getNameAnchor?.(),dropScreen=getDropAnchor?.();
   const sourceError=sourceScreen?Math.hypot(x-sourceScreen.x,y-sourceScreen.y):0,dropError=dropScreen?Math.hypot(x-dropScreen.x,y-dropScreen.y):0;
   canvas.dataset.pickupPhase=phase.toFixed(4);canvas.dataset.grip=grip.toFixed(4);canvas.dataset.sourceError=sourceError.toFixed(2);canvas.dataset.dropError=dropError.toFixed(2);canvas.dataset.reachable=String(solved.reachable);
   onNamePose({homeX:homeScreen.x,homeY:homeScreen.y,x,y,angle:-(armShoulder+armElbow+armWrist)*180/Math.PI,grip:smooth((grip-.25)/.65),opacity:state.inspect?0:1-segment(chapter,1.2,1.9),phase,sourceError,dropError,reachable:solved.reachable});}

  const rect=frameRect,baseProjected=baseCenter.clone().project(camera),wanted=desired.clone().sub(center).project(camera),actual=held.clone().project(camera);
  canvas.dataset.baseScreen=[rect.left+(baseProjected.x+1)*rect.width/2,rect.top+(1-baseProjected.y)*rect.height/2].map(v=>v.toFixed(2)).join(',');
  canvas.dataset.anchorError=Math.hypot((wanted.x-actual.x)*rect.width/2,(wanted.y-actual.y)*rect.height/2).toFixed(2);
  const renderStart=performance.now();if(profiling)animationTotal+=renderStart-cpuStart;
  renderer.info.reset();renderer.setScissorTest(false);renderer.setViewport(0,0,full.width,full.height);renderer.clear();
  renderer.setViewport(vx,0,vw,full.height);renderer.setScissor(Math.max(0,vx),0,Math.min(full.width,vx+vw)-Math.max(0,vx),full.height);renderer.setScissorTest(true);
  gpuProfile.begin();renderer.render(scene,camera);gpuProfile.end();
  if(profiling){renderTotal+=performance.now()-renderStart;cpuTotal+=performance.now()-cpuStart;if(++cpuFrames===30){canvas.dataset.cpuMs=(cpuTotal/cpuFrames).toFixed(2);canvas.dataset.animationMs=(animationTotal/cpuFrames).toFixed(2);canvas.dataset.submitMs=(renderTotal/cpuFrames).toFixed(2);canvas.dataset.triangles=String(renderer.info.render.triangles);cpuTotal=0;cpuFrames=0;animationTotal=0;renderTotal=0;}}
  canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.renderMode='fixed-buffer-demand';
  const moving=state.motion&&!state.inspect&&(landing||gesture>.001||demonstration.active||trackingMix>.001||(labState.active&&heartbeat.phase<.15));
  const poseError=Math.abs(armShoulder-shoulderGoal)+Math.abs(armElbow-elbowGoal)+Math.abs(armWrist-wristGoal)+Math.abs(grip-gripGoal)+Math.abs(yaw-yawGoal);
  if(moving||(!state.inspect&&(settling>.001||poseError>.0002))||focusTarget||orbitChanged)request();
  canvas.dataset.rendering=raf?'active':'idle';
  if(!sampleStart)sampleStart=time;
  if(++sampleFrames===30){canvas.dataset.frameMs=((time-sampleStart)/29).toFixed(1);canvas.dataset.drawCalls=String(renderer.info.render.calls);canvas.dataset.grip=grip.toFixed(4);canvas.dataset.toolPosition=held.toArray().map(v=>v.toFixed(4)).join(',');canvas.dataset.pickupPhase=phase.toFixed(4);canvas.dataset.pose=[armShoulder,armElbow,yaw].map(v=>v.toFixed(4)).join(',');sampleFrames=0;sampleStart=0;}
  inFrame=false;
 }
 resize();resetView();
 // Compile the later workbench shaders before they first enter a scroll section.
 // The poster remains visible until this async preparation completes.
 const benchVisible=bench.group.visible;bench.group.visible=true;
 await renderer.compileAsync(scene,camera);bench.group.visible=benchVisible;
 request();
 return {setState(next:SceneState){const dirty=next.inspect!==state.inspect||next.motion!==state.motion||(['progress','chapter','pickup','gesture','fade','viewX','viewWidth'] as const).some(k=>Math.abs((next[k]??0)-(state[k]??0))>.00001);if(!dirty)return;const changed=next.inspect!==state.inspect;state=next;controls.enabled=next.inspect;if(changed){focusTarget=null;focusCamera=null;resize();}if(!next.inspect)selected=undefined;request();},resize,resetView,select,setVisible(value:boolean){const changed=value!==visible;visible=value;if(value&&changed)request();},dispose(){running=false;window.removeEventListener('scroll',noteScroll);gpuProfile.dispose();cancelAnimationFrame(raf);window.removeEventListener('pointermove',followPointer);document.documentElement.removeEventListener('pointerleave',leavePointer);window.removeEventListener('blur',leavePointer);guide?.removeEventListener('keydown',guideKeys);guide?.removeEventListener('click',guideStart);guide?.removeEventListener('blur',leavePointer);bench.dispose();window.removeEventListener('lab-heartbeat',wake);document.removeEventListener('visibilitychange',wake);controls.removeEventListener('change',wake);controls.dispose();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('keydown',keydown);gltf.scene.traverse(n=>{if(n instanceof THREE.Mesh){n.geometry.dispose();for(const m of Array.isArray(n.material)?n.material:[n.material])m.dispose();}});ground.geometry.dispose();ground.material.dispose();contactTexture.dispose();finishes.dispose();environment.dispose();renderer.dispose();}};
}




















