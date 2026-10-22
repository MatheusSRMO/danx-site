// Telas da estação desenhadas em canvas (viram textura no modelo 3D).
// Valores do relatório de exemplo da apresentação DANX: aluno de 10 anos, 148 cm.

export const SCREEN_W = 600;
export const SCREEN_H = 1000;

const FONT = '"Inter Variable", "Inter", system-ui, sans-serif';
// Tema escuro, como a interface original da estação.
const C = {
  bg: "#161c28",
  bar: "#222b3b",
  ink: "#f2f4f8",
  ink2: "#9aa4b6",
  line: "#2c3546",
  blue: "#4f8ff7",
  teal: "#2ec2c6",
  // Paleta categórica validada para fundo escuro (ordem: água, músculo/proteína, gordura, minerais)
  water: "#1aa3a5",
  protein: "#5574f2",
  fat: "#bf8220",
  mineral: "#b065dc",
  green: "#3fbf74",
  orange: "#f0953a",
};

function header(g: CanvasRenderingContext2D, title: string, step: string) {
  g.fillStyle = C.bg;
  g.fillRect(0, 0, SCREEN_W, SCREEN_H);
  // Barra superior com voltar e avançar, como na interface original
  const grd = g.createLinearGradient(0, 0, SCREEN_W, 0);
  grd.addColorStop(0, "#2a2350");
  grd.addColorStop(1, "#173b4a");
  g.fillStyle = grd;
  g.fillRect(20, 20, SCREEN_W - 40, 64);
  g.fillStyle = C.ink;
  g.beginPath();
  g.moveTo(52, 52);
  g.lineTo(66, 42);
  g.lineTo(66, 62);
  g.fill();
  g.fillStyle = "#3fbf74";
  g.beginPath();
  g.moveTo(SCREEN_W - 66, 40);
  g.lineTo(SCREEN_W - 46, 52);
  g.lineTo(SCREEN_W - 66, 64);
  g.fill();
  g.fillStyle = C.ink2;
  g.font = `600 18px ${FONT}`;
  g.textAlign = "center";
  g.fillText(`DANX · ${step}`, SCREEN_W / 2, 59);
  g.textAlign = "left";
  g.fillStyle = C.ink;
  g.font = `700 44px ${FONT}`;
  g.fillText(title, 40, 150);
}

function ring(g: CanvasRenderingContext2D, x: number, y: number, r: number, w: number, pct: number, color: string) {
  g.lineCap = "round";
  g.lineWidth = w;
  g.strokeStyle = color + "33";
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.stroke();
  g.strokeStyle = color;
  g.beginPath();
  g.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * pct);
  g.stroke();
}

function bar(g: CanvasRenderingContext2D, y: number, label: string, value: string, pct: number, color: string) {
  g.fillStyle = C.ink2;
  g.font = `500 24px ${FONT}`;
  g.fillText(label, 40, y);
  g.fillStyle = C.ink;
  g.font = `600 26px ${FONT}`;
  g.textAlign = "right";
  g.fillText(value, SCREEN_W - 40, y);
  g.textAlign = "left";
  const top = y + 16;
  g.fillStyle = C.line;
  roundRect(g, 40, top, SCREEN_W - 80, 12, 6);
  g.fillStyle = color;
  roundRect(g, 40, top, (SCREEN_W - 80) * pct, 12, 6);
}

function roundRect(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fill();
}

function score(g: CanvasRenderingContext2D) {
  header(g, "Sua avaliação", "1/5");
  const cx = SCREEN_W / 2,
    cy = 380;
  ring(g, cx, cy, 160, 26, 0.86, C.blue);
  ring(g, cx, cy, 124, 26, 0.72, C.teal);
  ring(g, cx, cy, 88, 26, 0.6, C.green);
  g.fillStyle = C.ink;
  g.textAlign = "center";
  g.font = `700 72px ${FONT}`;
  g.fillText("86", cx, cy + 22);
  g.font = `500 20px ${FONT}`;
  g.fillStyle = C.ink2;
  g.fillText("pontuação de saúde", cx, cy + 56);
  g.textAlign = "left";
  bar(g, 640, "Peso", "44,2 kg", 0.6, C.blue);
  bar(g, 730, "Gordura", "21,3%", 0.52, C.fat);
  bar(g, 820, "Músculo", "52,2%", 0.72, C.protein);
  bar(g, 910, "IMC", "20,2", 0.58, C.teal);
}

function composition(g: CanvasRenderingContext2D) {
  header(g, "Composição", "2/5");
  // Partes do peso corporal (somam 100%). Gordura vem do relatório de exemplo; o resto é ilustrativo.
  const parts = [
    { l: "Água", v: "58,9%", p: 0.589, c: C.water },
    { l: "Proteína", v: "16,1%", p: 0.161, c: C.protein },
    { l: "Gordura", v: "21,3%", p: 0.213, c: C.fat },
    { l: "Minerais", v: "3,7%", p: 0.037, c: C.mineral },
  ];
  // Barra empilhada com 2px de respiro entre os segmentos
  let x = 40;
  const W = SCREEN_W - 80 - 2 * (parts.length - 1);
  parts.forEach((p) => {
    g.fillStyle = p.c;
    roundRect(g, x, 220, W * p.p, 64, 8);
    x += W * p.p + 2;
  });
  parts.forEach((p, i) => {
    const y = 380 + i * 115;
    g.fillStyle = p.c;
    g.beginPath();
    g.arc(52, y - 9, 12, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = C.ink;
    g.font = `500 30px ${FONT}`;
    g.fillText(p.l, 80, y);
    g.font = `700 44px ${FONT}`;
    g.textAlign = "right";
    g.fillText(p.v, SCREEN_W - 40, y + 4);
    g.textAlign = "left";
    g.fillStyle = C.line;
    g.fillRect(40, y + 40, SCREEN_W - 80, 2);
  });
  g.fillStyle = C.ink2;
  g.font = `500 24px ${FONT}`;
  g.fillText("Músculo", 40, 880);
  g.fillStyle = C.ink;
  g.font = `700 44px ${FONT}`;
  g.textAlign = "right";
  g.fillText("52,2%", SCREEN_W - 40, 884);
  g.textAlign = "left";
}

function posture(g: CanvasRenderingContext2D) {
  header(g, "Postura", "3/5");
  const cx = SCREEN_W / 2;
  const J = {
    head: [cx, 230],
    neck: [cx, 300],
    shL: [cx - 90, 322],
    shR: [cx + 90, 310],
    elL: [cx - 112, 460],
    elR: [cx + 112, 452],
    wrL: [cx - 118, 580],
    wrR: [cx + 118, 574],
    pel: [cx, 520],
    hipL: [cx - 50, 538],
    hipR: [cx + 50, 530],
    knL: [cx - 54, 700],
    knR: [cx + 54, 696],
    anL: [cx - 54, 860],
    anR: [cx + 54, 860],
  } as Record<string, number[]>;
  const bones = [
    ["head", "neck"],
    ["neck", "pel"],
    ["neck", "shL"],
    ["neck", "shR"],
    ["shL", "elL"],
    ["elL", "wrL"],
    ["shR", "elR"],
    ["elR", "wrR"],
    ["pel", "hipL"],
    ["pel", "hipR"],
    ["hipL", "knL"],
    ["knL", "anL"],
    ["hipR", "knR"],
    ["knR", "anR"],
  ];
  g.strokeStyle = "#c7c7cc";
  g.lineWidth = 10;
  g.lineCap = "round";
  bones.forEach(([a, b]) => {
    g.beginPath();
    g.moveTo(J[a][0], J[a][1]);
    g.lineTo(J[b][0], J[b][1]);
    g.stroke();
  });
  g.fillStyle = "#c7c7cc";
  g.beginPath();
  g.arc(J.head[0], J.head[1], 44, 0, Math.PI * 2);
  g.fill();
  // Linhas de alinhamento (sinal de atenção nos ombros e na pelve)
  g.setLineDash([12, 10]);
  g.lineWidth = 4;
  g.strokeStyle = C.orange;
  [
    [J.shL, J.shR],
    [J.hipL, J.hipR],
  ].forEach(([a, b]) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    g.beginPath();
    g.moveTo(a[0] - dx * 0.9, a[1] - dy * 0.9);
    g.lineTo(b[0] + dx * 0.9, b[1] + dy * 0.9);
    g.stroke();
  });
  g.strokeStyle = C.teal;
  g.beginPath();
  g.moveTo(cx, 170);
  g.lineTo(cx, 900);
  g.stroke();
  g.setLineDash([]);
  Object.values(J).forEach(([x, y]) => {
    g.fillStyle = "#fff";
    g.beginPath();
    g.arc(x, y, 9, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = C.blue;
    g.lineWidth = 4;
    g.stroke();
  });
  g.fillStyle = C.ink;
  g.font = `600 26px ${FONT}`;
  g.fillText("Ombros 2,1°", 40, 950);
  g.textAlign = "right";
  g.fillText("Pelve 1,4°", SCREEN_W - 40, 950);
  g.textAlign = "left";
}

function balance(g: CanvasRenderingContext2D) {
  header(g, "Equilíbrio", "4/5");
  const cx = SCREEN_W / 2,
    cy = 470;
  [200, 140, 80].forEach((r, i) => {
    g.strokeStyle = i === 2 ? C.blue + "55" : C.line;
    g.lineWidth = 3;
    g.beginPath();
    g.arc(cx, cy, r, 0, Math.PI * 2);
    g.stroke();
  });
  g.strokeStyle = C.blue;
  g.lineWidth = 4;
  g.beginPath();
  for (let i = 0; i <= 260; i++) {
    const t = i / 18;
    const x = cx + 34 * Math.sin(t * 1.3) + 14 * Math.sin(t * 3.1 + 1);
    const y = cy + 22 * Math.sin(t * 0.9 + 0.5) + 9 * Math.cos(t * 2.7);
    if (i === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  g.fillStyle = C.ink;
  g.textAlign = "center";
  g.font = `700 96px ${FONT}`;
  g.fillText("92", cx, 820);
  g.font = `500 24px ${FONT}`;
  g.fillStyle = C.ink2;
  g.fillText("de 100 · 10 s em um pé", cx, 866);
  g.textAlign = "left";
}

function growth(g: CanvasRenderingContext2D) {
  header(g, "Crescimento", "5/5");
  const L = 60,
    R = SCREEN_W - 40,
    T = 220,
    B = 760;
  const ages = [2, 4, 6, 8, 10, 12, 14, 16, 18];
  const curves = [
    [82, 94, 106, 117, 126, 136, 148, 157, 161],
    [87.5, 103, 116, 127, 138, 149, 163, 172, 176],
    [93, 111, 125, 137, 150, 162, 177, 184, 187],
  ];
  const x = (a: number) => L + ((a - 2) / 16) * (R - L);
  const y = (h: number) => T + (1 - (h - 75) / 117) * (B - T);
  g.strokeStyle = C.line;
  g.lineWidth = 2;
  [100, 125, 150, 175].forEach((h) => {
    g.beginPath();
    g.moveTo(L, y(h));
    g.lineTo(R, y(h));
    g.stroke();
  });
  ["#2f5fae", C.blue, "#a9cdfa"].forEach((col, k) => {
    g.strokeStyle = col;
    g.lineWidth = 4;
    g.beginPath();
    curves[k].forEach((h, i) => (i ? g.lineTo(x(ages[i]), y(h)) : g.moveTo(x(ages[i]), y(h))));
    g.stroke();
  });
  g.fillStyle = "#fff";
  g.strokeStyle = C.teal;
  g.lineWidth = 5;
  g.beginPath();
  g.arc(x(10), y(148), 12, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  g.fillStyle = C.ink;
  g.font = `700 64px ${FONT}`;
  g.fillText("148 cm", 40, 880);
  g.fillStyle = C.ink2;
  g.font = `500 24px ${FONT}`;
  g.fillText("10 anos · curva de altura por idade", 40, 924);
}

const DRAW = [score, composition, posture, balance, growth];
export const SCREEN_COUNT = DRAW.length;

export function drawScreen(i: number) {
  const c = document.createElement("canvas");
  c.width = SCREEN_W;
  c.height = SCREEN_H;
  const g = c.getContext("2d")!;
  DRAW[i](g);
  return c;
}
