import * as THREE from 'three';

/** Reusable, very fine surface finishes; geometry and lighting supply the detail. */
export function createMaterialFinisher(renderer: THREE.WebGLRenderer) {
  const textures: THREE.DataTexture[] = [];
  const originals = new Set<THREE.MeshStandardMaterial>();
  const cache = new Map<THREE.MeshStandardMaterial, Map<boolean, THREE.MeshPhysicalMaterial>>();
  const anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  function finishTexture(brushed: boolean, normal: boolean) {
    const size = 128;
    const data = new Uint8Array(size * size * 4);
    // A seeded periodic field avoids seams, sparkly noise, and runtime randomness.
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const u = x / size * Math.PI * 2;
        const v = y / size * Math.PI * 2;
        const grain = brushed
          ? Math.sin(v * 31 + .3 * Math.sin(u * 2)) * .55 + Math.sin(v * 47) * .25
          : Math.sin(u * 19) * Math.cos(v * 23) * .5 + Math.sin(u * 37 + v * 29) * .25;
        const i = (y * size + x) * 4;
        if (normal) {
          // Tangent-space neutral is (128,128,255); metal grain runs along U.
          data[i] = 128 + Math.round((brushed ? .4 : 3) * Math.sin(u * 19 + v * 13));
          data[i + 1] = 128 + Math.round(grain * 8);
          data[i + 2] = 255;
        } else {
          data[i] = 255;
          data[i + 1] = Math.round(245 + grain * 9); // Roughness occupies G only.
          data[i + 2] = 255; // Neutral metalness if sampled by a shared shader.
        }
        data[i + 3] = 255;
      }
    }
    const texture = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    texture.name = `${brushed ? 'Brushed' : 'Moulded'} ${normal ? 'normal' : 'roughness'}`;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(brushed ? 3 : 7, brushed ? 5 : 7);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.generateMipmaps = true;
    texture.anisotropy = anisotropy;
    texture.colorSpace = THREE.NoColorSpace;
    texture.needsUpdate = true;
    textures.push(texture);
    return texture;
  }
  const brushedNormal = finishTexture(true, true);
  const brushedRoughness = finishTexture(true, false);
  const mouldedNormal = finishTexture(false, true);
  const mouldedRoughness = finishTexture(false, false);

  function convert(source: THREE.MeshStandardMaterial, uv: boolean) {
    let variants = cache.get(source);
    if (!variants) { variants = new Map(); cache.set(source, variants); }
    const existing = variants.get(uv);
    if (existing) return existing;
    const material = new THREE.MeshPhysicalMaterial();
    // PhysicalMaterial.copy expects physical-only properties on its source.
    // Copy the standard base safely, preserving glTF maps, alpha, and normal scale.
    if (source instanceof THREE.MeshPhysicalMaterial) material.copy(source);
    else THREE.MeshStandardMaterial.prototype.copy.call(material, source);
    originals.add(source);
    const name = source.name.toLowerCase();
    let metal = false;
    let moulded = false;
    if (/alumin|machin|silver|steel|titanium|bearing|chrome/.test(name)) {
      metal = true;
      material.metalness = Math.max(.88, source.metalness);
      material.roughness = THREE.MathUtils.clamp(source.roughness, /polished|chrome/.test(name) ? .14 : .23, .36);
      material.clearcoat = .08;
      material.clearcoatRoughness = .3;
      material.envMapIntensity = 1.15;
      // Broad anisotropic response stays subtle; the texture adds finer brushing.
      if (uv) material.anisotropy = .22;
    } else if (/copper|brass|gold/.test(name)) {
      metal = true;
      material.metalness = .92;
      material.roughness = .27;
      material.envMapIntensity = .82;
      if (uv) material.anisotropy = .14;
    } else if (/polymer|ceramic|white|shell/.test(name)) {
      moulded = true;
      // Muted matte off-white body; joints, PCB and copper keep the warm accents.
      material.color.setHex(0xe8e6e0);
      material.metalness = .15;
      material.roughness = .55;
      material.clearcoat = 0;
      material.clearcoatRoughness = .25;
      material.ior = 1.46;
      material.envMapIntensity = .8;
    } else if (/pcb|soldermask/.test(name)) {
      moulded = true;
      material.color.setHex(0x285c51);
      material.metalness = .05;
      material.roughness = .38;
      material.clearcoat = .32;
      material.clearcoatRoughness = .25;
    } else if (/anodized|chassis/.test(name)) {
      metal = true;
      material.metalness = Math.max(.65, source.metalness);
      material.roughness = THREE.MathUtils.clamp(source.roughness, .28, .4);
      material.clearcoat = .08;
      material.clearcoatRoughness = .34;
      material.envMapIntensity = .75;
    } else if (/graphite|seal|rubber|package|cable/.test(name)) {
      moulded = true;
      material.metalness = .02;
      material.roughness = /seal|rubber|cable/.test(name) ? .57 : .45;
      material.clearcoat = 0;
      material.envMapIntensity = .55;
    }
    if (/led|signal|indicator/.test(name)) {material.color.setHex(0xd4a574);material.emissive.setHex(0xd4a574);material.emissiveIntensity=1.3;}
    if (uv && (metal || moulded)) {
      if (!material.normalMap) {
        material.normalMap = metal ? brushedNormal : mouldedNormal;
        material.normalScale.setScalar(metal ? .22 : .12);
      }
      if (!material.roughnessMap) material.roughnessMap = metal ? brushedRoughness : mouldedRoughness;
    }
    material.needsUpdate = true;
    variants.set(uv, material);
    return material;
  }

  return {
    apply(root: THREE.Object3D) {
      root.traverse(node => {
        if (!(node instanceof THREE.Mesh)) return;
        const uv = !!node.geometry.getAttribute('uv');
        const finish = (material: THREE.Material) => material instanceof THREE.MeshStandardMaterial
          ? convert(material, uv) : material;
        node.material = Array.isArray(node.material) ? node.material.map(finish) : finish(node.material);
      });
    },
    dispose() {
      for (const texture of textures) texture.dispose();
      for (const material of originals) material.dispose();
      for (const variants of cache.values()) for (const material of variants.values()) material.dispose();
      cache.clear();
      originals.clear();
    },
  };
}

