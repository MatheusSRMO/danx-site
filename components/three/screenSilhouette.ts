// Silhuetas vetoriais estilizadas de criança (de frente e de lado), usadas no lugar das fotos da câmera.
// Desenhadas em unidades de 0 a 1000 de altura (topo da cabeça = 0, planta dos pés = 1000), escaladas para o tamanho pedido.
import type { G } from "./screenKit";

export type View = "front" | "side";
export type Pt = [number, number];

export type FigureStyle = {
  /** engrossa todas as formas (px no espaço final): usado para desenhar só o contorno */
  grow?: number;
  /** cor única (contorno ou silhueta chapada); sem isso desenha com roupas e tons */
  flat?: string | CanvasGradient;
  /** brilho claro em volta do corpo (segmentação da câmera) */
  glow?: boolean;
};

const SKIN_A = "#b4bec4";
const SKIN_B = "#8f9ba3";
const SHIRT = "#dde1e1";
const SHIRT_SH = "#bcc3c5";
const SHORTS = "#2a2c34";
const HAIR = "#34353c";

/** Pontos-chave do corpo, em unidades. */
export const KEYS: Record<View, Record<string, Pt>> = {
  front: {
    head: [0, 44],
    shL: [-98, 182],
    shR: [98, 182],
    chest: [0, 186],
    mid: [0, 372],
    elL: [-142, 340],
    elR: [142, 340],
    wrL: [-172, 470],
    wrR: [172, 470],
    hipL: [-44, 455],
    hipC: [0, 455],
    hipR: [44, 455],
    knL: [-48, 720],
    knR: [48, 720],
    anL: [-44, 935],
    anR: [44, 935],
  },
  side: {
    head: [8, 40],
    ear: [0, 76],
    sh: [0, 186],
    mid: [0, 330],
    hip: [0, 452],
    kn: [6, 718],
    an: [-6, 940],
    foot: [-34, 985],
  },
};

export function pt(view: View, name: string, cx: number, top: number, h: number): Pt {
  const s = h / 1000;
  const p = KEYS[view][name];
  return [cx + p[0] * s, top + p[1] * s];
}

export function figure(g: G, view: View, cx: number, top: number, h: number, st: FigureStyle = {}) {
  const s = h / 1000;
  const grow = st.grow ?? 0;
  const X = (x: number) => cx + x * s;
  const Y = (y: number) => top + y * s;

  const flat = st.flat;
  const paint = (c: string | CanvasGradient) => {
    g.fillStyle = flat ?? c;
    g.strokeStyle = flat ?? c;
  };

  const poly = (pts: Pt[], c: string | CanvasGradient, smooth = false) => {
    paint(c);
    g.beginPath();
    if (smooth) {
      const n = pts.length;
      const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      const m0 = mid(pts[n - 1], pts[0]);
      g.moveTo(X(m0[0]), Y(m0[1]));
      for (let i = 0; i < n; i++) {
        const m = mid(pts[i], pts[(i + 1) % n]);
        g.quadraticCurveTo(X(pts[i][0]), Y(pts[i][1]), X(m[0]), Y(m[1]));
      }
    } else {
      pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1]))));
    }
    g.closePath();
    g.fill();
    if (grow) {
      g.lineWidth = grow * 2;
      g.lineJoin = "round";
      g.stroke();
    }
  };

  const ellipse = (x: number, y: number, rx: number, ry: number, c: string | CanvasGradient, rot = 0) => {
    paint(c);
    g.beginPath();
    g.ellipse(X(x), Y(y), rx * s + grow, ry * s + grow, rot, 0, Math.PI * 2);
    g.fill();
  };

  // membro com largura variável (cápsula afunilada)
  const limb = (a: Pt, b: Pt, w0: number, w1: number, c: string | CanvasGradient) => {
    const ax = X(a[0]),
      ay = Y(a[1]),
      bx = X(b[0]),
      by = Y(b[1]);
    const r0 = (w0 * s) / 2 + grow,
      r1 = (w1 * s) / 2 + grow;
    const ang = Math.atan2(by - ay, bx - ax);
    const d = Math.hypot(bx - ax, by - ay);
    const sinA = Math.min(1, Math.max(-1, (r0 - r1) / (d || 1)));
    const off = Math.asin(sinA);
    paint(c);
    g.beginPath();
    g.arc(ax, ay, r0, ang + Math.PI / 2 + off, ang - Math.PI / 2 - off);
    g.arc(bx, by, r1, ang - Math.PI / 2 - off, ang + Math.PI / 2 + off);
    g.closePath();
    g.fill();
  };

  g.save();
  const skin = g.createLinearGradient(0, Y(0), 0, Y(1000));
  skin.addColorStop(0, SKIN_A);
  skin.addColorStop(1, SKIN_B);
  const shirt = g.createLinearGradient(0, Y(160), 0, Y(480));
  shirt.addColorStop(0, SHIRT);
  shirt.addColorStop(1, SHIRT_SH);

  if (st.glow) {
    g.shadowColor = "rgba(255,255,255,0.55)";
    g.shadowBlur = 26 * Math.max(0.4, s * 1.1);
  }

  if (view === "front") {
    // pernas e pés
    for (const k of [-1, 1]) {
      limb([k * 42, 520], [k * 48, 725], 84, 64, skin);
      limb([k * 48, 725], [k * 44, 940], 64, 44, skin);
      ellipse(k * 56, 968, 38, 20, skin, k * 0.2);
    }
    // braços
    for (const k of [-1, 1]) {
      limb([k * 94, 196], [k * 134, 350], 44, 33, skin);
      limb([k * 134, 350], [k * 160, 480], 33, 26, skin);
      ellipse(k * 170, 515, 18, 34, skin, k * -0.25);
    }
    limb([0, 118], [0, 180], 40, 50, skin);
    ellipse(0, 68, 50, 66, skin);
    // camiseta regata e bermuda
    poly(
      [
        [-34, 168],
        [-104, 190],
        [-104, 230],
        [-84, 300],
        [-78, 420],
        [-86, 486],
        [86, 486],
        [78, 420],
        [84, 300],
        [104, 230],
        [104, 190],
        [34, 168],
        [0, 214],
      ],
      shirt,
    );
    limb([-84, 196], [-100, 236], 34, 26, shirt);
    limb([84, 196], [100, 236], 34, 26, shirt);
    poly(
      [
        [-90, 466],
        [90, 466],
        [100, 660],
        [8, 668],
        [0, 548],
        [-8, 668],
        [-100, 660],
      ],
      SHORTS,
    );
    if (!st.flat) {
      g.shadowBlur = 0;
      g.fillStyle = HAIR;
      g.beginPath();
      g.moveTo(X(-50), Y(62));
      g.bezierCurveTo(X(-60), Y(-24), X(60), Y(-24), X(50), Y(62));
      g.bezierCurveTo(X(44), Y(36), X(22), Y(30), X(0), Y(28));
      g.bezierCurveTo(X(-22), Y(32), X(-42), Y(36), X(-50), Y(62));
      g.fill();
    }
  } else {
    // perna e pé (o pé aponta para a direita)
    limb([0, 520], [8, 725], 88, 66, skin);
    limb([8, 725], [-4, 940], 66, 46, skin);
    paint(skin);
    g.beginPath();
    g.moveTo(X(-30), Y(930));
    g.lineTo(X(18), Y(930));
    g.bezierCurveTo(X(30), Y(955), X(86), Y(962), X(90), Y(982));
    g.lineTo(X(-34), Y(985));
    g.bezierCurveTo(X(-40), Y(965), X(-34), Y(950), X(-30), Y(930));
    g.closePath();
    g.fill();
    // braço junto ao corpo, um pouco à frente
    limb([-2, 200], [8, 350], 46, 34, skin);
    limb([8, 350], [24, 480], 34, 27, skin);
    ellipse(30, 514, 19, 32, skin, -0.15);
    limb([-6, 118], [-8, 182], 40, 48, skin);
    ellipse(2, 68, 52, 66, skin);
    // nariz e queixo
    paint(skin);
    g.beginPath();
    g.moveTo(X(46), Y(60));
    g.lineTo(X(66), Y(80));
    g.lineTo(X(46), Y(88));
    g.closePath();
    g.fill();
    // camiseta e bermuda de perfil
    poly(
      [
        [-34, 172],
        [-54, 250],
        [-58, 340],
        [-50, 430],
        [-54, 488],
        [52, 488],
        [50, 430],
        [56, 360],
        [54, 270],
        [42, 192],
        [12, 168],
      ],
      shirt,
      true,
    );
    limb([-2, 196], [4, 270], 56, 46, shirt);
    poly(
      [
        [-58, 466],
        [54, 466],
        [66, 668],
        [-56, 668],
      ],
      SHORTS,
    );
    if (!st.flat) {
      g.shadowBlur = 0;
      g.fillStyle = HAIR;
      g.beginPath();
      g.moveTo(X(-46), Y(84));
      g.bezierCurveTo(X(-60), Y(-22), X(52), Y(-22), X(56), Y(48));
      g.bezierCurveTo(X(38), Y(32), X(14), Y(30), X(2), Y(44));
      g.bezierCurveTo(X(-8), Y(56), X(-24), Y(70), X(-46), Y(84));
      g.fill();
    }
  }
  g.restore();
}
