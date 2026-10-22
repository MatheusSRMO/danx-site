import Image from "next/image";
import { management } from "@/lib/content";
import s from "./Management.module.css";

// Dados fictícios, só para ilustrar o painel da gestão.
const BY_GRADE = [
  { g: "1º", v: 9 },
  { g: "2º", v: 11 },
  { g: "3º", v: 12 },
  { g: "4º", v: 14 },
  { g: "5º", v: 17 },
  { g: "6º", v: 21 },
  { g: "7º", v: 24 },
  { g: "8º", v: 26 },
  { g: "9º", v: 23 },
];

function Dashboard() {
  const max = 30;
  return (
    <div
      className={s.window}
      role="img"
      aria-label="Exemplo de painel da gestão com dados fictícios: alunos avaliados, escolas, avaliações no ano e percentual de alunos com sinais de atenção postural por ano escolar, que cresce do 1º ao 8º ano"
    >
      <div className={s.chrome} aria-hidden="true">
        <span />
        <span />
        <span />
        <em>Painel da gestão</em>
      </div>
      <div className={s.body} aria-hidden="true">
        <div className={s.filters}>
          <span>Rede municipal ▾</span>
          <span>Ano letivo 2026 ▾</span>
          <span>Todas as escolas ▾</span>
        </div>
        <div className={s.kpis}>
          <div>
            <p>Alunos avaliados</p>
            <b className="num">1.284</b>
          </div>
          <div>
            <p>Escolas</p>
            <b className="num">12</b>
          </div>
          <div>
            <p>Avaliações no ano</p>
            <b className="num">2.410</b>
          </div>
        </div>
        <div className={s.chart}>
          <p className={s.chartTitle}>Alunos com sinais de atenção postural, por ano escolar (%)</p>
          <div className={s.bars}>
            {BY_GRADE.map((b) => (
              <div key={b.g} className={s.bar} title={`${b.g} ano: ${b.v}%`}>
                <span className={s.barLabel}>{b.v}</span>
                <i style={{ height: `${(b.v / max) * 100}%` }} />
                <em>{b.g}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
      <p className={s.fake}>Dados fictícios, apenas para ilustração</p>
    </div>
  );
}

export default function Management() {
  return (
    <section className="section alt" aria-labelledby="gestao-title">
      <div className="container-wide">
        <div className={s.head}>
          <h2 id="gestao-title" className="headline pre-line" data-reveal>
            Dados para decidir.
            <br />
            <span className="grad-text">Não só para guardar.</span>
          </h2>
          <p className="lead" data-reveal>
            {management.lead}
          </p>
        </div>

        <div className={s.dash} data-reveal>
          <Dashboard />
        </div>

        <div className={s.split}>
          <div className={s.photo} data-reveal>
            <Image
              src="/media/gestao.webp"
              alt="Secretária de educação e diretor de escola analisando um painel de indicadores no notebook"
              fill
              sizes="(max-width: 900px) 96vw, 620px"
            />
          </div>
          <ul className={s.benefits}>
            {management.benefits.map((b) => (
              <li key={b.title} data-reveal>
                <h3>{b.title}</h3>
                <p>{b.text}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={s.programs} data-reveal>
          <h3>Onde a estação entra na rotina da rede</h3>
          <ul>
            {management.programs.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
