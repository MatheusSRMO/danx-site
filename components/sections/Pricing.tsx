import Image from "next/image";
import { docs, pricing, REVISAO, site } from "@/lib/content";
import s from "./Pricing.module.css";

const Check = () => (
  <svg viewBox="0 0 20 20" aria-hidden="true">
    <path d="M5 10.5l3.2 3.2L15 7" />
  </svg>
);

export default function Pricing() {
  const wa = `https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Olá! Quero saber o valor e as condições da Estação de Saúde DANX.")}`;
  // Sem preço confirmado, a produção mostra "sob proposta" e só lista os temas da proposta (sem afirmar o que inclui)
  const pending = pricing.price.tbc && !REVISAO;
  const conditions = pricing.conditions.filter((c) => REVISAO || !c.tbc);
  const includesPending = !REVISAO && pricing.includes.every((i) => i.tbc);
  return (
    <section id="como-comprar" className="section alt" aria-labelledby="preco-kicker preco-title">
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
              Como comprar
            </p>
            <h2 id="preco-title" className={s.name}>
              {pending ? pricing.pending.title : "Estação de Saúde DANX"}
            </h2>
            {pending ? null : (
              <>
                <p className={s.price}>
                  <span className="num">{pricing.price.value}</span>
                  {pricing.price.tbc && REVISAO && <span className="tbc">Preço a confirmar</span>}
                </p>
                <p className={s.per}>{pricing.price.per}</p>
              </>
            )}
            <p className={s.lead}>{pending ? pricing.pending.lead : pricing.lead}</p>

            {conditions.length > 0 && (
              <>
                <h3 className={s.h3}>Condições comerciais</h3>
                <ul className={s.conditions}>
                  {conditions.map((c) => (
                    <li key={c.title}>
                      <b>
                        {c.title}
                        {c.tbc && REVISAO && <span className="tbc">A confirmar</span>}
                      </b>
                      <span>{c.text}</span>
                    </li>
                  ))}
                </ul>
              </>
            )}

            <h3 className={s.h3}>{includesPending ? pricing.pending.includesTitle : "O que está incluído"}</h3>
            <ul className={`${s.includes} ${includesPending ? s.topics : ""}`}>
              {pricing.includes.map((i) => (
                <li key={i.text}>
                  {!includesPending && <Check />}
                  {i.text}
                  {i.tbc && REVISAO && <span className="tbc">A confirmar</span>}
                </li>
              ))}
            </ul>

            <h3 className={s.h3}>Como é a compra</h3>
            <ol className={s.steps}>
              {pricing.steps.map((st) => (
                <li key={st.title}>
                  <b>{st.title}</b>
                  <span>{st.text}</span>
                </li>
              ))}
            </ol>

            <div className={s.ctas}>
              <a className="btn btn-primary" href="#cotacao">
                Solicitar cotação
              </a>
              <a className="link" href={wa} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
            </div>
          </div>
          <div className={s.docs}>
            <div>
              <h3 className={s.h3}>Documentos para o processo de compra</h3>
              <p>A cotação pode vir acompanhada de:</p>
              <ul>
                {docs
                  .filter((d) => REVISAO || !d.hide)
                  .map((d) => (
                    <li key={d.title}>
                      {d.title}
                      {d.tbc && REVISAO && <span className="tbc">A confirmar</span>}
                    </li>
                  ))}
              </ul>
            </div>
            <a className="btn btn-secondary" href="#cotacao" data-doc="todos">
              Solicitar cotação com documentos
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
