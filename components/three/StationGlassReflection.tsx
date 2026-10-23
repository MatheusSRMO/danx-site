"use client";
import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { roundedOutline } from "./stationGeometry";
import type { StationState } from "./stationState";

/** Reflexo local no vidro, sem fotografia ou iluminação incorporada à textura. */
export default function StationGlassReflection({ state }: { state: StationState }) {
  const reflection = useMemo(() => {
    const geometry = new THREE.ShapeGeometry(roundedOutline(0.3986, 0.4336, 0.0263), 12);
    const mirror = new Reflector(geometry, {
      textureWidth: 256, textureHeight: 256, multisample: 0, clipBias: 0.0001,
      shader: {
        uniforms: { tDiffuse: { value: null }, textureMatrix: { value: null }, color: { value: null } },
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
          varying vec4 reflectionUv;
          varying vec3 surfacePosition;
          varying vec3 surfaceNormal;
          void main() {
            vec4 reflected = texture2DProj(tDiffuse, reflectionUv);
            float facing = clamp(dot(normalize(cameraPosition - surfacePosition), normalize(surfaceNormal)), 0.0, 1.0);
            float fresnel = 0.38 + 0.62 * pow(1.0 - facing, 5.0);
            gl_FragColor = vec4(reflected.rgb, reflected.a * fresnel);
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
    mirror.position.set(0, 0.0751, 0.47);

    const renderReflection = mirror.onBeforeRender;
    const cameraMatrix = new THREE.Matrix4(), projection = new THREE.Matrix4();
    const rootMatrix = new THREE.Matrix4(), towerMatrix = new THREE.Matrix4(), canopyMatrix = new THREE.Matrix4();
    const clearColor = new THREE.Color();
    let valid = false, screen = -1;
    mirror.onBeforeRender = (renderer, scene, camera, ...args) => {
      // A silhueta usa o material substituto da bancada; não precisa de captura.
      if (scene.overrideMaterial) return;
      const base = mirror.parent, root = base?.parent;
      if (!base || !root) return;
      const tower = root.children[1], canopy = root.children[2];
      if (valid && state.ultraSmooth < 0.01 && screen === state.screen
        && cameraMatrix.equals(camera.matrixWorld) && projection.equals(camera.projectionMatrix)
        && rootMatrix.equals(root.matrixWorld) && towerMatrix.equals(tower.matrixWorld)
        && canopyMatrix.equals(canopy.matrixWorld)) return;

      const background = scene.background, alpha = renderer.getClearAlpha();
      renderer.getClearColor(clearColor);
      const wasVisible = base.visible;
      try {
        // A captura contém só a geometria acima do vidro; fundo transparente conserva o ambiente PBR.
        base.visible = false;
        scene.background = null;
        renderer.setClearColor(0x000000, 0);
        renderReflection.call(mirror, renderer, scene, camera, ...args);
      } finally {
        base.visible = wasVisible;
        scene.background = background;
        renderer.setClearColor(clearColor, alpha);
      }
      cameraMatrix.copy(camera.matrixWorld); projection.copy(camera.projectionMatrix);
      rootMatrix.copy(root.matrixWorld); towerMatrix.copy(tower.matrixWorld); canopyMatrix.copy(canopy.matrixWorld);
      screen = state.screen;
      valid = true;
    };
    return mirror;
  }, [state]);

  useEffect(() => () => {
    reflection.dispose();
    reflection.geometry.dispose();
  }, [reflection]);
  return <primitive object={reflection} />;
}
