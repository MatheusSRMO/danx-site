"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Reflector } from "three/addons/objects/Reflector.js";
import { roundedOutline } from "./stationGeometry";
import { reflectionGuard } from "./reflectionGuard";
import type { StationState } from "./stationState";

/**
 * Reflexo planar da plataforma no vidro preto da torre (só no modo completo): no original, os eletrodos e o vidro da
 * base aparecem espelhados na parte de baixo do vidro. O espelho cobre só a faixa de baixo do vidro, onde a plataforma
 * pode aparecer, e some para cima. Ligado ao grupo da torre: a captura mostra só a base (sem torre nem dossel).
 */
export default function StationTowerReflection({
  state, width, height, radius, y, z, strength = 0.55,
}: { state: StationState; width: number; height: number; radius: number; y: number; z: number; strength?: number }) {
  // Resolução do espelho: metade dos pixels da tela, até 512 px (reflexo de vidro brilhante tolera leve desfoque; é recapturado a cada quadro em que a câmera anda)
  const size = useThree((st) => st.size), dpr = useThree((st) => st.viewport.dpr);
  const tw = THREE.MathUtils.clamp(Math.round((size.width * dpr) / 2), 128, 512);
  const th = THREE.MathUtils.clamp(Math.round((size.height * dpr) / 2), 128, 512);
  const mirror = useMemo(() => {
    const geometry = new THREE.ShapeGeometry(roundedOutline(width, height, radius), 12);
    const mirror = new Reflector(geometry, {
      textureWidth: tw, textureHeight: th, multisample: 2, clipBias: 0.0001,
      shader: {
        uniforms: { tDiffuse: { value: null }, textureMatrix: { value: null }, color: { value: null }, strength: { value: strength }, span: { value: height } },
        vertexShader: `
          uniform mat4 textureMatrix;
          varying vec4 reflectionUv;
          varying vec3 surfacePosition;
          varying vec3 surfaceNormal;
          varying float localY;
          void main() {
            reflectionUv = textureMatrix * vec4(position, 1.0);
            surfacePosition = (modelMatrix * vec4(position, 1.0)).xyz;
            surfaceNormal = normalize(mat3(modelMatrix) * normal);
            localY = position.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D tDiffuse;
          uniform float strength;
          uniform float span;
          varying vec4 reflectionUv;
          varying vec3 surfacePosition;
          varying vec3 surfaceNormal;
          varying float localY;
          void main() {
            vec4 reflected = texture2DProj(tDiffuse, reflectionUv);
            float facing = clamp(dot(normalize(cameraPosition - surfacePosition), normalize(surfaceNormal)), 0.0, 1.0);
            float fresnel = 0.6 + 0.4 * pow(1.0 - facing, 3.0);
            // A faixa cobre só o pé do vidro: some em direção ao topo do espelho
            float h = (localY + span * 0.5) / span;
            float fade = 1.0 - smoothstep(0.35, 0.95, h);
            gl_FragColor = vec4(reflected.rgb * strength, reflected.a * fresnel * fade);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      },
    });
    const material = mirror.material as THREE.ShaderMaterial;
    material.transparent = true;
    material.depthWrite = false;
    mirror.name = "tower-glass-reflection";
    mirror.position.set(0, y, z);

    const renderReflection = mirror.onBeforeRender;
    const cameraMatrix = new THREE.Matrix4(), projection = new THREE.Matrix4();
    const rootMatrix = new THREE.Matrix4(), towerMatrix = new THREE.Matrix4();
    const clearColor = new THREE.Color();
    let valid = false, glow = -1;
    mirror.onBeforeRender = (renderer, scene, camera, geometry, material, group) => {
      // A silhueta usa o material substituto da bancada; não precisa de captura. Também não captura dentro de outro espelho.
      if (scene.overrideMaterial || reflectionGuard.busy) return;
      const tower = mirror.parent, root = tower?.parent;
      if (!tower || !root) return;
      const canopy = root.children[2];
      const steel = (root.children[0] as THREE.Group).children.find((c) => c.name === "electrode-0") as THREE.Mesh | undefined;
      const glowNow = steel ? ((steel.material as THREE.MeshPhysicalMaterial).emissiveIntensity ?? 0) : 0;
      if (valid && glowNow === glow && cameraMatrix.equals(camera.matrixWorld) && projection.equals(camera.projectionMatrix)
        && rootMatrix.equals(root.matrixWorld) && towerMatrix.equals(tower.matrixWorld)) return;

      const background = scene.background, alpha = renderer.getClearAlpha();
      renderer.getClearColor(clearColor);
      const towerVisible = tower.visible, canopyVisible = canopy.visible;
      reflectionGuard.busy = true;
      try {
        // A captura contém só a plataforma; fundo transparente conserva o ambiente PBR.
        tower.visible = false;
        canopy.visible = false;
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
        renderReflection.call(mirror, renderer, scene, camera, geometry, material, group);
      } finally {
        reflectionGuard.busy = false;
        tower.visible = towerVisible;
        canopy.visible = canopyVisible;
        scene.background = background;
        renderer.setClearColor(clearColor, alpha);
      }
      cameraMatrix.copy(camera.matrixWorld); projection.copy(camera.projectionMatrix);
      rootMatrix.copy(root.matrixWorld); towerMatrix.copy(tower.matrixWorld);
      glow = glowNow;
      valid = true;
    };
    return mirror;
  }, [state, width, height, radius, y, z, strength, tw, th]);

  useEffect(() => () => {
    mirror.dispose();
    mirror.geometry.dispose();
  }, [mirror]);
  return <primitive object={mirror} />;
}
