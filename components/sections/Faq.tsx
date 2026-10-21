import { faq } from "@/lib/content";
import s from "./Faq.module.css";

export default function Faq() {
  return (
    <section id="faq" className="section alt" aria-labelledby="faq-title">
      <div className="container">
        <h2 id="faq-title" className="headline-2" data-reveal>
          Perguntas frequentes.
        </h2>
        <div className={s.list}>
          {faq.map((f) => (
            <details key={f.q} className={s.item}>
              <summary>
                <span>
                  {f.q}
                  {f.tbc && <span className="tbc">Resposta a confirmar</span>}
                </span>
                <i aria-hidden="true" />
              </summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
