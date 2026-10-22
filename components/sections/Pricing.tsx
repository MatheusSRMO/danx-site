import Image from "next/image";
import { pricing, site } from "@/lib/content";
import s from "./Pricing.module.css";

const Check = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5 10.5l3.2 3.2L15 7" />
  </svg>
);

export default function Pricing() {
  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Olá! Quero saber o valor e as condições da Estação de Saúde DANX.")}`;
  return (
    <section id="investimento" className="section alt" aria-labelledby="preco-kicker preco-title">
      <div className="container-wide">
        <div className={s.box}>
          <div className={s.media} data-reveal>
            <Image
              src="/media/station-studio.webp"
              alt="Estação de Saúde DANX em vista de três quartos"
              width={1024}
              height={1536}
              sizes="(max-width: 900px) 70vw, 460px"
            />
          </div>
          <div className={s.info}>
            <p id="preco-kicker" className={s.kicker}>
              Investimento
            </p>
            <h2 id="preco-title" className={s.name}>
              Estação de Saúde DANX
            </h2>
            <p className={s.price}>
              <span className="num">{pricing.price.value}</span>
              {pricing.price.tbc && <span className="tbc">Preço a confirmar</span>}
            </p>
            <p className={s.per}>{pricing.price.per}</p>
            <p className={s.lead}>{pricing.lead}</p>

            <h3 className={s.h3}>Condições comerciais</h3>
            <ul className={s.conditions}>
              {pricing.conditions.map((c) => (
                <li key={c.title}>
                  <b>
                    {c.title}
                    {c.tbc && <span className="tbc">A confirmar</span>}
                  </b>
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>

            <h3 className={s.h3}>O que está incluído</h3>
            <ul className={s.includes}>
              {pricing.includes.map((i) => (
                <li key={i.text}>
                  <Check />
                  {i.text}
                  {i.tbc && <span className="tbc">A confirmar</span>}
                </li>
              ))}
            </ul>

            <div className={s.ctas}>
              <a className="btn btn-primary" href="#cotacao">
                Solicitar cotação
              </a>
              <a className="link" href={wa} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
