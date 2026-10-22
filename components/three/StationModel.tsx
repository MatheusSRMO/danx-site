"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { drawScreen, SCREEN_COUNT } from "./screenUi";
import type { StationState } from "./stationState";

// Modelo fiel à estação real (metros; y para cima, frente em +z, torre ao fundo).
// Medidas: 2,10 m de altura · base 0,48 × 0,935 m · tela de 32″ (0,398 × 0,708 m) na vertical.
// Cores amostradas do render oficial do produto.

const BASE = { w: 0.48, d: 0.935, h: 0.075, z0: -0.13 };
const TOWER = { y0: 0.11, y1: 1.78, w: 0.43 };
const SCREEN = { w: 0.398, h: 0.708 };
const CANOPY = { x: 0.19, z: -0.015, rise: 1.985, top: 2.085, r: 0.1, plateZ0: 0.3, plateZ1: 0.48 };

export const PAD_POSITIONS: [number, number, number, number][] = [
  // x, z, largura (x), comprimento (z): para cada pé, dedos (maior, perto da torre) e calcanhar
  [-0.085, 0.47, 0.072, 0.13],
  [0.085, 0.47, 0.072, 0.13],
  [-0.085, 0.66, 0.072, 0.085],
  [0.085, 0.66, 0.072, 0.085],
];

function useMaterials() {
  return useMemo(
    () => ({
      glass: new THREE.MeshPhysicalMaterial({
        color: "#222a35",
        metalness: 0,
        roughness: 0.32,
        clearcoat: 0.55,
        clearcoatRoughness: 0.22,
      }),
      body: new THREE.MeshPhysicalMaterial({
        color: "#566b86",
        metalness: 0.3,
        roughness: 0.46,
        clearcoat: 0.2,
        clearcoatRoughness: 0.5,
      }),
      top: new THREE.MeshPhysicalMaterial({ color: "#3d3f44", metalness: 0.5, roughness: 0.42 }),
      wedge: new THREE.MeshPhysicalMaterial({ color: "#47413c", metalness: 0.5, roughness: 0.45 }),
      padGlass: new THREE.MeshPhysicalMaterial({
        color: "#a7adb4",
        metalness: 0,
        roughness: 0.2,
        clearcoat: 0.6,
        clearcoatRoughness: 0.12,
      }),
      steel: new THREE.MeshPhysicalMaterial({
        color: "#f1f3f5",
        metalness: 0.35,
        roughness: 0.32,
        emissive: new THREE.Color("#2ec2c6"),
        emissiveIntensity: 0,
      }),
      canopy: new THREE.MeshPhysicalMaterial({
        color: "#1d2026",
        metalness: 0.75,
        roughness: 0.24,
        clearcoat: 0.6,
        clearcoatRoughness: 0.15,
      }),
      sensor: new THREE.MeshStandardMaterial({ color: "#0d0e10", metalness: 0.3, roughness: 0.55 }),
    }),
    [],
  );
}

/** Placa fina de cantos arredondados (no plano x/z), para o vidro dos eletrodos e as placas de aço. */
function plateGeometry(w: number, l: number, r: number, t: number) {
  const s = new THREE.Shape();
  const x = w / 2,
    z = l / 2,
    rr = Math.min(r, x, z);
  s.moveTo(-x + rr, -z);
  s.lineTo(x - rr, -z);
  s.quadraticCurveTo(x, -z, x, -z + rr);
  s.lineTo(x, z - rr);
  s.quadraticCurveTo(x, z, x - rr, z);
  s.lineTo(-x + rr, z);
  s.quadraticCurveTo(-x, z, -x, z - rr);
  s.lineTo(-x, -z + rr);
  s.quadraticCurveTo(-x, -z, -x + rr, -z);
  const g = new THREE.ExtrudeGeometry(s, {
    depth: t,
    bevelEnabled: true,
    bevelSize: 0.0012,
    bevelThickness: 0.0012,
    bevelSegments: 2,
    curveSegments: 16,
  });
  g.rotateX(Math.PI / 2);
  return g;
}

function wedgeGeometry() {
  // Cunha que recebe a torre: perfil desenhado no plano z/y e extrudado na largura (x)
  const s = new THREE.Shape();
  s.moveTo(BASE.z0 + 0.01, BASE.h);
  s.lineTo(0.115, BASE.h);
  s.lineTo(0.035, 0.155);
  s.lineTo(BASE.z0 + 0.02, 0.155);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, {
    depth: 0.46,
    bevelEnabled: true,
    bevelSize: 0.003,
    bevelThickness: 0.003,
    bevelSegments: 2,
  });
  g.rotateY(-Math.PI / 2);
  g.translate(0.23, 0, 0);
  return g;
}

function barGeometry(x: number) {
  // Barra chata do dossel: sobe da torre, curva para a frente e segue até a placa
  const path = new THREE.CurvePath<THREE.Vector3>();
  const { z, rise, top, r, plateZ0 } = CANOPY;
  path.add(new THREE.LineCurve3(new THREE.Vector3(x, TOWER.y1 - 0.02, z), new THREE.Vector3(x, rise, z)));
  const steps = 12;
  for (let i = 0; i < steps; i++) {
    const a0 = (i / steps) * (Math.PI / 2);
    const a1 = ((i + 1) / steps) * (Math.PI / 2);
    path.add(
      new THREE.LineCurve3(
        new THREE.Vector3(x, rise + Math.sin(a0) * r, z + r - Math.cos(a0) * r),
        new THREE.Vector3(x, rise + Math.sin(a1) * r, z + r - Math.cos(a1) * r),
      ),
    );
  }
  path.add(new THREE.LineCurve3(new THREE.Vector3(x, top, z + r), new THREE.Vector3(x, top, plateZ0 + 0.06)));
  // Seção retangular arredondada (0,026 × 0,02 m)
  const w = 0.013,
    h = 0.01,
    rr = 0.004;
  const shape = new THREE.Shape();
  shape.moveTo(-w + rr, -h);
  shape.lineTo(w - rr, -h);
  shape.quadraticCurveTo(w, -h, w, -h + rr);
  shape.lineTo(w, h - rr);
  shape.quadraticCurveTo(w, h, w - rr, h);
  shape.lineTo(-w + rr, h);
  shape.quadraticCurveTo(-w, h, -w, h - rr);
  shape.lineTo(-w, -h + rr);
  shape.quadraticCurveTo(-w, -h, -w + rr, -h);
  const pts = path.getSpacedPoints(160);
  const curve = new THREE.CatmullRomCurve3(pts, false, "centripetal", 0);
  return new THREE.ExtrudeGeometry(shape, { steps: 200, bevelEnabled: false, extrudePath: curve });
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
      c.position.y = THREE.MathUtils.lerp(CANOPY.top - 0.02, 1.05, ph);
      const r = 0.03 + ph * 0.24;
      c.scale.set(r, r, r);
      mats[i].opacity = w * Math.sin(ph * Math.PI) * 0.55;
    });
  });
  return (
    <group ref={group}>
      {rings.map((r, i) => (
        <mesh key={r} rotation={[-Math.PI / 2, 0, 0]} position={[0, 2, 0.4]} material={mats[i]}>
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

  const wedge = useMemo(wedgeGeometry, []);
  const padGlassGeo = useMemo(() => plateGeometry(0.4, 0.42, 0.02, 0.004), []);
  const padGeos = useMemo(() => PAD_POSITIONS.map(([, , w, l]) => plateGeometry(w, l, 0.03, 0.002)), []);
  const bars = useMemo(() => [barGeometry(-CANOPY.x), barGeometry(CANOPY.x)], []);

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

  const bodyTopH = TOWER.y1 - TOWER.y0;
  const towerMidY = (TOWER.y0 + TOWER.y1) / 2;

  return (
    <group ref={root}>
      {/* Base: bandeja de alumínio, tampo grafite, cunha, vidro claro e eletrodos */}
      <group>
        <RoundedBox
          args={[BASE.w, BASE.h, BASE.d]}
          radius={0.022}
          smoothness={6}
          position={[0, BASE.h / 2, BASE.z0 + BASE.d / 2]}
          material={m.body}
        />
        <RoundedBox
          args={[BASE.w - 0.02, 0.004, BASE.d - 0.02]}
          radius={0.002}
          smoothness={2}
          position={[0, BASE.h + 0.001, BASE.z0 + BASE.d / 2]}
          material={m.top}
        />
        <mesh geometry={wedge} material={m.wedge} />
        <mesh geometry={padGlassGeo} material={m.padGlass} position={[0, BASE.h + 0.007, 0.565]} />
        {PAD_POSITIONS.map(([x, z], i) => (
          <mesh key={`${x}${z}`} geometry={padGeos[i]} material={m.steel} position={[x, BASE.h + 0.0105, z]} />
        ))}
      </group>

      {/* Torre: vidro preto na frente, corpo de alumínio atrás com degrau na metade de baixo */}
      <group ref={tower}>
        <RoundedBox
          args={[TOWER.w, bodyTopH, 0.014]}
          radius={0.006}
          smoothness={4}
          position={[0, towerMidY, 0.033]}
          material={m.glass}
        />
        <RoundedBox
          args={[0.415, bodyTopH, 0.06]}
          radius={0.01}
          smoothness={4}
          position={[0, towerMidY, -0.005]}
          material={m.body}
        />
        <RoundedBox
          args={[0.415, 0.7, 0.1]}
          radius={0.012}
          smoothness={4}
          position={[0, TOWER.y0 + 0.35, -0.03]}
          material={m.body}
        />
        <mesh position={[0, TOWER.y1 - 0.022 - SCREEN.h / 2, 0.0405]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial ref={screenMat} color="#e6e6e6" toneMapped={false} />
        </mesh>
      </group>

      {/* Dossel: duas barras chatas e a placa frontal com o sensor ultrassônico */}
      <group ref={canopy}>
        {bars.map((g, i) => (
          <mesh key={i} geometry={g} material={m.canopy} />
        ))}
        <RoundedBox
          args={[0.45, 0.02, CANOPY.plateZ1 - CANOPY.plateZ0]}
          radius={0.008}
          smoothness={4}
          position={[0, CANOPY.top + 0.004, (CANOPY.plateZ0 + CANOPY.plateZ1) / 2]}
          material={m.canopy}
        />
        <mesh position={[0, CANOPY.top - 0.008, 0.4]} material={m.sensor}>
          <cylinderGeometry args={[0.02, 0.02, 0.006, 40]} />
        </mesh>
        <Ultrasound state={station} />
      </group>
    </group>
  );
}

export const STATION_DIMS = { BASE, TOWER, SCREEN, CANOPY };
