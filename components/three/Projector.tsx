"use client";
import { useMemo } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import type { StationState } from "./stationState";

export type Anchor = { id: string; pos: [number, number, number]; module: "base" | "tower" | "canopy" };

// Deve espelhar as transformações do StationModel e do StationCanvas.
const MODEL_Z = -0.35;
const OFFSET = { base: 0, tower: 0.2, canopy: 0.52 };

/** Projeta pontos do modelo para a tela e posiciona os rótulos HTML sobre eles. */
export default function Projector({
  state,
  anchors,
  nodes,
}: {
  state: StationState;
  anchors: Anchor[];
  nodes: React.RefObject<Record<string, HTMLElement | null>>;
}) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  const axis = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  useFrame(() => {
    const e = state.explodeSmooth;
    anchors.forEach((a) => {
      const el = nodes.current?.[a.id];
      if (!el) return;
      v.set(a.pos[0], a.pos[1] + OFFSET[a.module] * e, a.pos[2]);
      v.applyAxisAngle(axis, state.rotSmooth);
      v.y += state.lift;
      v.z += MODEL_Z;
      v.project(camera);
      const x = (v.x * 0.5 + 0.5) * size.width;
      const y = (-v.y * 0.5 + 0.5) * size.height;
      el.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
    });
  });
  return null;
}
