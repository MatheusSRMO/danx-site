"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { ContactShadows, Environment, Lightformer } from "@react-three/drei";
import StationModel from "./StationModel";
import type { StationState } from "./stationState";

/** Luz de estúdio: softboxes que desenham reflexos longos no vidro preto (sem HDR externo). */
function Studio() {
  return (
    <Environment resolution={512} frames={1} environmentIntensity={1.15}>
      {/* Estúdio de tom médio: o vidro fica grafite e o alumínio mostra a cor, como no render oficial */}
      <color attach="background" args={["#3b3f46"]} />
      <Lightformer intensity={2.6} rotation-x={Math.PI / 2} position={[0, 5, 0.5]} scale={[7, 5, 1]} />
      <Lightformer intensity={3.2} rotation-y={Math.PI / 2} position={[-3.5, 1.4, 2]} scale={[0.8, 8, 1]} />
      <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-3.5, 1.4, -1.2]} scale={[0.5, 8, 1]} />
      <Lightformer intensity={2.4} rotation-y={-Math.PI / 2} position={[3.5, 1.4, 1.5]} scale={[0.8, 8, 1]} />
      <Lightformer intensity={0.9} position={[0, 1.4, 6]} scale={[10, 2.5, 1]} />
      <Lightformer intensity={1.4} rotation-x={-Math.PI / 2} position={[0, -3, 0]} scale={[8, 8, 1]} color="#eef0f3" />
    </Environment>
  );
}

function Rig({ state }: { state: StationState }) {
  const { camera, size } = useThree();
  const tgt = useMemo(() => new THREE.Vector3(), []);
  const pos = useMemo(() => new THREE.Vector3(0, 1.1, 8), []);
  useFrame((_, dt) => {
    const narrow = size.width / size.height < 0.8;
    const dist = state.camDist * (narrow ? 1.25 : 1);
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
      <Studio />
      <ambientLight intensity={0.25} />
      <Rig state={state} />
      <group position={[0, 0, -0.35]}>
        <StationModel state={state} low={low} />
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
