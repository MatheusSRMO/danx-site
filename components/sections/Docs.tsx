import { docs } from "@/lib/content";
import s from "./Docs.module.css";

export default function Docs() {
  return (
    <section className="section" aria-labelledby="docs-title">
      <div className="container">
        <h2 id="docs-title" className="headline-2" data-reveal>
          Documentos para gestores.
        </h2>
        <p className="lead" data-reveal>
          O que o processo de compra costuma pedir, reunido em um só lugar.
        </p>
        <ul className={s.list}>
          {docs.map((d) => (
            <li key={d.title} data-reveal>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M7 3h7l5 5v13H7z" />
                <path d="M14 3v5h5M10 13h6M10 17h6" />
              </svg>
              <div>
                <h3>{d.title}</h3>
                <p>{d.text}</p>
              </div>
              <span className={s.status}>{d.tbc ? <span className="tbc">A confirmar</span> : "Em breve"}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
