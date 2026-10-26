import Image from "next/image";
import SpecGroups from "./SpecGroups";
import s from "./Specs.module.css";

export default function Specs() {
  return (
    <section id="especificacoes" className="section" aria-labelledby="specs-title">
      <div className="container-wide">
        <p className="eyebrow eyebrow-accent">Especificações</p>
        <h2 id="specs-title" className="headline-2" data-reveal>
          Sete testes em uma estação de 2,1 m.
        </h2>

        <div className={s.dims} data-reveal>
          <figure className={`${s.fig} ${s.front}`}>
            <Image
              src="/media/station-front.webp"
              alt="Estação vista de frente"
              width={1024}
              height={1536}
              sizes="(max-width: 760px) 44vw, 300px"
            />
            <span className={s.vLine} aria-hidden="true" />
            <span className={s.vLabel} aria-hidden="true">
              2.100 mm
            </span>
            <span className={s.hLine} aria-hidden="true" />
            <span className={s.hLabel} aria-hidden="true">
              480 mm
            </span>
            <figcaption className="sr-only">Altura de 2.100 mm e largura de 480 mm</figcaption>
          </figure>
          <figure className={`${s.fig} ${s.side}`}>
            <Image
              src="/media/station-side.webp"
              alt="Estação vista de lado"
              width={1024}
              height={1536}
              sizes="(max-width: 760px) 44vw, 300px"
            />
            <span className={s.hLine} aria-hidden="true" />
            <span className={s.hLabel} aria-hidden="true">
              935 mm
            </span>
            <figcaption className="sr-only">Profundidade de 935 mm</figcaption>
          </figure>
        </div>

        <SpecGroups />
        <a className={`btn btn-secondary ${s.more}`} href="#cotacao" data-doc="Ficha técnica">
          Pedir a ficha técnica completa
        </a>
      </div>
    </section>
  );
}
