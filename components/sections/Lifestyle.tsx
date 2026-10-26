"use client";
import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import s from "./Lifestyle.module.css";

const POINTS = [
  {
    t: "Pouco espaço no chão",
    d: "Ocupa só 48 × 93,5 cm. Reserve 2,5 m à frente da tela apenas para o teste de visão.",
  },
  {
    t: "Avalia mesmo sem internet",
    d: "Guarda mais de 100 mil avaliações e sincroniza com a nuvem quando a conexão volta.",
  },
  {
    t: "Guiada na tela e por voz",
    d: "O aluno sobe na plataforma e segue as instruções da própria estação. O relatório sai na hora.",
  },
];

export default function Lifestyle() {
  const root = useRef<HTMLElement>(null);
  useGSAP(
    () => {
      if (document.documentElement.classList.contains("reduced")) return;
      const q = gsap.utils.selector(root);
      const frame = q(`.${s.frame}`)[0];
      // A imagem se abre a partir de um recorte central enquanto aproxima
      gsap.fromTo(
        frame,
        { clipPath: "inset(14% 18% 14% 18% round 40px)" },
        {
          clipPath: "inset(0% 0% 0% 0% round 28px)",
          ease: "none",
          scrollTrigger: { trigger: frame, start: "top 90%", end: "center 55%", scrub: true },
        },
      );
      gsap.fromTo(
        q(`.${s.frame} img`),
        { scale: 1.22 },
        {
          scale: 1,
          ease: "none",
          scrollTrigger: { trigger: frame, start: "top bottom", end: "bottom 40%", scrub: true },
        },
      );
    },
    { scope: root },
  );
  return (
    <section ref={root} className="section" aria-labelledby="rotina-title">
      <div className="container-wide">
        <h2 id="rotina-title" className="headline" data-reveal>
          Feita para a rotina da escola.
        </h2>
        <p className="lead" data-reveal>
          Pouco espaço, uso intenso, turma após turma. A estação se encaixa no que a escola já faz.
        </p>
      </div>
      <div className={`container-wide ${s.wrap}`}>
        <div className={s.frame}>
          <Image
            src="/media/test-balance.webp"
            alt="Adolescente em um pé só, de olhos fechados e mãos juntas, sobre a plataforma da estação no teste de equilíbrio"
            fill
            sizes="(max-width: 760px) 96vw, 560px"
          />
          <span className="illus">Imagem ilustrativa</span>
        </div>
        <ul className={s.points}>
          {POINTS.map((p) => (
            <li key={p.t} data-reveal>
              <h3>{p.t}</h3>
              <p>{p.d}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
