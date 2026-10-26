"use client";
import { getImageProps } from "next/image";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { hero, site } from "@/lib/content";
import s from "./Hero.module.css";

// Uma foto larga no desktop e uma vertical no celular: com <picture>, cada aparelho baixa só a sua
const ALT =
  "Aluno descalço sobre a plataforma da Estação de Saúde DANX em um ginásio escolar, ao lado da professora com um tablet";
const shared = { alt: ALT, sizes: "100vw", loading: "eager", fetchPriority: "high" } as const;
// Na exportação estática (imagens sem otimização) não há srcSet: usa o próprio arquivo
const wide = getImageProps({ ...shared, src: "/media/hero-school.webp", width: 1536, height: 1024 }).props;
const wideSet = wide.srcSet ?? wide.src;
const { srcSet: tallSrcSet, ...tallImg } = getImageProps({
  ...shared,
  src: "/media/hero-school-tall.webp",
  width: 1024,
  height: 1536,
}).props;
const tallSet = tallSrcSet ?? tallImg.src;

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
      // Ao rolar, a cena aproxima devagar e o texto sobe (na foto, para não brigar com a entrada do bloco)
      gsap.to(q(`.${s.img}`), {
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
        <picture>
          <source media="(max-width: 900px)" srcSet={tallSet} sizes="100vw" />
          <source media="(min-width: 901px)" srcSet={wideSet} sizes="100vw" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img {...tallImg} className={s.img} alt={ALT} />
        </picture>
        <span className="illus">Imagem ilustrativa</span>
      </div>
      <div className={`container-wide ${s.copy}`}>
        <h1 id="hero-title" className={s.product} data-in>
          {hero.product}
        </h1>
        <p className={s.title} data-in>
          {hero.title} <span className="grad-text">{hero.titleEnd}</span>
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
        <p className={s.talk} data-in>
          Prefere conversar?{" "}
          <a
            href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Olá! Quero conhecer a Estação de Saúde DANX.")}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            WhatsApp {site.phone}
          </a>
        </p>
      </div>
    </section>
  );
}
