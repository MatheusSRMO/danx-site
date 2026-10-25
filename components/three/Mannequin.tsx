"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { StationState } from "./stationState";

// Manequim de criança (10 anos, 1,48 m) que demonstra cada avaliação na história da estação.
// Procedural (sem arquivos externos): segmentos arredondados e articulações em esfera, como um manequim de artista.
// Referencial: metros, y para cima, o manequim olha para +z antes de girar; a esquerda dele fica em +x.

// Medidas (m), proporções de uma criança de 1,48 m: quadril 0,74 · ombros 1,20 · base do pescoço 1,23 · topo da cabeça 1,48
const M = {
  ankle: 0.06,
  shin: 0.34,
  thigh: 0.34,
  hipX: 0.072,
  pelvisY: 0.742,
  torso: 0.49,
  shoulderY: 0.455,
  shoulderX: 0.148,
  neck: 0.05,
  head: 0.1,
  upperArm: 0.27,
  forearm: 0.21,
  hand: 0.14,
  foot: 0.215,
};

const JOINTS = ["pelvis", "spine", "neck", "head", "shL", "elL", "wrL", "shR", "elR", "wrR", "hipL", "knL", "anL", "hipR", "knR", "anR"] as const;
type Joint = (typeof JOINTS)[number];
/** Ângulos em graus (X, Y, Z) por articulação. X positivo leva um membro pendurado para trás; Z positivo, para a esquerda (+x). */
type Pose = Partial<Record<Joint, [number, number, number]>>;
type Key = {
  /** Posição dos pés no piso (x, z) e altura do piso (plataforma = 0,07). */
  at: [number, number, number];
  /** Para onde olha (graus em y; 180 = de frente para a torre). */
  face: number;
  pose: Pose;
  /** Entre esta chave e a seguinte o manequim caminha (passos proporcionais à distância). */
  walk?: boolean;
  /** Mostra o espirômetro na mão. */
  spiro?: boolean;
  visible?: boolean;
};

const STAND: Pose = { shL: [0, 0, 6], shR: [0, 0, -6], elL: [-6, 0, 0], elR: [-6, 0, 0] };
// Bioimpedância: braços levemente afastados do corpo, parado
const BIA: Pose = { shL: [0, 0, 16], shR: [0, 0, -16], elL: [-4, 0, 0], elR: [-4, 0, 0] };
// Equilíbrio: numa perna só, mãos juntas diante do peito, olhos fechados (cabeça um pouco baixa)
const BALANCE: Pose = {
  pelvis: [0, 0, -3],
  hipL: [-62, 0, 8],
  knL: [95, 0, 0],
  anL: [-20, 0, 0],
  hipR: [0, 0, 2],
  shL: [-38, 0, -18],
  elL: [-92, 30, 0],
  shR: [-38, 0, 18],
  elR: [-92, -30, 0],
  neck: [10, 0, 0],
};
// Toque na tela (identificação e agilidade): braço direito à frente, um pouco para dentro
const TAP_LOW: Pose = { spine: [6, 0, 0], shR: [-78, 0, 6], elR: [-12, 0, 0], wrR: [-10, 0, 0], shL: [0, 0, 6], elL: [-8, 0, 0] };
const TAP_HIGH: Pose = { spine: [8, 0, 0], shR: [-118, 0, 10], elR: [-10, 0, 0], wrR: [-10, 0, 0], shL: [0, 0, 6], elL: [-8, 0, 0] };
// Espirometria: as duas mãos seguram o espirômetro diante da boca
const SPIRO: Pose = {
  spine: [4, 0, 0],
  neck: [-4, 0, 0],
  shL: [-46, 0, -8],
  elL: [-112, 18, 0],
  shR: [-46, 0, 8],
  elR: [-112, -18, 0],
};
// Visão: mão esquerda cobre o olho esquerdo; a direita aponta a direção do "E"
const VISION: Pose = {
  shL: [-64, 0, 4],
  elL: [-128, 0, -14],
  wrL: [0, 0, -20],
  shR: [-72, 0, -40],
  elR: [-8, 0, 0],
};
// Postura (câmera): em pé, braços afastados do corpo, como pede a tela
const POSTURE: Pose = { shL: [0, 0, 28], shR: [0, 0, -28], elL: [-4, 0, 0], elR: [-4, 0, 0] };

const P = 0.07; // altura do tampo da plataforma
const FEET_Z = 0.47; // pés sobre os eletrodos (dedos à frente, calcanhar atrás)

/** Linha do tempo do manequim: `state.act` percorre as chaves (0, 1, 2, …). */
const KEYS: Key[] = [
  { at: [1.5, 1.6, 0], face: 230, pose: STAND, walk: true, visible: false }, // 0 fora de cena
  { at: [0.0, 1.05, 0], face: 180, pose: STAND, walk: true }, // 1 chega diante da estação
  { at: [0.0, FEET_Z, P], face: 180, pose: STAND }, // 2 sobe na plataforma
  { at: [0.0, FEET_Z, P], face: 180, pose: TAP_LOW }, // 3 digita o ID na tela
  { at: [0.0, FEET_Z, P], face: 180, pose: BIA }, // 4 altura e composição corporal
  { at: [0.0, FEET_Z, P], face: 180, pose: BIA }, // 5
  { at: [0.0, FEET_Z, P], face: 180, pose: BALANCE }, // 6 equilíbrio
  { at: [0.0, FEET_Z, P], face: 180, pose: TAP_HIGH }, // 7 agilidade
  { at: [0.0, FEET_Z, P], face: 180, pose: SPIRO, spiro: true }, // 8 espirometria
  { at: [0.0, FEET_Z, P], face: 180, pose: STAND, walk: true }, // 9 desce e recua
  { at: [0.0, 2.55, 0], face: 180, pose: VISION }, // 10 visão a 2,5 m
  { at: [0.0, 2.35, 0], face: 180, pose: POSTURE }, // 11 postura de frente
  { at: [0.0, 2.35, 0], face: 90, pose: POSTURE, walk: true }, // 12 postura de lado
  { at: [1.0, 0.3, 0], face: 20, pose: STAND, walk: true }, // 13 fica ao lado da estação, virada para quem vê (fecho da história)
  { at: [-1.6, 1.4, 0], face: 140, pose: STAND, walk: true, visible: false }, // 14 sai de cena
];
export const MANNEQUIN_KEYS = KEYS.length;

const smooth = (t: number) => t * t * (3 - 2 * t);
const D2R = Math.PI / 180;

function segment(len: number, r0: number, r1: number, mat: THREE.Material) {
  // Segmento afunilado pendurado para baixo a partir da articulação (y = 0 → y = −len)
  const g = new THREE.CylinderGeometry(r0, r1, len, 20, 1, false);
  g.translate(0, -len / 2, 0);
  return new THREE.Mesh(g, mat);
}
function ball(r: number, mat: THREE.Material) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 20, 14), mat);
}

export default function Mannequin({ state }: { state: StationState }) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const smoothAct = useRef(state.act);

  const rig = useMemo(() => {
    const skin = new THREE.MeshStandardMaterial({ color: "#d9d3c9", roughness: 0.58, metalness: 0 });
    const joint = new THREE.MeshStandardMaterial({ color: "#c4bdb1", roughness: 0.5, metalness: 0 });
    const prop = new THREE.MeshStandardMaterial({ color: "#eef0f2", roughness: 0.35, metalness: 0.05 });
    const propDark = new THREE.MeshStandardMaterial({ color: "#2b3138", roughness: 0.4 });
    const g: Record<Joint, THREE.Group> = Object.fromEntries(JOINTS.map((j) => [j, new THREE.Group()])) as Record<Joint, THREE.Group>;

    // Tronco: perfil girado (bacia → cintura → peito → ombros), achatado de frente para trás
    const torso = new THREE.LatheGeometry(
      [
        [0.0, -0.035], [0.118, -0.005], [0.13, 0.08], [0.108, 0.2], [0.112, 0.3], [0.135, 0.4], [0.118, 0.455], [0.05, 0.485], [0.0, 0.49],
      ].map(([r, y]) => new THREE.Vector2(r, y)),
      28,
    );
    torso.scale(1, 1, 0.66);
    g.pelvis.position.y = M.pelvisY;
    g.pelvis.add(g.spine);
    g.spine.add(new THREE.Mesh(torso, skin));
    // Pescoço e cabeça
    g.neck.position.y = M.torso - 0.01;
    g.spine.add(g.neck);
    const neck = segment(M.neck + 0.04, 0.038, 0.043, skin);
    neck.rotation.x = Math.PI;
    g.neck.add(neck);
    g.head.position.y = M.neck;
    g.neck.add(g.head);
    const head = ball(M.head, skin);
    head.scale.set(0.9, 1.06, 1.0);
    head.position.y = M.head;
    g.head.add(head);
    // Queixo e nariz discretos: dão a direção do rosto
    const jaw = ball(0.062, skin);
    jaw.scale.set(1.05, 0.8, 1.0);
    jaw.position.set(0, 0.045, 0.032);
    g.head.add(jaw);
    const nose = ball(0.014, skin);
    nose.scale.set(0.8, 1.2, 1);
    nose.position.set(0, 0.1, 0.097);
    g.head.add(nose);

    // Braços
    for (const [sh, el, wr, side] of [["shL", "elL", "wrL", 1], ["shR", "elR", "wrR", -1]] as const) {
      g[sh].position.set(side * M.shoulderX, M.shoulderY, 0);
      g.spine.add(g[sh]);
      g[sh].add(ball(0.045, joint));
      g[sh].add(segment(M.upperArm, 0.04, 0.033, skin));
      g[el].position.y = -M.upperArm;
      g[sh].add(g[el]);
      g[el].add(ball(0.033, joint));
      g[el].add(segment(M.forearm, 0.031, 0.025, skin));
      g[wr].position.y = -M.forearm;
      g[el].add(g[wr]);
      g[wr].add(ball(0.025, joint));
      const hand = ball(0.05, skin);
      hand.scale.set(0.55, 1.35, 0.32);
      hand.position.y = -0.06;
      g[wr].add(hand);
    }
    // Pernas
    for (const [hip, kn, an, side] of [["hipL", "knL", "anL", 1], ["hipR", "knR", "anR", -1]] as const) {
      g[hip].position.set(side * M.hipX, 0, 0);
      g.pelvis.add(g[hip]);
      g[hip].add(ball(0.06, joint));
      g[hip].add(segment(M.thigh, 0.062, 0.045, skin));
      g[kn].position.y = -M.thigh;
      g[hip].add(g[kn]);
      g[kn].add(ball(0.044, joint));
      g[kn].add(segment(M.shin, 0.043, 0.032, skin));
      g[an].position.y = -M.shin;
      g[kn].add(g[an]);
      g[an].add(ball(0.03, joint));
      const foot = new THREE.Mesh(new THREE.CapsuleGeometry(0.036, M.foot - 0.07, 6, 16), skin);
      foot.rotation.x = Math.PI / 2;
      foot.scale.set(1.15, 1, 0.75);
      foot.position.set(0, -M.ankle + 0.026, M.foot / 2 - 0.06);
      g[an].add(foot);
    }

    // Espirômetro portátil (cabo com bocal), preso à mão direita
    const spiro = new THREE.Group();
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.022, 0.15, 20), prop);
    tube.rotation.x = Math.PI / 2;
    spiro.add(tube);
    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.018, 0.04, 16), propDark);
    mouth.rotation.x = Math.PI / 2;
    mouth.position.z = 0.09;
    spiro.add(mouth);
    spiro.position.set(-0.03, -0.07, 0.06);
    spiro.visible = false;
    g.wrR.add(spiro);

    const meshes: THREE.Mesh[] = [];
    g.pelvis.traverse((o) => (o as THREE.Mesh).isMesh && meshes.push(o as THREE.Mesh));
    meshes.forEach((m) => {
      m.castShadow = false;
      m.receiveShadow = false;
    });
    return { g, spiro, materials: [skin, joint, prop, propDark], meshes };
  }, []);

  useEffect(
    () => () => {
      rig.meshes.forEach((m) => m.geometry.dispose());
      rig.materials.forEach((m) => m.dispose());
    },
    [rig],
  );

  const tmp = useMemo(() => ({ a: new THREE.Euler(), q: new THREE.Quaternion(), qb: new THREE.Quaternion() }), []);

  useFrame((_, dt) => {
    const k = 1 - Math.pow(0.002, dt);
    smoothAct.current += (state.act - smoothAct.current) * k;
    const act = THREE.MathUtils.clamp(smoothAct.current, 0, KEYS.length - 1);
    const i = Math.min(Math.floor(act), KEYS.length - 2);
    const f = act - i;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const u = smooth(f);

    const r = root.current!;
    // Acompanha o giro da estação (o manequim fica no mesmo referencial do produto)
    r.rotation.y = state.rotSmooth;
    r.position.y = state.lift;
    const va = a.visible ?? true, vb = b.visible ?? true;
    const show = va && vb ? 1 : vb ? u : va ? 1 - u : 0;
    r.visible = show > 0.02 && state.explodeSmooth < 0.5;

    const bd = body.current!;
    const x = THREE.MathUtils.lerp(a.at[0], b.at[0], u);
    const z = THREE.MathUtils.lerp(a.at[1], b.at[1], u);
    // Sobe ou desce da plataforma no meio do trajeto
    const floor = THREE.MathUtils.lerp(a.at[2], b.at[2], smooth(THREE.MathUtils.clamp((f - 0.35) / 0.4, 0, 1)));
    bd.position.set(x, floor, z);
    bd.rotation.y = THREE.MathUtils.lerp(a.face, b.face, u) * D2R;
    // Aparece/some escalando de leve (sem piscar)
    const sc = 0.9 + 0.1 * Math.min(1, show);
    bd.scale.setScalar(sc);

    // Pose: mistura das duas chaves, mais a passada quando caminha
    const walking = a.walk ? Math.sin(Math.PI * f) : 0;
    const dist = Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1]);
    const phase = f * Math.max(1, Math.round(dist / 0.55)) * Math.PI * 2;
    const swing = 26 * walking;
    for (const j of JOINTS) {
      const pa = a.pose[j] ?? [0, 0, 0];
      const pb = b.pose[j] ?? [0, 0, 0];
      let ax = THREE.MathUtils.lerp(pa[0], pb[0], u);
      const ay = THREE.MathUtils.lerp(pa[1], pb[1], u);
      const az = THREE.MathUtils.lerp(pa[2], pb[2], u);
      if (walking > 0) {
        const s = Math.sin(phase);
        if (j === "hipL") ax += -swing * s;
        if (j === "hipR") ax += swing * s;
        if (j === "knL") ax += swing * 1.2 * Math.max(0, -Math.cos(phase - 0.6));
        if (j === "knR") ax += swing * 1.2 * Math.max(0, Math.cos(phase - 0.6));
        if (j === "shL") ax += swing * 0.6 * s;
        if (j === "shR") ax += -swing * 0.6 * s;
      }
      rig.g[j].rotation.set(ax * D2R, ay * D2R, az * D2R, "XYZ");
    }
    // Pequeno balanço vertical da passada
    rig.g.pelvis.position.y = M.pelvisY + (walking > 0 ? Math.abs(Math.cos(phase)) * 0.012 * walking : 0);
    // Respiração sutil quando parado
    rig.g.spine.scale.set(1, 1, 1 + 0.012 * Math.sin(performance.now() / 700) * (1 - walking));
    rig.spiro.visible = (a.spiro && u < 0.85) || (b.spiro && u > 0.15) ? true : false;
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <primitive object={rig.g.pelvis} />
      </group>
    </group>
  );
}
