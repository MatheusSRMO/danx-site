// Telas de equilíbrio, agilidade, espirometria e visão.
import {
  chamfer,
  circle,
  clamp,
  easeOut,
  gradConic,
  gradRad,
  gradX,
  gradY,
  haloRing,
  header,
  lerp,
  rad,
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
import { KEY_H, KEY_W } from "./screenPagesA";

const BLACK = "#000";

function clear(g: G) {
  g.fillStyle = BLACK;
  g.fillRect(0, 0, U_W, 1920);
}

/** Número grande em itálico largo (como o original). Centro em (cx, cy). */
function bigNum(g: G, s: string, cx: number, cy: number, size: number, color: string | CanvasGradient = "#fff") {
  text(g, s, cx, cy + size * 0.35, { f: "num", w: 800, s: size, c: color, a: "center", sk: 12 });
}

// ---------------------------------------------------------------- anéis de gradiente (equilíbrio, espirometria)
const RING_SPECTRUM: Stop[] = [
  [0, "rgb(40,236,140)"],
  [40 / 360, "rgb(40,214,225)"],
  [90 / 360, "rgb(60,110,252)"],
  [135 / 360, "rgb(130,50,242)"],
  [180 / 360, "rgb(214,40,226)"],
  [225 / 360, "rgb(90,50,250)"],
  [270 / 360, "rgb(40,170,250)"],
  [315 / 360, "rgb(40,226,214)"],
  [1, "rgb(40,236,140)"],
];

function spectrumRing(g: G, cx: number, cy: number, r: number, lw: number, rotDeg = 0) {
  g.save();
  g.strokeStyle = gradConic(g, cx, cy, r, RING_SPECTRUM, rad(rotDeg));
  g.lineWidth = lw;
  circle(g, cx, cy, r);
  g.stroke();
  g.restore();
}

/** Anel de marcas (régua) por dentro do anel externo. */
function ruler(g: G, cx: number, cy: number, rOut: number, minor: number, major: number, color: string, stepDeg = 3, majorEvery = 5) {
  g.strokeStyle = color;
  g.lineCap = "butt";
  const n = Math.round(360 / stepDeg);
  g.lineWidth = 2;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    if (i % majorEvery === 0) continue;
    const a = rad(-90 + i * stepDeg);
    g.moveTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
    g.lineTo(cx + Math.cos(a) * (rOut - minor), cy + Math.sin(a) * (rOut - minor));
  }
  g.stroke();
  g.lineWidth = 3;
  g.beginPath();
  for (let i = 0; i < n; i += majorEvery) {
    const a = rad(-90 + i * stepDeg);
    g.moveTo(cx + Math.cos(a) * rOut, cy + Math.sin(a) * rOut);
    g.lineTo(cx + Math.cos(a) * (rOut - major), cy + Math.sin(a) * (rOut - major));
  }
  g.stroke();
}

function arrow(g: G, cx: number, cy: number, ang: number, inward: boolean) {
  // seta triangular: a ponta aponta para o centro do anel (inward) ou para fora
  g.save();
  g.translate(cx, cy);
  g.rotate(rad(ang) + (inward ? Math.PI : 0));
  const grd = g.createLinearGradient(-25, -25, 25, 25);
  grd.addColorStop(0, "#38d4f0");
  grd.addColorStop(1, "#1f84ec");
  g.fillStyle = grd;
  roundTri(
    g,
    [
      [25, 0],
      [-25, -24],
      [-25, 24],
    ],
    5,
  );
  g.fill();
  g.restore();
}

// ---------------------------------------------------------------- botão superior (equilíbrio e agilidade)
export const BX = 540,
  BY = 400;

function topHalo(g: G) {
  haloRing(g, BX, BY, 118, 170, "8,10,60", 0.7);
}

function topTicks(g: G, lit: number, litColor = "#2a8ee8") {
  ticks(g, BX, BY, 110, 130, 90, -90, 270, 4.2, "rgba(72,82,128,0.62)");
  const n = Math.round(clamp(lit) * 90);
  if (n <= 0) return;
  g.strokeStyle = litColor;
  g.lineWidth = 4.2;
  g.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rad(-90 + (360 * i) / 90);
    g.moveTo(BX + Math.cos(a) * 110, BY + Math.sin(a) * 110);
    g.lineTo(BX + Math.cos(a) * 130, BY + Math.sin(a) * 130);
  }
  g.stroke();
}

function discIdle(g: G, label: string, weight = 500, size = 25) {
  g.fillStyle = "#06223c";
  circle(g, BX, BY, 100);
  g.fill();
  g.fillStyle = "#22a9e9";
  circle(g, BX, BY, 90);
  g.fill();
  text(g, label, BX, BY + 9, { f: "text", w: weight, s: size, c: "#fff", a: "center" });
}

function discRun(g: G, lit = true) {
  g.fillStyle = lit ? "#0a1430" : "#04041c";
  circle(g, BX, BY, 100);
  g.fill();
  g.fillStyle = lit ? "#22294a" : "#05051f";
  circle(g, BX, BY, 90);
  g.fill();
}

// ================================================================ EQUILÍBRIO
const EQ_CX = 540,
  EQ_CY = 960;
const INSTR_EQ = ["Por favor, junte as mãos, feche os olhos, fique em uma perna e mantenha a", "posição por 10 segundos para completar o teste."];

export const equilibrio: Page = {
  steps: 40,
  bg(g) {
    clear(g);
    header(g, "AVALIAÇÃO DE EQUILÍBRIO", 357);
    // halo do anel
    haloRing(g, EQ_CX, EQ_CY, 262, 350, "10,8,64", 0.32);
    topHalo(g);
    // marcas fixas do anel interno
    ruler(g, EQ_CX, EQ_CY, 190, 6, 12, "rgba(22,140,120,0.6)", 4, 6);
    text(g, INSTR_EQ[0], 191, 1483, { f: "text", w: 300, s: 24, c: "#e2e2e6", fit: 693 });
    text(g, INSTR_EQ[1], 191, 1508, { f: "text", w: 300, s: 24, c: "#e2e2e6", fit: 455 });
    text(g, "Capacidade de equilíbrio", 540, 1020, { f: "text", w: 300, s: 24, c: "#d8d8de", a: "center" });
  },
  fg(g, t) {
    const running = t >= 0.02;
    const e = running ? clamp((t - 0.02) / 0.98) : 0;
    // botão / cronômetro
    topTicks(g, running ? e : 0);
    if (!running) discIdle(g, "INICIAR", 500, 25);
    else {
      discRun(g, false);
      const sec = Math.max(0, Math.ceil(10 * (1 - e) - 1e-6));
      bigNum(g, `00:${String(sec).padStart(2, "0")}`, BX + 3, BY, 28);
    }
    // anéis (o gradiente gira junto com as setas)
    const phi = -t * 600;
    // marcas externas
    ruler(g, EQ_CX, EQ_CY, 266, 8, 17, "rgba(24,176,150,0.85)", 3, 5);
    spectrumRing(g, EQ_CX, EQ_CY, 272, 4, phi);
    spectrumRing(g, EQ_CX, EQ_CY, 228, 3, -phi * 0.5);
    // setas: o par externo gira para um lado e o interno para o outro
    const fo = phi,
      fi = -phi;
    for (const base of [0, 180]) {
      const a = rad(base + fo);
      arrow(g, EQ_CX + Math.cos(a) * 276, EQ_CY + Math.sin(a) * 276, base + fo, true);
      const b = rad(base + fi);
      arrow(g, EQ_CX + Math.cos(b) * 166, EQ_CY + Math.sin(b) * 166, base + fi, false);
    }
    // valor
    const v = Math.round(100 - 14 * Math.pow(e, 0.85));
    bigNum(g, String(v), 546, 962, 46);
    text(g, "%", 656, 984, { f: "num", w: 800, s: 14, c: "#fff", a: "center", sk: 12 });
  },
};

// ================================================================ AGILIDADE
export const TAPS = [480, 455, 400, 380, 345]; // tempos de reação (ms); a média é 412
export const CELLS = [2, 3, 7, 4, 6];
export const GRID_X = [276, 468, 660];
export const GRID_Y = [806, 957, 1107];

function gridCell(g: G, i: number, lit: boolean) {
  const x = GRID_X[i % 3],
    y = GRID_Y[Math.floor(i / 3)];
  chamfer(g, x + 2, y + 2, KEY_W - 4, KEY_H - 4, 13);
  if (lit) {
    g.fillStyle = gradX(g, x, x + KEY_W, [
      [0, "rgb(0,62,112)"],
      [1, "rgb(0,112,140)"],
    ]);
    g.fill();
  }
  g.strokeStyle = lit ? "#0b86b0" : "#06586c";
  g.lineWidth = 4;
  g.stroke();
}

function tapDot(g: G, i: number, a: number) {
  const x = GRID_X[i % 3],
    y = GRID_Y[Math.floor(i / 3)];
  g.fillStyle = `rgba(190,192,200,${a})`;
  circle(g, x + 66, y + 90, 11);
  g.fill();
}

export const agilidade: Page = {
  steps: 40,
  bg(g) {
    clear(g);
    header(g, "AVALIAÇÃO DA AGILIDADE", 353);
    topHalo(g);
    text(g, "Durante o teste, o botão acenderá 5 vezes. Por favor, clique", 265, 1296, { f: "text", w: 300, s: 24, c: "#e2e2e6", fit: 547 });
    text(g, "no botão aceso para completar o teste.", 265, 1321, { f: "text", w: 300, s: 24, c: "#e2e2e6", fit: 363 });
    text(g, "Média(MS)", 540, 757, { f: "text", w: 400, s: 23, c: "#fff", a: "center" });
  },
  fg(g, t) {
    const T0 = 0.08,
      T1 = 0.88;
    const idle = t < T0;
    const done = t >= T1 - 1e-9;
    const mean = (n: number) => (n <= 0 ? 0 : Math.round(TAPS.slice(0, n).reduce((a, b) => a + b, 0) / n));
    if (idle) {
      topTicks(g, 0);
      discIdle(g, "INICIAR", 400, 24);
      bigNum(g, "0000", 548, 684, 51);
      return;
    }
    if (done) {
      topTicks(g, 1);
      // botão roxo "INICIAR"
      g.fillStyle = "#06223c";
      circle(g, BX, BY, 104);
      g.fill();
      g.fillStyle = gradY(g, BY - 100, BY + 100, [
        [0, "#8c64ff"],
        [0.55, "#4a78e8"],
        [1, "#0a6cb4"],
      ]);
      circle(g, BX, BY, 100);
      g.fill();
      text(g, "INICIAR", BX, BY + 15, { f: "text", w: 400, s: 40, c: "#fff", a: "center" });
      // selo de classificação e média final
      g.fillStyle = gradX(g, 488, 592, [
        [0, "#6eea96"],
        [1, "#9af070"],
      ]);
      rrect(g, 488, 591, 104, 48, 7);
      g.fill();
      text(g, "BOM", 540, 626, { f: "text", w: 400, s: 23, c: "#fff", a: "center" });
      bigNum(g, "412", 548, 684, 51);
      return;
    }
    const f = (t - T0) / (T1 - T0);
    const k = Math.min(4, Math.floor(f * 5));
    const ff = f * 5 - k;
    const tapped = ff >= 0.78;
    const taps = k + (tapped ? 1 : 0);
    topTicks(g, taps / 5);
    // botão que acende a cada alvo
    const lit = ff >= 0.1 && !tapped;
    if (lit) {
      g.fillStyle = "rgba(34,169,233,0.22)";
      circle(g, BX, BY, 118);
      g.fill();
    }
    discRun(g);
    if (lit) {
      g.strokeStyle = "#22a9e9";
      g.lineWidth = 5;
      circle(g, BX, BY, 90);
      g.stroke();
    }
    text(g, String(5 - taps), BX, BY + 21, { f: "text", w: 300, s: 62, c: "#fff", a: "center" });
    // média parcial
    bigNum(g, taps === 0 ? "0000" : String(mean(taps)), 548, 684, 51);
    // grade 3 × 3
    for (let i = 0; i < 9; i++) gridCell(g, i, lit && CELLS[k] === i);
    if (tapped) tapDot(g, CELLS[k], 0.85);
    else if (k > 0 && ff < 0.3) tapDot(g, CELLS[k - 1], 0.4 * (1 - ff / 0.3));
  },
};

// ================================================================ ESPIROMETRIA
const SP_CX = 540,
  SP_CY = 770;
const VITAL = 1650;

function blueTicksSpiro(g: G, frac: number) {
  const n = Math.round(clamp(frac) * 120);
  if (n <= 0) return;
  const R0 = 238,
    R1 = 259;
  for (let i = 0; i < n; i++) {
    const a = rad(-90 + (300 * i) / 120);
    g.strokeStyle = i < n * 0.6 ? "#2c8cea" : "#1f78e0";
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(SP_CX + Math.cos(a) * R0, SP_CY + Math.sin(a) * R0);
    g.lineTo(SP_CX + Math.cos(a) * R1, SP_CY + Math.sin(a) * R1);
    g.stroke();
  }
}

function liquid(g: G, level: number, phase: number) {
  if (level <= 0) return;
  const R = 226;
  g.save();
  circle(g, SP_CX, SP_CY, R);
  g.clip();
  const bottom = SP_CY + R;
  const yTop = bottom - 2 * R * level;
  // onda traseira (mais escura) e frontal
  for (let w = 0; w < 2; w++) {
    g.beginPath();
    g.moveTo(SP_CX - R - 4, bottom + 4);
    for (let x = -R - 4; x <= R + 4; x += 12) {
      const amp = (w ? 10 : 7) * Math.min(1, level * 14);
      const y = yTop + Math.sin((x / R) * 2.6 + phase + w * 1.7) * amp + (w ? 0 : 4);
      g.lineTo(SP_CX + x, y);
    }
    g.lineTo(SP_CX + R + 4, bottom + 4);
    g.closePath();
    g.fillStyle =
      w === 0
        ? gradY(g, yTop, bottom, [
            [0, "rgba(10,60,90,0.75)"],
            [1, "rgba(0,60,120,0.75)"],
          ])
        : gradY(g, yTop, bottom, [
            [0, "#10dcd8"],
            [0.5, "#08a8cc"],
            [1, "#0070b2"],
          ]);
    g.fill();
  }
  g.restore();
}

function bubbles(g: G, ph: number, power: number) {
  // coluna de bolhas roxas subindo do botão até o anel
  const n = 16;
  for (let i = 0; i < n; i++) {
    const u = (((i / n + ph) % 1) + 1) % 1; // 0 = no anel, 1 = no botão
    const y = lerp(1052, 1470, u);
    const r = lerp(30, 6, u) * (0.6 + 0.4 * power);
    const a = (1 - u) * 0.75 * power + 0.05;
    g.fillStyle = `rgba(112,100,236,${a})`;
    circle(g, SP_CX + (i % 2 ? 1.5 : -1.5), y, r);
    g.fill();
  }
}

export const espirometria: Page = {
  steps: 40,
  bg(g) {
    clear(g);
    header(g, "TESTE ESPIROMÉTRICO", 309);
    g.fillStyle = gradRad(g, SP_CX, SP_CY, 0, 400, [
      [0, "rgba(4,4,32,0.9)"],
      [0.62, "rgba(4,4,32,0.9)"],
      [0.9, "rgba(3,3,26,0.55)"],
      [1, "rgba(0,0,0,0)"],
    ]);
    circle(g, SP_CX, SP_CY, 400);
    g.fill();
    g.fillStyle = "#020220";
    circle(g, SP_CX, SP_CY, 226);
    g.fill();
    spectrumRing(g, SP_CX, SP_CY, 269, 4, 0);
    spectrumRing(g, SP_CX, SP_CY, 227, 3, 0);
  },
  fg(g, t) {
    const connecting = t < 0.1;
    const ready = t >= 0.1 && t < 0.25;
    const blowing = t >= 0.25 && t < 0.85;
    const done = t >= 0.85;
    const p = seg(t, 0.25, 0.85);
    const val = done ? VITAL : Math.round(VITAL * easeOut(p));
    // brilho do anel ao soprar
    if (blowing) {
      const k = 0.5 + 0.5 * Math.sin(p * 18);
      g.fillStyle = gradRad(g, SP_CX, SP_CY, 0, 335, [
        [0, `rgba(24,12,92,${0.28 + 0.16 * k})`],
        [0.8, `rgba(24,12,92,${0.5 + 0.16 * k})`],
        [1, "rgba(20,10,80,0)"],
      ]);
      circle(g, SP_CX, SP_CY, 335);
      g.fill();
      spectrumRing(g, SP_CX, SP_CY, 269, 4, 0);
      spectrumRing(g, SP_CX, SP_CY, 227, 3, 0);
    }
    // líquido
    const level = done ? 0.63 : connecting || ready ? 0.012 : 0.012 + 0.618 * easeOut(p);
    if (connecting || ready) {
      // lente roxa no fundo
      g.save();
      circle(g, SP_CX, SP_CY, 226);
      g.clip();
      g.fillStyle = "rgba(140,100,255,0.85)";
      g.beginPath();
      g.moveTo(468, 986);
      g.quadraticCurveTo(515, 970, 590, 986);
      g.lineTo(468, 986);
      g.fill();
      g.restore();
    } else liquid(g, level, p * 14);
    if (blowing || done) blueTicksSpiro(g, done ? 0.82 : 0.82 * easeOut(p));
    // valor e rótulo
    if (done) {
      text(g, "GERAL", 545, 696, { f: "num", w: 800, s: 38, c: "#fff", a: "center", sk: 12 });
    }
    bigNum(g, val === 0 ? "0" : String(val), val === 0 ? 548 : 550, 746, 66);
    text(g, "Capacidade vital(ML)", 540, 820, { f: "text", w: 400, s: 23, c: "#fff", a: "center" });
    // bolhas e botão
    if (blowing) bubbles(g, -p * 3, 0.6 + 0.4 * Math.sin(p * 9) ** 2);
    const BY2 = 1590;
    if (connecting) {
      g.fillStyle = "rgba(6,6,34,0.7)";
      circle(g, 540, BY2, 128);
      g.fill();
      text(g, "CONECTANDO", 540, BY2 + 9, { f: "text", w: 300, s: 24, c: "#7c7c8c", a: "center" });
      text(g, "Conectar manualmente", 1040, 1876, { f: "text", w: 400, s: 15, c: "#fff", a: "right" });
      g.fillStyle = "#fff";
      g.fillRect(894, 1879, 146, 1.5);
    } else if (done) {
      g.fillStyle = "rgba(6,22,60,0.9)";
      circle(g, 540, BY2, 100);
      g.fill();
      g.fillStyle = "#22a9e9";
      circle(g, 540, BY2, 90);
      g.fill();
    } else {
      g.fillStyle = "rgba(6,6,40,0.9)";
      circle(g, 540, BY2, 128);
      g.fill();
      g.fillStyle = gradY(g, BY2 - 100, BY2 + 100, [
        [0, "#8c64ff"],
        [0.5, "#4a78e8"],
        [1, "#0a6cb4"],
      ]);
      circle(g, 540, BY2, 100);
      g.fill();
      if (ready) text(g, "CONECTADO", 540, BY2 + 9, { f: "text", w: 400, s: 25, c: "#fff", a: "center" });
    }
  },
};

// ================================================================ VISÃO
type Dir = "right" | "left" | "up" | "down";
const PRES: { label: string; size: number }[] = [
  { label: "4.5 | 0.3", size: 80 },
  { label: "4.6 | 0.4", size: 64 },
  { label: "4.7 | 0.5", size: 51 },
  { label: "4.8 | 0.6", size: 40 },
  { label: "4.9 | 0.8", size: 32 },
  { label: "5.0 | 1.0", size: 25 },
];
const SEQ_L: Dir[] = ["right", "up", "left", "down", "right", "up"];
const SEQ_R: Dir[] = ["down", "left", "up", "right", "left", "down"];

function optotype(g: G, cx: number, cy: number, s: number, dir: Dir) {
  const u = s / 5;
  g.save();
  g.translate(cx, cy);
  g.rotate(dir === "right" ? 0 : dir === "down" ? Math.PI / 2 : dir === "left" ? Math.PI : -Math.PI / 2);
  g.fillStyle = "#000";
  const x0 = -s / 2,
    y0 = -s / 2;
  g.fillRect(x0, y0, u, s);
  g.fillRect(x0, y0, s, u);
  g.fillRect(x0, y0 + 2 * u, s, u);
  g.fillRect(x0, y0 + 4 * u, s, u);
  g.restore();
}

function eyeBox(g: G, x: number, label: string, caption: string) {
  g.fillStyle = "#242c4a";
  rrect(g, x, 282, 200, 200, 9);
  g.fill();
  if (label) text(g, label, x + 100, 400, { f: "text", w: 300, s: 54, c: "#fff", a: "center" });
  text(g, caption, x + 100, 517, { f: "text", w: 300, s: 19, c: "#e4e4ec", a: "center" });
}

function roundBtn(g: G, cx: number, cy: number, fill: string, halo: string, glyph: "x" | "ok") {
  g.fillStyle = halo;
  circle(g, cx, cy, 72);
  g.fill();
  g.fillStyle = fill;
  circle(g, cx, cy, 65);
  g.fill();
  g.strokeStyle = "#fff";
  g.lineWidth = 2.6;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  if (glyph === "x") {
    g.moveTo(cx - 8, cy - 8);
    g.lineTo(cx + 8, cy + 8);
    g.moveTo(cx + 8, cy - 8);
    g.lineTo(cx - 8, cy + 8);
  } else {
    g.moveTo(cx - 10, cy + 1);
    g.lineTo(cx - 3, cy + 8);
    g.lineTo(cx + 11, cy - 8);
  }
  g.stroke();
}

export const visao: Page = {
  steps: 24,
  bg(g) {
    clear(g);
    header(g, "TESTE DE VISÃO", 218);
    // moldura do painel
    g.fillStyle = "#222a4a";
    rrect(g, 115, 610, 850, 850, 34);
    g.fill();
    roundBtn(g, 440, 382, "#ff767c", "rgba(60,0,6,0.55)", "x");
    roundBtn(g, 640, 382, "#6fe88c", "rgba(0,44,10,0.55)", "ok");
    text(g, "Distância: 2,5 M", 540, 1492, { f: "text", w: 300, s: 24, c: "#d8d8de", a: "center" });
  },
  fg(g, t) {
    const second = t >= 0.5;
    const local = second ? (t - 0.5) / 0.5 : t / 0.5;
    // 12 passos por olho: em cada linha da tabela o E aparece (passo par) e depois vem o retorno do toque (passo ímpar)
    const final = t >= 1;
    const st = final ? 10 : Math.min(11, Math.floor(local * 12 + 1e-6));
    const pi = Math.floor(st / 2);
    const flash = !final && st % 2 === 1;
    const miss = second && pi === 5; // o olho direito erra a última linha
    const pr = PRES[pi];
    const dir = (second ? SEQ_R : SEQ_L)[pi];
    // resultados dos olhos
    eyeBox(g, 115, t >= 0.5 ? "5.0" : "", "Visão do olho esquerdo");
    eyeBox(g, 765, t >= 1 ? "4.9" : "", "Visão do olho direito");
    text(g, pr.label, 540, 598, { f: "text", w: 300, s: 19, c: "#d8d8de", a: "center" });
    // painel branco (ou verde no acerto, vermelho no erro)
    g.fillStyle = flash ? (miss ? "#ff8a8e" : "#98f06a") : "#fff";
    rrect(g, 135, 630, 810, 810, 10);
    g.fill();
    optotype(g, 540, 1035, pr.size, dir);
  },
};
