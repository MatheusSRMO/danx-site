"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Reflector } from "three/addons/objects/Reflector.js";
import { roundedOutline } from "./stationGeometry";
import { reflectionGuard } from "./reflectionGuard";
import type { StationState } from "./stationState";

export type MirrorRegion = {
  w: number; d: number; r: number; cz: number;
  /** Furo no espelho (o bolsão do vidro, quando o espelho cobre o tampo). */
  hole?: { w: number; d: number; r: number; cz: number };
};

/** Contorno (x, z do mundo) para o plano do espelho: o eixo y local da forma vira -z depois da rotação. */
function placedPath(w: number, d: number, r: number, cz: number) {
  return roundedOutline(w, d, r).getPoints(12).map((p) => new THREE.Vector2(p.x, p.y - cz));
}

const DEFAULT_REGION: MirrorRegion = { w: 0.3986, d: 0.4336, r: 0.0263, cz: 0.47 };

/**
 * Reflexo local de torre e dossel numa superfície horizontal brilhante da bandeja (o vidro dos eletrodos ou o tampo
 * bronze), sem fotografia ou iluminação incorporada à textura. Cada região tem sua altura e intensidade.
 */
export default function StationGlassReflection({
  state, y = 0.0685, region = DEFAULT_REGION, strength = 0.4, opacity = 0.85, hide,
}: {
  state: StationState; y?: number; region?: MirrorRegion; strength?: number; opacity?: number;
  /** Nomes de objetos que somem só na captura deste espelho (continuam visíveis na cena): ex.: o logotipo do vidro. */
  hide?: readonly string[];
}) {
  // Resolução do espelho: metade dos pixels da tela, até 512 px (reflexo de vidro brilhante tolera leve desfoque; é recapturado a cada quadro em que a câmera anda)
  const size = useThree((st) => st.size), dpr = useThree((st) => st.viewport.dpr);
  const tw = THREE.MathUtils.clamp(Math.round((size.width * dpr) / 2), 128, 512);
  const th = THREE.MathUtils.clamp(Math.round((size.height * dpr) / 2), 128, 512);
  const reflection = useMemo(() => {
    const shape = new THREE.Shape(placedPath(region.w, region.d, region.r, region.cz));
    if (region.hole) shape.holes.push(new THREE.Path(placedPath(region.hole.w, region.hole.d, region.hole.r, region.hole.cz)));
    const geometry = new THREE.ShapeGeometry(shape, 12);
    const mirror = new Reflector(geometry, {
      textureWidth: tw, textureHeight: th, multisample: 2, clipBias: 0.0001,
      shader: {
        uniforms: { tDiffuse: { value: null }, textureMatrix: { value: null }, color: { value: null }, strength: { value: strength }, opacity: { value: opacity } },
        vertexShader: `
          uniform mat4 textureMatrix;
          varying vec4 reflectionUv;
          varying vec3 surfacePosition;
          varying vec3 surfaceNormal;
          void main() {
            reflectionUv = textureMatrix * vec4(position, 1.0);
            surfacePosition = (modelMatrix * vec4(position, 1.0)).xyz;
            surfaceNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float strength;
          uniform float opacity;
          varying vec4 reflectionUv;
          varying vec3 surfacePosition;
          varying vec3 surfaceNormal;
          void main() {
            vec4 reflected = texture2DProj(tDiffuse, reflectionUv);
            float facing = clamp(dot(normalize(cameraPosition - surfacePosition), normalize(surfaceNormal)), 0.0, 1.0);
            float fresnel = opacity + (1.0 - opacity) * pow(1.0 - facing, 5.0);
            gl_FragColor = vec4(reflected.rgb * strength, reflected.a * fresnel);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      },
    });
    const material = mirror.material as THREE.ShaderMaterial;
    material.transparent = true;
    material.depthWrite = false;
    mirror.name = "electrode-glass-reflection";
    mirror.rotation.x = -Math.PI / 2;
    mirror.position.set(0, y, 0);

    const renderReflection = mirror.onBeforeRender;
    const cameraMatrix = new THREE.Matrix4(), projection = new THREE.Matrix4();
    const rootMatrix = new THREE.Matrix4(), towerMatrix = new THREE.Matrix4(), canopyMatrix = new THREE.Matrix4();
    const clearColor = new THREE.Color();
    const waveMatrices = Array.from({ length: 5 }, () => new THREE.Matrix4());
    const waveOpacities = new Float64Array(5);
    let valid = false, screen = -1, wavesVisible = false, screenVersion = -1;
    let screenTexture: THREE.Texture | null = null;
    let hidden: THREE.Object3D[] | null = null;
    mirror.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      // A silhueta usa o material substituto da bancada; não precisa de captura.
      if (scene.overrideMaterial || reflectionGuard.busy) return;
      const base = mirror.parent, root = base?.parent;
      if (!base || !root) return;
      const tower = root.children[1], canopy = root.children[2];
      const screenMap = (tower.children[2] as THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>).material.map;
      const waves = canopy.children[canopy.children.length - 1];
      let wavesChanged = wavesVisible !== waves.visible;
      if (waves.visible && !wavesChanged) {
        for (let i = 0; i < waves.children.length; i++) {
          const wave = waves.children[i] as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
          if (!waveMatrices[i].equals(wave.matrixWorld) || waveOpacities[i] !== wave.material.opacity) {
            wavesChanged = true;
            break;
          }
        }
      }
      if (valid && !wavesChanged && screen === state.screen
        && screenTexture === screenMap && screenVersion === (screenMap?.version ?? -1)
        && cameraMatrix.equals(camera.matrixWorld) && projection.equals(camera.projectionMatrix)
        && rootMatrix.equals(root.matrixWorld) && towerMatrix.equals(tower.matrixWorld)
        && canopyMatrix.equals(canopy.matrixWorld)) return;

      const background = scene.background, alpha = renderer.getClearAlpha();
      renderer.getClearColor(clearColor);
      const wasVisible = base.visible;
      if (hide?.length && !hidden) hidden = hide.map((n) => root.getObjectByName(n)).filter((o): o is THREE.Object3D => !!o);
      const hiddenWas = hidden ? hidden.map((o) => o.visible) : null;
      reflectionGuard.busy = true;
      try {
        // A captura contém só a geometria acima do vidro; fundo transparente conserva o ambiente PBR.
        base.visible = false;
        if (hidden) for (const o of hidden) o.visible = false;
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
        renderReflection.call(mirror, renderer, scene, camera, geometry, material, group);
      } finally {
        reflectionGuard.busy = false;
        base.visible = wasVisible;
        if (hidden && hiddenWas) for (let i = 0; i < hidden.length; i++) hidden[i].visible = hiddenWas[i];
        scene.background = background;
        renderer.setClearColor(clearColor, alpha);
      }
      cameraMatrix.copy(camera.matrixWorld); projection.copy(camera.projectionMatrix);
      rootMatrix.copy(root.matrixWorld); towerMatrix.copy(tower.matrixWorld); canopyMatrix.copy(canopy.matrixWorld);
      screen = state.screen;
      screenTexture = screenMap;
      screenVersion = screenMap?.version ?? -1;
      wavesVisible = waves.visible;
      if (wavesVisible) {
        for (let i = 0; i < waves.children.length; i++) {
          const wave = waves.children[i] as THREE.Mesh<THREE.RingGeometry, THREE.MeshBasicMaterial>;
          waveMatrices[i].copy(wave.matrixWorld);
          waveOpacities[i] = wave.material.opacity;
        }
      }
      valid = true;
    };
    return mirror;
  }, [state, y, region, strength, opacity, hide, tw, th]);

  useEffect(() => () => {
    reflection.dispose();
    reflection.geometry.dispose();
  }, [reflection]);
  return <primitive object={reflection} />;
}
