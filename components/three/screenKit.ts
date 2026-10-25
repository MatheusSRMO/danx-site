// Primitivas de desenho das telas da estação. Tudo é desenhado no espaço do quadro original (1080 × 1920).
import { fam } from "./screenFonts";

export type G = CanvasRenderingContext2D;
export const U_W = 1080;
export const U_H = 1920;

/** Uma tela: `bg` é a parte estática (guardada em cache), `fg` é a parte que muda com t. */
export type Page = {
  steps: number;
  bg?: (g: G) => void;
  fg?: (g: G, t: number) => void;
};

export const clamp = (v: number, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
/** Progresso de t dentro da janela [a, b], limitado a 0..1. */
export const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;
export const easeOut = (k: number) => 1 - Math.pow(1 - k, 3);
export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
export const rad = (d: number) => (d * Math.PI) / 180;

/** Gerador pseudoaleatório determinístico (as telas precisam ser idênticas a cada chamada). */
export function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export type Stop = [number, string];

export function gradX(g: G, x0: number, x1: number, stops: Stop[]) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
export function gradY(g: G, y0: number, y1: number, stops: Stop[]) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
export function gradLine(g: G, x0: number, y0: number, x1: number, y1: number, stops: Stop[]) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
export function gradRad(g: G, cx: number, cy: number, r0: number, r1: number, stops: Stop[]) {
  const gr = g.createRadialGradient(cx, cy, r0, cx, cy, r1);
  for (const [o, c] of stops) gr.addColorStop(o, c);
  return gr;
}
/** Gradiente cônico (ângulo 0 = direita, sentido horário); sem suporte, cai para um gradiente linear vertical. */
export function gradConic(g: G, cx: number, cy: number, r: number, stops: Stop[], start = 0) {
  if (typeof g.createConicGradient === "function") {
    const gr = g.createConicGradient(start, cx, cy);
    for (const [o, c] of stops) gr.addColorStop(o, c);
    return gr;
  }
  return gradY(g, cy - r, cy + r, stops);
}

export type TextOpts = {
  f?: "text" | "title" | "num" | "tech";
  w?: number | string;
  s: number; // tamanho em px (espaço 1080 × 1920)
  c?: string | CanvasGradient | CanvasPattern;
  a?: CanvasTextAlign;
  b?: CanvasTextBaseline;
  /** inclinação (itálico sintético) em graus, positivo = para a direita */
  sk?: number;
  /** espaçamento entre letras em px */
  ls?: number;
  /** largura alvo: o texto é comprimido ou esticado na horizontal até ocupar exatamente isso */
  fit?: number;
  /** largura máxima: só comprime quando passa disso */
  max?: number;
  alpha?: number;
  italic?: boolean;
};

export function setFont(g: G, o: TextOpts) {
  g.font = `${o.italic ? "italic " : ""}${o.w ?? 400} ${o.s}px ${fam(o.f ?? "text")}`;
}

/** Escreve texto. O ponto (x, y) é a linha de base (ou o centro vertical com b = "middle"). */
export function text(g: G, str: string, x: number, y: number, o: TextOpts) {
  g.save();
  setFont(g, o);
  g.textAlign = o.a ?? "left";
  g.textBaseline = o.b ?? "alphabetic";
  g.fillStyle = o.c ?? "#fff";
  if (o.alpha != null) g.globalAlpha *= o.alpha;
  if (o.ls) (g as unknown as { letterSpacing: string }).letterSpacing = `${o.ls}px`;
  g.translate(x, y);
  let sx = 1;
  if (o.fit || o.max) {
    const m = g.measureText(str).width - (o.ls || 0);
    if (o.fit) sx = o.fit / m;
    else if (o.max && m > o.max) sx = o.max / m;
  }
  const sk = o.sk ? -Math.tan((o.sk * Math.PI) / 180) : 0;
  if (sx !== 1 || sk) g.transform(sx, 0, sk, 1, 0, 0);
  g.fillText(str, 0, 0);
  g.restore();
}

export function measure(g: G, str: string, o: TextOpts) {
  g.save();
  setFont(g, o);
  if (o.ls) (g as unknown as { letterSpacing: string }).letterSpacing = `${o.ls}px`;
  const w = g.measureText(str).width;
  g.restore();
  return w;
}

export function rrect(g: G, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** Retângulo com cantos cortados (a "chanfradura" dos botões do teclado). */
export function chamfer(g: G, x: number, y: number, w: number, h: number, c: number) {
  g.beginPath();
  g.moveTo(x + c, y);
  g.lineTo(x + w - c, y);
  g.lineTo(x + w, y + c);
  g.lineTo(x + w, y + h - c);
  g.lineTo(x + w - c, y + h);
  g.lineTo(x + c, y + h);
  g.lineTo(x, y + h - c);
  g.lineTo(x, y + c);
  g.closePath();
}

export function circle(g: G, cx: number, cy: number, r: number) {
  g.beginPath();
  g.arc(cx, cy, r, 0, Math.PI * 2);
}

/** Halo suave (círculo com gradiente radial que some nas bordas). */
export function halo(g: G, cx: number, cy: number, r0: number, r1: number, rgb: string, a0: number, a1 = 0) {
  g.fillStyle = gradRad(g, cx, cy, r0, r1, [
    [0, `rgba(${rgb},${a0})`],
    [1, `rgba(${rgb},${a1})`],
  ]);
  circle(g, cx, cy, r1);
  g.fill();
}

/** Anel de marcas radiais (n marcas entre os ângulos a0 e a1, em graus; 0° = direita, -90° = topo). */
export function ticks(
  g: G,
  cx: number,
  cy: number,
  r0: number,
  r1: number,
  n: number,
  a0: number,
  a1: number,
  lw: number,
  color: string | ((i: number, f: number) => string),
  endpoint = false,
) {
  g.lineWidth = lw;
  g.lineCap = "butt";
  const div = endpoint ? n - 1 : n;
  if (typeof color === "string") {
    g.strokeStyle = color;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const a = rad(a0 + ((a1 - a0) * i) / div);
      const ca = Math.cos(a),
        sa = Math.sin(a);
      g.moveTo(cx + ca * r0, cy + sa * r0);
      g.lineTo(cx + ca * r1, cy + sa * r1);
    }
    g.stroke();
    return;
  }
  for (let i = 0; i < n; i++) {
    const a = rad(a0 + ((a1 - a0) * i) / div);
    const ca = Math.cos(a),
      sa = Math.sin(a);
    g.strokeStyle = color(i, i / div);
    g.beginPath();
    g.moveTo(cx + ca * r0, cy + sa * r0);
    g.lineTo(cx + ca * r1, cy + sa * r1);
    g.stroke();
  }
}

/** Triângulo arredondado (as setas da barra superior e do anel de equilíbrio). */
export function roundTri(g: G, p: [number, number][], r: number) {
  g.beginPath();
  const n = p.length;
  for (let i = 0; i < n; i++) {
    const a = p[(i + n - 1) % n],
      b = p[i],
      c = p[(i + 1) % n];
    const v1 = [a[0] - b[0], a[1] - b[1]],
      v2 = [c[0] - b[0], c[1] - b[1]];
    const l1 = Math.hypot(v1[0], v1[1]),
      l2 = Math.hypot(v2[0], v2[1]);
    const rr_ = Math.min(r, l1 / 2, l2 / 2);
    const p1 = [b[0] + (v1[0] / l1) * rr_, b[1] + (v1[1] / l1) * rr_];
    const p2 = [b[0] + (v2[0] / l2) * rr_, b[1] + (v2[1] / l2) * rr_];
    if (i === 0) g.moveTo(p1[0], p1[1]);
    else g.lineTo(p1[0], p1[1]);
    g.quadraticCurveTo(b[0], b[1], p2[0], p2[1]);
  }
  g.closePath();
}

/** Barra de título das telas internas: gradiente azul-marinho → verde, seta branca, seta verde e título. */
export function header(g: G, title: string, titleW: number) {
  // fundo da barra
  g.fillStyle = gradX(g, 0, U_W, [
    [0, "#1c0031"],
    [0.1, "#0e0034"],
    [0.22, "#00003a"],
    [0.32, "#000036"],
    [0.4, "#000031"],
    [0.5, "#000b2b"],
    [0.62, "#00202d"],
    [0.75, "#002b2c"],
    [0.9, "#00322a"],
    [1, "#003a22"],
  ]);
  g.fillRect(0, 0, U_W, 152);
  // fio de gradiente na base
  g.fillStyle = gradX(g, 0, U_W, [
    [0, "#a533dd"],
    [0.22, "#3c25d0"],
    [0.5, "#32a5f4"],
    [0.75, "#40ecec"],
    [1, "#54ffc2"],
  ]);
  g.fillRect(0, 146, U_W, 4);
  // seta esquerda (branca) e direita (verde)
  g.fillStyle = "#fff";
  roundTri(
    g,
    [
      [52, 75],
      [96, 50],
      [96, 100],
    ],
    5,
  );
  g.fill();
  g.fillStyle = "#96fd52";
  roundTri(
    g,
    [
      [1028, 75],
      [984, 50],
      [984, 100],
    ],
    5,
  );
  g.fill();
  // título
  const gr = gradX(g, 540 - titleW / 2, 540 + titleW / 2, [
    [0, "#e2e4ff"],
    [0.5, "#c9d6f6"],
    [1, "#cbe6fa"],
  ]);
  text(g, title, 540, 88, { f: "title", w: 400, s: 37, c: gr, a: "center", fit: titleW });
}

/** Botão circular "INICIAR" (azul) com anel de marcas e halo, como nas telas de equilíbrio e agilidade. */
export function ringButtonBase(g: G, cx: number, cy: number) {
  halo(g, cx, cy, 120, 160, "10,14,60", 0.55, 0);
}
