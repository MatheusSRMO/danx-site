import { audience } from "@/lib/content";
import s from "./Audience.module.css";

export default function Audience() {
  return (
    <section id="para-quem" className="section" aria-labelledby="para-quem-title">
      <div className="container-wide">
        <div className={s.head}>
          <p className="eyebrow eyebrow-accent">Para quem</p>
          <h2 id="para-quem-title" className="headline" data-reveal>
            {audience.title}
          </h2>
          <p className="lead" data-reveal>
            {audience.lead}
          </p>
        </div>
        <div className={s.cards}>
          {audience.segments.map((seg) => (
            <article key={seg.title} className={s.card} data-reveal>
              <p className={s.sub}>{seg.sub}</p>
              <h3>{seg.title}</h3>
              <p className={s.text}>{seg.text}</p>
              <a className="link" href="#cotacao" data-tipo={seg.tipo}>
                {seg.cta}
              </a>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
