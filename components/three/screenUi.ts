// Telas da estação desenhadas em canvas (viram textura na tela do modelo 3D).
// Recriam a interface real da estação em 1080 × 1920 (9:16), com o aluno de exemplo do site:
// menino, 10 anos, 148 cm, 44,2 kg, gordura 21,3%, músculo 52,2%, água 58,9%, proteína 16,1%, IMC 20,2, pontuação 86.
import { loadFonts, fontsReady } from "./screenFonts";
import { U_H, U_W, type G, type Page } from "./screenKit";
import { composicao } from "./screenComposicao";
import { consentimento, inicio } from "./screenPagesA";
import { agilidade, equilibrio, espirometria, visao } from "./screenPagesB";
import { evolucao, pontuacao, postura, relatorio } from "./screenPagesC";

export const SCREEN_W = 600;
// Mesma proporção da área visível da tela no modelo (STATION_DIMS.SCREEN: 360 × 708 mm)
export const SCREEN_H = Math.round((SCREEN_W * 0.708) / 0.36);
export const SCREENS = [
  "inicio",
  "consentimento",
  "composicao",
  "equilibrio",
  "agilidade",
  "espirometria",
  "visao",
  "postura",
  "pontuacao",
  "evolucao",
  "relatorio",
] as const;
export type ScreenId = (typeof SCREENS)[number];

const PAGES: Partial<Record<ScreenId, Page>> = { inicio, consentimento, composicao, equilibrio, agilidade, espirometria, visao, postura, pontuacao, evolucao, relatorio };

/** Em quantos passos distintos vale redesenhar cada tela ao longo de t (1 = estática; ~40 para contagens). */
export const SCREEN_STEPS: Record<ScreenId, number> = {
  inicio: PAGES.inicio?.steps ?? 1,
  consentimento: PAGES.consentimento?.steps ?? 1,
  composicao: PAGES.composicao?.steps ?? 1,
  equilibrio: PAGES.equilibrio?.steps ?? 1,
  agilidade: PAGES.agilidade?.steps ?? 1,
  espirometria: PAGES.espirometria?.steps ?? 1,
  visao: PAGES.visao?.steps ?? 1,
  postura: PAGES.postura?.steps ?? 1,
  pontuacao: PAGES.pontuacao?.steps ?? 1,
  evolucao: PAGES.evolucao?.steps ?? 1,
  relatorio: PAGES.relatorio?.steps ?? 1,
};

/** Carrega as fontes usadas nas telas (chamar e esperar antes de desenhar). */
export async function loadScreenFonts(): Promise<void> {
  await loadFonts();
  cache.clear();
}

// A parte estática de cada tela fica em um canvas guardado (um por resolução), então redesenhar custa só uma cópia.
const cache = new Map<string, HTMLCanvasElement | OffscreenCanvas>();
const K = SCREEN_W / U_W;
const OY = (SCREEN_H - U_H * K) / 2;

function toSpace(g: G, scale: number) {
  g.setTransform(scale, 0, 0, scale, 0, 0);
  g.translate(0, OY);
  g.scale(K, K);
}

function makeCanvas(w: number, h: number): HTMLCanvasElement | OffscreenCanvas {
  if (typeof OffscreenCanvas !== "undefined") return new OffscreenCanvas(w, h);
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/**
 * Desenha a tela `id` no estado `t` (0 a 1 = progresso dentro da avaliação). Determinística: mesmo id e t → mesma imagem.
 * `direct` desenha o fundo na hora, sem o canvas guardado (para ampliações, que pediriam um cache enorme).
 */
export function drawDeviceScreen(g: G, id: ScreenId, t: number, direct = false): void {
  const page = PAGES[id];
  g.save();
  g.fillStyle = "#000";
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  if (!page) {
    g.restore();
    return;
  }
  const tt = Number.isFinite(t) ? Math.min(1, Math.max(0, t)) : 0;
  const m = g.getTransform();
  const scale = Math.max(1, Math.round(Math.hypot(m.a, m.b) * 4) / 4);
  g.imageSmoothingEnabled = true;
  if (page.bg && direct) {
    g.save();
    g.translate(0, OY);
    g.scale(K, K);
    page.bg(g, page.variant ? page.variant(tt) : 0);
    g.restore();
  } else if (page.bg) {
    const v = page.variant ? page.variant(tt) : 0;
    const key = `${id}:${v}@${scale}`;
    let c = fontsReady() ? cache.get(key) : undefined;
    if (!c) {
      c = makeCanvas(Math.ceil(SCREEN_W * scale), Math.ceil(SCREEN_H * scale));
      const cg = c.getContext("2d") as G;
      cg.fillStyle = "#000";
      cg.fillRect(0, 0, c.width, c.height);
      toSpace(cg, scale);
      page.bg(cg, v);
      if (fontsReady()) cache.set(key, c);
    }
    g.drawImage(c as CanvasImageSource, 0, 0, SCREEN_W, SCREEN_H);
  }
  if (page.fg) {
    g.translate(0, OY);
    g.scale(K, K);
    g.beginPath();
    g.rect(0, 0, U_W, U_H);
    g.clip();
    page.fg(g, tt);
  }
  g.restore();
}

/** Região da tela, em unidades do desenho (1080 × 1920): x, y, largura, altura. */
export type Region = [number, number, number, number];

/** Desenha só a região `r` da tela, ampliada para ocupar um canvas de `w` × `h` pixels (a lupa da história). */
export function drawScreenRegion(g: G, id: ScreenId, t: number, r: Region, w: number, h: number): void {
  const s = Math.min(w / (r[2] * K), h / (r[3] * K));
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.fillStyle = "#000";
  g.fillRect(0, 0, w, h);
  // A região inteira cabe no canvas, centrada (se a proporção não bater, sobra um pouco de tela em volta)
  const ox = (w - r[2] * K * s) / 2 - r[0] * K * s;
  const oy = (h - r[3] * K * s) / 2 - (OY + r[1] * K) * s;
  g.setTransform(s, 0, 0, s, ox, oy);
  drawDeviceScreen(g, id, t, true);
  g.setTransform(1, 0, 0, 1, 0, 0);
}

// ---- Compatibilidade com o modelo 3D atual ----
export const SCREEN_COUNT = SCREENS.length;

export function drawScreen(i: number) {
  const c = document.createElement("canvas");
  c.width = SCREEN_W;
  c.height = SCREEN_H;
  const g = c.getContext("2d")!;
  drawDeviceScreen(g, SCREENS[((i % SCREENS.length) + SCREENS.length) % SCREENS.length], 1);
  return c;
}
