import { faq, REVISAO, site } from "@/lib/content";
import s from "./Faq.module.css";

export default function Faq() {
  return (
    <section id="faq" className="section alt" aria-labelledby="faq-title">
      <div className="container">
        <h2 id="faq-title" className="headline-2" data-reveal>
          Perguntas frequentes.
        </h2>
        <div className={s.list}>
          {faq
            .filter((f) => REVISAO || !f.tbc || f.pub)
            .map((f) => (
              <details key={f.q} className={s.item}>
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
            Dúvidas sobre compra pública, garantia ou manutenção? Fale com a nossa equipe pelo{" "}
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
              WhatsApp {site.phone}
            </a>
            .
          </p>
        )}
      </div>
    </section>
  );
}
