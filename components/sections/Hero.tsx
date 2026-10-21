"use client";
import Image from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hero } from "@/lib/content";
import s from "./Hero.module.css";

export default function Hero() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      if (document.documentElement.classList.contains("reduced")) return;
      const q = gsap.utils.selector(root);
      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(q(`.${s.media}`), { opacity: 0, scale: 1.08, duration: 2.2 }, 0)
        .from(q("[data-in]"), { opacity: 0, y: 28, duration: 1.1, stagger: 0.1 }, 0.3);
      // Ao rolar, a cena aproxima devagar e o texto sobe
      gsap.to(q(`.${s.media}`), {
        scale: 1.07,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "bottom top", scrub: true },
      });
      gsap.to(q(`.${s.copy}`), {
        yPercent: -14,
        opacity: 0,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "top top", end: "75% top", scrub: true },
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} id="topo" className={s.hero} aria-labelledby="hero-title">
      <div className={s.media}>
        <Image
          className={s.wide}
          src="/media/hero-school.webp"
          alt="Aluno descalço sobre a plataforma da Estação de Saúde DANX em um ginásio escolar, ao lado da professora com um tablet"
          fill
          priority
          sizes="100vw"
        />
        <Image className={s.tall} src="/media/hero-school-tall.webp" alt="" width={1024} height={1536} priority sizes="100vw" />
      </div>
      <div className={`container-wide ${s.copy}`}>
        <h1 id="hero-title" className={s.product} data-in>
          {hero.product}
        </h1>
        <p className={s.title} data-in>
          Saúde em <span className="grad-text">alta definição.</span>
        </p>
        <p className={`lead ${s.lead}`} data-in>
          {hero.lead}
        </p>
        <div className={s.ctas} data-in>
          <a className="btn btn-primary" href="#cotacao">
            Solicitar cotação
          </a>
          <a className="link" href="#tecnologia">
            Conheça a estação
          </a>
        </div>
        <p className={s.note} data-in>
          {hero.note}
        </p>
      </div>
    </section>
  );
}
