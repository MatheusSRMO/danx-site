"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { canopyBarGeometry, electrodeGeometry, fairingGeometry, slabGeometry, towerBodyGeometry } from "./stationGeometry";
import { drawScreen, SCREEN_COUNT } from "./screenUi";
import type { StationState } from "./stationState";

// Modelo fiel à estação real (metros; y para cima, frente em +z, torre ao fundo).
// Medidas: 2,10 m de altura · base 0,48 × 0,935 m · tela de 32″ (0,398 × 0,708 m) na vertical.
// Cores amostradas do render oficial do produto.

const BASE = { w: 0.48, d: 0.935, h: 0.07, z0: -0.19, radius: 0.038 };
const TOWER = { y0: 0.17, y1: 1.74, w: 0.43, step: 0.77, screenMargin: 0.048 };
const SCREEN = { w: 0.398, h: 0.708 };
const CANOPY = { x: 0.19, topX: 0.226, z: -0.02, rise: 1.955, top: 2.085, r: 0.13, plateZ0: 0.33, plateZ1: 0.49, w: 0.476, sensorZ: 0.445 };

export const PAD_POSITIONS: [number, number, number, number][] = [
  // x, z, largura (x), comprimento (z): para cada pé, dedos (maior, perto da torre) e calcanhar
  [-0.085, 0.405, 0.086, 0.16],
  [0.085, 0.405, 0.086, 0.16],
  [-0.085, 0.555, 0.086, 0.08],
  [0.085, 0.555, 0.086, 0.08],
];

function useMaterials() {
  return useMemo(
    () => ({
      glass: new THREE.MeshPhysicalMaterial({
        color: "#282d30",
        metalness: 0,
        roughness: 0.18,
        clearcoat: 1,
        clearcoatRoughness: 0.08,
      }),
      body: new THREE.MeshPhysicalMaterial({
        color: "#4d6375",
        metalness: 0.3,
        roughness: 0.46,
        clearcoat: 0.2,
        clearcoatRoughness: 0.5,
      }),
      top: new THREE.MeshPhysicalMaterial({ color: "#4b4944", metalness: 0.4, roughness: 0.32 }),
      wedge: new THREE.MeshPhysicalMaterial({ color: "#48443f", metalness: 0.35, roughness: 0.38 }),
      padGlass: new THREE.MeshPhysicalMaterial({
        color: "#9fa5a4",
        metalness: 0,
        roughness: 0.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.12,
      }),
      steel: new THREE.MeshPhysicalMaterial({
        color: "#deded9",
        metalness: 0.55,
        roughness: 0.32,
        emissive: new THREE.Color("#2ec2c6"),
        emissiveIntensity: 0,
      }),
      canopy: new THREE.MeshPhysicalMaterial({
        color: "#303334",
        metalness: 0.5,
        roughness: 0.3,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
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
    g.children.forEach((c, i) => {
      const ph = (t * 0.45 + rings[i]) % 1;
      c.position.y = THREE.MathUtils.lerp(CANOPY.top - 0.018, 1.05, ph);
      const r = 0.03 + ph * 0.24;
      c.scale.set(r, r, r);
      mats[i].opacity = w * Math.sin(ph * Math.PI) * 0.55;
    });
  });
  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, CANOPY.top - 0.018, CANOPY.sensorZ]} material={mats[i]}>
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
    fairing: fairingGeometry(BASE.h + 0.001),
    padGlass: slabGeometry(0.4, 0.435, 0.027, 0.004, 0.0007),
    pads: PAD_POSITIONS.map(([, , w, d], i) => electrodeGeometry(w, d, i >= 2)),
    body: towerBodyGeometry(0.415, TOWER.y0 - 0.012, TOWER.y1, TOWER.step),
    // Rotation du plan x/z vers la façade x/y; le verre s'étend vers l'arrière.
    glass: slabGeometry(TOWER.w, TOWER.y1 - TOWER.y0, 0.014, 0.01, 0.0015).rotateX(Math.PI / 2),
    bars: [-1, 1].map((side) => canopyBarGeometry(side, CANOPY, TOWER.y1)),
    cap: slabGeometry(CANOPY.w, CANOPY.plateZ1 - CANOPY.plateZ0, 0.017, 0.024, 0.002),
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
        <mesh geometry={geometry.padGlass} material={m.padGlass} position={[0, BASE.h + 0.003, 0.49]} />
        {PAD_POSITIONS.map(([x, z], i) => (
          <mesh key={i} geometry={geometry.pads[i]} material={m.steel} position={[x, BASE.h + 0.0045, z]} />
        ))}
      </group>

      {/* Vidro preto contínuo; carcaça traseira com degrau de alumínio e ombro inclinado. */}
      <group ref={tower}>
        <mesh geometry={geometry.body} material={m.body} />
        <mesh geometry={geometry.glass} position={[0, (TOWER.y0 + TOWER.y1) / 2, 0.040]} material={m.glass} />
        <mesh position={[0, TOWER.y1 - TOWER.screenMargin - SCREEN.h / 2, 0.0403]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial ref={screenMat} color="#e6e6e6" toneMapped={false} />
        </mesh>
      </group>

      {/* Barras chatas que se abrem para cima e placa de sensor com cantos arredondados. */}
      <group ref={canopy}>
        {geometry.bars.map((g, i) => <mesh key={i} geometry={g} material={m.canopy} />)}
        <mesh geometry={geometry.cap} material={m.canopy} position={[0, 2.1, (CANOPY.plateZ0 + CANOPY.plateZ1) / 2]} />
        <mesh geometry={geometry.underside} material={m.padGlass} position={[0, 2.077, (CANOPY.plateZ0 + CANOPY.plateZ1) / 2]} />
        <mesh position={[0, CANOPY.top - 0.011, CANOPY.sensorZ]} material={m.sensor}>
          <cylinderGeometry args={[0.014, 0.014, 0.003, 40]} />
        </mesh>
        <Ultrasound state={station} />
      </group>
    </group>
  );
}

export const STATION_DIMS = { BASE, TOWER, SCREEN, CANOPY };
