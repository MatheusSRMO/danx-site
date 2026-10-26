import { management } from "@/lib/content";
import s from "./Management.module.css";

// Dados fictícios, só para ilustrar o painel da gestão (sem tendência, para não sugerir um resultado real).
const BY_GRADE = [
  { g: "1º", v: 14 },
  { g: "2º", v: 11 },
  { g: "3º", v: 16 },
  { g: "4º", v: 13 },
  { g: "5º", v: 18 },
  { g: "6º", v: 12 },
  { g: "7º", v: 15 },
  { g: "8º", v: 17 },
  { g: "9º", v: 13 },
];

function Dashboard() {
  const max = 30;
  const peak = Math.max(...BY_GRADE.map((b) => b.v));
  return (
    <div
      className={s.window}
      role="img"
      aria-label="Exemplo de painel da gestão com dados fictícios: alunos avaliados, escolas, avaliações no ano e percentual de alunos com sinais de atenção postural por ano escolar"
    >
      <div className={s.chrome} aria-hidden="true">
        <span />
        <span />
        <span />
        <em>Painel da gestão</em>
        <b className={s.sample}>Exemplo · dados fictícios</b>
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
              <div key={b.g} className={`${s.bar} ${b.v === peak ? s.peak : ""}`} title={`${b.g} ano: ${b.v}%`}>
                <span className={s.barLabel}>{b.v}</span>
                <i style={{ height: `${(b.v / max) * 100}%` }} />
                <em>{b.g}</em>
              </div>
            ))}
          </div>
        </div>
      </div>
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
          <p className={s.reading}>
            Exemplo de leitura: o painel mostra em quais anos há mais alunos com sinais de atenção postural, para a
            escola ou a rede priorizar as ações.
          </p>
        </div>

        <div className={s.split}>
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
          <h3>Onde a estação entra na rotina da escola e da rede</h3>
          <ul>
            {management.programs.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
          <a className="btn btn-primary" href="#cotacao">
            Solicitar cotação
          </a>
        </div>
      </div>
    </section>
  );
}
