// Telas de postura, pontuação, evolução e relatório.
import {
  chamfer,
  circle,
  clamp,
  easeOut,
  gradConic,
  gradRad,
  gradX,
  gradY,
  header,
  lerp,
  rad,
  rng,
  roundTri,
  rrect,
  seg,
  text,
  ticks,
  U_W,
  type G,
  type Page,
  type Stop,
} from "./screenKit";
import { figure, pt, type View } from "./screenSilhouette";

function clear(g: G) {
  g.fillStyle = "#000";
  g.fillRect(0, 0, U_W, 1920);
}

// ================================================================ POSTURA
const FRONT = { cx: 594, top: 735, h: 1065 };
const SIDE = { cx: 612, top: 715, h: 1165 };
const SPLIT_T = 0.55;

function cameraBackground(g: G) {
  // sala estilizada no lugar da imagem da câmera: parede, janelas à direita e piso
  g.fillStyle = gradY(g, 605, 1920, [
    [0, "#8a9594"],
    [0.55, "#667271"],
    [0.62, "#4c4f52"],
    [1, "#303236"],
  ]);
  g.fillRect(0, 605, U_W, 1315);
  // faixa de luz no teto
  g.fillStyle = "rgba(255,255,255,0.10)";
  g.fillRect(540, 605, 70, 120);
  g.fillRect(120, 605, 90, 70);
  // janelas (montantes verticais)
  g.fillStyle = "rgba(40,48,48,0.35)";
  for (let i = 0; i < 5; i++) g.fillRect(790 + i * 70, 605, 10, 1000);
  g.fillStyle = "rgba(255,255,255,0.07)";
  g.fillRect(780, 605, 300, 1000);
  // luz atrás do aluno
  g.fillStyle = gradRad(g, 590, 1250, 100, 700, [
    [0, "rgba(190,200,200,0.22)"],
    [1, "rgba(190,200,200,0)"],
  ]);
  g.fillRect(0, 605, U_W, 1315);
}

function eyeButton(g: G) {
  g.fillStyle = "rgba(64,64,66,0.78)";
  circle(g, 77, 674, 45);
  g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 3.4;
  g.lineCap = "round";
  g.beginPath();
  g.moveTo(52, 674);
  g.bezierCurveTo(62, 656, 92, 656, 102, 674);
  g.bezierCurveTo(92, 692, 62, 692, 52, 674);
  g.stroke();
  circle(g, 77, 674, 7);
  g.stroke();
  g.beginPath();
  g.moveTo(58, 694);
  g.lineTo(96, 654);
  g.stroke();
}

function thumbs(g: G, sideDone: boolean, activeSide: boolean) {
  // painel das silhuetas pequenas
  g.fillStyle = "#00000e";
  g.fillRect(0, 152, U_W, 452);
  g.fillStyle = "#000";
  g.fillRect(534, 152, 12, 452);
  // silhueta de frente (sempre pronta) e de lado (contorno até a captura)
  figure(g, "front", 283, 218, 327, { glow: true });
  if (sideDone) {
    figure(g, "side", 826, 205, 340, { glow: true });
  } else {
    const grd = gradY(g, 200, 545, [
      [0, "#20b060"],
      [0.5, "#1a8aa0"],
      [1, "#2050d0"],
    ]);
    figure(g, "side", 826, 205, 340, { flat: grd, grow: 2.2 });
    figure(g, "side", 826, 205, 340, { flat: "#00000e" });
  }
  text(g, "CORPO POSITIVO", 270, 580, { f: "title", w: 300, s: 23, c: "#fff", a: "center" });
  text(g, "CORPO LATERAL", 810, 580, { f: "title", w: 300, s: 23, c: "#fff", a: "center" });
  // faixa da vista ativa
  const bar = activeSide
    ? gradX(g, 640, 1080, [
        [0, "#0a80b0"],
        [1, "#10c8cc"],
      ])
    : gradX(g, 0, 440, [
        [0, "#10c8cc"],
        [1, "#0a80b0"],
      ]);
  g.fillStyle = bar;
  g.fillRect(activeSide ? 640 : 0, 594, activeSide ? 440 : 440, 10);
  // botão triangular de reavaliação
  g.fillStyle = "#000";
  roundTri(
    g,
    [
      [540, 452],
      [424, 604],
      [656, 604],
    ],
    24,
  );
  g.fill();
  g.fillStyle = gradY(g, 463, 595, [
    [0, "#8aef7a"],
    [1, "#70e48e"],
  ]);
  roundTri(
    g,
    [
      [540, 463],
      [440, 595],
      [640, 595],
    ],
    20,
  );
  g.fill();
  // ícone de câmera
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  g.lineWidth = 3;
  rrect(g, 527, 520, 27, 19, 3);
  g.stroke();
  g.fillRect(534, 516, 12, 5);
  circle(g, 540.5, 530, 4.6);
  g.stroke();
  text(g, "REAVALIAÇÃO", 540, 580, { f: "title", w: 300, s: 23, c: "#fff", a: "center" });
}

type Cb = (g: G, a: number) => void;

function pill(g: G, x: number, y: number, w: number, label: string, hue: number, a: number) {
  g.save();
  g.globalAlpha = a;
  g.shadowColor = "rgba(255,255,255,0.4)";
  g.shadowBlur = 8;
  g.fillStyle = gradX(g, x, x + w, [
    [0, "rgb(18,205,140)"],
    [1, hue ? "rgb(0,205,255)" : "rgb(0,230,190)"],
  ]);
  rrect(g, x, y, w, 43, 21.5);
  g.fill();
  g.shadowBlur = 0;
  g.strokeStyle = "rgba(255,255,255,0.92)";
  g.lineWidth = 3;
  g.stroke();
  text(g, label, x + w / 2, y + 28, { f: "text", w: 300, s: 17, c: "#fff", a: "center", max: w - 26 });
  g.restore();
}

function leader(g: G, x0: number, y0: number, x1: number, y1: number, a: number, dashed = false) {
  g.save();
  g.globalAlpha = a;
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 2;
  if (dashed) g.setLineDash([5, 5]);
  g.beginPath();
  g.moveTo(x0, y0);
  g.lineTo(x1, y1);
  g.stroke();
  g.restore();
}

function dot(g: G, x: number, y: number, a: number) {
  g.save();
  g.globalAlpha = a;
  g.fillStyle = "rgba(220,224,228,0.45)";
  circle(g, x, y, 15);
  g.fill();
  g.fillStyle = "#e6e8ea";
  circle(g, x, y, 9);
  g.fill();
  g.restore();
}

function label(g: G, str: string, x: number, y: number, a: number, align: CanvasTextAlign = "right") {
  g.save();
  g.shadowColor = "rgba(0,0,0,0.65)";
  g.shadowBlur = 4;
  text(g, str, x, y, { f: "text", w: 300, s: 17, c: "#fff", a: align, alpha: a });
  g.restore();
}

function hoop(g: G, cx: number, cy: number, rx: number, ry: number, a: number) {
  g.save();
  g.globalAlpha = a;
  g.strokeStyle = "#fff";
  g.lineWidth = 3;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, 0.05, Math.PI - 0.05);
  g.stroke();
  g.lineWidth = 1.6;
  g.globalAlpha = a * 0.7;
  g.beginPath();
  g.ellipse(cx, cy, rx, ry, 0, Math.PI + 0.05, Math.PI * 2 - 0.05);
  g.stroke();
  g.restore();
}

/** Apresenta um item entre as janelas a e b de u. */
const appear = (u: number, a: number, b = a + 0.07) => easeOut(seg(u, a, b));

function overlayFront(g: G, u: number) {
  const P = (n: string) => pt("front", n, FRONT.cx, FRONT.top, FRONT.h);
  // linhas de prumo
  const pl = appear(u, 0.02, 0.12);
  leader(g, FRONT.cx, 605, FRONT.cx, 1920, pl);
  // anéis de varredura
  if (u < 0.3) {
    const k = seg(u, 0, 0.3);
    for (const [y0, y1] of [
      [1000, 1250],
      [1500, 1380],
    ]) {
      const y = lerp(y0, y1, k);
      g.save();
      g.globalAlpha = Math.sin(k * Math.PI) * 0.9;
      g.strokeStyle = "#39a8ff";
      g.lineWidth = 6;
      g.shadowColor = "#39a8ff";
      g.shadowBlur = 14;
      g.beginPath();
      g.ellipse(FRONT.cx, y, 240, 20, 0, 0, Math.PI * 2);
      g.stroke();
      g.restore();
    }
  }
  const [shL, shR, hipL, hipC, hipR, knL, knR, anL, anR, elL, elR, wrL, wrR, head, mid] = [
    "shL",
    "shR",
    "hipL",
    "hipC",
    "hipR",
    "knL",
    "knR",
    "anL",
    "anR",
    "elL",
    "elR",
    "wrL",
    "wrR",
    "head",
    "mid",
  ].map(P);
  const chain: [number[], number[]][] = [
    [shL, elL],
    [elL, wrL],
    [shR, elR],
    [elR, wrR],
    [hipL, knL],
    [knL, anL],
    [hipR, knR],
    [knR, anR],
    [head, mid],
    [mid, hipC],
    [shL, shR],
    [hipL, hipR],
  ];
  const ca = appear(u, 0.1, 0.4);
  chain.forEach(([a, b]) => leader(g, a[0], a[1], lerp(a[0], b[0], ca), lerp(a[1], b[1], ca), 0.9, true));
  [head, shL, shR, mid, elL, elR, wrL, wrR, hipL, hipC, hipR, knL, knR, anL, anR].forEach((p, i) => dot(g, p[0], p[1], appear(u, 0.1 + i * 0.022, 0.2 + i * 0.022)));
  // medidas à esquerda
  const L: [string, number, number][] = [
    ["Espaçamento do occipital: 10,8 cm", 837, 0.42],
    ["Circunferência do braço: 21,4 cm", 1025, 0.5],
    ["Cintura: 62,0 cm", 1185, 0.58],
    ["Quadril: 74,5 cm", 1257, 0.62],
    ["Circunferência da coxa: 40,2 cm", 1368, 0.68],
  ];
  L.forEach(([s, y, at]) => {
    const a = appear(u, at);
    label(g, s, 411, y + 6, a);
    leader(g, 430, y, 548, y, a);
  });
  hoop(g, 590, 1196, 112, 22, appear(u, 0.58));
  hoop(g, 587, 1266, 118, 21, appear(u, 0.62));
  hoop(g, 527, 1372, 56, 12, appear(u, 0.68));
  hoop(g, 456, 1036, 22, 7, appear(u, 0.5));
  // indicadores à direita
  const R: [string, number, number, number, number, number][] = [
    ["Risco de rolamento da cabeça: BAIXO", 742, 267, head[1], 0.72, 0],
    ["Risco de ombro: MÉDIO", 955, 173, shR[1], 0.78, 0],
    ["Risco de coluna: BAIXO", 1108, 176, mid[1], 0.84, 1],
    ["Risco de pernas X/O: BAIXO", 1476, 169, knR[1], 0.9, 0],
  ];
  R.forEach(([s, y, w, py, at, hue]) => {
    const a = appear(u, at);
    leader(g, FRONT.cx + 8, py, 775, y + 21, a);
    pill(g, 775, y, w, s, hue, a);
  });
}

function overlaySide(g: G, u: number) {
  const P = (n: string) => pt("side", n, SIDE.cx, SIDE.top, SIDE.h);
  const [head, sh, mid, hip, kn, an] = ["head", "sh", "mid", "hip", "kn", "an"].map(P);
  leader(g, 607, 605, 607, 1920, appear(u, 0.02, 0.12));
  // linha de prumo pontilhada cabeça → tornozelo
  const pa = appear(u, 0.06, 0.34);
  leader(g, head[0], head[1], lerp(head[0], an[0], pa), lerp(head[1], an[1], pa), 0.95, true);
  [head, sh, mid, hip, kn, an].forEach((p, i) => dot(g, p[0], p[1], appear(u, 0.1 + i * 0.05)));
  // escalas verticais à esquerda
  const br: [number, number, number][] = [
    [757, 918, 0.32],
    [977, 1335, 0.4],
    [1385, 1887, 0.48],
  ];
  br.forEach(([y0, y1, at]) => {
    const a = appear(u, at, at + 0.1);
    const yy = lerp(y0, y1, a);
    g.save();
    g.strokeStyle = "rgba(255,255,255,0.92)";
    g.lineWidth = 2;
    g.beginPath();
    g.moveTo(480, y0);
    g.lineTo(480, yy);
    g.moveTo(470, y0);
    g.lineTo(490, y0);
    if (a > 0.98) {
      g.moveTo(470, y1);
      g.lineTo(490, y1);
    }
    g.stroke();
    g.restore();
  });
  const T: [string, number, number][] = [
    ["Comprimento da cabeça: 22,4 cm", 837, 0.4],
    ["Proporção do corpo da cabeça: 6,6", 866, 0.42],
    ["Parte superior do corpo: 62,0 cm", 1157, 0.5],
    ["Extensão do braço: 148,0 cm", 1186, 0.52],
    ["Parte inferior do corpo: 86,0 cm", 1565, 0.58],
    ["Comprimento da coxa: 38,0 cm", 1594, 0.6],
    ["Parte inferior da perna: 36,0 cm", 1622, 0.62],
    ["Comprimento do pé: 22,0 cm", 1651, 0.64],
  ];
  T.forEach(([s, y, at]) => label(g, s, 398, y + 6, appear(u, at), "right"));
  [837, 1157, 1565].forEach((y, i) => leader(g, 430, y, 478, y, appear(u, [0.4, 0.5, 0.58][i])));
  const R: [string, number, number, number, number][] = [
    ["Risco de avanço da cabeça: BAIXO", 735, 246, head[1], 0.7],
    ["Risco de corcunda na coluna: BAIXO", 967, 240, sh[1], 0.76],
    ["Risco pélvico: MÉDIO", 1313, 158, hip[1], 0.82],
    ["Risco de hiperextensão do joelho: BAIXO", 1545, 277, kn[1], 0.88],
  ];
  R.forEach(([s, y, w, py, at], i) => {
    const a = appear(u, at);
    leader(g, SIDE.cx + 6, py, 775, y + 21, a);
    pill(g, 775, y, w, s, i === 1 ? 1 : 0, a);
  });
}

export const postura: Page = {
  steps: 24,
  variant: (t) => (t >= SPLIT_T ? 1 : 0),
  bg(g, v) {
    clear(g);
    header(g, "DIMENSÕES DO CORPO E POSTURA", 478);
    cameraBackground(g);
    const view: View = v ? "side" : "front";
    const f = v ? SIDE : FRONT;
    figure(g, view, f.cx, f.top, f.h, { glow: true });
    eyeButton(g);
    thumbs(g, v === 1, v === 1);
  },
  fg(g, t) {
    if (t < SPLIT_T) overlayFront(g, t / SPLIT_T);
    else overlaySide(g, (t - SPLIT_T) / (1 - SPLIT_T));
  },
};

// ================================================================ PONTUAÇÃO
const SC_CX = 540,
  SC_CY = 550;
const SCORE = 86;
const GREEN: [string, string] = ["#78e696", "#a0ee6e"];
const YELLOW: [string, string] = ["#ffd228", "#ffe08c"];
const BLUE: [string, string] = ["#1a86ea", "#46e4ff"];
const RED: [string, string] = ["#ff2a00", "#ff7678"];

const RAINBOW: Stop[] = [
  [0, "rgb(255,20,150)"],
  [45 / 360, "rgb(160,20,255)"],
  [90 / 360, "rgb(70,30,255)"],
  [135 / 360, "rgb(10,100,255)"],
  [180 / 360, "rgb(0,225,255)"],
  [225 / 360, "rgb(40,255,120)"],
  [270 / 360, "rgb(240,255,0)"],
  [315 / 360, "rgb(255,140,0)"],
  [1, "rgb(255,20,150)"],
];

function logo(g: G, x: number, y: number, rot: number) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  const grd = g.createLinearGradient(0, -34, 0, 34);
  grd.addColorStop(0, "#14ffc8");
  grd.addColorStop(0.6, "#2aff80");
  grd.addColorStop(1, "#ffc000");
  g.fillStyle = grd;
  for (const [k, w] of [
    [0, 36],
    [16, 26],
  ] as const) {
    g.beginPath();
    g.moveTo(0, -36 + k);
    g.lineTo(w, -2 + k);
    g.lineTo(w * 0.62, -2 + k);
    g.lineTo(0, -22 + k);
    g.lineTo(-w * 0.62, -2 + k);
    g.lineTo(-w, -2 + k);
    g.closePath();
    g.fill();
  }
  g.fillStyle = "#c8ff3a";
  g.beginPath();
  g.moveTo(0, 6);
  g.lineTo(16, 30);
  g.lineTo(0, 24);
  g.lineTo(-16, 30);
  g.closePath();
  g.fill();
  g.restore();
}

function scoreRing(g: G) {
  // anel arco-íris
  g.strokeStyle = gradConic(g, SC_CX, SC_CY, 300, RAINBOW, -Math.PI / 2);
  g.lineWidth = 5;
  circle(g, SC_CX, SC_CY, 298);
  g.stroke();
  // anel fino e blocos
  g.strokeStyle = "rgb(0,128,146)";
  g.lineWidth = 3;
  circle(g, SC_CX, SC_CY, 264);
  g.stroke();
  g.fillStyle = "rgb(0,138,155)";
  const nb = 14;
  for (let i = 0; i < nb; i++) {
    const a0 = rad(-90 + (360 / nb) * i + 3);
    const a1 = rad(-90 + (360 / nb) * (i + 1) - 3);
    const r1 = i % 2 ? 276 : 280;
    g.beginPath();
    g.arc(SC_CX, SC_CY, r1, a0, a1);
    g.arc(SC_CX, SC_CY, 254, a1, a0, true);
    g.closePath();
    g.fill();
  }
  // faixa escura interna
  g.fillStyle = "rgba(6,28,30,0.9)";
  for (const [a0, a1] of [
    [-170, -95],
    [-80, -20],
    [-5, 60],
    [75, 150],
    [165, 215],
  ]) {
    g.beginPath();
    g.arc(SC_CX, SC_CY, 222, rad(a0), rad(a1));
    g.arc(SC_CX, SC_CY, 194, rad(a1), rad(a0), true);
    g.closePath();
    g.fill();
  }
  // logotipos e arcos
  logo(g, 540, 410, 0);
  logo(g, 416, 623, rad(240));
  logo(g, 664, 623, rad(120));
  g.strokeStyle = "#17e6ee";
  g.lineWidth = 4;
  g.lineCap = "butt";
  for (const [a0, a1] of [
    [180, 236],
    [-56, 0],
    [64, 116],
  ]) {
    g.beginPath();
    g.arc(SC_CX, SC_CY, a0 === 64 ? 138 : 132, rad(a0), rad(a1));
    g.stroke();
  }
  text(g, "PONTUAÇÃO", 540, 600, { f: "title", w: 400, s: 18, c: "#f6a23c", a: "center" });
}

function indicator(g: G, x: number, y: number) {
  g.fillStyle = "#001018";
  circle(g, x, y, 25);
  g.fill();
  g.fillStyle = "#0a6e92";
  circle(g, x, y, 19);
  g.fill();
  g.fillStyle = "#14a0c8";
  circle(g, x, y, 13);
  g.fill();
  g.fillStyle = "#fff";
  circle(g, x, y, 6);
  g.fill();
}

function tile(g: G, x: number, y: number, w: number, h: number, col: [string, string], lines: string[], size = 18, a = 1) {
  if (a <= 0) return;
  g.save();
  g.globalAlpha = a;
  g.translate(0, (1 - a) * 14);
  g.fillStyle = gradX(g, x, x + w, [
    [0, col[0]],
    [1, col[1]],
  ]);
  rrect(g, x, y, w, h, 10);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 1.5;
  g.stroke();
  const cy = y + h / 2;
  if (lines.length === 1) text(g, lines[0], x + w / 2, cy + size * 0.35, { f: "title", w: 400, s: size, c: "#fff", a: "center" });
  else lines.forEach((l, i) => text(g, l, x + w / 2, cy + (i ? 26 : -3), { f: "title", w: 400, s: size, c: "#fff", a: "center" }));
  g.restore();
}

function manIcon(g: G, cx: number, y: number) {
  g.fillStyle = "#fff";
  circle(g, cx, y + 7, 6);
  g.fill();
  rrect(g, cx - 10, y + 16, 20, 28, 5);
  g.fill();
  g.fillRect(cx - 8, y + 42, 6, 34);
  g.fillRect(cx + 2, y + 42, 6, 34);
  g.fillRect(cx - 15, y + 18, 5, 28);
  g.fillRect(cx + 10, y + 18, 5, 28);
}

const ROW1 = 975,
  ROW2 = 1220;

export const pontuacao: Page = {
  steps: 40,
  bg(g) {
    clear(g);
    header(g, "PONTUAÇÃO DE SAÚDE", 317);
    scoreRing(g);
    // rótulos dos indicadores
    const L: [string, number, number, number][] = [
      ["TIPO DO CORPO", 75, ROW1, 100],
      ["IDADE METABÓLICA", 462, ROW1, 487],
      ["NÍVEL DE SAÚDE", 836, ROW1, 861],
      ["Capacidade de equilíbrio", 75, ROW2, 100],
      ["CAPACIDADE PULMONAR", 446, ROW2, 471],
      ["AGILIDADE", 840, ROW2, 865],
      ["CONTROLE DE PESO", 75, 1465, 110],
      ["ESTADO NUTRICIONAL", 75, 1710, 120],
    ];
    for (const [s, ix, y, tx] of L) {
      indicator(g, ix, y);
      text(g, s, tx, y + 6, { f: "title", w: 300, s: 18, c: "#fff" });
    }
    const C: [string, number, number][] = [
      ["PESO PERFEITO", 200, 1616],
      ["CONTROLE DE PESO", 433, 1616],
      ["CONTROLE DE GORDURA", 666, 1616],
      ["CONTROLE MUSCULAR", 900, 1616],
      ["PROTEÍNA", 240, 1886],
      ["MINERAL", 553, 1886],
      ["Gordura", 867, 1886],
    ];
    for (const [s, x, y] of C) text(g, s, x, y + 5, { f: "title", w: 300, s: 15, c: "#fff", a: "center" });
  },
  fg(g, t) {
    // pontuação contando até 86; as marcas do anel interno acendem junto
    const k = easeOut(seg(t, 0, 0.7));
    const v = Math.round(SCORE * k);
    const n = 150;
    ticks(g, SC_CX, SC_CY, 196, 218, n, -90, 270, 2.6, "rgba(122,122,124,0.9)");
    const lit = Math.round((n * v) / 100);
    if (lit > 0) {
      g.strokeStyle = "#1ee0ea";
      g.lineWidth = 2.6;
      g.beginPath();
      for (let i = 0; i < lit; i++) {
        const a = rad(-90 + (360 * i) / n);
        g.moveTo(SC_CX + Math.cos(a) * 196, SC_CY + Math.sin(a) * 196);
        g.lineTo(SC_CX + Math.cos(a) * 218, SC_CY + Math.sin(a) * 218);
      }
      g.stroke();
    }
    text(g, String(v), SC_CX, 572, { f: "title", w: 300, s: 82, c: "#fff", a: "center" });

    // pastilhas entram uma a uma
    const a = (i: number) => easeOut(seg(t, 0.1 + i * 0.045, 0.22 + i * 0.045));
    // linha 1
    const a0 = a(0);
    if (a0 > 0) {
      g.save();
      g.globalAlpha = a0;
      g.translate(0, (1 - a0) * 14);
      g.fillStyle = "#00ff6e";
      rrect(g, 102, 1010, 120, 120, 10);
      g.fill();
      g.strokeStyle = "rgba(255,255,255,0.35)";
      g.lineWidth = 1.5;
      g.stroke();
      manIcon(g, 162, 1014);
      text(g, "músculo", 162, 1108, { f: "tech", w: 400, s: 14, c: "#fff", a: "center" });
      text(g, "padrão", 162, 1123, { f: "tech", w: 400, s: 14, c: "#fff", a: "center" });
      g.restore();
    }
    tile(g, 504, 1010, 120, 120, GREEN, ["10", "(NORMAL)"], 18, a(1));
    tile(g, 865, 1010, 120, 120, BLUE, ["Lv 1"], 18, a(2));
    tile(g, 132, 1255, 120, 120, GREEN, ["86", "(ÓTIMO)"], 18, a(3));
    tile(g, 505, 1255, 120, 120, GREEN, ["1650", "(GERAL)"], 18, a(4));
    tile(g, 865, 1255, 120, 120, GREEN, ["412", "(BOM)"], 18, a(5));
    // controle de peso
    tile(g, 100, 1500, 200, 100, GREEN, ["42.6"], 29, a(6));
    tile(g, 333, 1500, 200, 100, RED, ["-1.6"], 29, a(7));
    tile(g, 566, 1500, 200, 100, RED, ["-0.9"], 29, a(8));
    tile(g, 800, 1500, 200, 100, BLUE, ["+0.7"], 29, a(9));
    // estado nutricional
    [240, 553, 867].forEach((x, i) => {
      const al = a(10 + i);
      if (al <= 0) return;
      g.save();
      g.globalAlpha = al;
      g.fillStyle = "#00a850";
      circle(g, x, 1810, 60);
      g.fill();
      g.fillStyle = "#00ff7a";
      circle(g, x, 1810, 51);
      g.fill();
      text(g, "NORMAL", x, 1816, { f: "title", w: 300, s: 17, c: "#fff", a: "center" });
      g.restore();
    });
    void clamp;
  },
};

// ================================================================ EVOLUÇÃO
const AGES = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
// Curvas de referência (menino, 2 a 18 anos): os extremos (3% e 97%) e a posição relativa dos percentis intermediários.
const REF = {
  h: {
    p97: [102.9, 109.7, 117.6, 125.8, 133.1, 140.7, 147.7, 154.3, 160.1, 166.8, 175.6, 184.0, 188.4, 190.1, 190.8, 191.2, 191.6],
    p3: [81.3, 86.4, 93.6, 99.9, 105.3, 110.2, 115.1, 119.4, 123.3, 126.9, 131.1, 137.5, 145.4, 151.3, 153.9, 155.1, 155.2],
    f: { p75: 0.35, p50: 0.515, p25: 0.66 },
  },
  w: {
    p97: [19.1, 21.7, 24.7, 28.7, 33.6, 40.5, 49.3, 58.3, 66.1, 73.1, 81.4, 90.4, 97.4, 100.9, 101.9, 101.9, 102.0],
    p3: [10.4, 11.6, 12.9, 14.3, 15.6, 16.9, 18.1, 19.5, 20.7, 22.3, 24.3, 27.2, 31.3, 35.5, 38.4, 40.5, 41.1],
    f: { p75: 0.495, p50: 0.66, p25: 0.795 },
  },
};
type PKey = "p97" | "p75" | "p50" | "p25" | "p3";
function curveValues(key: "h" | "w", k: PKey): number[] {
  const r = REF[key];
  if (k === "p97" || k === "p3") return r[k];
  return r.p97.map((hi, i) => hi - r.f[k] * (hi - r.p3[i]));
}
const PCT: { k: PKey; c: string; l: string }[] = [
  { k: "p97", c: "#ff5a68", l: "97%" },
  { k: "p75", c: "#ffc84a", l: "75%" },
  { k: "p50", c: "#8ae664", l: "50%" },
  { k: "p25", c: "#2cc8d2", l: "25%" },
  { k: "p3", c: "#7a5af0", l: "3%" },
];
const PX0 = 59,
  PX1 = 1023;
const xAge = (a: number) => PX0 + ((a - 2) / 16) * (PX1 - PX0);
type Chart = { top: number; bot: number; vmin: number; vmax: number; key: "h" | "w"; title: string; ticks: number[] };
const CHARTS: Chart[] = [
  {
    top: 311,
    bot: 711,
    vmin: 75,
    vmax: 195,
    key: "h",
    title: "MENINO Tendência de crescimento em altura (cm)",
    ticks: [195, 188, 181, 175, 168, 161, 155, 148, 141, 135, 128, 121, 115, 108, 101, 95, 88, 81, 75],
  },
  {
    top: 810,
    bot: 1211,
    vmin: 10,
    vmax: 120,
    key: "w",
    title: "MENINO Tendência de crescimento de peso (kg)",
    ticks: [120, 113, 107, 101, 95, 89, 83, 77, 71, 65, 58, 52, 46, 40, 34, 28, 22, 16, 10],
  },
];
const yVal = (c: Chart, v: number) => c.bot - ((v - c.vmin) / (c.vmax - c.vmin)) * (c.bot - c.top);

function curvePath(g: G, c: Chart, vals: number[], upTo: number) {
  // spline suave (Catmull-Rom) até a fração upTo do eixo
  const pts = vals.map((v, i) => [xAge(AGES[i]), yVal(c, v)] as [number, number]);
  const n = pts.length;
  const lim = upTo * (n - 1);
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 0; i < n - 1 && i < lim; i++) {
    const p0 = pts[Math.max(0, i - 1)],
      p1 = pts[i],
      p2 = pts[i + 1],
      p3 = pts[Math.min(n - 1, i + 2)];
    const f = Math.min(1, lim - i);
    const c1: [number, number] = [p1[0] + ((p2[0] - p0[0]) / 6) * f, p1[1] + ((p2[1] - p0[1]) / 6) * f];
    const c2: [number, number] = [p2[0] - ((p3[0] - p1[0]) / 6) * f, p2[1] - ((p3[1] - p1[1]) / 6) * f];
    const end: [number, number] = [lerp(p1[0], p2[0], f), lerp(p1[1], p2[1], f)];
    if (f < 1) {
      g.lineTo(end[0], end[1]);
    } else g.bezierCurveTo(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1]);
  }
}

function miniFigure(g: G, view: View, x0: number) {
  g.save();
  rrect(g, x0, 1338, 400, 500, 4);
  g.clip();
  g.fillStyle = gradY(g, 1338, 1838, [
    [0, "#7e8a89"],
    [0.62, "#5c6666"],
    [0.66, "#464a4e"],
    [1, "#303236"],
  ]);
  g.fillRect(x0, 1338, 400, 500);
  g.fillStyle = "rgba(255,255,255,0.07)";
  g.fillRect(x0 + 300, 1338, 100, 400);
  const cx = x0 + (view === "front" ? 218 : 232);
  figure(g, view, cx, 1388, 430, { glow: true });
  // marcações em miniatura
  g.strokeStyle = "rgba(255,255,255,0.85)";
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(cx, 1338);
  g.lineTo(cx, 1838);
  g.stroke();
  const ys = view === "front" ? [1396, 1480, 1537, 1676] : [1393, 1483, 1615, 1700];
  ys.forEach((y, i) => {
    g.fillStyle = gradX(g, x0 + 290, x0 + 380, [
      [0, "#12cd8c"],
      [1, i === 2 ? "#00cdff" : "#00e6be"],
    ]);
    rrect(g, x0 + 292, y - 8, 96 - (i % 2) * 20, 15, 7.5);
    g.fill();
    g.strokeStyle = "rgba(255,255,255,0.9)";
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(cx, y);
    g.lineTo(x0 + 292, y);
    g.stroke();
    g.strokeStyle = "rgba(255,255,255,0.9)";
    g.stroke();
  });
  g.restore();
}

export const evolucao: Page = {
  steps: 40,
  bg(g) {
    clear(g);
    header(g, "REGISTRO DA TENDÊNCIA DE EVOLUÇÃO", 546);
    // aba da data
    g.fillStyle = "#04162e";
    g.fillRect(0, 152, 1080, 98);
    g.fillStyle = "#06385f";
    g.fillRect(0, 152, 180, 98);
    text(g, "10-23", 90, 208, { f: "title", w: 300, s: 24, c: "#fff", a: "center" });
    for (const c of CHARTS) {
      text(g, c.title, 58, c.top - 33, { f: "title", w: 300, s: 21, c: "#4a4a64" });
      // grade
      g.strokeStyle = "#1c1c2a";
      g.lineWidth = 1.5;
      g.beginPath();
      for (const a of AGES) {
        g.moveTo(xAge(a), c.top - 4);
        g.lineTo(xAge(a), c.bot + 2);
      }
      c.ticks.forEach((v, i) => {
        const y = c.top + (i * (c.bot - c.top)) / (c.ticks.length - 1);
        g.moveTo(PX0 - 3, y);
        g.lineTo(PX1, y);
      });
      g.stroke();
      c.ticks.forEach((v, i) => {
        const y = c.top + (i * (c.bot - c.top)) / (c.ticks.length - 1);
        text(g, String(v), 8, y + 8, { f: "title", w: 300, s: 22, c: "#3c3c58" });
      });
      for (const a of AGES) text(g, String(a), xAge(a), c.bot + 28, { f: "title", w: 300, s: 22, c: "#3c3c58", a: "center" });
      text(g, "Idade (anos)", 1022, c.bot + 47, { f: "title", w: 300, s: 19, c: "#4a4a64", a: "right" });
    }
    // fotos → silhuetas
    text(g, "CORPO POSITIVO", 270, 1307, { f: "title", w: 300, s: 24, c: "#fff", a: "center" });
    text(g, "CORPO LATERAL", 810, 1307, { f: "title", w: 300, s: 24, c: "#fff", a: "center" });
    miniFigure(g, "front", 70);
    miniFigure(g, "side", 610);
  },
  fg(g, t) {
    const grow = easeOut(seg(t, 0.04, 0.72));
    for (const c of CHARTS) {
      g.lineWidth = 3.6;
      g.lineCap = "round";
      g.lineJoin = "round";
      for (const p of PCT) {
        g.strokeStyle = p.c;
        curvePath(g, c, curveValues(c.key, p.k), grow);
        g.stroke();
        if (grow > 0.97) {
          const v = curveValues(c.key, p.k)[16];
          text(g, p.l, 1022, yVal(c, v) + 7, { f: "title", w: 400, s: 20, c: p.c });
        }
      }
    }
    // ponto do aluno (148 cm e 44,2 kg aos 10 anos)
    const pk = easeOut(seg(t, 0.72, 0.88));
    if (pk > 0) {
      const marks: [Chart, number, string][] = [
        [CHARTS[0], 148, "148.0"],
        [CHARTS[1], 44.2, "44.2"],
      ];
      for (const [c, v, s] of marks) {
        const x = xAge(10),
          y = yVal(c, v);
        g.save();
        g.globalAlpha = pk;
        g.fillStyle = "rgba(255,255,255,0.28)";
        circle(g, x, y, 24 * pk);
        g.fill();
        g.fillStyle = "#fff";
        circle(g, x, y, 14 * pk);
        g.fill();
        text(g, s, x, y - 28, { f: "title", w: 400, s: 27, c: "#fff", a: "center" });
        g.restore();
      }
    }
  },
};

// ================================================================ RELATÓRIO
function qrMatrix(n: number) {
  const r = rng(20261048);
  const m: boolean[][] = Array.from({ length: n }, () => Array.from({ length: n }, () => r() > 0.52));
  const finder = (x0: number, y0: number) => {
    for (let y = -1; y <= 7; y++)
      for (let x = -1; x <= 7; x++) {
        const xx = x0 + x,
          yy = y0 + y;
        if (xx < 0 || yy < 0 || xx >= n || yy >= n) continue;
        const ring = x === 0 || x === 6 || y === 0 || y === 6;
        const core = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        m[yy][xx] = x >= 0 && x <= 6 && y >= 0 && y <= 6 && (ring || core);
      }
  };
  finder(0, 0);
  finder(n - 7, 0);
  finder(0, n - 7);
  for (let i = 8; i < n - 8; i++) {
    m[6][i] = i % 2 === 0;
    m[i][6] = i % 2 === 0;
  }
  return m;
}

export const relatorio: Page = {
  steps: 1,
  bg(g) {
    clear(g);
    const CY0 = 490,
      CY1 = 1005;
    // painel
    g.fillStyle = gradLineBlue(g);
    chamfer(g, 62, CY0, 926, CY1 - CY0, 6);
    g.fill();
    // brilho diagonal
    g.save();
    chamfer(g, 62, CY0, 926, CY1 - CY0, 6);
    g.clip();
    g.fillStyle = gradX(g, 62, 988, [
      [0, "rgba(0,60,110,0.18)"],
      [0.5, "rgba(0,30,60,0)"],
      [1, "rgba(0,80,130,0.16)"],
    ]);
    g.fillRect(62, CY0, 926, CY1 - CY0);
    g.restore();
    // tampas laterais
    g.fillStyle = gradY(g, CY0, CY1, [
      [0, "#0c6cc0"],
      [1, "#0a7ad2"],
    ]);
    g.beginPath();
    g.moveTo(30, CY0 + 6);
    g.lineTo(52, CY0);
    g.lineTo(68, CY0);
    g.lineTo(68, CY0 + 60);
    g.lineTo(58, CY0 + 70);
    g.lineTo(58, CY1 - 86);
    g.lineTo(62, CY1 - 78);
    g.lineTo(62, CY1 - 8);
    g.lineTo(30, CY1 - 2);
    g.closePath();
    g.fill();
    g.fillStyle = gradY(g, CY0, CY1, [
      [0, "#14a0dc"],
      [1, "#18b4ea"],
    ]);
    g.beginPath();
    g.moveTo(1050, CY0 + 6);
    g.lineTo(1028, CY0);
    g.lineTo(1012, CY0);
    g.lineTo(1012, CY0 + 70);
    g.lineTo(1022, CY0 + 80);
    g.lineTo(1022, CY1 - 86);
    g.lineTo(1018, CY1 - 78);
    g.lineTo(1018, CY1 - 8);
    g.lineTo(1050, CY1 - 2);
    g.closePath();
    g.fill();
    // linhas decorativas
    g.fillStyle = "#1a88d8";
    g.fillRect(93, 492, 629, 5);
    g.fillRect(262, 509, 628, 5);
    g.fillRect(366, 999, 629, 6);
    g.fillRect(553, 1026, 380, 6);
    g.strokeStyle = "rgba(20,100,160,0.22)";
    g.lineWidth = 2;
    g.strokeRect(106, 530, 868, 436);
    g.fillStyle = "rgba(0,0,0,0.0)";
    // letreiro
    text(g, "ANÁLISE CORPORAL CONCLUÍDA", 112, 467, {
      f: "tech",
      w: 700,
      italic: true,
      s: 20,
      c: gradX(g, 112, 497, [
        [0, "#1b8fe6"],
        [1, "#20a8ee"],
      ]),
      ls: 1.2,
      sk: 12,
      fit: 390,
    });
    // título
    const tc = gradX(g, 400, 716, [
      [0, "#1c8ee6"],
      [1, "#28a8ee"],
    ]);
    text(g, "AVALIAÇÃO DE SAÚDE", 562, 652, { f: "tech", w: 700, italic: true, s: 31, c: tc, a: "center", ls: 2, sk: 12, fit: 311 });
    text(g, "CONCLUÍDA", 562, 696, { f: "tech", w: 700, italic: true, s: 31, c: tc, a: "center", ls: 2, sk: 12, fit: 148 });
    g.fillStyle = "rgba(40,120,160,0.55)";
    g.fillRect(130, 811, 853, 1.5);
    // botões
    for (const [x, kind] of [
      [348, "print"],
      [648, "next"],
    ] as const) {
      g.save();
      g.shadowColor = "rgba(0,150,220,0.5)";
      g.shadowBlur = 16;
      g.fillStyle = gradX(g, x, x + 86, [
        [0, "#04557e"],
        [1, "#06719e"],
      ]);
      chamfer(g, x, 849, 86, 82, 10);
      g.fill();
      g.restore();
      g.strokeStyle = "#1da4d8";
      g.lineWidth = 3;
      chamfer(g, x + 2, 851, 82, 78, 9);
      g.stroke();
      g.strokeStyle = "#fff";
      g.fillStyle = "#fff";
      g.lineWidth = 3;
      g.lineCap = "round";
      g.lineJoin = "round";
      const cx = x + 43,
        cy = 890;
      if (kind === "print") {
        rrect(g, cx - 11, cy - 4, 22, 13, 2);
        g.stroke();
        g.strokeRect(cx - 7, cy - 14, 14, 10);
        g.strokeRect(cx - 7, cy + 3, 14, 10);
      } else {
        g.beginPath();
        g.moveTo(cx - 14, cy);
        g.lineTo(cx + 14, cy);
        g.moveTo(cx + 5, cy - 9);
        g.lineTo(cx + 14, cy);
        g.lineTo(cx + 5, cy + 9);
        g.stroke();
      }
    }
    // QR decorativo
    const n = 29,
      cell = 5,
      qx = 467,
      qy = 1077;
    g.fillStyle = "#fff";
    g.fillRect(qx - 3, qy - 3, n * cell + 6, n * cell + 6);
    g.fillStyle = "#050510";
    const m = qrMatrix(n);
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (m[y][x]) g.fillRect(qx + x * cell, qy + y * cell, cell, cell);
    g.fillStyle = "#fff";
    circle(g, 540, 1150, 17);
    g.fill();
    g.fillStyle = "#e61e64";
    circle(g, 540, 1150, 14);
    g.fill();
    g.fillStyle = "#fff";
    g.beginPath();
    g.moveTo(540, 1142);
    g.lineTo(548, 1155);
    g.lineTo(532, 1155);
    g.closePath();
    g.fill();
    text(g, "Escaneie para ver o relatório", 540, 1255, { f: "text", w: 400, s: 17, c: "#4a78e6", a: "center" });
    // nota de rodapé
    const nota = [
      "Nota: Este produto não é um dispositivo médico. Seu uso destina-se apenas a alertar o usuário sobre o seu estado de saúde.",
      "Consulte seu médico se os resultados obtidos com este dispositivo não estiverem de acordo com os parâmetros de saúde",
      "padrão.",
    ];
    nota.forEach((l, i) => text(g, l, 140, 1781 + i * 17, { f: "text", w: 300, s: 14.5, c: "#2e2e34" }));
  },
};

function gradLineBlue(g: G) {
  return gradY(g, 490, 1005, [
    [0, "#00050f"],
    [0.5, "#000a18"],
    [1, "#00060e"],
  ]);
}
