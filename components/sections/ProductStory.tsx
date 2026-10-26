"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getTier, isTouch, type Tier } from "@/lib/device";
import { createStationState, type StationState } from "../three/stationState";
import {
  drawScreenRegion,
  loadScreenFonts,
  SCREEN_STEPS,
  SCREENS,
  type Region,
  type ScreenId,
} from "../three/screenUi";
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
};
const KEYS: Key[] = [
  { p: 0.0, rot: -2.3, dist: 9.6, y: 1.05, elev: 0.5, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.05, rot: -0.7, dist: 6.6, y: 1.05, elev: 0.55, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Em cada etapa a estação aparece inteira; o que está na tela vem ampliado na lupa, ao lado do texto
  { p: 0.135, rot: -0.32, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.185, rot: -0.26, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Altura: ondas do sensor descem do dossel
  { p: 0.235, rot: -0.48, dist: 6.4, y: 1.12, elev: 0.3, explode: 0, glow: 0, ultra: 1, cx: 0 },
  // Composição corporal: eletrodos acesos na plataforma
  { p: 0.315, rot: -0.8, dist: 6.6, y: 1.02, elev: 0.95, explode: 0, glow: 1, ultra: 0, cx: -0.1 },
  { p: 0.335, rot: -0.74, dist: 6.5, y: 1.04, elev: 0.9, explode: 0, glow: 1, ultra: 0, cx: -0.1 },
  // Do equilíbrio à postura, a câmera gira devagar em volta da estação
  { p: 0.4, rot: -0.3, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.48, rot: -0.12, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.56, rot: 0.06, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.655, rot: 0.2, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.745, rot: 0.34, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Resultado
  { p: 0.835, rot: -0.15, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.865, rot: -0.15, dist: 6.5, y: 1.1, elev: 0.2, explode: 0, glow: 0, ultra: 0, cx: 0 },
  // Instalação: vista explodida
  { p: 0.92, rot: -0.62, dist: 9.6, y: 1.3, elev: 0.5, explode: 1, glow: 0, ultra: 0, cx: 0 },
  { p: 1.0, rot: -0.38, dist: 6.6, y: 1.05, elev: 0.55, explode: 0, glow: 0, ultra: 0, cx: 0 },
];

// Telas reais da estação ao longo da rolagem: mesma tela entre dois pontos → o progresso t avança
const SCREEN_TRACK: [number, ScreenId, number][] = [
  [0.0, "inicio", 0],
  [0.105, "inicio", 0],
  [0.14, "inicio", 1],
  [0.148, "consentimento", 0],
  [0.166, "consentimento", 1],
  [0.172, "composicao", 0],
  [0.186, "composicao", 0.2],
  [0.226, "composicao", 0.46],
  [0.27, "composicao", 0.47],
  [0.282, "composicao", 0.5],
  [0.308, "composicao", 0.95],
  [0.35, "composicao", 1],
  // Cada teste termina no meio do capítulo: o resultado fica na tela enquanto o número aparece no texto
  [0.355, "equilibrio", 0],
  [0.362, "equilibrio", 0.02],
  [0.398, "equilibrio", 1],
  [0.44, "equilibrio", 1],
  [0.445, "agilidade", 0],
  [0.478, "agilidade", 1],
  [0.52, "agilidade", 1],
  [0.525, "espirometria", 0],
  [0.556, "espirometria", 1],
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

// Lupa: o trecho de cada tela que conta a história, ampliado para ler (unidades do desenho da tela, 1080 × 1920)
const LOUPE: Record<ScreenId, Region> = {
  inicio: [240, 560, 600, 450],
  consentimento: [300, 760, 480, 360],
  composicao: [73, 230, 933, 700],
  equilibrio: [140, 600, 800, 600],
  agilidade: [194, 280, 693, 520],
  espirometria: [127, 440, 827, 620],
  visao: [330, 860, 420, 315],
  postura: [560, 680, 520, 390],
  pontuacao: [140, 250, 800, 600],
  evolucao: [0, 150, 1080, 810],
  relatorio: [0, 150, 1080, 810],
};
// Na medição da altura, a lupa fica nos números do centro do anel
const LOUPE_ALTURA: Region = [300, 410, 480, 360];

function drawLoupe(canvas: HTMLCanvasElement, state: StationState) {
  const id = SCREENS[Math.min(SCREENS.length - 1, Math.max(0, Math.round(state.screen)))];
  const steps = SCREEN_STEPS[id];
  const step = Math.round(Math.min(1, Math.max(0, state.screenT)) * steps);
  const t = steps ? step / steps : 1;
  const w = Math.round(canvas.clientWidth * Math.min(2, window.devicePixelRatio || 1));
  const h = Math.round(canvas.clientHeight * Math.min(2, window.devicePixelRatio || 1));
  const key = `${id}:${step}:${w}x${h}`;
  if (!w || !h || canvas.dataset.key === key) return;
  canvas.dataset.key = key;
  if (canvas.width !== w) canvas.width = w;
  if (canvas.height !== h) canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return;
  drawScreenRegion(g, id, t, id === "composicao" && t < 0.48 ? LOUPE_ALTURA : LOUPE[id], w, h);
}

const CHAPTERS = [
  {
    at: 0.03,
    kicker: "Conheça a estação",
    title: "Uma estação. Sete testes.",
    text: "Torre de vidro temperado, tela de 32″, dossel com sensor de altura e plataforma de bioimpedância. Role para ver cada etapa na tela da estação.",
  },
  {
    at: 0.135,
    kicker: "Identificação",
    title: "Começa com o número do aluno.",
    text: "O aluno digita o número de matrícula, e a tela exibe o aviso de coleta de dados. O consentimento dos responsáveis é combinado antes com a escola.",
    screen: "teclado da matrícula e aviso de coleta de dados.",
  },
  {
    at: 0.235,
    kicker: "Altura",
    title: "Sem régua, sem toque.",
    text: "O sensor ultrassônico no topo mede a altura em segundos. Cada avaliação vira um ponto na curva de crescimento.",
    screen: "a altura é a primeira medida da análise corporal.",
    stat: { v: "148", u: "cm" },
  },
  {
    at: 0.315,
    kicker: "Composição corporal",
    title: "Quatro eletrodos sob os pés.",
    text: "Placas de aço inox 304 e corrente de baixa intensidade, abaixo de 280 µA. A bioimpedância separa água, proteína, gordura e minerais.",
    screen: "o anel com os indicadores do corpo e os valores medidos.",
    stat: { v: "21,3%", u: "de gordura" },
  },
  {
    at: 0.4,
    kicker: "Equilíbrio",
    title: "Uma perna só, olhos fechados.",
    text: "Em uma perna só, mãos juntas e olhos fechados, por dez segundos sobre a plataforma. A tela mostra a capacidade de equilíbrio.",
    stat: { v: "88%", u: "capacidade de equilíbrio" },
    screen: "cronômetro de 10 segundos e a capacidade de equilíbrio.",
  },
  {
    at: 0.48,
    kicker: "Agilidade",
    title: "Cinco toques, contra o relógio.",
    text: "O botão acende cinco vezes na tela e o aluno toca o mais rápido que puder. O tempo médio de reação sai em milissegundos, já com a classificação.",
    stat: { v: "412", u: "ms de tempo médio de reação" },
    screen: "o botão que acende e o tempo médio de reação.",
  },
  {
    at: 0.56,
    kicker: "Capacidade pulmonar",
    title: "Um sopro no espirômetro.",
    text: "Espirômetro sem fio com bocal descartável. A tela mostra a capacidade vital em mililitros enquanto o aluno sopra.",
    stat: { v: "1.650", u: "mL de capacidade vital" },
    screen: "a capacidade vital subindo enquanto o aluno sopra.",
  },
  {
    at: 0.655,
    kicker: "Acuidade visual",
    title: "A 2,5 metros da tela.",
    text: "Cobrindo um olho de cada vez, o aluno indica para onde aponta o E. A tela registra a acuidade de cada olho.",
    screen: "o E em tamanhos decrescentes, um olho de cada vez.",
  },
  {
    at: 0.745,
    kicker: "Postura",
    title: "De frente e de lado.",
    text: "A visão computacional marca os pontos do corpo e aponta sinais de atenção postural, com medidas como a inclinação dos ombros e do quadril.",
    screen: "os pontos do corpo, de frente e de lado.",
  },
  {
    at: 0.845,
    kicker: "Resultado",
    title: "Resultado na hora.",
    text: "A tela mostra a pontuação de saúde e a curva de crescimento. O relatório sai impresso ou pelo QR code.",
    stat: { v: "86", u: "pontuação de saúde" },
    screen: "pontuação de saúde, curva de crescimento e relatório.",
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
    text: "Pronta para receber a escola inteira, turma após turma.",
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
  const L = (k: keyof Key) => a[k] + (b[k] - a[k]) * t;
  state.rotY = L("rot");
  state.camDist = L("dist");
  state.camY = L("y");
  state.camElev = L("elev");
  state.explode = L("explode");
  state.glow = L("glow");
  state.ultra = L("ultra");
  state.camX = L("cx");
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
      const loupes = chapters.map((c) => c.querySelector<HTMLCanvasElement>("canvas[data-loupe]"));
      let cur = 0;
      const paintLoupe = () => {
        const lc = loupes[cur];
        if (lc) drawLoupe(lc, state);
      };
      // Com as fontes da tela carregadas, a lupa é redesenhada com elas
      loadScreenFonts().then(() => {
        loupes.forEach((l) => l && delete l.dataset.key);
        paintLoupe();
      });

      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: ({ progress: p }) => {
          applyKeys(state, p);

          // Cada capítulo aparece perto do seu quadro-chave
          let current = 0;
          let withLoupe = 0;
          CHAPTERS.forEach((c, i) => {
            const next = CHAPTERS[i + 1]?.at ?? 1.2;
            const prev = CHAPTERS[i - 1]?.at ?? -0.2;
            const start = (prev + c.at) / 2;
            const end = (c.at + next) / 2;
            const w = sm(p, start, start + 0.018) * (1 - sm(p, end - 0.018, end));
            if (c.screen) withLoupe += w;
            const el = chapters[i];
            el.style.opacity = String(w);
            el.style.transform = `translateY(${(1 - w) * 24}px)`;
            // Os capítulos ficam no DOM para leitores de tela; só o botão visível recebe cliques
            const cta = ctas[i];
            if (cta) cta.style.pointerEvents = w > 0.5 ? "auto" : "none";
            if (p >= start) current = i;
          });
          dots.forEach((d, i) => d.classList.toggle(s.on, i === current));
          // No celular, nas etapas com lupa, a estação vai para a esquerda e a lupa fica ao lado dela
          if (window.innerWidth <= 900) state.viewX = -0.2 * withLoupe;
          cur = current;
          paintLoupe();
          fill.style.transform = `scaleY(${p})`;
          // Rótulos só com a estação aberta: somem por inteiro antes e depois da vista explodida
          const lab = sm(state.explode, 0.6, 1);
          callouts.forEach((c) => (c.style.opacity = String(lab)));
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
                </p>
              )}
              {c.screen && (
                <figure className={s.loupe}>
                  <canvas data-loupe aria-hidden="true" />
                  <figcaption>
                    <b>Na tela:</b> {c.screen}
                  </figcaption>
                </figure>
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

        <p className={s.sample}>
          <span>Números de um aluno de exemplo</span>
          <span className={s.sep}> · </span>
          <a href="#para-quem">Pular a apresentação</a>
        </p>
        <p className={s.hint} aria-hidden="true">
          {touch ? "Arraste para girar" : "Clique e arraste para girar"}
        </p>
      </div>
    </section>
  );
}
