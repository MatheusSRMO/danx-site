"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useFrame, useThree } from "@react-three/fiber";
import {
  canopyBarGeometry,
  electrodeGeometry,
  fairingGeometry,
  ringSlabGeometry,
  sensorPlateGeometry,
  slabGeometry,
  towerBodyGeometry,
} from "./stationGeometry";
import { drawScreen, SCREEN_COUNT } from "./screenUi";
import { GLASS_LOGO_ASPECT, glassLogoTexture } from "./glassLogo";
import StationGlassReflection, { type MirrorRegion } from "./StationGlassReflection";
import StationTowerReflection from "./StationTowerReflection";
import type { StationState } from "./stationState";

// Modelo fiel à estação real (metros; y para cima, frente em +z, torre ao fundo).
// Medidas: 2,10 m de altura · base 0,48 × 0,935 m · tela nominal de 32″ na vertical.
// A área visível da tela segue o render CAD (mais estreita que a proporção nominal 16:9).
// Formas e acabamentos ajustados pelas referências oficiais e pelas avaliações em .fidelity/LOG.md.

// Bandeja: corpo de alumínio azul-ardósia e, por cima, uma chapa bronze-grafite de 4,4 mm com o bolsão do vidro.
const BASE = { w: 0.48, d: 0.935, h: 0.0699, z0: -0.21, radius: 0.0337, plate: 0.0044, bottomBevel: 0.004 };
// Vidro dos eletrodos assentado 1,6 mm abaixo do tampo; os eletrodos ficam rentes à face dele.
const PAD = { cz: 0.47, w: 0.4, d: 0.435, r: 0.027, thick: 0.003, top: 0.0683, hole: 0.0045 };
// Regiões dos espelhos planares da bandeja: o vidro (altura do vidro) e o tampo em volta dele (altura do tampo).
const GLASS_MIRROR: MirrorRegion = { w: PAD.w - 0.0014, d: PAD.d - 0.0014, r: PAD.r - 0.0007, cz: PAD.cz };
const TOP_MIRROR: MirrorRegion = {
  w: BASE.w - 0.001, d: BASE.d - 0.001, r: BASE.radius - 0.0005, cz: BASE.z0 + BASE.d / 2,
  hole: { w: PAD.w + PAD.hole, d: PAD.d + PAD.hole, r: PAD.r + PAD.hole / 2, cz: PAD.cz },
};
// Torre: vidro preto de 436 mm rente ao corpo de alumínio (440 mm); atrás, o degrau com chanfro reto.
const TOWER = {
  y0: 0.109, y1: 1.7655, w: 0.4359, bodyW: 0.4408, step: 0.7546, chamfer: 0.0199,
  front: 0.0261, rear: -0.0164, rear2: -0.0434, glassZ: 0.0383, glassT: 0.0142, screenMargin: 0.0345,
};
const SCREEN = { w: 0.36, h: 0.708 };
// Logotipo no vidro: mesmo lugar e tamanho da inscrição do render oficial (centro a 236 mm do chão, 30 mm de altura)
const GLASS_LOGO = { y: 0.236, h: 0.03 };
// Cunha de largura constante (rente às pontas da bandeja): trapézio de rampas íngremes (36 mm atrás e 39 mm na frente de avanço, para 37 mm de altura).
const FAIRING = {
  height: 0.0371, widthBottom: 0.478, widthTop: 0.478,
  backBottom: -0.065, frontBottom: 0.098, backTop: -0.029, frontTop: 0.0585,
};
// Dossel: duas barras planas (25,6 × 29 mm) que sobem coladas à traseira da torre, fazem o cotovelo e seguem retas
// (queda frontal de ~2,4°) até a placa de 33 mm; as barras saem rentes às pontas da placa.
const CANOPY = {
  x: 0.2001, z: -0.0034, wx: 0.0256, wt: 0.0289, fillet: 0.0025,
  R: 0.0999, top: 2.1, pitch: 0.0437,
  plateW: 0.4259, plateD: 0.1119, plateZ: 0.4608, plateY: 2.0897, plateH: 0.033, plateR: 0.005,
  rise: 0, sensorZ: 0, sensorY: 0,
};
CANOPY.rise = CANOPY.top - CANOPY.R - CANOPY.wt / 2;
// A placa acompanha a queda do trecho reto das barras; o ponto mais alto de tudo é o cotovelo (2,100 m).
const PLATE_ANGLE = Math.atan(CANOPY.pitch);
const PLATE_Z = CANOPY.plateZ;
const PLATE_Y = CANOPY.plateY;
const plateHeightAt = (z: number) => PLATE_Y - (z - PLATE_Z) * CANOPY.pitch;
// Sensor quase rente à chapa inferior: rebaixo de 0,3 mm, sem aro refletivo.
// A mesma face emissora define a origem das ondas em coordenadas do dossel.
const UNDERSIDE_H = 0.002;
const UNDERSIDE_INSET = 0.001;
const SENSOR_DEPTH = 0.0004;
const SENSOR_LOCAL_Y = -CANOPY.plateH + UNDERSIDE_INSET - UNDERSIDE_H + SENSOR_DEPTH - 0.0001;
CANOPY.sensorZ = PLATE_Z + CANOPY.plateD / 2 - 0.043;
const SENSOR_LOCAL_Z = (CANOPY.sensorZ - PLATE_Z - SENSOR_LOCAL_Y * Math.sin(PLATE_ANGLE)) / Math.cos(PLATE_ANGLE);
CANOPY.sensorY = plateHeightAt(CANOPY.sensorZ) + SENSOR_LOCAL_Y / Math.cos(PLATE_ANGLE);
// Fila vertical de furos na traseira, abaixo do degrau (ventilação/alto-falante)
const REAR_HOLES = { count: 15, y0: 0.28, y1: 0.657, d: 0.007 };

/**
 * Escurecimento suave com a altura (oclusão do ambiente embaixo, perto da plataforma): no original a lateral de
 * alumínio da torre vai de um azul-ardósia claro no alto (luminância ~131) a um bem escuro no pé (~62), quase linear.
 */
function heightShade(g: THREE.BufferGeometry, y1: number) {
  const pos = g.getAttribute("position");
  const colors = new Float32Array(pos.count * 3);
  const top = (56 + 43.6 * y1) / 131;
  for (let i = 0; i < pos.count; i++) {
    const lum = (56 + 43.6 * THREE.MathUtils.clamp(pos.getY(i), 0.1, y1)) / 131;
    const k = Math.pow(lum / top, 2.2);
    colors.set([k, k, k], i * 3);
  }
  g.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return g;
}

/** Fila de furos circulares na face traseira (abaixo do degrau); um só buffer. */
function rearHolesGeometry() {
  const parts: THREE.BufferGeometry[] = [];
  for (let i = 0; i < REAR_HOLES.count; i++) {
    const y = THREE.MathUtils.lerp(REAR_HOLES.y0, REAR_HOLES.y1, i / (REAR_HOLES.count - 1));
    const c = new THREE.CircleGeometry(REAR_HOLES.d / 2, 14);
    c.rotateY(Math.PI); // voltado para trás (-z)
    c.translate(0, y, TOWER.rear2 - 0.0004);
    parts.push(c);
  }
  const merged = mergeGeometries(parts)!;
  parts.forEach((g) => g.dispose());
  return merged;
}

/**
 * Detalhes da barra esquerda vistos na foto lateral oficial: uma alça de fio (guia de cabo) junto ao topo da torre e,
 * onde a barra termina no degrau, uma plaquinha clara de fixação. Um só buffer, preso à barra (grupo do dossel).
 */
function barAccessoriesGeometry() {
  const x = -CANOPY.x, rear = CANOPY.z - CANOPY.wt / 2;
  const yLoop = TOWER.y1 - 0.004;
  const loop = new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3([
      new THREE.Vector3(x, yLoop + 0.031, rear + 0.003), new THREE.Vector3(x, yLoop + 0.027, rear - 0.011),
      new THREE.Vector3(x, yLoop + 0.012, rear - 0.021), new THREE.Vector3(x, yLoop, rear - 0.0235),
      new THREE.Vector3(x, yLoop - 0.012, rear - 0.021), new THREE.Vector3(x, yLoop - 0.027, rear - 0.011),
      new THREE.Vector3(x, yLoop - 0.031, rear + 0.003),
    ]), 24, 0.0013, 8, false,
  );
  const plate = new THREE.BoxGeometry(0.014, 0.0035, 0.052);
  plate.rotateX(Math.PI / 2);
  plate.translate(x, TOWER.step + TOWER.chamfer + 0.04, rear - 0.0017);
  const merged = mergeGeometries([loop, plate])!;
  loop.dispose();
  plate.dispose();
  return merged;
}

export const PAD_POSITIONS: [number, number, number, number][] = [
  // x, z, largura (x), comprimento (z): para cada pé, dedos (maior, perto da torre) e calcanhar.
  // Medidas e posições ajustadas sobre o render oficial da base de perto (contornos dos eletrodos).
  [-0.1043, 0.408, 0.1008, 0.1887],
  [0.1043, 0.408, 0.1008, 0.1887],
  [-0.103, 0.5808, 0.1098, 0.0884],
  [0.103, 0.5808, 0.1098, 0.0884],
];

function useMaterials(low: boolean) {
  return useMemo(
    () => ({
      // Vidro temperado preto brilhante da torre: quase preto de base e brilho vindo do ambiente; o reflexo nítido
      // da plataforma vem do espelho planar (StationTowerReflection), só no modo completo.
      glass: new THREE.MeshPhysicalMaterial({
        color: "#262829",
        metalness: 0,
        roughness: 0.45,
        ior: 1.7,
        clearcoat: 0.15,
        clearcoatRoughness: 0.12,
        specularColor: new THREE.Color("#d7e7f7"),
      }),
      // O fio do vidro (espessura) é escuro: sem o brilho das faces.
      glassEdge: new THREE.MeshBasicMaterial({ color: "#0d0f12" }),
      body: new THREE.MeshPhysicalMaterial({ color: "#5d697d", metalness: 0, roughness: 0.8 }),
      fairingEnd: new THREE.MeshPhysicalMaterial({ color: "#4e5b6e", metalness: 0.05, roughness: 0.8 }),
      towerBody: new THREE.MeshPhysicalMaterial({
        vertexColors: true, color: "#566f82", metalness: 0, roughness: 0.8,
      }),
      // Tampo e cunha bronze-grafite; alumínio azul-ardósia. Acabamento acetinado: casam nos dois estúdios (claro e escuro).
      top: new THREE.MeshPhysicalMaterial({ color: "#9b9b96", metalness: 0, roughness: 0.8 }),
      wedge: new THREE.MeshPhysicalMaterial({ color: "#514d49", metalness: 0.1, roughness: 0.8 }),
      padFrame: new THREE.MeshStandardMaterial({ color: "#303839", metalness: 0.25, roughness: 0.32 }),
      // Vidro temperado preto brilhante (legenda do desenho oficial). Parece cinza-claro no render 3/4 só porque,
      // visto de raspão, reflete o fundo branco do estúdio; com fundo preto (base de perto) fica escuro.
      padGlass: new THREE.MeshPhysicalMaterial({
        color: "#000016",
        metalness: 0,
        roughness: 0.1,
        ior: 1.5,
        clearcoat: 0,
        clearcoatRoughness: 0.03,
      }),
      steel: new THREE.MeshPhysicalMaterial({
        color: "#fafaf7",
        metalness: 0.05,
        roughness: 0.3,
        anisotropy: 0.65,
        anisotropyRotation: Math.PI / 2,
        emissive: new THREE.Color("#2ec2c6"),
        emissiveIntensity: 0,
      }),
      // Grafite acetinado: faces planas sem reflexo forte e filetes que pegam o brilho das faixas de luz do estúdio
      canopy: new THREE.MeshPhysicalMaterial({
        color: "#424447", metalness: 0.5, roughness: 0.15, emissive: new THREE.Color("#0c1114"),
      }),
      canopyPlate: new THREE.MeshPhysicalMaterial({ color: "#001730", metalness: 0.5, roughness: 0.62, clearcoat: 0.05, clearcoatRoughness: 0.22 }),
      // Laterais e cantos da placa: o mesmo grafite das barras, para a placa e as barras serem uma peça só
      canopyEdge: new THREE.MeshPhysicalMaterial({
        color: "#424447", metalness: 0.5, roughness: 0.15, emissive: new THREE.Color("#0c1114"),
      }),
      hole: new THREE.MeshStandardMaterial({ color: "#07080a", metalness: 0, roughness: 0.7 }),
      clip: new THREE.MeshStandardMaterial({ color: "#c9cbcd", metalness: 0.4, roughness: 0.4 }),
    }),
    [low],
  );
}

/**
 * Ganho de reflexo do ambiente por material (1 = o mesmo do estúdio). O three só respeita `envMapIntensity` quando o
 * material tem `envMap` próprio, então ele é ligado ao ambiente da cena assim que ele existe (ver useEnvironmentGain).
 */
const ENV_GAIN: Record<string, number> = {
  glass: 1.9, padGlass: 0.4, top: 0.65, body: 0.83, fairingEnd: 1.22, towerBody: 1.65, canopy: 0.43, canopyEdge: 0.43,
};

/** Liga cada material ao ambiente da cena para poder dar a cada um o seu ganho de reflexo. */
function useEnvironmentGain(materials: Record<string, THREE.Material>) {
  const scene = useThree((st) => st.scene);
  const linked = useRef<THREE.Texture | null>(null);
  useFrame(() => {
    const env = scene.environment;
    if (!env || linked.current === env) return;
    linked.current = env;
    for (const [name, mat] of Object.entries(materials)) {
      const std = mat as THREE.MeshStandardMaterial;
      if (!std.isMeshStandardMaterial) continue;
      std.envMap = env;
      std.envMapIntensity = scene.environmentIntensity * (ENV_GAIN[name] ?? 1);
      std.needsUpdate = true;
    }
  });
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

export default function StationModel({ state: station, low = false }: { state: StationState; low?: boolean }) {
  const m = useMaterials(low);
  useEnvironmentGain(m);
  const root = useRef<THREE.Group>(null);
  const canopy = useRef<THREE.Group>(null);
  const tower = useRef<THREE.Group>(null);
  const screenMat = useRef<THREE.MeshBasicMaterial>(null);
  const logo = useMemo(() => glassLogoTexture(), []);
  useEffect(() => () => logo.dispose(), [logo]);

  const geometry = useMemo(() => ({
    base: ringSlabGeometry(BASE.w, BASE.d, BASE.radius, BASE.h - BASE.plate, 0, BASE.bottomBevel),
    top: ringSlabGeometry(BASE.w - 0.001, BASE.d - 0.001, BASE.radius - 0.0005, BASE.plate, 0.002, 0,
      { w: PAD.w + 2 * PAD.hole / 2, d: PAD.d + 2 * PAD.hole / 2, r: PAD.r + PAD.hole / 2, cz: PAD.cz - (BASE.z0 + BASE.d / 2) }),
    fairing: fairingGeometry(BASE.h, FAIRING),
    padFrame: slabGeometry(PAD.w + PAD.hole, PAD.d + PAD.hole, PAD.r + PAD.hole / 2, 0.001, 0.0002),
    padGlass: slabGeometry(PAD.w, PAD.d, PAD.r, PAD.thick, 0.0007),
    pads: PAD_POSITIONS.map(([, , w, d], i) => electrodeGeometry(w, d, i >= 2)),
    body: heightShade(towerBodyGeometry(TOWER.bodyW, TOWER.y0 - 0.012, TOWER.y1, TOWER), TOWER.y1),
    // Do plano x/z para a fachada x/y, com a espessura do vidro para trás.
    glass: slabGeometry(TOWER.w, TOWER.y1 - TOWER.y0, 0.018, TOWER.glassT, 0.0015).rotateX(Math.PI / 2),
    bars: [-1, 1].map((side) => canopyBarGeometry(side, { ...CANOPY, zEnd: PLATE_Z - CANOPY.plateD / 2 + 0.035 }, TOWER.step + TOWER.chamfer - 0.001)),
    cap: slabGeometry(CANOPY.plateW, CANOPY.plateD, CANOPY.plateR, CANOPY.plateH, 0.0025),
    underside: sensorPlateGeometry(CANOPY.plateW - 0.022, CANOPY.plateD - 0.018, 0.004, UNDERSIDE_H, 0.0005,
      SENSOR_LOCAL_Z, SENSOR_DEPTH),
    holes: rearHolesGeometry(),
    accessories: barAccessoriesGeometry(),
  }), []);
  const fairingMaterials = useMemo(() => [m.wedge, m.fairingEnd], [m]);
  const topMaterials = useMemo(() => [m.top, m.top], [m]);
  const glassMaterials = useMemo(() => [m.glass, m.glassEdge], [m]);
  const plateMaterials = useMemo(() => [m.canopyPlate, m.canopyEdge], [m]);

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
      {/* Bandeja arredondada, cunha trapezoidal e vidro claro separado do tampo. */}
      <group>
        <mesh geometry={geometry.base} position={[0, BASE.h - BASE.plate, BASE.z0 + BASE.d / 2]} material={m.body} />
        <mesh geometry={geometry.top} position={[0, BASE.h, BASE.z0 + BASE.d / 2]} material={topMaterials} />
        <mesh geometry={geometry.fairing} material={fairingMaterials} />
        <mesh name="electrode-frame" geometry={geometry.padFrame} material={m.padFrame} position={[0, PAD.top - PAD.thick + 0.0004, PAD.cz]} />
        <mesh name="electrode-glass" geometry={geometry.padGlass} material={m.padGlass} position={[0, PAD.top, PAD.cz]} />
        {PAD_POSITIONS.map(([x, z], i) => (
          <mesh key={i} name={`electrode-${i}`} geometry={geometry.pads[i]} material={m.steel} position={[x, PAD.top + 0.0004, z]} />
        ))}
        {!low && <StationGlassReflection state={station} y={PAD.top + 0.0002} region={GLASS_MIRROR} />}
        {!low && <StationGlassReflection state={station} y={BASE.h + 0.0002} region={TOP_MIRROR} strength={0.5} opacity={0.8} />}
      </group>

      {/* Vidro preto contínuo; carcaça traseira com degrau de alumínio e ombro inclinado. */}
      <group ref={tower}>
        <mesh geometry={geometry.body} material={m.towerBody} />
        <mesh geometry={geometry.glass} position={[0, (TOWER.y0 + TOWER.y1) / 2, TOWER.glassZ]} material={glassMaterials} />
        <mesh position={[0, TOWER.y1 - TOWER.screenMargin - SCREEN.h / 2, TOWER.glassZ + 0.0003]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial ref={screenMat} color="#e6e6e6" toneMapped={false} />
        </mesh>
        <mesh position={[0, GLASS_LOGO.y, TOWER.glassZ + 0.0003]}>
          <planeGeometry args={[GLASS_LOGO.h * GLASS_LOGO_ASPECT, GLASS_LOGO.h]} />
          <meshBasicMaterial map={logo} color="#e4e6e8" transparent depthWrite={false} />
        </mesh>
        <mesh name="rear-holes" geometry={geometry.holes} material={m.hole} />
        {!low && (
          <StationTowerReflection state={station} width={TOWER.w} height={0.5} radius={0.018}
            y={TOWER.y0 + 0.25} z={TOWER.glassZ + 0.0001} strength={0.3} />
        )}
      </group>

      {/* Tubos paralelos com cotovelo circular; sensor somente na face inferior da placa. */}
      <group ref={canopy}>
        {geometry.bars.map((g, i) => <mesh key={i} geometry={g} material={m.canopy} />)}
        <mesh name="canopy-plate" geometry={geometry.cap} material={plateMaterials} rotation={[PLATE_ANGLE, 0, 0]} position={[0, PLATE_Y, PLATE_Z]} />
        <mesh name="canopy-underside" geometry={geometry.underside} material={m.canopyPlate} rotation={[PLATE_ANGLE, 0, 0]}
          position={[0, PLATE_Y - (CANOPY.plateH - UNDERSIDE_INSET) * Math.cos(PLATE_ANGLE), PLATE_Z - (CANOPY.plateH - UNDERSIDE_INSET) * Math.sin(PLATE_ANGLE)]} />
        <mesh name="ultrasound-sensor" rotation={[Math.PI / 2 + PLATE_ANGLE, 0, 0]} position={[0, CANOPY.sensorY, CANOPY.sensorZ]} material={m.canopyPlate}>
          <circleGeometry args={[0.0145, 48]} />
        </mesh>
        <mesh name="bar-accessories" geometry={geometry.accessories} material={m.clip} />
        <Ultrasound state={station} />
      </group>
    </group>
  );
}

export const STATION_DIMS = { BASE, TOWER, SCREEN, CANOPY };
