"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import s from "./Assessments.module.css";

function useInView<T extends Element>(threshold = 0.25) {
  const ref = useRef<T>(null);
  const [inView, set] = useState(false);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => set(e.isIntersecting), { threshold });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, inView] as const;
}

// Partes do peso corporal (somam 100%). Gordura vem do relatório de exemplo da DANX; o restante é ilustrativo.
const COMPOSITION = [
  { label: "Água", value: 58.9, color: "var(--c-water)" },
  { label: "Proteína", value: 16.1, color: "var(--c-protein)" },
  { label: "Gordura", value: 21.3, color: "var(--c-fat)" },
  { label: "Minerais", value: 3.7, color: "var(--c-mineral)" },
];
const pt = (v: number) => v.toLocaleString("pt-BR", { minimumFractionDigits: 1 });

function Composition({ on }: { on: boolean }) {
  return (
    <div className={s.comp}>
      <div
        className={`${s.stack} ${on ? s.grow : ""}`}
        role="img"
        aria-label="Composição do peso corporal: água 58,9%, proteína 16,1%, gordura 21,3%, minerais 3,7%"
      >
        {COMPOSITION.map((c) => (
          <span
            key={c.label}
            style={{ flexGrow: c.value, background: c.color }}
            title={`${c.label}: ${pt(c.value)}%`}
          />
        ))}
      </div>
      <dl className={s.compLegend}>
        {COMPOSITION.map((c) => (
          <div key={c.label}>
            <dt>
              <i style={{ background: c.color }} />
              {c.label}
            </dt>
            <dd className="num">{pt(c.value)}%</dd>
          </div>
        ))}
      </dl>
    </div>
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
        aria-label="Esqueleto com ombros e pelve levemente desalinhados, marcados como sinal de atenção"
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
          </span>{" "}
          Ombros <b className="num">2,1°</b>
        </li>
        <li>
          <span className={s.warnDot} aria-hidden="true">
            !
          </span>{" "}
          Pelve <b className="num">1,4°</b>
        </li>
        <li className={s.flagNote}>Sinais de atenção</li>
      </ul>
    </div>
  );
}

// Curvas aproximadas de altura por idade (meninos), próximas às referências da OMS. Ilustrativas.
const AGES = [2, 4, 6, 8, 10, 12, 14, 16, 18];
const CURVES = [
  { k: "P97", v: [93, 111, 125, 137, 150, 162, 177, 184, 187], c: "#7fb0ee" },
  { k: "P50", v: [87.5, 103, 116, 127, 138, 149, 163, 172, 176], c: "#1f6fd8" },
  { k: "P3", v: [82, 94, 106, 117, 126, 136, 148, 157, 161], c: "#164f9c" },
];
function Growth({ on }: { on: boolean }) {
  const W = 560,
    H = 230,
    L = 34,
    R = 48,
    T = 10,
    B = 26;
  const x = (a: number) => L + ((a - 2) / 16) * (W - L - R);
  const y = (h: number) => T + (1 - (h - 75) / 117) * (H - T - B);
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
      {[2, 6, 10, 14, 18].map((a) => (
        <text key={a} x={x(a)} y={H - 6} className={s.axis} textAnchor="middle">
          {a} anos
        </text>
      ))}
      {CURVES.map((c) => (
        <g key={c.k}>
          <path d={d(c.v)} stroke={c.c} className={s.curve} pathLength={1} />
          <text x={W - R + 8} y={y(c.v[8]) + 4} className={s.axis}>
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

function Balance({ on }: { on: boolean }) {
  let path = "";
  for (let i = 0; i <= 220; i++) {
    const t = i / 16;
    const px = 80 + 15 * Math.sin(t * 1.3) + 6 * Math.sin(t * 3.1 + 1);
    const py = 80 + 10 * Math.sin(t * 0.9 + 0.5) + 4 * Math.cos(t * 2.7);
    path += `${i ? "L" : "M"}${px.toFixed(1)} ${py.toFixed(1)}`;
  }
  return (
    <div className={s.balance}>
      <svg viewBox="0 0 160 160" aria-hidden="true">
        {[70, 48, 26].map((r) => (
          <circle key={r} cx={80} cy={80} r={r} className={s.target} />
        ))}
        <path d={path} className={`${s.trace} ${on ? s.traceOn : ""}`} pathLength={1} />
      </svg>
      <p className={s.score}>
        <span className="num">92</span>
        <small>de 100</small>
      </p>
    </div>
  );
}

function Reaction({ on }: { on: boolean }) {
  const [cell, setCell] = useState(4);
  const [ms, setMs] = useState(312);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => {
      setCell((c) => {
        let n = c;
        while (n === c) n = Math.floor(Math.random() * 9);
        return n;
      });
      setMs(260 + Math.round(Math.random() * 140));
    }, 950);
    return () => window.clearInterval(id);
  }, [on]);
  return (
    <div className={s.reaction}>
      <div className={s.grid9} aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <span key={i} className={i === cell ? s.lit : ""} />
        ))}
      </div>
      <p className={s.score}>
        <span className="num">{ms}</span>
        <small>ms</small>
      </p>
    </div>
  );
}

function Lungs({ on }: { on: boolean }) {
  return (
    <div className={s.lungs}>
      <svg viewBox="0 0 120 120" aria-hidden="true">
        <circle cx={60} cy={60} r={48} className={s.ringBg} />
        <circle cx={60} cy={60} r={48} className={`${s.ring} ${on ? s.ringOn : ""}`} pathLength={1} />
      </svg>
      <p className={s.score}>
        <span className="num">2.340</span>
        <small>mL</small>
      </p>
    </div>
  );
}

function Vision({ on }: { on: boolean }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setStep((v) => (v + 1) % 8), 1400);
    return () => window.clearInterval(id);
  }, [on]);
  const rot = [0, 90, 180, 270, 90, 0, 270, 180][step];
  const size = [1, 1, 0.78, 0.78, 0.6, 0.6, 0.44, 0.44][step];
  return (
    <div className={s.vision} aria-hidden="true">
      <svg viewBox="0 0 50 50" style={{ transform: `rotate(${rot}deg) scale(${size})` }}>
        <path d="M0 0H50V10H0Z M0 20H50V30H0Z M0 40H50V50H0Z M0 0H10V50H0Z" />
      </svg>
    </div>
  );
}

const INDICATORS = [
  "Altura",
  "Peso",
  "IMC",
  "Gordura corporal",
  "Massa de gordura",
  "Gordura visceral",
  "Massa muscular",
  "Massa magra",
  "Água corporal",
  "Proteína",
  "Minerais",
  "Massa óssea",
  "Taxa metabólica basal",
  "Equilíbrio",
  "Tempo de reação",
  "Capacidade vital",
  "Acuidade visual",
  "Ombros",
  "Coluna",
  "Pelve",
  "Joelhos",
  "Percentil de altura",
  "Percentil de peso",
  "Pontuação de saúde",
];
function Indicators() {
  return (
    <div className={s.indicators}>
      <p className={s.huge}>62</p>
      <div className={s.ticker} aria-hidden="true">
        <ul>
          {[...INDICATORS, ...INDICATORS].map((t, i) => (
            <li key={i}>{t}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Rope({ on, still }: { on: boolean; still: boolean }) {
  // Com movimento reduzido, mostra um minuto já contado em vez de animar
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) return;
    const id = window.setInterval(() => setN((v) => (v >= 128 ? 0 : v + 1)), 150);
    return () => window.clearInterval(id);
  }, [on]);
  return (
    <p className={s.score}>
      <span className="num">{still ? 128 : n}</span>
      <small>saltos</small>
    </p>
  );
}

type Tile = {
  id: string;
  cat: string;
  color: string;
  title: string;
  text: string;
  wide?: boolean;
  tbc?: boolean;
  photo?: { src: string; alt: string };
};
const TILES: Tile[] = [
  {
    id: "composicao",
    cat: "Composição corporal",
    color: "var(--c-protein)",
    title: "Água, proteína, gordura e minerais.",
    text: "Bioimpedância com quatro eletrodos de aço inox 304 e algoritmo específico para quem ainda está crescendo.",
    wide: true,
  },
  {
    id: "postura",
    cat: "Postura",
    color: "var(--warn)",
    title: "A câmera vê o que o espelho esconde.",
    text: "Visão computacional mapeia ombros, coluna, pelve e joelhos e aponta sinais de atenção.",
  },
  {
    id: "equilibrio",
    cat: "Equilíbrio",
    color: "var(--teal)",
    title: "Dez segundos em um pé só.",
    text: "A plataforma acompanha a oscilação do corpo e gera uma pontuação de 0 a 100.",
    photo: {
      src: "/media/test-balance.webp",
      alt: "Adolescente em um pé só, de olhos fechados, sobre a plataforma da estação no teste de equilíbrio",
    },
  },
  {
    id: "reacao",
    cat: "Agilidade e reação",
    color: "var(--accent)",
    title: "Tempo de reação, em milissegundos.",
    text: "Estímulos aleatórios na tela, resposta cronometrada.",
  },
  {
    id: "pulmao",
    cat: "Capacidade pulmonar",
    color: "var(--c-water)",
    title: "Fôlego, em mililitros.",
    text: "Espirômetro com sensor de pressão de alta precisão.",
  },
  {
    id: "crescimento",
    cat: "Altura e crescimento",
    color: "var(--accent)",
    title: "Cada medida, um ponto na curva.",
    text: "O sensor ultrassônico mede a altura sem contato, e a estação acompanha os percentis por idade e sexo, ano após ano.",
    wide: true,
  },
  {
    id: "visao",
    cat: "Acuidade visual",
    color: "var(--c-mineral)",
    title: "Triagem visual na própria tela.",
    text: "Optotipo “E” em quatro direções.",
  },
  {
    id: "indicadores",
    cat: "Relatório",
    color: "var(--ink)",
    title: "62 indicadores em uma avaliação.",
    text: "Do peso à taxa metabólica basal, com sugestões gerais de atividade física e hábitos alimentares.",
    wide: true,
  },
  {
    id: "corda",
    cat: "Pular corda",
    color: "var(--c-fat)",
    title: "Um minuto, cada salto contado.",
    text: "Corda com Bluetooth integrada ao relatório.",
    tbc: true,
  },
];

export default function Assessments() {
  const [ref, on] = useInView<HTMLDivElement>(0.1);
  // Os testes que ficam se repetindo param quando a pessoa pede menos movimento
  const [reduced, setReduced] = useState(false);
  useEffect(() => setReduced(document.documentElement.classList.contains("reduced")), []);
  const loop = on && !reduced;
  const visual = (id: string) => {
    switch (id) {
      case "composicao":
        return <Composition on={on} />;
      case "postura":
        return <Posture />;
      case "equilibrio":
        return <Balance on={on} />;
      case "reacao":
        return <Reaction on={loop} />;
      case "pulmao":
        return <Lungs on={on} />;
      case "crescimento":
        return <Growth on={on} />;
      case "visao":
        return <Vision on={loop} />;
      case "indicadores":
        return <Indicators />;
      default:
        return <Rope on={loop} still={reduced} />;
    }
  };

  return (
    <section id="avaliacoes" className={`section alt ${s.section}`} aria-labelledby="avaliacoes-title">
      <div className="container-wide">
        <div className={s.head}>
          <h2 id="avaliacoes-title" className="headline" data-reveal>
            Sete avaliações.
            <br />
            <span className="grad-text">Um só relatório.</span>
          </h2>
          <p className="lead" data-reveal>
            Altura, composição corporal, postura, equilíbrio, agilidade, capacidade pulmonar e visão, com curva de
            crescimento por idade e sexo. A estação conduz cada teste <strong>pela tela e por voz</strong>.
          </p>
        </div>
        <div ref={ref} className={s.grid}>
          {TILES.map((t) =>
            t.photo ? (
              <article key={t.id} className={`${s.tile} ${s.photoTile}`} data-reveal>
                <Image
                  src={t.photo.src}
                  alt={t.photo.alt}
                  fill
                  sizes="(max-width: 680px) 100vw, (max-width: 1000px) 50vw, 33vw"
                />
                <header className={s.photoCap}>
                  <p className={s.cat}>{t.cat}</p>
                  <h3>{t.title}</h3>
                  <p className={s.text}>{t.text}</p>
                </header>
              </article>
            ) : (
              <article key={t.id} className={`${s.tile} ${t.wide ? s.wide : ""} ${s[t.id] ?? ""}`} data-reveal>
                <header>
                  <p className={s.cat}>
                    <i style={{ background: t.color }} aria-hidden="true" />
                    {t.cat}
                    {t.tbc && <span className="tbc">A confirmar</span>}
                  </p>
                  <h3>{t.title}</h3>
                  <p className={s.text}>{t.text}</p>
                </header>
                <div className={s.visual}>{visual(t.id)}</div>
              </article>
            ),
          )}
        </div>
        <p className={s.footnote}>
          Valores ilustrativos. Gordura, altura e idade vêm de um relatório de exemplo (aluno de 10 anos, 148 cm); os
          demais números e as curvas são apenas demonstrativos. A estação faz triagem e avaliação, não diagnóstico.
        </p>
      </div>
    </section>
  );
}
