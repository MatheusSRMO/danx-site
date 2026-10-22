import Image from "next/image";
import { audience } from "@/lib/content";
import s from "./Audience.module.css";

export default function Audience() {
  return (
    <section id="para-quem" className="section" aria-labelledby="para-quem-title">
      <div className="container-wide">
        <div className={s.head}>
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
              <a className="link" href="#cotacao">
                Solicitar cotação
              </a>
            </article>
          ))}
        </div>
        <div className={s.banner} data-reveal>
          <div className={s.bannerText}>
            <h3>{audience.exclusive.title}</h3>
            <p>{audience.exclusive.text}</p>
            <a className="btn btn-primary" href="#cotacao">
              Solicitar cotação
            </a>
          </div>
          <div className={s.bannerMedia}>
            <Image
              src="/media/station-studio.webp"
              alt=""
              width={1024}
              height={1536}
              sizes="(max-width: 900px) 70vw, 420px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
