"use client";
import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows } from "@react-three/drei";
import StationModel from "./StationModel";
import Child from "./Child";
import StationStudio from "./StationStudio";
import type { StationState } from "./stationState";

function Rig({ state }: { state: StationState }) {
  const { camera, size } = useThree();
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(0, 1.1, 8), []);
  useFrame((_, dt) => {
    const aspect = size.width / size.height;
    const narrow = aspect < 0.8;
    // Cenas largas (ex.: a criança a 2,5 m da torre) precisam caber na largura útil do quadro, descontado o texto
    const cam0 = camera as THREE.PerspectiveCamera;
    const usable = aspect * (1 - 2 * Math.abs(state.viewX));
    // (só no layout de celular, em que o texto fica embaixo e o quadro é estreito)
    const fit = state.span && size.width <= 900 ? state.span / 2 / (Math.tan(((cam0.fov * Math.PI) / 180) / 2) * usable) + 1.2 : 0;
    const dist = Math.max(state.camDist * (narrow ? 1.25 : 1), fit);
    const k = 1 - Math.pow(0.001, dt);
    pos.lerp(tgt.set(state.camX + state.pointerX * 0.25, state.camY + state.camElev, dist), k);
    camera.position.copy(pos);
    camera.lookAt(state.camX, state.camY, 0.3);
    const cam = camera as THREE.PerspectiveCamera;
    if (Math.abs(cam.fov - state.fov) > 0.01) {
      cam.fov += (state.fov - cam.fov) * k;
      cam.updateProjectionMatrix();
    }
    if (state.viewX || state.viewY) {
      cam.setViewOffset(
        size.width,
        size.height,
        -size.width * state.viewX,
        size.height * state.viewY,
        size.width,
        size.height,
      );
    } else if (cam.view) {
      cam.clearViewOffset();
    }
  });
  return null;
}

/** Só em desenvolvimento: expõe cena e câmera para os testes de enquadramento (sobreposição com o texto). */
function DevHook() {
  const { scene, camera, gl } = useThree();
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    (window as unknown as { __r3f?: unknown }).__r3f = { scene, camera, gl };
  }, [scene, camera, gl]);
  return null;
}

export default function StationCanvas({
  state,
  active = true,
  low = false,
  shadowFrames = Infinity,
  children,
}: {
  state: StationState;
  active?: boolean;
  low?: boolean;
  shadowFrames?: number;
  children?: React.ReactNode;
}) {
  return (
    <Canvas
      dpr={low ? [1, 1.25] : [1, 2]}
      frameloop={active ? "always" : "never"}
      camera={{ fov: 20, near: 0.1, far: 50, position: [0, 1.2, 8] }}
      gl={{
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.05,
      }}
      aria-hidden="true"
    >
      {/* Mesmo estúdio do render oficial em 3/4 (fundo branco), como na bancada de fidelidade */}
      <StationStudio variant="light" />
      <ambientLight intensity={0.25} />
      <Rig state={state} />
      <DevHook />
      <group position={[0, 0, -0.35]}>
        <StationModel state={state} low={low} />
        {/* A criança carrega o próprio arquivo; a estação aparece antes, sem esperar por ela */}
        <Suspense fallback={null}>
          <Child state={state} />
        </Suspense>
        <ContactShadows
          position={[0, 0.0005, 0.35]}
          scale={3.2}
          blur={2.6}
          far={1.6}
          opacity={0.55}
          resolution={low ? 256 : 512}
          frames={shadowFrames}
          color="#1b2230"
        />
      </group>
      {children}
    </Canvas>
  );
}
