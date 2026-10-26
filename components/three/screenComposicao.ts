// Tela de análise da composição corporal: anel de rótulos coloridos, medidores e lista de barras.
import {
  circle,
  easeOut,
  gradConic,
  gradRad,
  gradX,
  header,
  lerp,
  rad,
  rrect,
  seg,
  text,
  ticks,
  U_W,
  type G,
  type Page,
  type Stop,
} from "./screenKit";

const CX = 540,
  CY = 590;

// Cores ao redor do anel (ângulo em graus a partir do topo, sentido horário)
const WHEEL: [number, [number, number, number]][] = [
  [0, [255, 22, 170]],
  [45, [176, 40, 240]],
  [90, [72, 30, 240]],
  [135, [40, 100, 250]],
  [180, [0, 228, 246]],
  [225, [48, 234, 112]],
  [270, [252, 214, 50]],
  [315, [255, 132, 32]],
  [360, [255, 22, 170]],
];
function wheel(angTop: number, a = 1) {
  const d = ((angTop % 360) + 360) % 360;
  let i = 0;
  while (i < WHEEL.length - 2 && d > WHEEL[i + 1][0]) i++;
  const [d0, c0] = WHEEL[i],
    [d1, c1] = WHEEL[i + 1];
  const k = (d - d0) / (d1 - d0);
  const c = c0.map((v, j) => Math.round(lerp(v, c1[j], k)));
  return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
}
const WHEEL_STOPS: Stop[] = WHEEL.map(([d, c]) => [d / 360, `rgb(${c[0]},${c[1]},${c[2]})`]);

type Metric = {
  key: string;
  pill: string;
  label: string;
  ang: number; // ângulo a partir do topo
  col: string;
  ix: number; // centro do ícone
  iy: number;
  ty: number; // centro vertical do rótulo
  vr: number; // raio do vértice do radar no resultado (0..1)
};
const METRICS: Metric[] = [
  { key: "imc", pill: "IMC", label: "IMC", ang: 0, col: "#e6179b", ix: 540, iy: 226, ty: 261, vr: 0.95 },
  { key: "osso", pill: "OSSO", label: "OSSO", ang: 45, col: "#ffc832", ix: 787, iy: 326, ty: 378, vr: 0.7 },
  { key: "visc", pill: "VISC.", label: "VISCERAL", ang: 90, col: "#1ee66e", ix: 890, iy: 580, ty: 618, vr: 0.94 },
  { key: "gord", pill: "GORDURA", label: "GORDURA", ang: 135, col: "#aa1ee6", ix: 786, iy: 825, ty: 873, vr: 0.85 },
  { key: "agua", pill: "ÁGUA", label: "ÁGUA", ang: 180, col: "#1e78f0", ix: 540, iy: 928, ty: 967, vr: 0.87 },
  { key: "prot", pill: "PROTEÍNA", label: "PROTEÍNA", ang: 225, col: "#1edce6", ix: 292, iy: 825, ty: 865, vr: 0.9 },
  { key: "musc", pill: "MÚSCULO", label: "MÚSCULO", ang: 270, col: "#6e3cf0", ix: 190, iy: 575, ty: 616, vr: 0.96 },
  { key: "tmb", pill: "TMB", label: "TMB", ang: 315, col: "#f57d14", ix: 291, iy: 325, ty: 378, vr: 0.94 },
];

// ---------- ícones de linha (cerca de 56 px) ----------
function icon(g: G, key: string, x: number, y: number, col: string) {
  g.save();
  g.translate(x, y);
  g.strokeStyle = col;
  g.fillStyle = col;
  g.lineWidth = 3.4;
  g.lineCap = "round";
  g.lineJoin = "round";
  const dot = (px: number, py: number, r: number) => {
    g.beginPath();
    g.arc(px, py, r, 0, Math.PI * 2);
    g.stroke();
  };
  switch (key) {
    case "imc": {
      g.beginPath();
      g.moveTo(-23, 10);
      g.lineTo(-12, -8);
      g.lineTo(2, 8);
      g.lineTo(13, -9);
      g.lineTo(24, 4);
      g.stroke();
      for (const [px, py] of [
        [-23, 10],
        [-12, -8],
        [13, -9],
        [24, 4],
      ])
        dot(px, py, 4);
      break;
    }
    case "tmb": {
      dot(0, 1, 8);
      dot(18, -16, 5);
      dot(17, 17, 5);
      dot(-19, 0, 4);
      g.beginPath();
      g.moveTo(6, -5);
      g.lineTo(14, -12);
      g.moveTo(6, 8);
      g.lineTo(13, 14);
      g.moveTo(-8, 0);
      g.lineTo(-15, 0);
      g.stroke();
      break;
    }
    case "osso": {
      // osso na diagonal: contorno de duas cabeças e uma haste
      g.save();
      g.rotate(-Math.PI / 4);
      g.lineWidth = 3.2;
      g.beginPath();
      g.moveTo(-14, -6);
      g.arc(-21, -6, 7, 0, Math.PI * 1.0, true);
      g.arc(-21, 6, 7, -Math.PI, 0, true);
      g.lineTo(-14, 6);
      g.lineTo(14, 6);
      g.arc(21, 6, 7, Math.PI, 0.0, false);
      g.arc(21, -6, 7, 0, Math.PI, false);
      g.lineTo(14, -6);
      g.closePath();
      g.stroke();
      g.restore();
      break;
    }
    case "visc": {
      g.beginPath();
      g.moveTo(-2, -10);
      g.lineTo(-2, 4);
      g.moveTo(2, -10);
      g.lineTo(2, 4);
      g.moveTo(0, -24);
      g.lineTo(0, -10);
      g.stroke();
      g.beginPath();
      g.moveTo(-3, -20);
      g.bezierCurveTo(-20, -22, -28, 8, -26, 20);
      g.bezierCurveTo(-24, 28, -10, 26, -4, 14);
      g.bezierCurveTo(-1, 8, -2, -4, -3, -20);
      g.stroke();
      g.beginPath();
      g.moveTo(3, -20);
      g.bezierCurveTo(20, -22, 28, 8, 26, 20);
      g.bezierCurveTo(24, 28, 10, 26, 4, 14);
      g.bezierCurveTo(1, 8, 2, -4, 3, -20);
      g.stroke();
      break;
    }
    case "gord": {
      // hélice de DNA inclinada
      g.save();
      g.rotate(0.45);
      g.lineWidth = 3;
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const yy = -26 + i * 2.2;
        const xx = Math.sin(i * 0.5) * 11;
        if (i) g.lineTo(xx, yy);
        else g.moveTo(xx, yy);
      }
      g.stroke();
      g.beginPath();
      for (let i = 0; i <= 24; i++) {
        const yy = -26 + i * 2.2;
        const xx = -Math.sin(i * 0.5) * 11;
        if (i) g.lineTo(xx, yy);
        else g.moveTo(xx, yy);
      }
      g.stroke();
      g.lineWidth = 2;
      for (let i = 1; i < 24; i += 3) {
        const yy = -26 + i * 2.2;
        const xx = Math.sin(i * 0.5) * 11;
        g.beginPath();
        g.moveTo(xx, yy);
        g.lineTo(-xx, yy);
        g.stroke();
      }
      g.restore();
      break;
    }
    case "agua": {
      g.beginPath();
      g.moveTo(0, -24);
      g.bezierCurveTo(4, -12, 15, -4, 15, 9);
      g.bezierCurveTo(15, 20, 8, 25, 0, 25);
      g.bezierCurveTo(-8, 25, -15, 20, -15, 9);
      g.bezierCurveTo(-15, -4, -4, -12, 0, -24);
      g.stroke();
      break;
    }
    case "prot": {
      g.beginPath();
      g.moveTo(-3, -24);
      g.bezierCurveTo(8, -26, 20, -12, 18, 4);
      g.bezierCurveTo(16, 18, 4, 25, -8, 22);
      g.bezierCurveTo(-24, 18, -22, -2, -14, -10);
      g.bezierCurveTo(-8, -15, -10, -22, -3, -24);
      g.stroke();
      dot(-1, 6, 7);
      break;
    }
    case "musc": {
      g.beginPath();
      g.moveTo(-24, 14);
      g.bezierCurveTo(-28, 0, -22, -14, -8, -16);
      g.bezierCurveTo(-2, -24, 14, -26, 20, -16);
      g.bezierCurveTo(26, -8, 20, -2, 14, 0);
      g.bezierCurveTo(22, 4, 26, 14, 14, 20);
      g.bezierCurveTo(4, 26, -14, 24, -24, 14);
      g.stroke();
      g.beginPath();
      g.moveTo(-12, -4);
      g.bezierCurveTo(-4, -10, 6, -10, 8, -2);
      g.stroke();
      g.beginPath();
      g.moveTo(-14, 8);
      g.bezierCurveTo(-6, 14, 4, 12, 8, 6);
      g.stroke();
      break;
    }
  }
  g.restore();
}

// ---------- barras ----------
type Row = { label: string; value: string; len: number; kind: "baixo" | "normal" | "alto" | "muito"; num: number; dec: number; unit: string };
// Aluno de exemplo (menino, 10 anos). Os comprimentos das barras seguem a posição do valor na faixa de referência.
const ROWS: Row[] = [
  { label: "ALTURA", value: "148.0", unit: "cm", len: 0.89, kind: "normal", num: 148, dec: 1 },
  { label: "PESO", value: "44.2", unit: " kg", len: 0.9, kind: "normal", num: 44.2, dec: 1 },
  { label: "IMC", value: "20.2", unit: "", len: 0.91, kind: "normal", num: 20.2, dec: 1 },
  { label: "GORDURA", value: "21.3", unit: "%", len: 0.7, kind: "normal", num: 21.3, dec: 1 },
  { label: "GORDURA-VISC", value: "2.0", unit: "", len: 0.44, kind: "baixo", num: 2, dec: 1 },
  { label: "GORDURA-SUBC", value: "17.8", unit: "%", len: 0.74, kind: "normal", num: 17.8, dec: 1 },
  { label: "MÚSCULO", value: "52.2", unit: "%", len: 0.93, kind: "normal", num: 52.2, dec: 1 },
  { label: "OSSO", value: "2.4", unit: " kg", len: 0.6, kind: "normal", num: 2.4, dec: 1 },
  { label: "ÁGUA", value: "58.9", unit: "%", len: 0.77, kind: "normal", num: 58.9, dec: 1 },
  { label: "PROTEÍNA", value: "16.1", unit: "%", len: 0.86, kind: "alto", num: 16.1, dec: 1 },
  { label: "TMB", value: "1312.0", unit: "kcal", len: 0.9, kind: "normal", num: 1312, dec: 1 },
];
const ROW_Y0 = 1059;
const ROW_DY = 73.7;
const BAR_X0 = 212,
  BAR_X1 = 856;

const KIND_COLORS: Record<Row["kind"], [string, string]> = {
  baixo: ["#14dcdc", "#1470c8"],
  normal: ["#9af070", "#64e79c"],
  alto: ["#ffe27a", "#ffcf1e"],
  muito: ["#ff7a7a", "#ff2a0a"],
};

function rows(g: G, ph: number, p: number) {
  // ph: 0..1 medição da altura (primeira linha); p: 0..1 demais barras (cada linha começa um pouco depois da anterior)
  const n = ROWS.length - 1;
  ROWS.forEach((r, i) => {
    const y = ROW_Y0 + i * ROW_DY;
    const k = i === 0 ? easeOut(ph) : easeOut(seg(p, ((i - 1) / n) * 0.5, ((i - 1) / n) * 0.5 + 0.5));
    // valor
    const v = r.num * k;
    const s = k <= 0 ? (r.unit === "kcal" ? "0" : r.unit === "cm" ? "0" : r.value === "2.0" ? "0" : "0") : v.toFixed(r.dec);
    const shown = k >= 0.999 ? r.value : s;
    text(g, shown + r.unit, 887, y + 7, { f: "text", w: 300, s: 21, c: "#dcdce0" });
    if (k <= 0) return;
    const len = (BAR_X1 - 16 - (BAR_X0 + 15)) * r.len * k;
    const [c0, c1] = KIND_COLORS[r.kind];
    g.fillStyle = gradX(g, BAR_X0 + 15, BAR_X0 + 15 + Math.max(len, 20), [
      [0, c0],
      [1, c1],
    ]);
    rrect(g, BAR_X0 + 15, y - 10, Math.max(len, 20), 20, 10);
    g.fill();
  });
}

function bars(g: G) {
  ROWS.forEach((r, i) => {
    const y = ROW_Y0 + i * ROW_DY;
    text(g, r.label, 182, y + 7, { f: "text", w: 300, s: 21, c: "#dcdce0", a: "right" });
    g.fillStyle = "#04041a";
    rrect(g, BAR_X0, y - 19, BAR_X1 - BAR_X0, 38, 19);
    g.fill();
  });
  // legenda
  const lg: [number, string, string, number][] = [
    [74, "#8c64ff", "MUITO BAIXO", 134],
    [295, "#0a6fa8", "BAIXO", 355],
    [456, "#6eeb96", "NORMAL", 516],
    [640, "#ffd71e", "ALTO", 700],
    [793, "#ff2a0a", "MUITO ALTO", 853],
  ];
  for (const [x, c, l, tx] of lg) {
    g.fillStyle = c;
    g.fillRect(x, 1860, 40, 40);
    text(g, l, tx, 1888, { f: "text", w: 300, s: 20, c: "#dcdce0" });
  }
}

// ---------- anel ----------
function guides(g: G) {
  g.strokeStyle = "rgba(24,26,64,0.55)";
  g.lineWidth = 2;
  circle(g, CX, CY, 292);
  g.stroke();
  g.strokeStyle = "rgba(18,20,50,0.5)";
  circle(g, CX, CY, 238);
  g.stroke();
  g.beginPath();
  g.moveTo(CX, 300);
  g.lineTo(CX, 880);
  g.moveTo(250, CY);
  g.lineTo(830, CY);
  g.stroke();
  g.beginPath();
  g.moveTo(CX, 880);
  g.lineTo(CX, 905);
  g.stroke();
}

function pills(g: G) {
  for (const m of METRICS) {
    const a = rad(m.ang - 90);
    const px = CX + Math.cos(a) * 180,
      py = CY + Math.sin(a) * 180;
    g.save();
    g.translate(px, py);
    g.rotate(a + Math.PI / 2);
    // gradiente ao longo da tangente (cor do ângulo vizinho nas pontas)
    g.fillStyle = gradX(g, -62, 62, [
      [0, wheel(m.ang - 17)],
      [1, wheel(m.ang + 17)],
    ]);
    rrect(g, -62, -16.5, 124, 33, 16.5);
    g.fill();
    g.restore();
    g.save();
    g.translate(px, py);
    g.rotate(a + Math.PI / 2);
    text(g, m.pill, 0, 8, { f: "text", w: 400, s: 24, c: "#fff", a: "center", max: 100 });
    g.restore();
  }
}

function outerLabels(g: G) {
  for (const m of METRICS) {
    icon(g, m.key, m.ix, m.iy, m.col);
    text(g, m.label, m.ix, m.ty + 9, { f: "tech", w: 400, s: 25, c: m.col, a: "center", ls: 0.6, max: 92 });
  }
}

function rainbowRing(g: G) {
  g.strokeStyle = gradConic(g, CX, CY, 140, WHEEL_STOPS, -Math.PI / 2);
  g.lineWidth = 5;
  circle(g, CX, CY, 134);
  g.stroke();
}

const NT = 136; // marcas do anel de progresso
const TICK_STOPS: Stop[] = [
  [0, "rgb(11,138,178)"],
  [0.25, "rgb(33,183,183)"],
  [0.5, "rgb(28,191,211)"],
  [0.75, "rgb(8,136,153)"],
  [1, "rgb(11,138,178)"],
];

function tickRing(g: G, lit: number) {
  // marcas apagadas
  ticks(g, CX, CY, 141, 160, NT, -90, 270, 3.1, "rgba(14,52,72,0.95)");
  if (lit <= 0) return;
  const n = Math.min(NT, Math.round(lit * NT));
  if (n <= 0) return;
  g.strokeStyle = gradConic(g, CX, CY, 160, TICK_STOPS, -Math.PI / 2);
  g.lineWidth = 3.1;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rad(-90 + (360 * i) / NT);
    g.moveTo(CX + Math.cos(a) * 141, CY + Math.sin(a) * 141);
    g.lineTo(CX + Math.cos(a) * 160, CY + Math.sin(a) * 160);
  }
  g.stroke();
}

function arcBand(g: G, r0: number, r1: number, a0: number, a1: number, color: string) {
  const A0 = rad(a0),
    A1 = rad(a1);
  g.fillStyle = color;
  g.beginPath();
  g.arc(CX, CY, r1, A0, A1);
  g.arc(CX, CY, r0, A1, A0, true);
  g.closePath();
  g.fill();
}

function innerGauge(g: G, p: number) {
  // faixa escura (grande) e faixa clara (menor) que crescem com o progresso, e quadradinhos ao longo do anel
  const s0 = -100;
  arcBand(g, 99, 126, s0, s0 + 330 * p, "rgb(0,84,94)");
  arcBand(g, 101, 116, s0, s0 + 118 * Math.min(1, p * 1.4), "rgb(18,145,178)");
  g.fillStyle = "rgb(34,190,190)";
  const nd = 46;
  for (let i = 0; i < nd; i++) {
    const f = i / nd;
    if (f > p) break;
    const a = rad(s0 + 340 * f);
    g.save();
    g.translate(CX + Math.cos(a) * 121, CY + Math.sin(a) * 121);
    g.rotate(a);
    g.fillRect(-6, -2.6, 10, 5.2);
    g.restore();
  }
}

function radar(g: G, k: number) {
  if (k <= 0) return;
  const pts = METRICS.map((m) => {
    const a = rad(m.ang - 90);
    const r = 300 * m.vr * k;
    return { x: CX + Math.cos(a) * r, y: CY + Math.sin(a) * r, m };
  });
  g.save();
  g.globalAlpha = 0.78 * k;
  g.fillStyle = gradConic(g, CX, CY, 300, WHEEL_STOPS, -Math.PI / 2);
  g.beginPath();
  pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y)));
  g.closePath();
  g.fill();
  // desbota o miolo para o fundo preto
  g.globalCompositeOperation = "source-atop";
  g.fillStyle = gradRad(g, CX, CY, 120, 300, [
    [0, "rgba(0,0,0,0.85)"],
    [1, "rgba(0,0,0,0)"],
  ]);
  g.fillRect(CX - 320, CY - 320, 640, 640);
  g.restore();
  for (const p of pts) {
    g.save();
    g.globalAlpha = k;
    g.fillStyle = wheel(p.m.ang, 0.35);
    circle(g, p.x, p.y, 18 * k);
    g.fill();
    g.fillStyle = wheel(p.m.ang);
    circle(g, p.x, p.y, 10 * k);
    g.fill();
    g.restore();
  }
}

function iniciar(g: G, glow = 0) {
  g.fillStyle = "rgba(0,12,40,0.9)";
  circle(g, CX, CY, 98);
  g.fill();
  g.fillStyle = "#22a9e9";
  circle(g, CX, CY, 74 + glow);
  g.fill();
  text(g, "INICIAR", CX, CY + 10, { f: "text", w: 500, s: 27, c: "#fff", a: "center" });
}

function valuesCenter(g: G, h: number, w: number) {
  const col = "#2de6dc";
  text(g, h.toFixed(1), 536, CY - 31, { f: "num", w: 800, s: 31, c: col, a: "center", sk: 12, b: "alphabetic" });
  text(g, "CM", 604, CY - 36, { f: "num", w: 800, s: 8, c: col, a: "left", sk: 12 });
  g.fillStyle = "#2cc8c6";
  g.fillRect(460, CY - 2, 160, 3);
  text(g, w.toFixed(1), 536, CY + 60, { f: "num", w: 800, s: 31, c: col, a: "center", sk: 12 });
  text(g, "KG", 604, CY + 56, { f: "num", w: 800, s: 8, c: col, a: "left", sk: 12 });
}

export const composicao: Page = {
  steps: 60,
  bg(g) {
    g.fillStyle = "#000";
    g.fillRect(0, 0, U_W, 1920);
    header(g, "ANÁLISE DA COMPOSIÇÃO CORPORAL", 514);
    guides(g);
    outerLabels(g);
    bars(g);
  },
  fg(g, t) {
    const ph = seg(t, 0.2, 0.45); // altura (sensor ultrassônico)
    const p = seg(t, 0.5, 0.82); // composição corporal (bioimpedância)
    const res = seg(t, 0.84, 0.94); // resultado final: radar acende
    radar(g, easeOut(res));
    // fundo do anel
    g.fillStyle = "#000";
    circle(g, CX, CY, 166);
    g.fill();
    // anel externo: o fundo escuro cobre o radar dentro do raio 166, então pílulas e marcas ficam por cima
    rainbowRing(g);
    tickRing(g, t < 0.2 ? 0.55 : 0.3 * ph + 0.7 * p);
    pills(g);
    if (t < 0.2) {
      innerGauge(g, 0.5);
      iniciar(g, t >= 0.15 ? 2 : 0);
    } else {
      innerGauge(g, 0.3 * ph + 0.7 * p);
      valuesCenter(g, 148 * easeOut(ph), 44.2 * easeOut(p));
    }
    // Enquanto a altura é medida, a linha dela fica em destaque
    const hl = Math.min(seg(t, 0.18, 0.22), 1 - seg(t, 0.47, 0.52));
    if (hl > 0) {
      g.save();
      g.globalAlpha = hl;
      g.strokeStyle = "#2de6dc";
      g.lineWidth = 4;
      rrect(g, 24, ROW_Y0 - 30, 1032, 60, 30);
      g.stroke();
      g.restore();
    }
    rows(g, ph, p);
  },
};
