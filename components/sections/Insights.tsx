"use client";
import { useEffect, useRef, useState } from "react";
import s from "./Insights.module.css";

function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => e.isIntersecting && set(true), { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

// Curvas aproximadas de altura por idade (meninos), próximas às referências da OMS. Ilustrativas.
// A partir dos 4 anos (a estação avalia a partir dos 3)
const AGES = [4, 6, 8, 10, 12, 14, 16, 18];
const CURVES = [
  { k: "P97", v: [111, 125, 137, 150, 162, 177, 184, 187], c: "#7fb0ee" },
  { k: "P50", v: [103, 116, 127, 138, 149, 163, 172, 176], c: "#1f6fd8" },
  { k: "P3", v: [94, 106, 117, 126, 136, 148, 157, 161], c: "#164f9c" },
];
function Growth({ on }: { on: boolean }) {
  const W = 560,
    H = 230,
    L = 34,
    R = 48,
    T = 10,
    B = 26;
  const x = (a: number) => L + ((a - 4) / 14) * (W - L - R);
  const y = (h: number) => T + (1 - (h - 88) / 104) * (H - T - B);
  const d = (v: number[]) => v.map((h, i) => `${i ? "L" : "M"}${x(AGES[i]).toFixed(1)} ${y(h).toFixed(1)}`).join(" ");
  return (
    <svg
      className={`${s.growth} ${on ? s.draw : ""}`}
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label="Curvas de altura por idade para meninos (percentis 3, 50 e 97). O aluno de exemplo, com 10 anos e 148 cm, fica acima do percentil 50."
    >
      {[100, 125, 150, 175].map((h) => (
        <g key={h}>
          <line x1={L} x2={W - R} y1={y(h)} y2={y(h)} className={s.gridline} />
          <text x={L - 8} y={y(h) + 4} className={s.axis} textAnchor="end">
            {h}
          </text>
        </g>
      ))}
      {[4, 8, 12, 16].map((a) => (
        <text key={a} x={x(a)} y={H - 6} className={s.axis} textAnchor="middle">
          {a} anos
        </text>
      ))}
      {CURVES.map((c) => (
        <g key={c.k}>
          <path d={d(c.v)} stroke={c.c} className={s.curve} pathLength={1} />
          <text x={W - R + 8} y={y(c.v[c.v.length - 1]) + 4} className={s.axis}>
            {c.k}
          </text>
        </g>
      ))}
      <circle cx={x(10)} cy={y(148)} r={7} className={s.dot}>
        <title>Aluno de exemplo: 10 anos, 148 cm</title>
      </circle>
    </svg>
  );
}

function Posture() {
  const J: Record<string, [number, number]> = {
    head: [100, 30],
    neck: [100, 58],
    shL: [64, 70],
    shR: [136, 64],
    elL: [56, 118],
    elR: [144, 114],
    wrL: [54, 160],
    wrR: [146, 157],
    pel: [100, 134],
    hipL: [80, 142],
    hipR: [120, 138],
    knL: [80, 200],
    knR: [120, 198],
    anL: [80, 256],
    anR: [120, 256],
  };
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
  const ext = (a: [number, number], b: [number, number]) => {
    const dx = b[0] - a[0],
      dy = b[1] - a[1];
    return { x1: a[0] - dx * 0.55, y1: a[1] - dy * 0.55, x2: b[0] + dx * 0.55, y2: b[1] + dy * 0.55 };
  };
  return (
    <div className={s.posture}>
      <svg
        viewBox="0 0 200 270"
        role="img"
        aria-label="Esqueleto com ombros e pelve levemente desalinhados, marcados como sinais de atenção"
      >
        <line {...ext(J.shL, J.shR)} className={s.warnLine} />
        <line {...ext(J.hipL, J.hipR)} className={s.warnLine} />
        <line x1={100} y1={6} x2={100} y2={266} className={s.plumb} />
        {bones.map(([a, b]) => (
          <line key={a + b} x1={J[a][0]} y1={J[a][1]} x2={J[b][0]} y2={J[b][1]} className={s.bone} />
        ))}
        <circle cx={J.head[0]} cy={J.head[1]} r={16} className={s.headC} />
        {Object.entries(J).map(([k, [x, y]]) =>
          k === "head" ? null : <circle key={k} cx={x} cy={y} r={4.2} className={s.joint} />,
        )}
      </svg>
      <ul className={s.flags}>
        <li>
          <span className={s.warnDot} aria-hidden="true">
            !
          </span>
          Ombros
        </li>
        <li>
          <span className={s.warnDot} aria-hidden="true">
            !
          </span>
          Pelve
        </li>
      </ul>
    </div>
  );
}

/** O que o relatório mostra além dos números do dia: a curva de cada aluno e os sinais de atenção postural. */
export default function Insights() {
  const [ref, on] = useInView<HTMLDivElement>(0.2);
  return (
    <div ref={ref} className={s.grid}>
      <article className={s.tile} data-reveal>
        <header>
          <p className={s.cat}>Acompanhamento</p>
          <h3>Cada avaliação, um ponto na curva.</h3>
          <p className={s.text}>A altura entra na curva de crescimento por idade e sexo, ano após ano.</p>
        </header>
        <div>
          <Growth on={on} />
          <p className={s.legend}>P3, P50 e P97: faixas de referência de crescimento (percentis).</p>
        </div>
      </article>
      <article className={s.tile} data-reveal>
        <header>
          <p className={s.cat}>Postura</p>
          <h3>Sinais de atenção, apontados.</h3>
          <p className={s.text}>
            A câmera marca ombros, coluna, pelve e joelhos e indica o que vale levar a um profissional.
          </p>
        </header>
        <Posture />
      </article>
    </div>
  );
}
