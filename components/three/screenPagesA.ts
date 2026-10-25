// Telas de identificação e consentimento.
import {
  chamfer,
  circle,
  clamp,
  gradConic,
  gradLine,
  gradX,
  gradY,
  rad,
  rrect,
  text,
  ticks,
  type G,
  type Page,
  type Stop,
} from "./screenKit";

export const STUDENT_ID = "20261048";
const KEYS: (string | "del" | "go")[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "del", "0", "go"];
const KEY_X = [276, 468, 660];
const KEY_Y = [1284, 1434, 1584, 1734];
export const KEY_W = 146;
export const KEY_H = 102;

/** Posição (centro) da tecla de um dígito. */
export function keyCenter(k: string) {
  const i = KEYS.indexOf(k);
  return { x: KEY_X[i % 3] + KEY_W / 2, y: KEY_Y[Math.floor(i / 3)] + KEY_H / 2 };
}

const RING_STOPS: Stop[] = [
  [0, "rgb(2,100,135)"],
  [30 / 360, "rgb(13,73,108)"],
  [60 / 360, "rgb(12,23,50)"],
  [90 / 360, "rgb(1,0,26)"],
  [120 / 360, "rgb(2,1,25)"],
  [150 / 360, "rgb(6,23,56)"],
  [180 / 360, "rgb(0,75,120)"],
  [210 / 360, "rgb(6,99,126)"],
  [240 / 360, "rgb(0,71,89)"],
  [270 / 360, "rgb(0,41,52)"],
  [300 / 360, "rgb(3,41,46)"],
  [330 / 360, "rgb(0,72,87)"],
  [1, "rgb(2,100,135)"],
];

function gear(g: G, cx: number, cy: number, r: number, color: string) {
  g.fillStyle = color;
  g.beginPath();
  const n = 8;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const w = Math.PI / n / 2;
    for (const [aa, rr] of [
      [a - w * 1.15, r * 0.78],
      [a - w * 0.7, r],
      [a + w * 0.7, r],
      [a + w * 1.15, r * 0.78],
    ] as const) {
      const x = cx + Math.cos(aa) * rr,
        y = cy + Math.sin(aa) * rr;
      if (i === 0 && aa === a - w * 1.15) g.moveTo(x, y);
      else g.lineTo(x, y);
    }
  }
  g.closePath();
  g.fill();
  g.globalCompositeOperation = "destination-out";
  circle(g, cx, cy, r * 0.38);
  g.fill();
  g.globalCompositeOperation = "source-over";
}

function wifi(g: G, cx: number, cy: number) {
  g.strokeStyle = "#fff";
  g.fillStyle = "#fff";
  g.lineCap = "round";
  g.lineWidth = 6;
  for (const r of [13, 24, 35]) {
    g.beginPath();
    g.arc(cx, cy, r, rad(-135), rad(-45));
    g.stroke();
  }
  circle(g, cx, cy, 4.5);
  g.fill();
}

/** Emblema com anel segmentado, letreiro da estação e campo de ID. */
function emblem(g: G) {
  const cx = 540,
    cy = 770;
  const conic = gradConic(g, cx, cy, 450, RING_STOPS, 0);
  // círculo externo
  g.strokeStyle = conic;
  g.lineWidth = 9;
  circle(g, cx, cy, 445);
  g.stroke();
  // faixa de blocos
  g.save();
  g.globalAlpha = 0.5;
  g.fillStyle = conic;
  const blocks = [
    [-100, 12],
    [-84, 13],
    [-64, 9],
    [-48, 12],
    [-30, 10],
    [-14, 9],
    [3, 10],
    [18, 12],
    [34, 10],
    [52, 11],
    [70, 10],
    [90, 14],
    [112, 10],
    [128, 12],
    [146, 12],
    [165, 10],
    [181, 10],
    [200, 12],
    [220, 10],
    [238, 12],
    [256, 8],
    [270, 10],
  ];
  for (const [a, w] of blocks) {
    const a0 = rad(a),
      a1 = rad(a + w);
    g.beginPath();
    g.arc(cx, cy, 405, a0, a1);
    g.lineTo(cx + Math.cos(a1) * 372, cy + Math.sin(a1) * 372);
    g.arc(cx, cy, 372, a1, a0, true);
    g.closePath();
    g.fill();
  }
  g.restore();
  // círculo fino e arcos pontilhados
  g.save();
  g.globalAlpha = 0.28;
  g.strokeStyle = conic;
  g.lineWidth = 2;
  circle(g, cx, cy, 418);
  g.stroke();
  g.globalAlpha = 0.7;
  ticks(g, cx, cy, 290, 303, 190, -80, 90, 2.2, "rgb(20,95,160)");
  g.globalAlpha = 0.4;
  ticks(g, cx, cy, 296, 306, 120, 105, 160, 2, "rgb(20,95,160)");
  g.restore();

  // letreiro
  text(g, "DANX · ESTAÇÃO DE SAÚDE", 540, 681, {
    f: "tech",
    w: 700,
    italic: true,
    s: 25,
    ls: 1.4,
    sk: 12,
    c: gradX(g, 316, 768, [
      [0, "#1b8fe6"],
      [1, "#1fa6ec"],
    ]),
    a: "center",
    fit: 452,
  });

  // moldura do campo de ID
  const capL = gradY(g, 712, 862, [
    [0, "#1c8be8"],
    [1, "#1d9af0"],
  ]);
  g.fillStyle = capL;
  g.beginPath();
  g.moveTo(296, 712);
  g.lineTo(322, 712);
  g.lineTo(322, 862);
  g.lineTo(296, 862);
  g.lineTo(290, 856);
  g.lineTo(290, 826);
  g.lineTo(296, 820);
  g.lineTo(296, 758);
  g.lineTo(290, 752);
  g.lineTo(290, 718);
  g.closePath();
  g.fill();
  g.fillStyle = "#000";
  g.fillRect(307, 712, 3, 150);
  g.fillRect(316, 712, 2, 150);
  const capR = gradY(g, 712, 862, [
    [0, "#10bff0"],
    [1, "#08d4ff"],
  ]);
  g.fillStyle = capR;
  g.beginPath();
  g.moveTo(758, 712);
  g.lineTo(784, 712);
  g.lineTo(790, 718);
  g.lineTo(790, 756);
  g.lineTo(784, 762);
  g.lineTo(784, 826);
  g.lineTo(790, 832);
  g.lineTo(790, 856);
  g.lineTo(784, 862);
  g.lineTo(758, 862);
  g.closePath();
  g.fill();
  g.fillStyle = "#000";
  g.fillRect(770, 712, 2, 150);
  g.fillRect(762, 712, 2, 150);
  // linhas superior e inferior
  g.fillStyle = gradX(g, 322, 758, [
    [0, "rgb(82,149,190)"],
    [1, "rgb(80,200,222)"],
  ]);
  g.fillRect(322, 711, 436, 5);
  g.fillStyle = gradX(g, 322, 758, [
    [0, "#2a9eec"],
    [1, "#52d0ee"],
  ]);
  g.fillRect(322, 859, 436, 4);
  // retângulo interno
  g.strokeStyle = gradX(g, 336, 736, [
    [0, "#32a0e0"],
    [1, "#33d5f5"],
  ]);
  g.lineWidth = 4;
  g.strokeRect(338, 742, 396, 62);
  // cunha azul na base
  g.fillStyle = gradX(g, 328, 458, [
    [0, "rgba(0,60,100,0.9)"],
    [1, "rgba(0,100,160,0.5)"],
  ]);
  g.beginPath();
  g.moveTo(328, 824);
  g.lineTo(412, 824);
  g.lineTo(458, 858);
  g.lineTo(328, 858);
  g.closePath();
  g.fill();
  g.fillStyle = "#1b9ff0";
  g.fillRect(328, 846, 130, 12);
  g.fillStyle = "rgba(0,120,190,0.5)";
  g.fillRect(466, 848, 270, 3);
  // marcas da cunha
  g.fillStyle = "rgba(120,200,255,0.5)";
  g.fillRect(332, 828, 5, 3);
  g.fillRect(332, 833, 10, 3);
  g.fillRect(332, 838, 14, 3);
  // grades laterais
  g.fillStyle = "rgba(0,0,0,0.55)";
  for (let y = 806; y < 850; y += 6) g.fillRect(293, y, 12, 3);
  for (let y = 722; y < 756; y += 6) g.fillRect(776, y, 10, 3);

  // rótulo "ID"
  g.strokeStyle = "#35b0f2";
  g.lineWidth = 4;
  g.lineJoin = "miter";
  g.beginPath();
  g.moveTo(350, 758);
  g.lineTo(350, 790);
  g.stroke();
  g.beginPath();
  g.moveTo(364, 758);
  g.lineTo(386, 758);
  g.lineTo(392, 764);
  g.lineTo(392, 790);
  g.lineTo(364, 790);
  g.closePath();
  g.stroke();
}

function keypad(g: G, hot?: string) {
  for (let i = 0; i < KEYS.length; i++) {
    const k = KEYS[i];
    const x = KEY_X[i % 3],
      y = KEY_Y[Math.floor(i / 3)];
    drawKey(g, x, y, k, k === hot);
  }
}

/** Tecla chanfrada (também usada na grade do teste de agilidade). */
export function drawKey(g: G, x: number, y: number, k: string, hot: boolean) {
  chamfer(g, x + 2, y + 2, KEY_W - 4, KEY_H - 4, 13);
  if (hot) {
    g.fillStyle = gradLine(g, x, y, x + KEY_W, y + KEY_H, [
      [0, "rgba(0,70,120,0.95)"],
      [1, "rgba(0,110,150,0.95)"],
    ]);
    g.fill();
  }
  g.strokeStyle = hot ? "#12a0d8" : "#05586c";
  g.lineWidth = 4;
  g.stroke();
  const cx = x + KEY_W / 2,
    cy = y + KEY_H / 2;
  const col = hot ? "#7fd6ff" : "#2e9be8";
  if (k === "del") {
    g.fillStyle = col;
    // lixeira
    g.fillRect(cx - 12, cy - 17, 24, 3);
    rrect(g, cx - 5, cy - 22, 10, 6, 2);
    g.fill();
    g.beginPath();
    g.moveTo(cx - 14, cy - 12);
    g.lineTo(cx + 14, cy - 12);
    g.lineTo(cx + 12, cy + 24);
    g.lineTo(cx - 12, cy + 24);
    g.closePath();
    g.fill();
    g.fillStyle = hot ? "rgba(0,50,90,0.9)" : "#000";
    for (const dx of [-7, -2, 3]) g.fillRect(cx + dx, cy - 6, 2.4, 24);
  } else if (k === "go") {
    g.fillStyle = col;
    g.beginPath();
    g.moveTo(cx - 33, cy + 20);
    g.bezierCurveTo(cx - 32, cy + 2, cx - 16, cy - 10, cx + 2, cy - 10);
    g.lineTo(cx + 2, cy - 22);
    g.lineTo(cx + 34, cy + 2);
    g.lineTo(cx + 2, cy + 22);
    g.lineTo(cx + 2, cy + 10);
    g.bezierCurveTo(cx - 14, cy + 8, cx - 26, cy + 12, cx - 33, cy + 20);
    g.closePath();
    g.fill();
  } else {
    text(g, k, cx, cy + 1, { f: "title", w: 300, s: 66, c: col, a: "center", b: "middle" });
  }
}

function digits(g: G, n: number, color: string) {
  if (n <= 0) return;
  text(g, STUDENT_ID.slice(0, n), 416, 790, { f: "title", w: 300, s: 48, c: color, a: "left", fit: n * 22.4 - 2 });
}

function topBar(g: G, dim = false) {
  g.save();
  g.globalAlpha = dim ? 0.2 : 1;
  gear(g, 91, 92, 24, "#34384e");
  g.restore();
  text(g, "DANX", 540, 106, { f: "text", w: 300, s: 40, c: "#3c3b42", a: "center", ls: 1 });
  if (!dim) wifi(g, 988, 108);
}

const N = STUDENT_ID.length;

export const inicio: Page = {
  steps: 32,
  bg(g) {
    g.fillStyle = "#000";
    g.fillRect(0, 0, 1080, 1920);
    topBar(g);
    emblem(g);
  },
  fg(g, t) {
    // t percorre 8 teclas; em cada uma, a tecla acende e depois o dígito aparece
    const tt = clamp(t) * N;
    const k = Math.min(N - 1, Math.floor(tt + 1e-9));
    const f = t >= 1 ? 1 : tt - k;
    const typed = k + (f >= 0.5 ? 1 : 0);
    const hot = t >= 1 ? "" : f >= 0.12 && f < 0.78 ? STUDENT_ID[k] : "";
    keypad(g, hot);
    digits(g, typed, "#2a9fe6");
  },
};

function dialog(g: G) {
  const x = 365,
    y = 818,
    w = 350,
    h = 283;
  g.save();
  g.shadowColor = "rgba(0,0,0,0.5)";
  g.shadowBlur = 24;
  g.fillStyle = "#fff";
  rrect(g, x, y, w, h, 14);
  g.fill();
  g.restore();
  g.save();
  rrect(g, x, y, w, h, 14);
  g.clip();
  g.fillStyle = gradX(g, x, x + w, [
    [0, "rgb(11,58,100)"],
    [0.5, "rgb(15,115,150)"],
    [1, "rgb(21,198,208)"],
  ]);
  g.fillRect(x, y, w, 50);
  g.restore();
  text(g, "AVISO DO SISTEMA", 377, 851, { f: "tech", w: 700, italic: true, s: 20, ls: 0.6, c: "#fff", fit: 232, sk: 12 });
  // ícone de alerta
  g.strokeStyle = "#cf2a1c";
  g.fillStyle = "#cf2a1c";
  g.lineWidth = 2.6;
  circle(g, 539.5, 895, 12.5);
  g.stroke();
  g.fillRect(538, 887, 3, 10);
  circle(g, 539.5, 902, 1.8);
  g.fill();
  // pergunta
  const lines = ["Você concorda em coletar", "suas informações pessoais", "durante o processo de teste?"];
  lines.forEach((l, i) => text(g, l, 540, 950 + i * 29, { f: "text", w: 700, s: 24, c: "#585659", a: "center", fit: i === 0 ? 292 : i === 1 ? 315 : 325 }));
  // botões
  g.fillStyle = "rgba(0,0,0,0.06)";
  g.fillRect(539.5, 1058, 1, 38);
  text(g, "RECUSAR", 452.5, 1083, { f: "text", w: 400, s: 18, c: "#9ca3ad", a: "center" });
  text(g, "CONCORDO", 627, 1083, { f: "text", w: 400, s: 18, c: "#9ca3ad", a: "center" });
}

export const consentimento: Page = {
  steps: 10,
  bg(g) {
    g.fillStyle = "#000";
    g.fillRect(0, 0, 1080, 1920);
    topBar(g, true);
    emblem(g);
    keypad(g);
    digits(g, N, "#2a9fe6");
    // escurece a tela inteira, menos o ícone de rede
    g.fillStyle = "rgba(0,0,0,0.83)";
    g.fillRect(0, 0, 1080, 1920);
    g.save();
    g.globalAlpha = 0.55;
    wifi(g, 988, 108);
    g.restore();
    dialog(g);
  },
  fg(g, t) {
    // a partir de 60% o aluno toca em CONCORDO: o botão fica destacado
    if (t < 0.6 - 1e-6) return;
    g.fillStyle = "#fff";
    g.fillRect(542, 1050, 158, 48);
    g.fillStyle = "rgba(60,150,200,0.16)";
    g.fillRect(542, 1050, 158, 48);
    text(g, "CONCORDO", 627, 1083, { f: "text", w: 500, s: 18, c: "#168ab8", a: "center" });
  },
};
