import s from "./Numbers.module.css";

const NUMBERS = [
  { k: "32″", v: "Tela Full HD sensível ao toque" },
  { k: "2,10 m", v: "de altura, com dossel ultrassônico" },
  { k: "<280 µA", v: "de corrente na bioimpedância, imperceptível" },
  { k: "100 mil+", v: "avaliações salvas no próprio equipamento" },
  { k: "3 a 99", v: "anos: faixa etária de uso do equipamento" },
  { k: "62", v: "indicadores em cada avaliação" },
];

export default function Numbers() {
  return (
    <section className={`section dark ${s.numbers}`} aria-labelledby="numeros-title">
      <div className="container-wide">
        <h2 id="numeros-title" className="headline" data-reveal>
          Em números.
        </h2>
        <dl className={s.grid}>
          {NUMBERS.map((n) => (
            <div key={n.k} data-reveal>
              <dt className={s.k}>{n.k}</dt>
              <dd className={s.v}>{n.v}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
