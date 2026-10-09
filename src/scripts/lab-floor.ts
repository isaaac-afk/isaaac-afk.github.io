import * as THREE from 'three';

/** Fixed CAD ground. No time, pointer, or scroll uniforms; only redraw on resize. */
export function createLabFloor(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 180);
  camera.position.set(0, 3, 8); camera.lookAt(0, 3, 0);
  const material = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, uniforms: { spacing: { value: .3 }, resolution: { value: new THREE.Vector2() } },
    vertexShader: `varying vec3 world;
      void main(){vec4 w=modelMatrix*vec4(position,1.);world=w.xyz;gl_Position=projectionMatrix*viewMatrix*w;}`,
    fragmentShader: `uniform float spacing; uniform vec2 resolution; varying vec3 world;
      void main(){vec2 cell=world.xz/spacing;vec2 delta=max(fwidth(cell),vec2(.0001));
      vec2 screen=gl_FragCoord.xy/resolution*2.-1.;
      vec2 dist=abs(fract(cell-.5)-.5)/delta;float line=1.-smoothstep(.2,1.,min(dist.x,dist.y));
      float horizon=1.-smoothstep(8.,55.,length(world.xz-vec2(0.,8.)));
      float edge=1.-smoothstep(.5,1.,abs(screen.x));float nearEdge=1.-smoothstep(.88,1.,abs(screen.y));
      gl_FragColor=vec4(vec3(.831373,.647059,.454902),.03*line*horizon*edge*nearEdge);}`
  });
  const geometry = new THREE.PlaneGeometry(180, 180);
  const floor = new THREE.Mesh(geometry, material); floor.rotation.x = -Math.PI / 2; scene.add(floor);
  // Static screen-space cross section of the overhead lamp's scattering volume.
  const lightGeometry = new THREE.PlaneGeometry(2, 2);
  const lightMaterial = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 uvScreen;void main(){uvScreen=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `varying vec2 uvScreen;void main(){vec2 p=uvScreen;
      vec2 a=vec2(.77,1.15),b=vec2(.29,.17);vec2 ab=b-a;
      float t=dot(p-a,ab)/dot(ab,ab);float d=length(p-(a+clamp(t,0.,1.)*ab));
      float width=mix(.012,.22,clamp(t,0.,1.));
      float alpha=.05*(1.-smoothstep(width*.1,width,d))*smoothstep(0.,.15,t)*(1.-smoothstep(.8,1.,t));
      gl_FragColor=vec4(1.,.985,.95,alpha);}` });
  const light = new THREE.Mesh(lightGeometry, lightMaterial); light.frustumCulled = false; light.renderOrder = 2; scene.add(light);
  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    renderer.getDrawingBufferSize(material.uniforms.resolution.value);
    // At the bottom of the frame, cell width is 40 CSS px, regardless of viewport.
    material.uniforms.spacing.value = 240 / h;
    renderer.render(scene, camera);
    canvas.dataset.renders = String(Number(canvas.dataset.renders || 0) + 1);
    // Snap ECG baseline to an actual projected cross-grid line near 73% height.
    const spacing = material.uniforms.spacing.value, distance = 3 / (.46 * Math.tan(Math.PI / 8));
    const z = Math.round((8 - distance) / spacing) * spacing;
    return new THREE.Vector3(0, 0, z).project(camera).y * -h / 2 + h / 2;
  }
  return { resize, dispose() { geometry.dispose(); material.dispose(); lightGeometry.dispose(); lightMaterial.dispose(); renderer.dispose(); } };
}
