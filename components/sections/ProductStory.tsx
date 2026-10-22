"use client";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";
import { getTier, isTouch, type Tier } from "@/lib/device";
import { createStationState, type StationState } from "../three/stationState";
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
  { p: 0.09, rot: -0.7, dist: 6.6, y: 1.05, elev: 0.55, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.24, rot: -0.42, dist: 3.4, y: 1.78, elev: 0.15, explode: 0, glow: 0, ultra: 1, cx: 0 },
  { p: 0.4, rot: -0.95, dist: 3.5, y: 0.28, elev: 1.0, explode: 0, glow: 1, ultra: 0, cx: -0.12 },
  { p: 0.57, rot: -0.12, dist: 2.25, y: 1.42, elev: 0.05, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.73, rot: -0.12, dist: 2.25, y: 1.42, elev: 0.05, explode: 0, glow: 0, ultra: 0, cx: 0 },
  { p: 0.86, rot: -0.62, dist: 9.6, y: 1.3, elev: 0.5, explode: 1, glow: 0, ultra: 0, cx: 0 },
  { p: 1.0, rot: -0.38, dist: 6.6, y: 1.05, elev: 0.55, explode: 0, glow: 0, ultra: 0, cx: 0 },
];

const CHAPTERS = [
  {
    at: 0.06,
    kicker: "Conheça a estação",
    title: "Uma estação. Sete avaliações.",
    text: "Torre de vidro temperado, tela de 32″, dossel de medição e plataforma de bioimpedância. Role para ver cada parte em ação.",
  },
  {
    at: 0.24,
    kicker: "Altura",
    title: "Sem régua, sem toque.",
    text: "O sensor ultrassônico no topo mede a altura em segundos. Cada avaliação vira um ponto na curva de crescimento.",
    stat: { v: "148", u: "cm" },
  },
  {
    at: 0.4,
    kicker: "Composição corporal",
    title: "Uma corrente que ninguém sente.",
    text: "Quatro eletrodos de aço inox 304 e corrente abaixo de 280 µA. A bioimpedância separa água, proteína, gordura e minerais.",
    stat: { v: "21,3%", u: "de gordura" },
  },
  {
    at: 0.62,
    kicker: "A tela",
    title: "Cada teste, guiado na tela e por voz.",
    text: "Postura por visão computacional, equilíbrio, reação, fôlego e visão. O resultado aparece na hora, na tela de 32 polegadas.",
  },
  {
    at: 0.84,
    kicker: "Instalação",
    title: "Chega desmontada. Montada no local.",
    text: "Torre com tela, plataforma de medição e dossel ultrassônico são montados no local.",
  },
  {
    at: 0.97,
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
  const L = (k: keyof Key) => a[k] + (b[k] - a[k]) * t;
  state.rotY = L("rot");
  state.camDist = L("dist");
  state.camY = L("y");
  state.camElev = L("elev");
  state.explode = L("explode");
  state.glow = L("glow");
  state.ultra = L("ultra");
  state.camX = L("cx");
  // Na aproximação da tela, as telas se alternam: postura, equilíbrio, crescimento
  state.screen =
    p > 0.5 && p < 0.79 ? 2 + Math.min(2, Math.floor(sm(p, 0.55, 0.76) * 3)) : p >= 0.37 && p <= 0.5 ? 1 : 0;
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
            {CHAPTERS.slice(1, 5).map((c) => (
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
