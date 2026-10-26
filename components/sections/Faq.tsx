import { faq, REVISAO, site } from "@/lib/content";
import s from "./Faq.module.css";

export default function Faq() {
  return (
    <section id="faq" className="section alt" aria-labelledby="faq-title">
      <div className={`container-wide ${s.wrap}`}>
        <p className="eyebrow eyebrow-accent">Dúvidas</p>
        <h2 id="faq-title" className="headline-2" data-reveal>
          Perguntas frequentes.
        </h2>
        <div className={s.list}>
          {faq
            .filter((f) => REVISAO || !f.tbc || f.pub)
            .map((f) => (
              <details
                key={f.q}
                id={"id" in f ? f.id : undefined}
                open={"open" in f ? f.open : undefined}
                className={s.item}
              >
                <summary>
                  <span>
                    {f.q}
                    {f.tbc && REVISAO && <span className="tbc">Resposta a confirmar</span>}
                  </span>
                  <i aria-hidden="true" />
                </summary>
                <p>{f.tbc && !REVISAO ? f.pub : f.a}</p>
              </details>
            ))}
        </div>
        {!REVISAO && (
          <p className={s.more}>
            Garantia e manutenção constam da proposta formal. Outras dúvidas? Fale com a nossa equipe pelo{" "}
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
              WhatsApp {site.phone.replace(" ", "\u00a0")}
            </a>
            .
          </p>
        )}
      </div>
    </section>
  );
}
