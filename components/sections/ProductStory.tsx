"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getTier, isTouch, type Tier } from "@/lib/device";
import { createStationState, type StationState } from "../three/stationState";
import { SCREENS, type ScreenId } from "../three/screenUi";
import type { Anchor } from "../three/Projector";
import s from "./ProductStory.module.css";

const StationCanvas = dynamic(() => import("../three/StationCanvas"), { ssr: false });
const Projector = dynamic(() => import("../three/Projector"), { ssr: false });

// Quadros-chave da câmera e do produto ao longo da rolagem (p de 0 a 1).
type Key = {
  p: number;
  rot: number;
  dist: number;
  y: number;
  elev: number;
  explode: number;
  glow: number;
  ultra: number;
  cx: number;
  /** Largura (m) que precisa caber no quadro; 0 = sem exigência. */
  span?: number;
};
const KEYS: Key[] = [
  { p: 0.0, rot: -2.3, dist: 9.6, y: 1.05, elev: 0.5, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.05, rot: -0.7, dist: 6.6, y: 1.05, elev: 0.55, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Identificação: a criança chega, sobe na plataforma e digita o número na tela
  { p: 0.1, rot: -0.55, dist: 6.4, y: 1.0, elev: 0.45, explode: 0, glow: 0, ultra: 0, cx: 0, span: 2.2 },
  { p: 0.135, rot: -0.85, dist: 5.2, y: 1.12, elev: 0.3, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.165, rot: -0.95, dist: 4.6, y: 1.25, elev: 0.25, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Altura: ondas do sensor descem até a cabeça
  { p: 0.235, rot: -0.42, dist: 3.6, y: 1.72, elev: 0.15, explode: 0, glow: 0, ultra: 1, cx: 0 },
  // Composição corporal: eletrodos sob os pés
  { p: 0.315, rot: -0.95, dist: 3.6, y: 0.32, elev: 1.0, explode: 0, glow: 1, ultra: 0, cx: -0.12 },
  // Toque em INICIAR (o alto da tela) antes do equilíbrio
  { p: 0.356, rot: -0.85, dist: 4.4, y: 1.15, elev: 0.25, explode: 0, glow: 0, ultra: 0, cx: -0.25 },
  // Equilíbrio: numa perna só
  { p: 0.4, rot: -1.15, dist: 4.8, y: 0.95, elev: 0.3, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Agilidade: toques na tela
  { p: 0.48, rot: -0.78, dist: 3.4, y: 1.3, elev: 0.22, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Fôlego: espirômetro
  { p: 0.56, rot: -1.05, dist: 3.4, y: 1.28, elev: 0.18, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Visão: a criança recua até 2,5 m; a câmera fica atrás dela, por cima do ombro, com a tela ao fundo
  { p: 0.6, rot: -0.6, dist: 7.2, y: 1.0, elev: 0.35, explode: 0, glow: 0, ultra: 0, cx: -0.55 },
  { p: 0.655, rot: -0.45, dist: 7.3, y: 1.0, elev: 0.3, explode: 0, glow: 0, ultra: 0, cx: -0.62 },
  // Postura: de frente para a câmera da estação e depois de lado (de lado, ela mostra o perfil para nós)
  { p: 0.725, rot: -0.45, dist: 7.3, y: 1.0, elev: 0.3, explode: 0, glow: 0, ultra: 0, cx: -0.5 },
  { p: 0.77, rot: -0.45, dist: 7.3, y: 1.0, elev: 0.3, explode: 0, glow: 0, ultra: 0, cx: -0.5 },
  // Resultado: a tela em destaque; a criança, ao lado da torre, olha a própria pontuação
  { p: 0.835, rot: -0.15, dist: 3.3, y: 1.34, elev: 0.08, explode: 0, glow: 0, ultra: 0, cx: 0, span: 1.5 },
  { p: 0.865, rot: -0.15, dist: 3.3, y: 1.34, elev: 0.08, explode: 0, glow: 0, ultra: 0, cx: 0, span: 1.5 },
  // Instalação: vista explodida (a criança some enquanto as peças se separam)
  { p: 0.92, rot: -0.62, dist: 9.6, y: 1.3, elev: 0.5, explode: 1, glow: 0, ultra: 0, cx: 0 },
  { p: 1.0, rot: -0.38, dist: 6.6, y: 1.05, elev: 0.55, explode: 0, glow: 0, ultra: 0, cx: 0, span: 1.9 },
];

// Coreografia da criança (chaves em components/three/Child.tsx), casada com a tela: cada toque cai no instante em que
// a tela reage (tecla acesa, CONCORDO, INICIAR, alvo da agilidade).
const ACT_TRACK: [number, number][] = [
  [0.0, 0],
  [0.05, 0],
  [0.1, 1], // chega diante da estação
  [0.11, 2], // sobe na plataforma
  [0.117, 3], // leva a mão à tela: matrícula (0,12 → 0,16) e termo (0,175 → 0,19)
  [0.192, 3],
  [0.205, 4], // braços afastados: altura e composição corporal
  [0.345, 5],
  [0.354, 6], // toca INICIAR do equilíbrio (0,358 → 0,364)
  [0.365, 6],
  [0.376, 7], // equilíbrio
  [0.432, 7],
  [0.441, 8], // agilidade: INICIAR e os cinco alvos
  [0.52, 8],
  [0.528, 9], // espirometria
  [0.59, 9],
  [0.594, 10], // devolve o espirômetro
  [0.602, 11], // vira no lugar
  [0.608, 12], // desce da plataforma
  [0.622, 13], // caminha até a marca de 2,5 m
  [0.632, 14], // vira para a tela: visão
  [0.7, 14],
  [0.708, 15], // postura de frente
  [0.75, 15],
  [0.762, 16], // postura de lado
  [0.79, 16],
  [0.83, 17], // vai para o lado da torre e olha o resultado na tela
  [0.85, 17],
  [0.865, 18], // some antes de a estação se abrir
  [0.95, 19], // troca de lado sem ser vista
  [0.982, 19],
  [0.997, 20], // reaparece no fecho, já sem os rótulos da vista explodida (o da torre fica à esquerda, onde ela para)
  [1.0, 20],
];

// Telas reais da estação ao longo da rolagem: mesma tela entre dois pontos → o progresso t avança
const SCREEN_TRACK: [number, ScreenId, number][] = [
  [0.0, "inicio", 0],
  [0.12, "inicio", 0],
  [0.16, "inicio", 1],
  [0.175, "consentimento", 0],
  [0.19, "consentimento", 1],
  [0.2, "composicao", 0],
  [0.25, "composicao", 0.45],
  [0.33, "composicao", 1],
  [0.355, "equilibrio", 0],
  [0.365, "equilibrio", 0.02],
  [0.44, "equilibrio", 1],
  [0.445, "agilidade", 0],
  [0.52, "agilidade", 1],
  [0.525, "espirometria", 0],
  [0.59, "espirometria", 1],
  [0.632, "visao", 0],
  [0.7, "visao", 1],
  [0.705, "postura", 0],
  [0.79, "postura", 1],
  [0.8, "pontuacao", 0],
  [0.845, "pontuacao", 1],
  [0.85, "evolucao", 0],
  [0.875, "evolucao", 1],
  [0.88, "relatorio", 1],
  [0.95, "pontuacao", 1],
  [1.0, "pontuacao", 1],
];

const CHAPTERS = [
  {
    at: 0.03,
    kicker: "Conheça a estação",
    title: "Uma estação. Sete avaliações.",
    text: "Torre de vidro temperado, tela de 32″, dossel de medição e plataforma de bioimpedância. Role para ver um aluno passar por cada etapa.",
  },
  {
    at: 0.135,
    kicker: "Identificação",
    title: "Começa com o número do aluno.",
    text: "O aluno digita a matrícula na tela e confirma o consentimento. A partir daí a estação conduz cada etapa, na tela e por voz.",
  },
  {
    at: 0.235,
    kicker: "Altura",
    title: "Sem régua, sem toque.",
    text: "O sensor ultrassônico no topo mede a altura em segundos. Cada avaliação vira um ponto na curva de crescimento.",
    stat: { v: "148", u: "cm" },
  },
  {
    at: 0.315,
    kicker: "Composição corporal",
    title: "Uma corrente que ninguém sente.",
    text: "Quatro eletrodos de aço inox 304 e corrente abaixo de 280 µA. A bioimpedância separa água, proteína, gordura e minerais.",
    stat: { v: "21,3%", u: "de gordura" },
  },
  {
    at: 0.4,
    kicker: "Equilíbrio",
    title: "Numa perna só, de olhos fechados.",
    text: "Mãos juntas, olhos fechados, dez segundos sobre a plataforma. A tela mostra a capacidade de equilíbrio.",
  },
  {
    at: 0.48,
    kicker: "Agilidade",
    title: "Cinco toques, contra o relógio.",
    text: "O botão acende cinco vezes na tela e o aluno toca o mais rápido que puder. O tempo médio de reação sai em milissegundos.",
  },
  {
    at: 0.56,
    kicker: "Fôlego",
    title: "Um sopro no espirômetro.",
    text: "Espirômetro sem fio com bocal descartável. A tela mostra a capacidade vital em mililitros enquanto o aluno sopra.",
  },
  {
    at: 0.655,
    kicker: "Visão",
    title: "A 2,5 metros da tela.",
    text: "Cobrindo um olho de cada vez, o aluno indica para onde aponta o E. A tela registra a acuidade de cada olho.",
  },
  {
    at: 0.745,
    kicker: "Postura",
    title: "De frente e de lado para a câmera.",
    text: "A visão computacional marca os pontos do corpo e aponta desvios de postura, além de medidas como ombros e quadril.",
  },
  {
    at: 0.845,
    kicker: "Resultado",
    title: "Pontuação, curva e relatório na hora.",
    text: "Ao final, a tela mostra a pontuação de saúde e a curva de crescimento. O relatório sai impresso ou pelo QR code, para a família.",
    stat: { v: "86", u: "pontuação de saúde" },
  },
  {
    at: 0.92,
    kicker: "Instalação",
    title: "Chega desmontada. Montada no local.",
    text: "Torre com tela, plataforma de medição e dossel ultrassônico são montados no local.",
  },
  {
    at: 0.985,
    kicker: "Pronta para a escola",
    title: "Pequena no espaço. Grande no cuidado.",
    text: "Ocupa uma base de 48 × 93,5 cm, funciona sem internet e guarda mais de 100 mil avaliações.",
    cta: true,
  },
];

const ANCHORS: (Anchor & { label: string; left?: boolean })[] = [
  { id: "canopy", module: "canopy", pos: [0.23, 2.09, 0.4], label: "Dossel ultrassônico" },
  { id: "tower", module: "tower", pos: [-0.21, 1.4, 0.04], label: "Torre com tela de 32″", left: true },
  { id: "base", module: "base", pos: [0.24, 0.07, 0.6], label: "Plataforma de bioimpedância" },
];

const sm = (x: number, a: number, b: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function applyKeys(state: StationState, p: number) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = sm(p, a.p, b.p);
  const L = (k: Exclude<keyof Key, "span">) => a[k] + (b[k] - a[k]) * t;
  state.rotY = L("rot");
  state.camDist = L("dist");
  state.camY = L("y");
  state.camElev = L("elev");
  state.explode = L("explode");
  state.glow = L("glow");
  state.ultra = L("ultra");
  state.camX = L("cx");
  state.span = (a.span ?? 0) + ((b.span ?? 0) - (a.span ?? 0)) * t;
  // A coreografia avança em ritmo linear dentro de cada trecho (a suavização fica na própria criança)
  let k = 0;
  while (k < ACT_TRACK.length - 2 && p > ACT_TRACK[k + 1][0]) k++;
  const [q0, a0] = ACT_TRACK[k];
  const [q1, a1] = ACT_TRACK[k + 1];
  state.act = a0 + (a1 - a0) * Math.min(1, Math.max(0, (p - q0) / (q1 - q0)));
  // Tela real da estação: segura a tela do ponto anterior até o próximo; na mesma tela, o progresso avança
  let j = 0;
  while (j < SCREEN_TRACK.length - 2 && p >= SCREEN_TRACK[j + 1][0]) j++;
  const [p0, id0, t0] = SCREEN_TRACK[j];
  const [p1, id1, t1] = SCREEN_TRACK[j + 1];
  const u = Math.min(1, Math.max(0, (p - p0) / (p1 - p0)));
  state.screen = SCREENS.indexOf(id0);
  state.screenT = id0 === id1 ? t0 + (t1 - t0) * u : t0;
}

export default function ProductStory() {
  const root = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const nodes = useRef<Record<string, HTMLElement | null>>({});
  const [tier, setTier] = useState<Tier | "pending">("pending");
  const [active, setActive] = useState(false);
  const [touch, setTouch] = useState(false);
  const state = useMemo(() => createStationState({ rotY: -2.3, rotSmooth: -2.3, camDist: 9.6, fov: 24 }), []);

  useEffect(() => {
    setTier(getTier());
    setTouch(isTouch());
  }, []);

  // A versão escolhida (3D ou estática) muda a altura da seção: as animações abaixo precisam remedir
  useEffect(() => {
    if (tier !== "pending") ScrollTrigger.refresh();
  }, [tier]);

  // No desktop o produto fica à direita do texto; no celular, centralizado (vale também ao redimensionar)
  useEffect(() => {
    const place = () => void (state.viewX = window.innerWidth > 900 ? 0.17 : 0);
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [state]);

  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setActive(e.isIntersecting), { rootMargin: "200px" });
    io.observe(root.current!);
    return () => io.disconnect();
  }, []);

  // Arrastar para girar; o giro extra volta devagar quando solta.
  // O arraste só começa depois de alguns pixels, para não roubar o clique do botão do último capítulo.
  useEffect(() => {
    const el = stage.current;
    if (!el || tier === "none") return;
    let startX = 0;
    let base = 0;
    let pointer = -1;
    let dragging = false;
    let back: gsap.core.Tween | undefined;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || !e.isPrimary) return;
      if ((e.target as Element).closest("a, button, input, select, textarea")) return;
      pointer = e.pointerId;
      startX = e.clientX;
      base = state.drag;
    };
    const end = () => {
      pointer = -1;
      if (!dragging) return;
      dragging = false;
      back = gsap.to(state, { drag: 0, duration: 2.2, delay: 1.4, ease: "power2.inOut" });
    };
    const move = (e: PointerEvent) => {
      if (e.pointerId !== pointer) return;
      if (e.pointerType === "mouse" && !(e.buttons & 1)) return end();
      const dx = e.clientX - startX;
      if (!dragging) {
        if (Math.abs(dx) < 6) return;
        dragging = true;
        back?.kill();
        el.setPointerCapture(e.pointerId);
      }
      state.drag = base + (dx / el.clientWidth) * Math.PI * 1.6;
    };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
    el.addEventListener("lostpointercapture", end);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      el.removeEventListener("lostpointercapture", end);
      back?.kill();
    };
  }, [state, tier]);

  // Quem chega pelo teclado a um capítulo (ex.: o botão do último) é levado até o trecho em que ele aparece
  useEffect(() => {
    const sec = root.current;
    if (!sec || tier === "pending" || tier === "none") return;
    const onFocus = (e: FocusEvent) => {
      const art = (e.target as Element).closest("article");
      const i = art ? [...sec.querySelectorAll("article")].indexOf(art as HTMLElement) : -1;
      if (i < 0) return;
      const y = sec.offsetTop + CHAPTERS[i].at * (sec.offsetHeight - window.innerHeight);
      if (window.__lenis) window.__lenis.scrollTo(y, { duration: 0.8 });
      else window.scrollTo(0, y);
    };
    sec.addEventListener("focusin", onFocus);
    return () => sec.removeEventListener("focusin", onFocus);
  }, [tier]);

  useGSAP(
    () => {
      if (tier === "pending" || tier === "none") return;
      const q = gsap.utils.selector(root);
      const chapters = q(`.${s.chapter}`) as HTMLElement[];
      const dots = q(`.${s.rail} li`) as HTMLElement[];
      const callouts = q(`.${s.callout}`) as HTMLElement[];
      const ctas = chapters.map((c) => c.querySelector<HTMLElement>(`.${s.cta}`));
      const fill = q(`.${s.railFill}`)[0] as HTMLElement;

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: ({ progress: p }) => {
          applyKeys(state, p);

          // Cada capítulo aparece perto do seu quadro-chave
          let current = 0;
          CHAPTERS.forEach((c, i) => {
            const next = CHAPTERS[i + 1]?.at ?? 1.2;
            const prev = CHAPTERS[i - 1]?.at ?? -0.2;
            const start = (prev + c.at) / 2;
            const end = (c.at + next) / 2;
            const w = sm(p, start, start + 0.03) * (1 - sm(p, end - 0.03, end));
            const el = chapters[i];
            el.style.opacity = String(w);
            el.style.transform = `translateY(${(1 - w) * 24}px)`;
            // Os capítulos ficam no DOM para leitores de tela; só o botão visível recebe cliques
            const cta = ctas[i];
            if (cta) cta.style.pointerEvents = w > 0.5 ? "auto" : "none";
            if (p >= start) current = i;
          });
          dots.forEach((d, i) => d.classList.toggle(s.on, i === current));
          fill.style.transform = `scaleY(${p})`;
          callouts.forEach((c) => (c.style.opacity = String(state.explode)));
        },
      });
    },
    { scope: root, dependencies: [tier] },
  );

  if (tier === "none") {
    return (
      <section id="tecnologia" className={`section ${s.static}`} aria-labelledby="story-title">
        <div className="container-wide">
          <h2 id="story-title" className="headline" data-reveal>
            Conheça a estação.
          </h2>
          <div className={s.staticGrid}>
            {[
              ["/media/station-studio.webp", "Estação de Saúde DANX em vista de três quartos"],
              ["/media/station-front.webp", "Estação vista de frente, com a tela ligada"],
              ["/media/station-side.webp", "Estação vista de lado, com o dossel avançando sobre a plataforma"],
            ].map(([src, alt]) => (
              <Image key={src} src={src} alt={alt} width={1024} height={1536} sizes="(max-width: 760px) 90vw, 30vw" />
            ))}
          </div>
          <div className={s.staticList}>
            {CHAPTERS.slice(2, 9).map((c) => (
              <div key={c.title}>
                <p className={s.kicker}>{c.kicker}</p>
                <h3>{c.title}</h3>
                <p>{c.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section ref={root} id="tecnologia" className={s.story} aria-labelledby="story-title">
      <div ref={stage} className={s.sticky}>
        <div className={s.canvas}>
          {tier !== "pending" && (
            <StationCanvas state={state} active={active} low={tier === "low"}>
              <Projector state={state} anchors={ANCHORS} nodes={nodes} />
            </StationCanvas>
          )}
        </div>

        <div className={`container-wide ${s.layer}`}>
          {CHAPTERS.map((c, i) => (
            <article key={c.title} className={s.chapter} aria-label={c.kicker}>
              <p className={s.kicker}>{c.kicker}</p>
              {i === 0 ? (
                <h2 id="story-title" className={s.title}>
                  {c.title}
                </h2>
              ) : (
                <h3 className={s.title}>{c.title}</h3>
              )}
              <p className={s.text}>{c.text}</p>
              {c.stat && (
                <p className={s.stat}>
                  <span>{c.stat.v}</span> {c.stat.u}
                  <small>Exemplo ilustrativo</small>
                </p>
              )}
              {c.cta && (
                <a className={`btn btn-primary ${s.cta}`} href="#cotacao">
                  Solicitar cotação
                </a>
              )}
            </article>
          ))}
        </div>

        <div className={s.callouts} aria-hidden="true">
          {ANCHORS.map((a) => (
            <div
              key={a.id}
              ref={(el) => void (nodes.current[a.id] = el)}
              className={`${s.callout} ${a.left ? s.left : ""}`}
            >
              <i />
              <span>{a.label}</span>
            </div>
          ))}
        </div>

        <div className={s.rail} aria-hidden="true">
          <span className={s.railTrack}>
            <span className={s.railFill} />
          </span>
          <ol>
            {CHAPTERS.map((c) => (
              <li key={c.kicker}>{c.kicker}</li>
            ))}
          </ol>
        </div>

        <p className={s.hint} aria-hidden="true">
          {touch ? "Arraste para girar" : "Clique e arraste para girar"}
        </p>
      </div>
    </section>
  );
}
