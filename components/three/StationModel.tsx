"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { useFrame, useThree } from "@react-three/fiber";
import {
  canopyBarGeometry,
  canopyPlateGeometry,
  electrodeGeometry,
  fairingGeometry,
  ringSlabGeometry,
  sensorPlateGeometry,
  slabGeometry,
  towerBodyGeometry,
} from "./stationGeometry";
import { drawDeviceScreen, loadScreenFonts, SCREEN_H, SCREEN_STEPS, SCREEN_W, SCREENS } from "./screenUi";
import { GLASS_LOGO_ASPECT, glassLogoTexture } from "./glassLogo";
import StationGlassReflection, { type MirrorRegion } from "./StationGlassReflection";
import StationTowerReflection from "./StationTowerReflection";
import type { StationState } from "./stationState";

// Modelo fiel à estação real (metros; y para cima, frente em +z, torre ao fundo).
// Medidas: 2,10 m de altura · base 0,48 × 0,935 m · tela nominal de 32″ na vertical.
// A área visível da tela segue o render CAD (mais estreita que a proporção nominal 16:9).
// Formas e acabamentos ajustados pelas referências oficiais e pelas avaliações em .fidelity/LOG.md.

// Bandeja: corpo de alumínio azul-ardósia e, por cima, uma chapa bronze-grafite de 6,4 mm com o bolsão do vidro.
const BASE = { w: 0.48, d: 0.935, h: 0.070078, z0: -0.21, radius: 0.033125, plate: 0.0064488, bottomBevel: 0.0050034 };
// Vidro dos eletrodos assentado 1,6 mm abaixo do tampo; os eletrodos ficam rentes à face dele.
const PAD = { cz: 0.47, w: 0.4, d: 0.435, r: 0.027, thick: 0.003, top: 0.0683, hole: 0.0045 };
// O produto é ortogonal: bandeja, torre e dossel sem giros nem deslocamentos de compensação (a câmera da bancada é que
// imita a perspectiva dos renders).
// Regiões dos espelhos planares da bandeja: o vidro (altura do vidro) e o tampo em volta dele (altura do tampo).
const GLASS_MIRROR: MirrorRegion = { w: PAD.w - 0.0014, d: PAD.d - 0.0014, r: PAD.r - 0.0007, cz: PAD.cz };
// O espelho do tampo não mostra o logotipo do vidro (o render oficial não tem esse reflexo no tampo).
const HIDE_LOGO = ["glass-logo"] as const;
const TOP_MIRROR: MirrorRegion = {
  w: BASE.w - 0.001, d: BASE.d - 0.001, r: BASE.radius - 0.0005, cz: BASE.z0 + BASE.d / 2,
  hole: { w: PAD.w + PAD.hole, d: PAD.d + PAD.hole, r: PAD.r + PAD.hole / 2, cz: PAD.cz },
};
// Torre: vidro preto de 441,0 mm rente ao corpo de alumínio (443,1 mm); atrás, o degrau com chanfro reto.
const TOWER = {
  y0: 0.11499, y1: 1.7676, w: 0.44102, bodyW: 0.44313, step: 0.76275, chamfer: 0.021283,
  front: 0.02694, rear: -0.01661, rear2: -0.04439, glassZ: 0.0383, glassT: 0.0142, screenMargin: 0.0345,
};
const SCREEN = { w: 0.36, h: 0.708 };
// Logotipo no vidro: mesmo lugar e tamanho da inscrição do render oficial (centro a 236 mm do chão, 30 mm de altura)
const GLASS_LOGO = { y: 0.236, h: 0.03 };
// Cunha de largura constante (rente às pontas da bandeja): trapézio de 51 mm de altura com a rampa de trás curta e a da frente
// longa; a face de bronze sobe até o pé do vidro (medida nos dois renders oficiais, com a bandeja já ajustada acima).
const FAIRING = {
  height: 0.051091, widthBottom: 0.47895, widthTop: 0.47895,
  backBottom: -0.055, frontBottom: 0.079657, backTop: -0.04, frontTop: 0.052742,
};
// Dossel: duas barras planas (24,9 × 31,5 mm) que sobem coladas à traseira da torre, fazem o cotovelo e seguem retas
// (queda frontal de ~4,0°) até a placa. A placa tem a mesma espessura das barras (+0,8 mm) e o mesmo plano de cima:
// a aresta de cima da barra continua direto na da placa, e as faces de fora das barras e das pontas da placa ficam no
// mesmo plano. Os cantos da frente da placa são de raio grande (49 mm); os de trás (20 mm) somem dentro das barras.
// Medido sobre o render 3/4 oficial (ajuste da silhueta em 1080 px com a câmera nivelada da bancada). O ponto mais alto
// (cotovelo) fica na altura real do produto, 2,100 m, e nunca passa disso.
const CANOPY = {
  x: 0.19652, z: -0.00405, wx: 0.02492, wt: 0.0315, fillet: 0.00313,
  R: 0.11541, top: 2.1, pitch: 0.06964,
  plateW: 0, plateD: 0.11735, plateZ: 0.48474, plateY: 0, plateH: 0, plateR: 0.04887, plateRBack: 0.02,
  plateBevel: 0.0025, barOverlap: 0.06784, outerShift: -0.00046, dH: 0.00079,
  rise: 0, sensorZ: 0, sensorY: 0,
};
CANOPY.rise = CANOPY.top - CANOPY.R - CANOPY.wt / 2;
CANOPY.plateW = 2 * (CANOPY.x + CANOPY.wx / 2 + CANOPY.outerShift);
CANOPY.plateH = CANOPY.wt + CANOPY.dH;
// A placa acompanha a queda do trecho reto das barras; o ponto mais alto de tudo é o cotovelo.
const PLATE_ANGLE = Math.atan(CANOPY.pitch);
const PLATE_Z = CANOPY.plateZ;
/** Altura da face de cima do trecho reto da barra em z (a placa usa o mesmo plano). */
function barTopAt(z: number) {
  const a = Math.PI / 2 + PLATE_ANGLE;
  const endY = CANOPY.rise + Math.sin(a) * CANOPY.R, endZ = CANOPY.z + CANOPY.R * (1 - Math.cos(a));
  return endY - (z - endZ) * CANOPY.pitch + CANOPY.wt / 2 / Math.cos(PLATE_ANGLE);
}
const PLATE_Y = barTopAt(PLATE_Z);
CANOPY.plateY = PLATE_Y;
const plateHeightAt = (z: number) => PLATE_Y - (z - PLATE_Z) * CANOPY.pitch;
// Sensor quase rente à chapa inferior: rebaixo de 0,3 mm, sem aro refletivo.
// A mesma face emissora define a origem das ondas em coordenadas do dossel.
const UNDERSIDE_H = 0.002;
const UNDERSIDE_INSET = 0.0018;
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

/**
 * Filete de luz nas arestas arredondadas: no render oficial uma faixa de luz de contorno (atrás e à direita) desenha um
 * brilho branco-azulado estreito nos raios do dossel (canto da placa, filetes das barras) e na quina de alumínio da torre.
 * O ambiente do estúdio não tem uma faixa tão forte sem estragar os outros materiais, então o brilho é um termo
 * especular extra, só nesses materiais: acende onde o reflexo da câmera cai perto de `RIM_DIR` (mundo) e só em
 * superfícies curvas (derivada da normal na tela); é zero nas faces planas. Segue a câmera. Também apaga a luz própria
 * (emissivo) das faces voltadas para baixo, que no oficial são escuras.
 */
const RIM_DIR = new THREE.Vector3(0.8955, 0.26, -0.3618).normalize();
function addRimStrip(mat: THREE.MeshPhysicalMaterial, gain: number, tint: string, cosLo = 0.9135, cosHi = 0.9877, sideEmissive?: string) {
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.rimDir = { value: RIM_DIR };
    shader.uniforms.rimColor = { value: new THREE.Color(tint).multiplyScalar(gain) };
    shader.uniforms.sideEmissive = { value: new THREE.Color(sideEmissive ?? "#000000") };
    // Com `sideEmissive`, as faces de lado (normal em ±x, em espaço do objeto) têm outra luz própria: nas barras do
    // dossel o render oficial tem as faces de lado cinza-quente neutro e as da frente azuladas.
    if (sideEmissive) {
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nvarying float vSide;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvSide = smoothstep(0.55, 0.9, abs(normal.x));");
    }
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", `#include <common>\nuniform vec3 rimDir;\nuniform vec3 rimColor;${sideEmissive ? "\nuniform vec3 sideEmissive;\nvarying float vSide;" : ""}`)
      // A base de luz própria (emissivo) vale só para as faces voltadas para cima e para os lados: as de baixo, vistas
      // de baixo, são escuras no render oficial.
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        ${sideEmissive ? "totalEmissiveRadiance = mix(totalEmissiveRadiance, sideEmissive, vSide);" : ""}
        totalEmissiveRadiance *= 1.0 - smoothstep(0.15, 0.7, -(inverseTransformDirection(normal, viewMatrix)).y);`,
      )
      .replace(
        "#include <opaque_fragment>",
        `{
          vec3 rimR = reflect(-normalize(vViewPosition), normal);
          vec3 rimS = normalize((viewMatrix * vec4(rimDir, 0.0)).xyz);
          float rimCurve = smoothstep(0.012, 0.04, length(fwidth(normal)));
          outgoingLight += rimColor * rimCurve * smoothstep(${cosLo.toFixed(4)}, ${cosHi.toFixed(4)}, dot(rimR, rimS));
        }
        #include <opaque_fragment>`,
      );
  };
  mat.customProgramCacheKey = () => `rim-${gain}-${tint}-${sideEmissive ?? "none"}`;
  return mat;
}

/**
 * Degradê vertical do vidro preto da torre: no render oficial o vidro é um pouco mais claro na altura do peito (pico
 * perto de 0,7 m) e escurece para os dois lados; o reflexo do estúdio sozinho só dá uma queda suave. É um fator sobre
 * a cor de base do vidro (a mesma tabela medida: altura do mundo -> fator), sem tocar nos reflexos.
 */
const GLASS_PROFILE = {
  y: [0.109, 0.3, 0.45, 0.57, 0.7, 0.8, 0.98, 1.8],
  k: [1.1, 1.17, 1.45, 1.6, 1.6, 1.55, 1.2, 1.15],
};
function addGlassProfile(mat: THREE.MeshPhysicalMaterial, centerY: number) {
  const n = GLASS_PROFILE.y.length;
  const arr = (v: number[]) => `float[${n}](${v.map((x) => x.toFixed(3)).join(",")})`;
  mat.onBeforeCompile = (shader) => {
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vGlassY;")
      .replace("#include <begin_vertex>", `#include <begin_vertex>\nvGlassY = position.y + ${centerY.toFixed(4)};`);
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        varying float vGlassY;
        const float glassPy[${n}] = ${arr(GLASS_PROFILE.y)};
        const float glassPk[${n}] = ${arr(GLASS_PROFILE.k)};
        float glassProfile(float y) {
          for (int i = 0; i < ${n - 1}; i++) {
            if (y < glassPy[i + 1]) return mix(glassPk[i], glassPk[i + 1], clamp((y - glassPy[i]) / (glassPy[i + 1] - glassPy[i]), 0.0, 1.0));
          }
          return glassPk[${n - 1}];
        }`,
      )
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= glassProfile(vGlassY);");
  };
  mat.customProgramCacheKey = () => "glass-profile";
  return mat;
}

/**
 * Parede da frente da bandeja: nos dois renders oficiais (3/4 e base de perto) ela é grafite neutro e brilhante, enquanto
 * as paredes laterais são azul-ardósia. O peso `vFront` vem da normal em espaço do objeto (gira junto com o modelo): 1
 * na parede que olha para +z, e cai nos cantos arredondados. Cor, aspereza e metal da frente ficam em `FRONT_WALL`.
 */
const FRONT_WALL = { color: "#686c71", roughness: 0.46, metalness: 0.2 };
function addFrontWall(mat: THREE.MeshPhysicalMaterial) {
  const c = new THREE.Color(FRONT_WALL.color);
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.frontColor = { value: c };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying float vFront;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvFront = smoothstep(0.35, 0.9, normal.z);");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vFront;\nuniform vec3 frontColor;")
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb = mix(diffuseColor.rgb, frontColor, vFront);")
      .replace("#include <roughnessmap_fragment>", `#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, ${FRONT_WALL.roughness.toFixed(3)}, vFront);`)
      .replace("#include <metalnessmap_fragment>", `#include <metalnessmap_fragment>\nmetalnessFactor = mix(metalnessFactor, ${FRONT_WALL.metalness.toFixed(3)}, vFront);`);
  };
  mat.customProgramCacheKey = () => `front-wall-${FRONT_WALL.color}-${FRONT_WALL.roughness}-${FRONT_WALL.metalness}`;
  return mat;
}

function useMaterials(low: boolean) {
  return useMemo(
    () => ({
      // Vidro temperado preto brilhante da torre: quase preto de base e brilho vindo do ambiente; o reflexo nítido
      // da plataforma vem do espelho planar (StationTowerReflection), só no modo completo.
      glass: addGlassProfile(new THREE.MeshPhysicalMaterial({
        color: "#262829",
        metalness: 0,
        roughness: 0.45,
        ior: 1.7,
        clearcoat: 0.15,
        clearcoatRoughness: 0.12,
        specularColor: new THREE.Color("#d7e7f7"),
      }), (TOWER.y0 + TOWER.y1) / 2),
      // O fio do vidro (espessura) é escuro: sem o brilho das faces.
      glassEdge: new THREE.MeshBasicMaterial({ color: "#0d0f12" }),
      body: addFrontWall(new THREE.MeshPhysicalMaterial({ color: "#5d697d", metalness: 0, roughness: 0.8 })),
      fairingEnd: new THREE.MeshPhysicalMaterial({ color: "#4e5b6e", metalness: 0.05, roughness: 0.8 }),
      towerBody: addRimStrip(new THREE.MeshPhysicalMaterial({
        vertexColors: true, color: "#566f82", metalness: 0, roughness: 0.8,
      }), 0.65, "#a4b6d2", 0.8, 0.965),
      // Tampo e cunha bronze-grafite; alumínio azul-ardósia. Acabamento acetinado: casam nos dois estúdios (claro e escuro).
      top: new THREE.MeshPhysicalMaterial({ color: "#9b9b96", metalness: 0, roughness: 0.8 }),
      wedge: new THREE.MeshPhysicalMaterial({ color: "#5d5853", metalness: 0, roughness: 0.9 }),
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
      // Grafite acetinado: luz própria baixa (as faces da frente do render oficial são cinza médio, o estúdio escuro da
      // frente não dá isso sozinho) e um filete de luz nos raios (addRimStrip). Faces planas sem reflexo forte.
      canopy: addRimStrip(new THREE.MeshPhysicalMaterial({
        color: "#323232", metalness: 0.2, roughness: 0.3, emissive: new THREE.Color("#333b43"),
      }), 1, "#c6d7e6", 0.9135, 0.9877, "#2c2c2e"),
      canopyPlate: new THREE.MeshPhysicalMaterial({ color: "#001f48", metalness: 0.25, roughness: 0.7, clearcoat: 0.05, clearcoatRoughness: 0.22 }),
      // Laterais e cantos da placa: o mesmo grafite das barras, para a placa e as barras serem uma peça só
      canopyEdge: addRimStrip(new THREE.MeshPhysicalMaterial({
        color: "#25272a", metalness: 0.2, roughness: 0.3, emissive: new THREE.Color("#454648"),
      }), 1, "#c6d7e6"),
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
    // Barras: do degrau da torre, subindo coladas à traseira, cotovelo e trecho reto até dentro da placa
    bars: [-1, 1].map((side) => canopyBarGeometry(side, { ...CANOPY, zEnd: PLATE_Z - CANOPY.plateD / 2 + CANOPY.barOverlap }, TOWER.step + TOWER.chamfer - 0.001)),
    cap: canopyPlateGeometry(CANOPY.plateW, CANOPY.plateD, CANOPY.plateR, CANOPY.plateRBack, CANOPY.plateH, CANOPY.plateBevel),
    underside: sensorPlateGeometry(CANOPY.plateW - 0.022, CANOPY.plateD - 0.018, 0.004, UNDERSIDE_H, 0.0005,
      SENSOR_LOCAL_Z, SENSOR_DEPTH),
    holes: rearHolesGeometry(),
    accessories: barAccessoriesGeometry(),
  }), []);
  const fairingMaterials = useMemo(() => [m.wedge, m.fairingEnd], [m]);
  const topMaterials = useMemo(() => [m.top, m.top], [m]);
  const glassMaterials = useMemo(() => [m.glass, m.glassEdge], [m]);
  const plateMaterials = useMemo(() => [m.canopyPlate, m.canopyEdge], [m]);

  // Tela real da estação: um canvas redesenhado só quando muda a tela ou o passo do progresso (após carregar as fontes)
  const screen = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = SCREEN_W;
    canvas.height = SCREEN_H;
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return { g: canvas.getContext("2d")!, tex, ready: false, id: -1, step: -1 };
  }, []);
  useEffect(() => {
    let alive = true;
    loadScreenFonts().then(() => {
      if (!alive) return;
      screen.ready = true;
      screen.id = -1;
    });
    return () => {
      alive = false;
      screen.tex.dispose();
    };
  }, [screen]);

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

    if (screen.ready) {
      const id = THREE.MathUtils.clamp(Math.round(station.screen), 0, SCREENS.length - 1);
      const steps = SCREEN_STEPS[SCREENS[id]];
      const step = Math.round(THREE.MathUtils.clamp(station.screenT, 0, 1) * steps);
      if (id !== screen.id || step !== screen.step) {
        screen.id = id;
        screen.step = step;
        screen.g.setTransform(1, 0, 0, 1, 0, 0);
        drawDeviceScreen(screen.g, SCREENS[id], steps ? step / steps : 1);
        screen.tex.needsUpdate = true;
      }
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
        {!low && <StationGlassReflection state={station} y={BASE.h + 0.0002} region={TOP_MIRROR} strength={0.5} opacity={0.8} hide={HIDE_LOGO} />}
      </group>

      {/* Vidro preto contínuo; carcaça traseira com degrau de alumínio e ombro inclinado. */}
      <group ref={tower}>
        <mesh geometry={geometry.body} material={m.towerBody} />
        <mesh geometry={geometry.glass} position={[0, (TOWER.y0 + TOWER.y1) / 2, TOWER.glassZ]} material={glassMaterials} />
        <mesh position={[0, TOWER.y1 - TOWER.screenMargin - SCREEN.h / 2, TOWER.glassZ + 0.0003]}>
          <planeGeometry args={[SCREEN.w, SCREEN.h]} />
          <meshBasicMaterial ref={screenMat} map={screen.tex} color="#e6e6e6" toneMapped={false} />
        </mesh>
        <mesh name="glass-logo" position={[0, GLASS_LOGO.y, TOWER.glassZ + 0.0003]}>
          <planeGeometry args={[GLASS_LOGO.h * GLASS_LOGO_ASPECT, GLASS_LOGO.h]} />
          <meshBasicMaterial map={logo} color="#e4e6e8" transparent depthWrite={false} />
        </mesh>
        <mesh name="rear-holes" geometry={geometry.holes} material={m.hole} />
        {!low && (
          <StationTowerReflection state={station} width={TOWER.w} height={0.5} radius={0.018}
            y={TOWER.y0 + 0.25} z={TOWER.glassZ + 0.0001} strength={0.3} />
        )}
      </group>

      {/* Barras planas com cotovelo circular; sensor somente na face inferior da placa. */}
      <group ref={canopy}>
        {geometry.bars.map((g, i) => <mesh key={i} geometry={g} material={m.canopy} />)}
        <mesh name="bar-accessories" geometry={geometry.accessories} material={m.clip} />
        <mesh name="canopy-plate" geometry={geometry.cap} material={plateMaterials} rotation={[PLATE_ANGLE, 0, 0]} position={[0, PLATE_Y, PLATE_Z]} />
        <mesh name="canopy-underside" geometry={geometry.underside} material={m.canopyPlate} rotation={[PLATE_ANGLE, 0, 0]}
          position={[0, PLATE_Y - (CANOPY.plateH - UNDERSIDE_INSET) * Math.cos(PLATE_ANGLE), PLATE_Z - (CANOPY.plateH - UNDERSIDE_INSET) * Math.sin(PLATE_ANGLE)]} />
        <mesh name="ultrasound-sensor" rotation={[Math.PI / 2 + PLATE_ANGLE, 0, 0]} position={[0, CANOPY.sensorY, CANOPY.sensorZ]} material={m.canopyPlate}>
          <circleGeometry args={[0.0145, 48]} />
        </mesh>
        {/* O grupo das ondas tem de ser o último filho do dossel (o espelho do vidro conta com isso). */}
        <Ultrasound state={station} />
      </group>
    </group>
  );
}

export const STATION_DIMS = { BASE, TOWER, SCREEN, CANOPY };
