"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import {
  canopyBarGeometry,
  electrodeGeometry,
  fairingGeometry,
  slabGeometry,
  towerBodyGeometry,
} from "./stationGeometry";
import { drawScreen, SCREEN_COUNT } from "./screenUi";
import type { StationState } from "./stationState";

// Modelo fiel à estação real (metros; y para cima, frente em +z, torre ao fundo).
// Medidas: 2,10 m de altura · base 0,48 × 0,935 m · tela nominal de 32″ na vertical.
// A área visível da tela segue o render CAD (mais estreita que a proporção nominal 16:9).
// Formas e acabamentos ajustados pelas referências oficiais e pelas avaliações em .fidelity/LOG.md.

const BASE = { w: 0.48, d: 0.935, h: 0.07, z0: -0.21, radius: 0.038 };
const TOWER = { y0: 0.13, y1: 1.769, w: 0.432, bodyW: 0.417, step: 0.745, screenMargin: 0.038 };
const SCREEN = { w: 0.36, h: 0.708 };
const CANOPY = {
  x: 0.201, z: -0.005, diameter: 0.036,
  rise: 1.982, top: 2.082, r: 0.1, pitch: 0.015,
  plateZ0: 0.373, plateZ1: 0.509, w: 0.44, plateH: 0.036,
  sensorZ: 0.466, sensorY: 2.0605,
};
// A placa acompanha a pequena queda do trecho reto; o ponto mais alto continua no cotovelo.
const PLATE_ANGLE = Math.atan(CANOPY.pitch);
const PLATE_Z = (CANOPY.plateZ0 + CANOPY.plateZ1) / 2;
const BEND_Z = CANOPY.z + CANOPY.r * (1 + Math.sin(PLATE_ANGLE));
const BEND_Y = CANOPY.rise + CANOPY.r * Math.cos(PLATE_ANGLE);
const plateHeightAt = (z: number) => BEND_Y - (z - BEND_Z) * CANOPY.pitch + CANOPY.diameter / (2 * Math.cos(PLATE_ANGLE));
const PLATE_Y = plateHeightAt(PLATE_Z);
// Face inferior do sensor: usada também como origem das ondas, em coordenadas do dossel.
CANOPY.sensorY = plateHeightAt(CANOPY.sensorZ) - (CANOPY.plateH + 0.0035) / Math.cos(PLATE_ANGLE);

export const PAD_POSITIONS: [number, number, number, number][] = [
  // x, z, largura (x), comprimento (z): para cada pé, dedos (maior, perto da torre) e calcanhar
  [-0.085, 0.385, 0.086, 0.16],
  [0.085, 0.385, 0.086, 0.16],
  [-0.085, 0.535, 0.086, 0.08],
  [0.085, 0.535, 0.086, 0.08],
];

function useMaterials() {
  return useMemo(
    () => ({
      glass: new THREE.MeshPhysicalMaterial({
        color: "#3b4348",
        metalness: 0,
        roughness: 0.27,
        envMapIntensity: 0.35,
        clearcoat: 0.45,
        clearcoatRoughness: 0.16,
      }),
      body: new THREE.MeshPhysicalMaterial({
        color: "#4d6375",
        metalness: 0.3,
        roughness: 0.46,
        clearcoat: 0.2,
        clearcoatRoughness: 0.5,
      }),
      towerBody: new THREE.MeshPhysicalMaterial({
        color: "#6c8598",
        metalness: 0.3,
        roughness: 0.4,
        clearcoat: 0.2,
        clearcoatRoughness: 0.5,
      }),
      top: new THREE.MeshPhysicalMaterial({ color: "#4b4944", metalness: 0.4, roughness: 0.32 }),
      wedge: new THREE.MeshPhysicalMaterial({ color: "#35312d", metalness: 0.45, roughness: 0.4 }),
      padGlass: new THREE.MeshPhysicalMaterial({
        color: "#9fa5a4",
        metalness: 0,
        roughness: 0.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.12,
      }),
      steel: new THREE.MeshPhysicalMaterial({
        color: "#f4f4ef",
        metalness: 0.35,
        envMapIntensity: 1.2,
        roughness: 0.32,
        emissive: new THREE.Color("#2ec2c6"),
        emissiveIntensity: 0,
      }),
      canopy: new THREE.MeshPhysicalMaterial({
        color: "#3e4142",
        metalness: 0.4,
        roughness: 0.38,
        clearcoat: 0.3,
        clearcoatRoughness: 0.24,
      }),
      sensor: new THREE.MeshStandardMaterial({ color: "#0d0e10", metalness: 0.3, roughness: 0.55 }),
    }),
    [],
  );
}

/** Ondas do ultrassom: anéis que descem do sensor do dossel, discretos, sem neon. */
function Ultrasound({ state }: { state: StationState }) {
  const group = useRef<THREE.Group>(null);
  const rings = useMemo(() => Array.from({ length: 5 }, (_, i) => i / 5), []);
  const mats = useMemo(
    () =>
      rings.map(
        () =>
          new THREE.MeshBasicMaterial({
            color: "#2f7de1",
            transparent: true,
            opacity: 0,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
      ),
    [rings],
  );
  useFrame((st) => {
    const w = state.ultraSmooth;
    const g = group.current!;
    g.visible = w > 0.01;
    if (!g.visible) return;
    const t = st.clock.elapsedTime;
    for (let i = 0; i < g.children.length; i++) {
      const c = g.children[i];
      const ph = (t * 0.45 + rings[i]) % 1;
      c.position.y = THREE.MathUtils.lerp(CANOPY.sensorY, 1.05, ph);
      const r = 0.03 + ph * 0.24;
      c.scale.set(r, r, r);
      mats[i].opacity = w * Math.sin(ph * Math.PI) * 0.55;
    }
  });
  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, CANOPY.sensorY, CANOPY.sensorZ]} material={mats[i]}>
          <ringGeometry args={[0.9, 1, 64]} />
        </mesh>
      ))}
    </group>
  );
}

export default function StationModel({ state: station }: { state: StationState }) {
  const m = useMaterials();
  const root = useRef<THREE.Group>(null);
  const canopy = useRef<THREE.Group>(null);
  const tower = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);

  const geometry = useMemo(() => ({
    base: slabGeometry(BASE.w, BASE.d, BASE.radius, BASE.h, 0.003),
    top: slabGeometry(BASE.w - 0.002, BASE.d - 0.002, BASE.radius - 0.001, 0.003, 0.0008),
    fairing: fairingGeometry(BASE.h + 0.001, TOWER.bodyW),
    padGlass: slabGeometry(0.4, 0.435, 0.027, 0.004, 0.0007),
    pads: PAD_POSITIONS.map(([, , w, d], i) => electrodeGeometry(w, d, i >= 2)),
    body: towerBodyGeometry(TOWER.bodyW, TOWER.y0 - 0.012, TOWER.y1, TOWER.step),
    // Do plano x/z para a fachada x/y, com a espessura do vidro para trás.
    glass: slabGeometry(TOWER.w, TOWER.y1 - TOWER.y0, 0.018, 0.01, 0.0015).rotateX(Math.PI / 2),
    bars: [-1, 1].map((side) => canopyBarGeometry(side, CANOPY, TOWER.y1)),
    cap: slabGeometry(CANOPY.w, CANOPY.plateZ1 - CANOPY.plateZ0, 0.018, CANOPY.plateH, 0.002),
    underside: slabGeometry(CANOPY.w - 0.022, CANOPY.plateZ1 - CANOPY.plateZ0 - 0.018, 0.012, 0.002, 0.0005),
  }), []);
  const fairingMaterials = useMemo(() => [m.wedge, m.body], [m]);

  // Telas (geradas após a fonte carregar, para o texto sair certo)
  const screens = useRef<THREE.CanvasTexture[]>([]);
  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => {
      if (!alive) return;
      screens.current = Array.from({ length: SCREEN_COUNT }, (_, i) => {
        const t = new THREE.CanvasTexture(drawScreen(i));
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 8;
        return t;
      });
      if (screenMat.current) {
        screenMat.current.map = screens.current[station.screen] ?? screens.current[0];
        screenMat.current.needsUpdate = true;
      }
    });
    return () => {
      alive = false;
      screens.current.forEach((t) => t.dispose());
    };
  }, [station]);

  const shown = useRef(-1);
  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.0008, dt);
    station.rotSmooth += (station.rotY + station.drag - station.rotSmooth) * k;
    station.explodeSmooth += (station.explode - station.explodeSmooth) * k;
    station.glowSmooth += (station.glow - station.glowSmooth) * k;
    station.ultraSmooth += (station.ultra - station.ultraSmooth) * k;
    const e = station.explodeSmooth;
    root.current!.rotation.y = station.rotSmooth;
    root.current!.position.y = station.lift;
    // Vista explodida: a plataforma fica no chão, torre e dossel sobem
    tower.current!.position.y = e * 0.2;
    canopy.current!.position.y = e * 0.52;
    // Eletrodos acendem quando o assunto é bioimpedância
    m.steel.emissiveIntensity = station.glowSmooth * (0.55 + 0.25 * Math.sin(performance.now() / 260));

    const want = station.screen;
    if (want !== shown.current && screens.current[want] && screenMat.current) {
      shown.current = want;
      screenMat.current.map = screens.current[want];
      screenMat.current.needsUpdate = true;
    }
  });

  return (
    <group ref={root}>
      {/* Bandeja arredondada, carenagem côncava e vidro claro separado do tampo bronze. */}
      <group>
        <mesh geometry={geometry.base} position={[0, BASE.h, BASE.z0 + BASE.d / 2]} material={m.body} />
        <mesh geometry={geometry.top} position={[0, BASE.h + 0.001, BASE.z0 + BASE.d / 2]} material={m.top} />
        <mesh geometry={geometry.fairing} material={fairingMaterials} />
        <mesh geometry={geometry.padGlass} material={m.padGlass} position={[0, BASE.h + 0.003, 0.47]} />
        {PAD_POSITIONS.map(([x, z], i) => (
          <mesh key={i} geometry={geometry.pads[i]} material={m.steel} position={[x, BASE.h + 0.0045, z]} />
        ))}
      </group>

      {/* Vidro preto contínuo; carcaça traseira com degrau de alumínio e ombro inclinado. */}
      <group ref={tower}>
        <mesh geometry={geometry.body} material={m.towerBody} />
        <mesh geometry={geometry.glass} position={[0, (TOWER.y0 + TOWER.y1) / 2, 0.040]} material={m.glass} />
        <mesh position={[0, TOWER.y1 - TOWER.screenMargin - SCREEN.h / 2, 0.0403]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial ref={screenMat} color="#e6e6e6" toneMapped={false} />
        </mesh>
      </group>

      {/* Tubos paralelos com cotovelo circular; sensor somente na face inferior da placa. */}
      <group ref={canopy}>
        {geometry.bars.map((g, i) => <mesh key={i} geometry={g} material={m.canopy} />)}
        <mesh geometry={geometry.cap} material={m.canopy} rotation={[PLATE_ANGLE, 0, 0]} position={[0, PLATE_Y, PLATE_Z]} />
        <mesh geometry={geometry.underside} material={m.canopy} rotation={[PLATE_ANGLE, 0, 0]}
          position={[0, PLATE_Y - (CANOPY.plateH - 0.001) * Math.cos(PLATE_ANGLE), PLATE_Z - (CANOPY.plateH - 0.001) * Math.sin(PLATE_ANGLE)]} />
        <mesh rotation={[PLATE_ANGLE, 0, 0]} position={[0, CANOPY.sensorY + 0.0015 * Math.cos(PLATE_ANGLE), CANOPY.sensorZ + 0.0015 * Math.sin(PLATE_ANGLE)]} material={m.sensor}>
          <cylinderGeometry args={[0.014, 0.014, 0.003, 40]} />
        </mesh>
        <Ultrasound state={station} />
      </group>
    </group>
  );
}

export const STATION_DIMS = { BASE, TOWER, SCREEN, CANOPY };
