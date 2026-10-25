"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useLoader, useThree } from "@react-three/fiber";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";
import type { StationState } from "./stationState";
import { SCREEN_H, SCREEN_W, SCREENS } from "./screenUi";
import { U_H, U_W } from "./screenKit";
import { keyCenter, STUDENT_ID } from "./screenPagesA";
import { BX, BY, CELLS, GRID_X, GRID_Y } from "./screenPagesB";
import { STATION_DIMS } from "./StationModel";

// Criança (11 anos, 1,48 m) que demonstra cada avaliação na história da estação.
// Malha: personagem gerado no MakeHuman (MPFB, recursos CC0), com esqueleto de 53 ossos; arquivo em public/models.
// As poses são resolvidas aqui: ângulos por articulação (cinemática direta) e alvos para mãos e pés (cinemática inversa
// de dois ossos), para que o dedo toque o vidro da tela sem atravessá-lo e os pés fiquem sobre os eletrodos.
// Referencial do corpo: metros, y para cima, a criança olha para +z; a esquerda dela fica em +x; origem no chão, entre os pés.

export const CHILD_URL = "/models/crianca.glb";

type V3 = [number, number, number];
const JOINTS = ["pelvis", "spine", "neck", "head", "shL", "elL", "wrL", "shR", "elR", "wrR", "hipL", "knL", "anL", "hipR", "knR", "anR"] as const;
type Joint = (typeof JOINTS)[number];
const JOINT_BONES: Record<Joint, string[]> = {
  pelvis: ["pelvis"],
  spine: ["spine_01", "spine_02", "spine_03"],
  neck: ["neck_01"],
  head: ["head"],
  shL: ["upperarm_l"],
  elL: ["lowerarm_l"],
  wrL: ["hand_l"],
  shR: ["upperarm_r"],
  elR: ["lowerarm_r"],
  wrR: ["hand_r"],
  hipL: ["thigh_l"],
  knL: ["calf_l"],
  anL: ["foot_l"],
  hipR: ["thigh_r"],
  knR: ["calf_r"],
  anR: ["foot_r"],
};

/** Alvo de um braço. A mão vai até `tip` (ponta do indicador) ou `wrist` (punho). */
type Arm = {
  /** Espaço do alvo: estação, corpo, ou relativo à boca/olho (no referencial da cabeça). */
  space: "station" | "body" | "mouth" | "eyeL";
  tip?: V3;
  wrist?: V3;
  /** Para onde o cotovelo aponta (corpo). */
  pole: V3;
  /** Giro do antebraço (graus): 0 = palma para baixo com o antebraço à frente; 90 = palma para dentro. */
  twist?: number;
  /** Punho (graus, eixos do corpo com o braço pendurado). */
  bend?: V3;
  /** Para onde a palma vira (corpo); se dado, define o giro do antebraço. */
  palm?: V3;
  /** Orientação da mão (corpo): direção dos dedos; com `palm`, a mão fica exatamente assim (o punho dobra). */
  fingers?: V3;
};
type Grip = "relax" | "point" | "flat" | "hold";
type Pose = {
  fk?: Partial<Record<Joint, V3>>;
  /** Deslocamento da bacia (m, corpo). */
  pelvis?: V3;
  /** Perna que fica livre (cinemática direta); as outras ficam apoiadas no lugar dos pés. */
  free?: ("L" | "R")[];
  armL?: Arm | "screen";
  armR?: Arm | "screen";
  handL?: Grip;
  handR?: Grip;
  /** Para onde olha: "hand" = alvo da mão direita; ou um ponto da estação; null = à frente. */
  look?: "hand" | V3 | null;
  /** Olhos fechados (0 a 1). */
  eyes?: number;
};
type Key = {
  /** Origem do corpo no piso (x, z da estação) e altura do piso (vidro dos eletrodos = PAD_TOP). */
  at: V3;
  /** Para onde olha (graus em y; 180 = de frente para a torre). */
  face: number;
  pose: Pose;
  walk?: boolean;
  spiro?: boolean;
  visible?: boolean;
};

const { TOWER, SCREEN, BASE } = STATION_DIMS;
const PAD_TOP = 0.0683;
// Pés sobre os eletrodos: calcanhar no eletrodo de trás, dedos no da frente
const FEET_Z = 0.53;
const STANCE_X = 0.104;

// Tela: coordenadas de desenho (1080 × 1920) → estação (rente ao vidro)
const SCREEN_TOP = TOWER.y1 - TOWER.screenMargin;
const SK = SCREEN_W / U_W;
const SOY = (SCREEN_H - U_H * SK) / 2;
function screenPoint(xd: number, yd: number, out: THREE.Vector3) {
  return out.set((xd / U_W - 0.5) * SCREEN.w, SCREEN_TOP - ((SOY + yd * SK) / SCREEN_H) * SCREEN.h, TOWER.glassZ);
}

// ---------------------------------------------------------------- poses
const STAND: Pose = { fk: { shL: [2, 0, 9], shR: [2, 0, -9], elL: [-10, 0, 0], elR: [-10, 0, 0] }, handL: "relax", handR: "relax" };
// Bioimpedância e altura: ereta, braços afastados do corpo
const BIA: Pose = { fk: { shL: [0, 0, 20], shR: [0, 0, -20], elL: [-6, 0, 0], elR: [-6, 0, 0] }, handL: "relax", handR: "relax" };
// Toque na tela com o indicador direito (o alvo vem da tela); a outra mão solta
const TAP: Pose = {
  fk: { spine: [7, 0, 0], shL: [2, 0, 9], elL: [-12, 0, 0] },
  armR: "screen",
  handR: "point",
  handL: "relax",
  look: "hand",
};
// Equilíbrio: numa perna só (a direita), mãos juntas diante do peito, olhos fechados
const BALANCE: Pose = {
  pelvis: [-0.03, 0, 0],
  fk: { pelvis: [0, 0, -2], spine: [0, 0, 2], hipL: [-55, 0, -2], knL: [85, 0, 0], anL: [-15, 0, 0], neck: [6, 0, 0] },
  free: ["L"],
  armL: { space: "body", wrist: [0.024, 1.0, 0.19], pole: [1, -0.8, -0.4], palm: [-1, 0, 0], fingers: [0, 0.8, 0.6] },
  armR: { space: "body", wrist: [-0.024, 1.0, 0.19], pole: [-1, -0.8, -0.4], palm: [1, 0, 0], fingers: [0, 0.8, 0.6] },
  handL: "flat",
  handR: "flat",
  eyes: 1,
};
// Espirometria: espirômetro na boca, segurado com a mão direita e apoiado pela esquerda
const SPIRO: Pose = {
  fk: { spine: [3, 0, 0] },
  armR: { space: "mouth", wrist: [-0.035, -0.06, 0.1], pole: [-1, -1, -0.2], twist: 20 },
  armL: { space: "mouth", wrist: [0.04, -0.07, 0.11], pole: [1, -1, -0.2], twist: 20 },
  handR: "hold",
  handL: "hold",
};
// Visão: a mão esquerda cobre o olho esquerdo; a direita aponta para onde abre o "E"
const VISION: Pose = {
  armL: { space: "eyeL", wrist: [0.015, -0.095, 0.035], pole: [1, -0.45, -0.1], palm: [0, 0, -1], fingers: [-0.25, 1, 0.1] },
  fk: { shR: [-80, 0, -45], elR: [-8, 0, 0], wrR: [0, 0, 0] },
  handL: "flat",
  handR: "point",
};
// Resultado: em pé ao lado da torre, olhando a pontuação na tela
const RESULT: Pose = { ...STAND, look: [0, 1.36, 0.04] };
// Postura (câmera da estação): ereta, braços afastados do corpo
const POSTURE: Pose = { fk: { shL: [0, 0, 26], shR: [0, 0, -26], elL: [-4, 0, 0], elR: [-4, 0, 0] }, handL: "relax", handR: "relax" };

/** Linha do tempo: `state.act` percorre as chaves (0, 1, 2, …). */
const MARK_Z = 2.6; // marca no chão a 2,5 m da tela (olhos a ~2,55 m do vidro)
const KEYS: Key[] = [
  { at: [1.5, 1.6, 0], face: 230, pose: STAND, walk: true, visible: false }, // 0 fora de cena
  { at: [0.0, 1.08, 0], face: 180, pose: STAND, walk: true }, // 1 chega diante da estação
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: STAND }, // 2 sobe na plataforma
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: TAP }, // 3 digita a matrícula e aceita o termo
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: BIA }, // 4 altura e composição corporal
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: BIA }, // 5
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: TAP }, // 6 toca INICIAR (equilíbrio)
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: BALANCE }, // 7 equilíbrio
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: TAP }, // 8 agilidade
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: SPIRO, spiro: true }, // 9 espirometria
  { at: [0.0, FEET_Z, PAD_TOP], face: 180, pose: STAND, walk: true }, // 10 devolve o espirômetro
  { at: [0.0, FEET_Z, PAD_TOP], face: 360, pose: STAND, walk: true }, // 11 vira no lugar, de costas para a torre
  { at: [0.04, 0.92, 0], face: 360, pose: STAND, walk: true }, // 12 desce da plataforma de frente
  { at: [0.03, MARK_Z - 0.12, 0], face: 360, pose: STAND, walk: true }, // 13 caminha até a marca
  { at: [0.0, MARK_Z, 0], face: 180, pose: VISION }, // 14 visão: vira para a tela, cobre um olho e aponta
  { at: [0.0, MARK_Z, 0], face: 180, pose: POSTURE, walk: true }, // 15 postura de frente
  { at: [0.0, MARK_Z, 0], face: 90, pose: POSTURE, walk: true }, // 16 postura de lado (sai andando)
  { at: [-0.47, 0.36, 0], face: 126, pose: RESULT }, // 17 ao lado da torre, olha o próprio resultado na tela
  // Some antes da vista explodida, muda de lugar invisível e reaparece: nunca atravessa a estação
  { at: [-0.47, 0.36, 0], face: 126, pose: RESULT, visible: false }, // 18
  { at: [-0.62, 0.45, 0], face: 20, pose: STAND, visible: false }, // 19
  { at: [-0.62, 0.45, 0], face: 20, pose: STAND }, // 20 fecho: ao lado esquerdo da estação, virada para quem vê
];

// Dedos: flexão (graus) de cada falange, somada à pose de repouso: indicador, médio, anelar, mínimo, polegar
const GRIPS: Record<Grip, [V3, V3, V3, V3, V3]> = {
  relax: [[8, 12, 8], [12, 16, 10], [14, 18, 10], [16, 20, 10], [0, 6, 6]],
  point: [[-6, -10, -8], [70, 95, 55], [75, 95, 55], [80, 95, 55], [10, 30, 25]],
  flat: [[-4, -8, -6], [-4, -8, -6], [-4, -8, -6], [-4, -8, -6], [0, 0, 0]],
  hold: [[45, 60, 35], [50, 65, 35], [55, 65, 35], [60, 65, 35], [10, 20, 20]],
};
const FINGERS = ["index", "middle", "ring", "pinky", "thumb"] as const;
/** Quanto cada mão fecha o leque dos dedos (fração do ângulo até o dedo médio). */
const SPREAD: Record<Grip, number> = { relax: 0.55, point: 0.4, flat: 0.8, hold: 0.6 };

const smooth = (t: number) => t * t * (3 - 2 * t);
const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t);
const D2R = Math.PI / 180;
const DOWN = new THREE.Vector3(0, -1, 0);
const HINGE_ARM = new THREE.Vector3(-1, 0, 0);
const HINGE_LEG = new THREE.Vector3(1, 0, 0);

// Pontos do rosto no repouso (corpo), medidos na malha
const MOUTH = new THREE.Vector3(0, 1.296, 0.128);
const EYE_L = new THREE.Vector3(0.031, 1.3745, 0.128);
const EYES = new THREE.Vector3(0, 1.3745, 0.128);

type Rig = ReturnType<typeof buildRig>;

function buildRig(scene: THREE.Object3D) {
  scene.updateMatrixWorld(true);
  const all: THREE.Bone[] = [];
  scene.traverse((o) => (o as THREE.Bone).isBone && all.push(o as THREE.Bone));
  const root = all.find((b) => !(b.parent as THREE.Bone)?.isBone)!;
  const bones: THREE.Bone[] = [];
  const visit = (b: THREE.Bone) => {
    bones.push(b);
    b.children.forEach((c) => (c as THREE.Bone).isBone && visit(c as THREE.Bone));
  };
  visit(root);
  const n = bones.length;
  const idx: Record<string, number> = {};
  bones.forEach((b, i) => (idx[b.name] = i));
  const parent = bones.map((b) => ((b.parent as THREE.Bone)?.isBone ? idx[b.parent!.name] : -1));
  const W0 = bones.map((b) => b.getWorldQuaternion(new THREE.Quaternion()));
  const P0 = bones.map((b) => b.getWorldPosition(new THREE.Vector3()));
  const L0 = bones.map((b) => b.quaternion.clone());
  const off = bones.map((b) => b.position.clone());
  const rootParentQ = root.parent!.getWorldQuaternion(new THREE.Quaternion());
  const dir0 = (a: string, b: string) => P0[idx[b]].clone().sub(P0[idx[a]]).normalize();

  // Referência "braços pendurados": gira braço e antebraço do repouso (pose em A) até apontarem para baixo
  const R = bones.map(() => new THREE.Quaternion());
  for (const s of ["l", "r"]) {
    const up = new THREE.Quaternion().setFromUnitVectors(dir0(`upperarm_${s}`, `lowerarm_${s}`), DOWN);
    const lowDir = dir0(`lowerarm_${s}`, `hand_${s}`).applyQuaternion(up);
    const low = new THREE.Quaternion().setFromUnitVectors(lowDir, DOWN).multiply(up);
    R[idx[`upperarm_${s}`]].copy(up);
    R[idx[`lowerarm_${s}`]].copy(low);
    // A mão e os dedos acompanham o antebraço
    const mark = (i: number) => {
      if (i !== idx[`lowerarm_${s}`] && i !== idx[`upperarm_${s}`]) R[i].copy(low);
      bones[i].children.forEach((c) => (c as THREE.Bone).isBone && mark(idx[c.name]));
    };
    mark(idx[`hand_${s}`]);
  }
  // Pernas: referência = repouso
  const legFrame0 = (a: string, b: string) => frame(dir0(a, b), HINGE_LEG, new THREE.Quaternion());

  const fingerBones = (s: string) => FINGERS.map((f) => [1, 2, 3].map((k) => idx[`${f}_0${k}_${s}`]));
  // Eixos dos dedos (no referencial de cada falange): a flexão segue a curvatura de repouso do dedo médio (aponta para
  // a palma); a adução gira a primeira falange em direção ao dedo médio (fecha o leque dos dedos abertos da pose em A).
  const fingerAxes = (s: string) => {
    const p = (b: string) => P0[idx[`${b}_${s}`]];
    const d1 = p("middle_02").clone().sub(p("middle_01")).normalize();
    const d2 = p("middle_03").clone().sub(p("middle_02")).normalize();
    const palm = d2.clone().addScaledVector(d1, -d2.dot(d1)).normalize();
    const inv = (i: number) => W0[i].clone().invert();
    return FINGERS.map((f) => {
      const chain = [1, 2, 3].map((k) => idx[`${f}_0${k}_${s}`]);
      const dirs = chain.map((bi, k) => (k < 2 ? P0[chain[k + 1]].clone().sub(P0[bi]) : P0[bi].clone().sub(P0[chain[1]])).normalize());
      const curl = chain.map((bi, k) => dirs[k].clone().cross(palm).normalize().applyQuaternion(inv(bi)));
      const mid = d1;
      const ax = dirs[0].clone().cross(mid);
      const ang = Math.asin(Math.min(1, ax.length()));
      const spread = ax.lengthSq() > 1e-8 ? ax.normalize().applyQuaternion(inv(chain[0])) : new THREE.Vector3(1, 0, 0);
      return { curl, spread, ang };
    });
  };
  // Normal da palma no referencial da mão (para o lado em que os dedos dobram)
  const palmLocal = (s: string) => {
    const p = (b: string) => P0[idx[`${b}_${s}`]];
    const d1 = p("middle_02").clone().sub(p("middle_01")).normalize();
    const d2 = p("middle_03").clone().sub(p("middle_02")).normalize();
    return d2.addScaledVector(d1, -d2.dot(d1)).normalize().applyQuaternion(W0[idx[`hand_${s}`]].clone().invert());
  };
  // Base (dedos, palma) no referencial da mão, invertida
  const handFrame = (s: string) => {
    const hi = idx[`hand_${s}`];
    const fd = P0[idx[`middle_01_${s}`]].clone().sub(P0[hi]).normalize().applyQuaternion(W0[hi].clone().invert());
    return frame(fd, palmLocal(s), new THREE.Quaternion()).invert();
  };
  // Ponta do indicador no referencial da última falange (o osso aponta para +y local)
  const tipLocal = (s: string) => new THREE.Vector3(0, off[idx[`index_03_${s}`]].length() * 1.0, 0);

  return {
    bones,
    n,
    idx,
    parent,
    W0,
    P0,
    L0,
    off,
    R,
    rootParentQ,
    legFrame0: { L: [legFrame0("thigh_l", "calf_l"), legFrame0("calf_l", "foot_l")], R: [legFrame0("thigh_r", "calf_r"), legFrame0("calf_r", "foot_r")] },
    fingers: { L: fingerBones("l"), R: fingerBones("r") },
    fingerAxes: { L: fingerAxes("l"), R: fingerAxes("r") },
    palm: { L: palmLocal("l"), R: palmLocal("r") },
    handFrameInv: { L: handFrame("l"), R: handFrame("r") },
    tip: { L: tipLocal("l"), R: tipLocal("r") },
    ankle0: { L: P0[idx.foot_l].clone(), R: P0[idx.foot_r].clone() },
    head0: P0[idx.head].clone(),
  };
}

/** Quatérnio da base ortonormal (d, n', d × n') com n' = n sem a componente em d. */
function frame(d: THREE.Vector3, n: THREE.Vector3, out: THREE.Quaternion) {
  const x = d.clone().normalize();
  const y = n.clone().addScaledVector(x, -n.dot(x)).normalize();
  const z = new THREE.Vector3().crossVectors(x, y);
  return out.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
}

const ARM_FRAME0 = frame(DOWN, HINGE_ARM, new THREE.Quaternion());

/** Contexto da resolução de uma pose: corpo no mundo da estação e estado da tela. */
type Ctx = { at: V3; face: number; state: StationState };

class Solver {
  rig: Rig;
  W: THREE.Quaternion[];
  P: THREE.Vector3[];
  D: THREE.Quaternion[];
  out: THREE.Quaternion[];
  pelvisOff = new THREE.Vector3();
  goalR = new THREE.Vector3();
  hasGoalR = false;
  private q = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private e = new THREE.Euler();
  private v = new THREE.Vector3();
  private v2 = new THREE.Vector3();

  constructor(rig: Rig) {
    this.rig = rig;
    this.W = rig.bones.map(() => new THREE.Quaternion());
    this.P = rig.bones.map(() => new THREE.Vector3());
    this.D = rig.bones.map(() => new THREE.Quaternion());
    this.out = rig.bones.map(() => new THREE.Quaternion());
  }

  /** Converte um ponto da estação para o corpo posicionado em `ctx`. */
  toBody(p: THREE.Vector3, ctx: Ctx) {
    p.x -= ctx.at[0];
    p.y -= ctx.at[2];
    p.z -= ctx.at[1];
    return p.applyAxisAngle(THREE.Object3D.DEFAULT_UP, -ctx.face * D2R);
  }

  /** Alvo da ponta do dedo vindo da tela (coordenadas do corpo). */
  screenGoal(ctx: Ctx, out: THREE.Vector3) {
    const st = ctx.state;
    const id = SCREENS[THREE.MathUtils.clamp(Math.round(st.screen), 0, SCREENS.length - 1)];
    const t = st.screenT;
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    let press = 0;
    const win = (x: number, x0: number, x1: number, e = 0.08) => Math.min(smooth(clamp01((x - x0) / e)), smooth(clamp01((x1 - x) / e)));
    if (id === "inicio") {
      // 8 teclas; a tecla k acende entre k + 0,12 e k + 0,78 (o dedo encosta nesse intervalo)
      const s = clamp01(t) * STUDENT_ID.length;
      const k = Math.min(STUDENT_ID.length - 1, Math.floor(s + 0.22));
      const m = smooth(clamp01((s - (k - 0.22)) / 0.34));
      const c0 = keyCenter(STUDENT_ID[Math.max(0, k - 1)]);
      const c1 = keyCenter(STUDENT_ID[k]);
      screenPoint(c0.x, c0.y + 12, a);
      screenPoint(c1.x, c1.y + 12, b);
      a.lerp(b, k === 0 ? 1 : m);
      press = t >= 1 ? 0 : win(s - k, 0.1, 0.8, 0.07);
    } else if (id === "consentimento") {
      screenPoint(627, 1074, a);
      press = win(t, 0.5, 0.72);
    } else if (id === "agilidade") {
      const T0 = 0.08;
      if (t < T0) {
        screenPoint(BX, BY + 20, a);
        press = win(t, 0.015, 0.07, 0.015);
      } else {
        const f = clamp01((t - T0) / 0.8) * 5;
        const k = Math.min(4, Math.floor(f));
        const ff = f - k;
        const cell = (i: number, o: THREE.Vector3) => screenPoint(GRID_X[i % 3] + 66, GRID_Y[Math.floor(i / 3)] + 80, o);
        if (k === 0) screenPoint(BX, BY + 20, a);
        else cell(CELLS[k - 1], a);
        cell(CELLS[k], b);
        a.lerp(b, smooth(clamp01((ff - 0.12) / 0.5)));
        press = t >= 0.88 ? 0 : win(ff, 0.66, 0.9, 0.06);
      }
    } else {
      // INICIAR do equilíbrio (toca enquanto a tela está parada, antes do cronômetro) e qualquer outra tela: o botão do alto
      screenPoint(BX, BY + 20, a);
      press = id === "equilibrio" ? win(t, 0.006, 0.019, 0.004) : 0;
    }
    // Encostado: polpa do dedo rente ao vidro; solto: 3 cm à frente
    a.z += 0.0095 + (1 - press) * 0.03;
    out.copy(this.toBody(a, ctx));
  }

  /** Resolve a pose no referencial do corpo posto em `ctx`; `swing` soma ângulos (balanço dos braços ao caminhar). */
  solve(pose: Pose, ctx: Ctx, swing: Partial<Record<Joint, V3>> | null) {
    const { rig, W, P, D } = this;
    const { idx, parent, W0, R, off } = rig;
    const fk = pose.fk ?? {};
    const angles = (j: Joint): V3 => {
      const a = fk[j] ?? [0, 0, 0];
      const g = swing?.[j];
      return g ? [a[0] + g[0], a[1] + g[1], a[2] + g[2]] : a;
    };
    // Alvo da mão direita vindo da tela (também serve para o olhar)
    this.hasGoalR = pose.armR === "screen";
    if (this.hasGoalR) this.screenGoal(ctx, this.goalR);
    const free = pose.free ?? [];

    // 1) Cinemática direta
    const E = new Map<number, THREE.Quaternion>();
    for (const j of JOINTS) {
      const [ax, ay, az] = angles(j);
      if (!ax && !ay && !az) continue;
      const q = new THREE.Quaternion().setFromEuler(this.e.set(ax * D2R, ay * D2R, az * D2R, "XYZ"));
      const list = JOINT_BONES[j];
      list.forEach((b) => E.set(idx[b], list.length > 1 ? new THREE.Quaternion().slerp(q, 1 / list.length) : q));
    }
    this.pelvisOff.set(...(pose.pelvis ?? [0, 0, 0]));
    for (let i = 0; i < rig.n; i++) {
      const p = parent[i];
      D[i].copy(p >= 0 ? D[p] : this.q.identity());
      const e = E.get(i);
      if (e) D[i].multiply(e);
      // Cabeça: olha para o alvo (pescoço 40%, cabeça 60%)
      if ((i === idx.neck_01 || i === idx.head) && pose.look && (pose.look !== "hand" || this.hasGoalR)) {
        const target = this.v2;
        if (pose.look === "hand") target.copy(this.goalR);
        else this.toBody(target.set(...pose.look), ctx);
        const eye = this.v.copy(EYES).sub(rig.head0).applyQuaternion(D[p]).add(P[p]);
        const dir = target.sub(eye).normalize().applyQuaternion(this.q2.copy(D[p]).invert());
        const pitch = Math.atan2(-dir.y, Math.hypot(dir.x, dir.z));
        const yaw = Math.atan2(dir.x, dir.z);
        const share = i === idx.neck_01 ? 0.4 : 0.6;
        // a parte do pescoço já entrou em D[p] quando i é a cabeça
        D[i].multiply(this.q.setFromEuler(this.e.set(pitch * share, yaw * share, 0, "YXZ")));
      }
      W[i].copy(D[i]).multiply(R[i]).multiply(W0[i]);
      if (p >= 0) P[i].copy(off[i]).applyQuaternion(W[p]).add(P[p]);
      else P[i].copy(off[i]).applyQuaternion(rig.rootParentQ);
      if (i === idx.pelvis) P[i].add(this.pelvisOff);
    }

    // 2) Pernas apoiadas: tornozelo no lugar de apoio, pé reto no chão (ao caminhar, a passada final segue as pegadas)
    for (const s of ["L", "R"] as const) {
      if (free.includes(s)) continue;
      const l = s.toLowerCase();
      const target = this.v.set(s === "L" ? STANCE_X : -STANCE_X, rig.ankle0[s].y, rig.ankle0[s].z);
      this.twoBone(idx[`thigh_${l}`], idx[`calf_${l}`], idx[`foot_${l}`], target, new THREE.Vector3(0, 0, 1), rig.legFrame0[s][0], rig.legFrame0[s][1], 0, null, true);
    }

    // 3) Braços com alvo
    for (const s of ["L", "R"] as const) {
      const arm = s === "R" ? pose.armR : pose.armL;
      if (!arm) continue;
      const l = s.toLowerCase();
      const sh = idx[`upperarm_${l}`], el = idx[`lowerarm_${l}`], wr = idx[`hand_${l}`];
      const side = s === "L" ? 1 : -1;
      let spec: Arm;
      const goal = new THREE.Vector3();
      if (arm === "screen") {
        spec = { space: "body", tip: [0, 0, 0], pole: [-0.5, -1, -0.15], twist: 45, bend: [-12, 0, 0] };
        goal.copy(this.goalR);
      } else {
        spec = arm;
        const src = (spec.tip ?? spec.wrist)!;
        goal.set(...src);
        if (spec.space === "station") this.toBody(goal, ctx);
        else if (spec.space === "mouth" || spec.space === "eyeL") {
          // relativo ao rosto: segue a cabeça
          const h = idx.head;
          const base = spec.space === "mouth" ? MOUTH : EYE_L;
          goal.add(this.v.copy(base).sub(rig.head0)).applyQuaternion(D[h]).add(P[h]);
        }
      }
      const pole = new THREE.Vector3(...spec.pole);
      const palm = spec.palm ? new THREE.Vector3(...spec.palm).normalize() : null;
      const fingers = spec.fingers ? new THREE.Vector3(...spec.fingers).normalize() : null;
      const twist = (spec.twist ?? 0) * D2R * -side;
      const bend = spec.bend ? new THREE.Quaternion().setFromEuler(this.e.set(spec.bend[0] * D2R, spec.bend[1] * D2R, spec.bend[2] * D2R, "XYZ")) : null;
      if (spec.tip) {
        // Ponta do dedo no alvo: corrige o alvo do punho algumas vezes
        const wt = goal.clone();
        for (let it = 0; it < 4; it++) {
          this.twoBone(sh, el, wr, wt, pole, ARM_FRAME0, ARM_FRAME0, twist, bend, false, palm, s, fingers);
          const tip = this.fingerTip(s, (s === "L" ? pose.handL : pose.handR) ?? "relax");
          wt.add(this.v.copy(goal).sub(tip));
        }
      } else this.twoBone(sh, el, wr, goal, pole, ARM_FRAME0, ARM_FRAME0, twist, bend, false, palm, s, fingers);
    }

    // 4) Rotações locais e dedos
    const out = this.out;
    for (let i = 0; i < rig.n; i++) {
      const p = parent[i];
      out[i].copy(p >= 0 ? this.q.copy(W[p]).invert() : this.q.copy(rig.rootParentQ).invert()).multiply(W[i]);
    }
    for (const s of ["L", "R"] as const) {
      const name = (s === "L" ? pose.handL : pose.handR) ?? "relax";
      const grip = GRIPS[name];
      const close = SPREAD[name];
      rig.fingers[s].forEach((chain, f) => {
        const ax = rig.fingerAxes[s][f];
        if (f < 4 && close) out[chain[0]].multiply(this.q.setFromAxisAngle(ax.spread, ax.ang * close));
        chain.forEach((bi, k) => {
          const a = grip[f][k] * D2R;
          if (a) out[bi].multiply(this.q.setFromAxisAngle(ax.curl[k], a));
        });
      });
    }
    return out;
  }

  /** W e P (corpo) a partir das rotações locais dos ossos e da posição local da bacia. */
  fromLocals(locals: THREE.Quaternion[], pelvisLocal: THREE.Vector3) {
    const { rig, W, P } = this;
    for (let i = 0; i < rig.n; i++) {
      const p = rig.parent[i];
      const pos = i === rig.idx.pelvis ? pelvisLocal : rig.off[i];
      if (p >= 0) {
        W[i].copy(W[p]).multiply(locals[i]);
        P[i].copy(pos).applyQuaternion(W[p]).add(P[p]);
      } else {
        W[i].copy(rig.rootParentQ).multiply(locals[i]);
        P[i].copy(pos).applyQuaternion(rig.rootParentQ);
      }
    }
  }

  /** Rotação local de i a partir de W. */
  local(i: number, out: THREE.Quaternion) {
    const p = this.rig.parent[i];
    return out.copy(p >= 0 ? this.q.copy(this.W[p]).invert() : this.q.copy(this.rig.rootParentQ).invert()).multiply(this.W[i]);
  }

  /** Perna até o tornozelo `target` (corpo), pé com guinada `yaw` e arfagem `pitch` (corpo). */
  plantLeg(s: "L" | "R", target: THREE.Vector3, yaw: number, pitch: number) {
    const { rig } = this;
    const l = s.toLowerCase();
    const c = rig.idx[`foot_${l}`];
    this.twoBone(rig.idx[`thigh_${l}`], rig.idx[`calf_${l}`], c, target, new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), rig.legFrame0[s][0], rig.legFrame0[s][1], 0, null, true);
    this.W[c].setFromAxisAngle(AXIS_Y, yaw).multiply(this.q.setFromAxisAngle(AXIS_X, pitch)).multiply(rig.W0[c]);
  }

  /** Leva o punho até `target` mexendo o mínimo no braço (mantém o lado do cotovelo e a orientação da mão). */
  nudgeArm(s: "L" | "R", target: THREE.Vector3) {
    const { rig, W, P } = this;
    const l = s.toLowerCase();
    const a = rig.idx[`upperarm_${l}`], b = rig.idx[`lowerarm_${l}`], c = rig.idx[`hand_${l}`];
    const S = P[a].clone(), E0 = P[b].clone(), H0 = P[c].clone();
    const la = rig.off[b].length(), lb = rig.off[c].length();
    const d = target.clone().sub(S);
    const dist = THREE.MathUtils.clamp(d.length(), Math.abs(la - lb) + 1e-3, la + lb - 1e-4);
    const u = d.normalize();
    const v = E0.clone().sub(S);
    v.addScaledVector(u, -v.dot(u)).normalize();
    const cosA = (la * la + dist * dist - lb * lb) / (2 * la * dist);
    const E = S.clone().addScaledVector(u, la * cosA).addScaledVector(v, la * Math.sqrt(Math.max(0, 1 - cosA * cosA)));
    const T = S.clone().addScaledVector(u, dist);
    const hand = W[c].clone();
    W[a].premultiply(this.q.setFromUnitVectors(E0.clone().sub(S).normalize(), E.clone().sub(S).normalize()));
    W[b].premultiply(this.q.setFromUnitVectors(H0.clone().sub(E0).normalize(), T.clone().sub(E).normalize()));
    W[c].copy(hand);
    P[b].copy(E);
    P[c].copy(T);
    return [a, b, c];
  }

  /** Posição da ponta do indicador (corpo), com a pose atual de W/P e a flexão do indicador em `grip`. */
  fingerTip(s: "L" | "R", grip: Grip) {
    const { rig, W, P } = this;
    const l = s.toLowerCase();
    const chain = rig.fingers[s][0];
    const ax = rig.fingerAxes[s][0];
    const wr = rig.idx[`hand_${l}`];
    const pos = P[wr].clone();
    let q = W[wr].clone();
    chain.forEach((bi, k) => {
      pos.add(this.v.copy(rig.off[bi]).applyQuaternion(q));
      q = q.clone().multiply(rig.L0[bi]);
      if (k === 0) q.multiply(this.q.setFromAxisAngle(ax.spread, ax.ang * SPREAD[grip]));
      q.multiply(this.q.setFromAxisAngle(ax.curl[k], GRIPS[grip][0][k] * D2R));
    });
    return pos.add(this.v.copy(rig.tip[s]).applyQuaternion(q));
  }

  /**
   * IK de dois ossos (a → b → c) até `target` (posição de c). Atualiza W e P de a, b, c e de todos os descendentes de c
   * (que mantêm a rotação local de repouso). `f0a`/`f0b`: base de referência (direção do osso, eixo da dobra).
   */
  twoBone(
    a: number, b: number, c: number, target: THREE.Vector3, pole: THREE.Vector3, f0a: THREE.Quaternion, f0b: THREE.Quaternion,
    twist: number, bend: THREE.Quaternion | null, leg: boolean, palm: THREE.Vector3 | null = null, side: "L" | "R" = "R",
    fingers: THREE.Vector3 | null = null,
  ) {
    const { rig, W, P } = this;
    const la = rig.off[b].length(), lb = rig.off[c].length();
    const S = P[a];
    const d = this.v.copy(target).sub(S);
    const dist = THREE.MathUtils.clamp(d.length(), Math.abs(la - lb) + 1e-3, la + lb - 1e-4);
    const u = d.normalize().clone();
    const v = pole.clone().addScaledVector(u, -pole.dot(u));
    if (v.lengthSq() < 1e-8) v.set(0, 0, 1).addScaledVector(u, -u.z);
    v.normalize();
    const cosA = (la * la + dist * dist - lb * lb) / (2 * la * dist);
    const sinA = Math.sqrt(Math.max(0, 1 - cosA * cosA));
    const Ep = S.clone().addScaledVector(u, la * cosA).addScaledVector(v, la * sinA);
    const Tp = S.clone().addScaledVector(u, dist);
    const u1 = Ep.clone().sub(S).normalize();
    const l1 = Tp.clone().sub(Ep).normalize();
    // Eixo da dobra: braço (-x) e perna (+x) na referência; perna/braço esticados usam o polo
    const n1 = new THREE.Vector3().crossVectors(u1, l1);
    if (n1.lengthSq() < 1e-6) n1.crossVectors(u1, v).negate();
    n1.normalize();
    // Braço: a referência é a pose "pendurada" (R); perna: o repouso
    const fa = frame(u1, n1, new THREE.Quaternion());
    const fb = frame(l1, n1, new THREE.Quaternion());
    const Da = fa.multiply(f0a.clone().invert());
    const Db = fb.multiply(f0b.clone().invert());
    if (leg) {
      // perna: base de repouso já contém a direção real do osso
      W[a].copy(Da).multiply(rig.W0[a]);
      W[b].copy(Db).multiply(rig.W0[b]);
      // pé reto: mesma orientação do repouso (plantLeg ajusta depois)
      W[c].copy(rig.W0[c]);
    } else {
      if (palm) {
        // Giro que leva a palma (com giro zero) até a direção pedida, em torno do antebraço
        const hand0 = Db.clone();
        if (bend) hand0.multiply(bend);
        hand0.multiply(rig.R[c]).multiply(rig.W0[c]);
        const p0 = rig.palm[side].clone().applyQuaternion(hand0);
        p0.addScaledVector(l1, -p0.dot(l1));
        const pw = palm.clone().addScaledVector(l1, -palm.dot(l1));
        twist = Math.atan2(l1.dot(new THREE.Vector3().crossVectors(p0, pw)), p0.dot(pw));
      }
      const tw = new THREE.Quaternion().setFromAxisAngle(l1, twist);
      W[a].copy(Da).multiply(rig.R[a]).multiply(rig.W0[a]);
      W[b].copy(tw).slerp(this.q.identity(), 0.6).multiply(Db).multiply(rig.R[b]).multiply(rig.W0[b]);
      if (fingers && palm) {
        // Mão com orientação dada: base (dedos, palma) no corpo × inversa da base no referencial da mão
        frame(fingers, palm, W[c]).multiply(rig.handFrameInv[side]);
      } else {
        W[c].copy(tw).multiply(Db);
        if (bend) W[c].multiply(bend);
        W[c].multiply(rig.R[c]).multiply(rig.W0[c]);
      }
    }
    P[b].copy(rig.off[b]).applyQuaternion(W[a]).add(S);
    P[c].copy(rig.off[c]).applyQuaternion(W[b]).add(P[b]);
    // descendentes de c: rotação local de repouso
    const walk = (i: number) => {
      rig.bones[i].children.forEach((ch) => {
        const k = rig.idx[ch.name];
        if (k === undefined) return;
        W[k].copy(W[i]).multiply(rig.L0[k]);
        P[k].copy(rig.off[k]).applyQuaternion(W[i]).add(P[i]);
        walk(k);
      });
    };
    walk(c);
  }
}

const AXIS_X = new THREE.Vector3(1, 0, 0);
const AXIS_Y = new THREE.Vector3(0, 1, 0);

// Folga mínima entre a pele da mão e o vidro (o vértice mais à frente fica a ~5 mm do osso)
const GLASS_GAP = 0.006;
/** Pontos da mão (corpo): punho, juntas e pontas dos cinco dedos. */
function handPoints(sv: Solver, s: "L" | "R", out: THREE.Vector3[]) {
  const { rig, W, P } = sv;
  const l = s.toLowerCase();
  out[0].copy(P[rig.idx[`hand_${l}`]]);
  let n = 1;
  for (const f of FINGERS) {
    const b1 = rig.idx[`${f}_01_${l}`], b3 = rig.idx[`${f}_03_${l}`];
    out[n++].copy(P[b1]);
    out[n++].set(0, rig.off[b3].length() * 1.15, 0).applyQuaternion(W[b3]).add(P[b3]);
  }
  return out;
}

// ---------------------------------------------------------------- passos
/** Piso sob um ponto da estação: vidro dos eletrodos, tampo da bandeja ou chão. */
function groundAt(x: number, z: number) {
  if (Math.abs(x) < 0.2 && Math.abs(z - 0.47) < 0.2175) return PAD_TOP;
  if (Math.abs(x) < BASE.w / 2 + 0.005 && z > BASE.z0 - 0.005 && z < BASE.z0 + BASE.d + 0.005) return BASE.h;
  return 0;
}
// Pé no referencial do corpo: tornozelo a 6 cm do chão; calcanhar 5 cm atrás, dedos 17 cm à frente
const ANKLE_Z = 0.0093;
const HEEL = -0.06;
const TOE = 0.175;
type Foot = { x: number; z: number; yaw: number; ground: number; lift: number; pitch: number };

/** Pegada de um pé com o corpo no ponto w (0 a 1) do trecho a → b. */
function footprint(a: Key, b: Key, w: number, side: 1 | -1, out: Foot) {
  const bx = THREE.MathUtils.lerp(a.at[0], b.at[0], w);
  const bz = THREE.MathUtils.lerp(a.at[1], b.at[1], w);
  const yaw = THREE.MathUtils.lerp(a.face, b.face, w) * D2R;
  const c = Math.cos(yaw),
    sn = Math.sin(yaw);
  const lx = side * STANCE_X;
  out.x = bx + c * lx + sn * ANKLE_Z;
  out.z = bz - sn * lx + c * ANKLE_Z;
  out.yaw = yaw;
  out.ground = footGround(out.x, out.z, yaw);
  out.lift = 0;
  out.pitch = 0;
  return out;
}
// Contorno do pé: calcanhar, meio e dedos, nas duas bordas (o pé tem ~9 cm de largura)
const FOOT_PTS = [HEEL, 0.05, TOE].flatMap((d) => [-0.05, 0.05].map((w) => [d, w] as const));
/** Piso sob o pé inteiro (maior altura no contorno do pé). */
function footGround(x: number, z: number, yaw: number) {
  let g = 0;
  const c = Math.cos(yaw), sn = Math.sin(yaw);
  for (const [d, w] of FOOT_PTS) g = Math.max(g, groundAt(x + sn * d + c * w, z + c * d - sn * w));
  return g;
}
/** O pé ficaria meio no chão, meio na plataforma? */
function straddles(f: Foot) {
  const c = Math.cos(f.yaw), sn = Math.sin(f.yaw);
  let lo = 1, hi = -1;
  for (const [d, w] of FOOT_PTS) {
    const g = groundAt(f.x + sn * d + c * w, f.z + c * d - sn * w);
    lo = Math.min(lo, g);
    hi = Math.max(hi, g);
  }
  return hi - lo > 0.01;
}

/**
 * Pés ao caminhar de a para b com o corpo em u (0 a 1): n passos alternados (mais um para fechar o apoio) com pegadas ao
 * longo do trajeto; nenhuma pegada fica com o pé meio no chão, meio na plataforma; o pé que passa por cima da borda sobe o
 * bastante para os dedos não tocarem nela.
 */
const fp = { s0: {} as Foot, s1: {} as Foot };
function footsteps(a: Key, b: Key, u: number, out: { L: Foot; R: Foot }) {
  const dist = Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1]);
  const turn = Math.abs(b.face - a.face);
  const climb = Math.abs(b.at[2] - a.at[2]) > 0.01;
  const n = climb ? 1 : Math.max(2, Math.ceil(dist / 0.42), Math.ceil(turn / 50));
  const m = n + 1;
  const k = Math.min(m - 1, Math.floor(u * m));
  const t = u * m - k;
  const landing = (j: number, side: 1 | -1, o: Foot) => {
    // pegada do passo j (1..m); 0 = apoio inicial
    let w = j <= 0 ? 0 : Math.min(1, j / n);
    footprint(a, b, w, side, o);
    while (w < 1 && straddles(o)) {
      w = Math.min(1, w + 0.02);
      footprint(a, b, w, side, o);
    }
    return o;
  };
  // passo j move o pé direito (j ímpar) ou o esquerdo (j par)
  for (const side of [1, -1] as const) {
    const key = side === 1 ? "L" : "R";
    const parity = side === -1 ? 1 : 0;
    const j = k + 1;
    const moving = j % 2 === parity;
    // último passo completo deste pé
    let last = moving ? j - 2 : j - 1;
    if (last % 2 !== parity) last -= 1;
    const o = out[key];
    if (!moving) {
      landing(last, side, o);
      continue;
    }
    const s0 = landing(last, side, fp.s0);
    const s1 = landing(j, side, fp.s1);
    const e = smooth(t);
    o.x = THREE.MathUtils.lerp(s0.x, s1.x, e);
    o.z = THREE.MathUtils.lerp(s0.z, s1.z, e);
    o.yaw = THREE.MathUtils.lerp(s0.yaw, s1.yaw, e);
    // arco: sobe acima de qualquer piso no caminho (com os dedos à frente)
    let top = Math.max(s0.ground, s1.ground);
    for (let q = 0.1; q < 1; q += 0.1) top = Math.max(top, footGround(THREE.MathUtils.lerp(s0.x, s1.x, q), THREE.MathUtils.lerp(s0.z, s1.z, q), o.yaw));
    const climbH = top - Math.min(s0.ground, s1.ground);
    const H = (Math.hypot(s1.x - s0.x, s1.z - s0.z) > 0.02 ? 0.055 : 0.03) + climbH * 1.3;
    o.ground = THREE.MathUtils.lerp(s0.ground, s1.ground, smooth(clamp01((t - 0.2) / 0.55)));
    o.lift = H * Math.sin(Math.PI * t);
    o.pitch = 14 * D2R * Math.sin(Math.PI * t);
  }
  return out;
}

export default function Child({ state }: { state: StationState }) {
  const gltf = useLoader(GLTFLoader, CHILD_URL, (l) => (l as GLTFLoader).setMeshoptDecoder(MeshoptDecoder));
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const smoothAct = useRef(state.act);
  const blink = useRef({ at: -1, next: 2 });

  const kit = useMemo(() => {
    const scene = gltf.scene;
    const rig = buildRig(scene);
    const meshes: THREE.SkinnedMesh[] = [];
    scene.traverse((o) => {
      const m = o as THREE.SkinnedMesh;
      if (!m.isSkinnedMesh) return;
      m.frustumCulled = false;
      meshes.push(m);
      const mat = m.material as THREE.MeshStandardMaterial;
      // Polo branca de uniforme (a textura é cinza-claro)
      if (mat.name === "polo") mat.color.setScalar(1.75);
      // Roupa tem face dupla: o avesso (visto pela barra ou pela manga) fica na sombra, não aceso como o lado de fora
      if (mat.name === "polo" || mat.name === "pants") {
        mat.onBeforeCompile = (sh) => {
          sh.fragmentShader = sh.fragmentShader.replace("#include <color_fragment>", "#include <color_fragment>\n  if (!gl_FrontFacing) diffuseColor.rgb *= 0.22;");
        };
        mat.customProgramCacheKey = () => "cloth-backface";
      }
    });
    // Espirômetro portátil: corpo branco com bocal azul (eixo +z = para a boca)
    const spiro = new THREE.Group();
    const white = new THREE.MeshStandardMaterial({ color: "#eef1f4", roughness: 0.35 });
    const blue = new THREE.MeshStandardMaterial({ color: "#2f7fd8", roughness: 0.4 });
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.019, 0.021, 0.13, 24), white);
    tube.rotation.x = Math.PI / 2;
    tube.position.z = -0.075;
    spiro.add(tube);
    const mouth = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.017, 0.035, 20), blue);
    mouth.rotation.x = Math.PI / 2;
    mouth.position.z = 0.0;
    spiro.add(mouth);
    spiro.visible = false;
    const solver = { a: new Solver(rig), b: new Solver(rig), post: new Solver(rig) };
    const materials = [...new Set(meshes.map((m) => m.material as THREE.MeshStandardMaterial))];
    // Pálpebras (morph "olhos" no corpo e nos cílios)
    const lids = meshes.filter((m) => m.morphTargetDictionary?.olhos !== undefined);
    return { scene, rig, meshes, spiro, solver, materials, lids, disposables: [white, blue, tube.geometry, mouth.geometry] };
  }, [gltf]);

  useEffect(() => () => kit.disposables.forEach((d) => d.dispose()), [kit]);

  // Compila de antemão a variante esmaecida dos materiais (evita um engasgo na primeira vez que a criança aparece)
  const { gl, camera, scene } = useThree();
  useEffect(() => {
    const was = root.current?.visible ?? true;
    if (root.current) root.current.visible = true;
    kit.materials.forEach((m) => ((m.alphaHash = true), (m.needsUpdate = true)));
    gl.compile(scene, camera);
    kit.materials.forEach((m) => ((m.alphaHash = false), (m.needsUpdate = true)));
    gl.compile(scene, camera);
    if (root.current) root.current.visible = was;
  }, [kit, gl, camera, scene]);

  const tmp = useMemo(
    () => ({
      q: new THREE.Quaternion(),
      q2: new THREE.Quaternion(),
      v: new THREE.Vector3(),
      m: new THREE.Vector3(),
      t: new THREE.Vector3(),
      w: new THREE.Vector3(),
      o: new THREE.Vector3(),
      zb: new THREE.Vector3(),
      pl: new THREE.Vector3(),
      fk: [new THREE.Quaternion(), new THREE.Quaternion(), new THREE.Quaternion()],
      locals: kit.rig.bones.map(() => new THREE.Quaternion()),
      pts: Array.from({ length: 11 }, () => new THREE.Vector3()),
      feet: { L: {} as Foot, R: {} as Foot },
    }),
    [kit],
  );


  const update = (dt: number) => {
    const k = 1 - Math.pow(0.002, dt);
    smoothAct.current += (state.act - smoothAct.current) * k;
    const act = THREE.MathUtils.clamp(smoothAct.current, 0, KEYS.length - 1);
    const i = Math.min(Math.floor(act), KEYS.length - 2);
    const f = act - i;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const u = smooth(f);

    const r = root.current!;
    r.rotation.y = state.rotSmooth;
    r.position.y = state.lift;
    const va = a.visible ?? true,
      vb = b.visible ?? true;
    const show = va && vb ? 1 : vb ? u : va ? 1 - u : 0;
    r.visible = show > 0.02 && state.explodeSmooth < 0.5;
    if (!r.visible) return;
    // Aparece e some esmaecendo em pontilhado (sem ordenar transparências: a pele nunca aparece através da roupa)
    const fading = show < 0.999;
    for (const m of kit.materials) {
      if (m.alphaHash !== fading) {
        m.alphaHash = fading;
        m.needsUpdate = true;
      }
      m.opacity = fading ? show : 1;
    }

    // Corpo: posição e direção no trecho
    const x = THREE.MathUtils.lerp(a.at[0], b.at[0], u);
    const z = THREE.MathUtils.lerp(a.at[1], b.at[1], u);
    const face = THREE.MathUtils.lerp(a.face, b.face, u) * D2R;
    const walking = a.walk && (a.at[0] !== b.at[0] || a.at[1] !== b.at[1] || a.face !== b.face) ? Math.sin(Math.PI * f) : 0;
    const feet = walking ? footsteps(a, b, u, tmp.feet) : null;
    // Altura do corpo: média do piso sob os dois pés (sobe a plataforma um pé de cada vez)
    const floor = feet ? (feet.L.ground + feet.R.ground) / 2 : THREE.MathUtils.lerp(a.at[2], b.at[2], u);
    const bd = body.current!;
    bd.position.set(x, floor, z);
    bd.rotation.y = face;

    // Braços balançam ao caminhar (as pernas seguem as pegadas)
    const steps = feet ? Math.max(2, Math.ceil(Math.hypot(b.at[0] - a.at[0], b.at[1] - a.at[1]) / 0.42)) + 1 : 1;
    const phase = u * steps * Math.PI;
    const gait: Partial<Record<Joint, V3>> | null = walking > 0.01 ? { shL: [-16 * walking * Math.sin(phase), 0, 0], shR: [16 * walking * Math.sin(phase), 0, 0] } : null;
    const bob = walking * (-0.022 + 0.01 * Math.abs(Math.cos(phase)));

    const qa = kit.solver.a.solve(a.pose, { at: a.at, face: a.face, state }, gait);
    const qb = kit.solver.b.solve(b.pose, { at: b.at, face: b.face, state }, gait);
    const { bones, idx } = kit.rig;
    const L = tmp.locals;
    for (let j = 0; j < bones.length; j++) L[j].copy(qa[j]).slerp(qb[j], u);
    // Bacia: deslocamento de cada pose (no referencial do pai do osso)
    const pi = idx.pelvis;
    const pv = tmp.v.copy(kit.solver.a.pelvisOff).lerp(kit.solver.b.pelvisOff, u);
    pv.y += bob;
    const pelvisLocal = tmp.pl.copy(kit.rig.off[pi]).add(pv.applyQuaternion(tmp.q.copy(kit.rig.W0[kit.rig.parent[pi]]).invert()));

    // Passada final no referencial atual do corpo: pés no chão/pegadas e mãos nunca atrás do vidro
    const post = kit.solver.post;
    post.fromLocals(L, pelvisLocal);
    const toBody = (wx: number, wy: number, wz: number, out: THREE.Vector3) => out.set(wx - x, wy - floor, wz - z).applyAxisAngle(AXIS_Y, -face);
    for (const s of ["L", "R"] as const) {
      const freeA = a.pose.free?.includes(s) ? 0 : 1;
      const freeB = b.pose.free?.includes(s) ? 0 : 1;
      const w = THREE.MathUtils.lerp(freeA, freeB, u);
      if (w < 1e-3) continue;
      const l = s.toLowerCase();
      const chain = [idx[`thigh_${l}`], idx[`calf_${l}`], idx[`foot_${l}`]];
      const fk = chain.map((c, n) => tmp.fk[n].copy(L[c]));
      let tgt: THREE.Vector3, yaw: number, pitch: number;
      if (feet) {
        const ft = feet[s];
        tgt = toBody(ft.x, ft.ground + kit.rig.ankle0[s].y + ft.lift, ft.z, tmp.t);
        yaw = ft.yaw - face;
        pitch = ft.pitch;
      } else {
        tgt = tmp.t.set(s === "L" ? STANCE_X : -STANCE_X, kit.rig.ankle0[s].y, kit.rig.ankle0[s].z);
        yaw = 0;
        pitch = 0;
      }
      post.plantLeg(s, tgt, yaw, pitch);
      chain.forEach((c, n) => {
        post.local(c, L[c]);
        if (w < 1) L[c].copy(fk[n]).slerp(tmp.q.copy(L[c]), w);
      });
      post.fromLocals(L, pelvisLocal);
    }
    // Mãos: nenhum ponto da mão passa do vidro da torre (inclusive nas transições entre poses)
    if (z < 1.5) {
      const zAxis = tmp.zb.set(0, 0, 1).applyAxisAngle(AXIS_Y, -face);
      for (const s of ["L", "R"] as const) {
        let need = 0;
        for (const pt of handPoints(post, s, tmp.pts)) {
          // ponto da mão em coordenadas da estação
          const w = tmp.w.copy(pt).applyAxisAngle(AXIS_Y, face).add(tmp.o.set(x, floor, z));
          if (Math.abs(w.x) < TOWER.w / 2 + 0.01 && w.y > TOWER.y0 && w.y < TOWER.y1 + 0.02) need = Math.max(need, TOWER.glassZ + GLASS_GAP - w.z);
        }
        if (need > 0) {
          const l = s.toLowerCase();
          const target = tmp.t.copy(post.P[idx[`hand_${l}`]]).addScaledVector(zAxis, need);
          for (const c of post.nudgeArm(s, target)) post.local(c, L[c]);
          post.fromLocals(L, pelvisLocal);
        }
      }
    }
    for (let j = 0; j < bones.length; j++) bones[j].quaternion.copy(L[j]);
    bones[pi].position.copy(pelvisLocal);

    // Olhos: fechados quando a pose pede (equilíbrio); fora disso, uma piscada a cada 3 a 5 s
    const now = performance.now() / 1000;
    if (now > blink.current.next) blink.current = { at: now, next: now + 3 + Math.random() * 2 };
    const bt = (now - blink.current.at) / 0.16;
    const lid = Math.max(THREE.MathUtils.lerp(a.pose.eyes ?? 0, b.pose.eyes ?? 0, u), bt < 1 ? Math.sin(Math.PI * bt) : 0);
    for (const m of kit.lids) m.morphTargetInfluences![m.morphTargetDictionary!.olhos] = lid;

    // Espirômetro diante da boca (segue a cabeça)
    const sp = (a.spiro && u < 0.85) || (b.spiro && u > 0.15);
    kit.spiro.visible = !!sp;
    if (sp) {
      const h = idx.head;
      const dq = tmp.q.copy(post.W[h]).multiply(tmp.q2.copy(kit.rig.W0[h]).invert());
      const m = tmp.m.copy(MOUTH).sub(kit.rig.head0).applyQuaternion(dq).add(post.P[h]);
      kit.spiro.position.copy(m).add(tmp.v.set(0, 0, 0.012).applyQuaternion(dq));
      kit.spiro.quaternion.copy(dq).multiply(tmp.q2.setFromAxisAngle(AXIS_X, -0.12));
      kit.spiro.rotateY(Math.PI);
    }
  };

  useFrame((_, dt) => {
    if (process.env.NODE_ENV !== "development") return update(dt);
    // Em desenvolvimento: custo médio por quadro (ms) em window.__childMs
    const t0 = performance.now();
    update(dt);
    const w = window as unknown as { __childMs?: number };
    w.__childMs = (w.__childMs ?? 0) * 0.95 + (performance.now() - t0) * 0.05;
  });

  return (
    <group ref={root}>
      <group ref={body}>
        <primitive object={kit.scene} />
        <primitive object={kit.spiro} />
      </group>
    </group>
  );
}
