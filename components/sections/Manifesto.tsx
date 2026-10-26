"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "@/lib/gsap";
import { manifesto } from "@/lib/content";
import s from "./Manifesto.module.css";

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);
  const words = manifesto.title.split(" ");

  useGSAP(
    () => {
      if (document.documentElement.classList.contains("reduced")) return;
      const q = gsap.utils.selector(root);
      gsap.fromTo(
        q(`.${s.word}`),
        // Mesmo antes de acender, a palavra mantém contraste de leitura (≈ 4,5:1)
        { opacity: 0.6 },
        {
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: { trigger: q(`.${s.text}`)[0], start: "top 80%", end: "bottom 45%", scrub: true },
        },
      );
      q("[data-stat]").forEach((el) => {
        const node = el as HTMLElement;
        const target = parseFloat(node.dataset.stat!);
        const dec = parseInt(node.dataset.dec!, 10);
        const o = { v: 0 };
        const fmt = (v: number) =>
          v.toLocaleString("pt-BR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
        // Conta a partir do zero só se ainda está fora da tela; quem já o vê (ou não roda JS) fica com o valor final
        if (node.getBoundingClientRect().top < window.innerHeight) return;
        node.textContent = fmt(0);
        gsap.to(o, {
          v: target,
          duration: 1.6,
          ease: "power3.out",
          scrollTrigger: { trigger: node, start: "top bottom", once: true },
          onUpdate: () => void (node.textContent = fmt(o.v)),
        });
      });
    },
    { scope: root },
  );

  return (
    <section ref={root} className={`section ${s.manifesto}`} aria-labelledby="manifesto-title">
      <div className="container-wide">
        <p className="eyebrow eyebrow-accent">Por que na escola</p>
        <h2 id="manifesto-title" className={s.text}>
          {words.map((w, i) => (
            <span key={i} className={s.word}>
              {w}{" "}
            </span>
          ))}
        </h2>
        <p className={`lead ${s.sub}`} data-reveal>
          {manifesto.text}
        </p>
        <div className={s.stats}>
          {manifesto.stats.map((st) => (
            <figure key={st.source} className={s.stat} data-reveal>
              <p className={s.value}>
                <span data-stat={st.value} data-dec={st.decimals}>
                  {st.value.toLocaleString("pt-BR", { minimumFractionDigits: st.decimals })}
                </span>
                <small>{st.suffix}</small>
              </p>
              <figcaption>
                <p>{st.label}</p>
                <p className={s.link}>{st.link}</p>
                <cite>Fonte: {st.source}</cite>
              </figcaption>
            </figure>
          ))}
        </div>
        <div className={s.bridge} data-reveal>
          {manifesto.bridge.map((b) => (
            <p key={b}>{b}</p>
          ))}
        </div>

      </div>
    </section>
  );
}
