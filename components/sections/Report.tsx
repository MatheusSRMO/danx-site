import Image from "next/image";
import { report } from "@/lib/content";
import Insights from "./Insights";
import s from "./Report.module.css";

function Rings() {
  const rings = [
    { r: 54, p: 0.86, c: "#1f6fd8" },
    { r: 40, p: 0.72, c: "#0e979a" },
    { r: 26, p: 0.6, c: "#30a14e" },
  ];
  return (
    <svg viewBox="0 0 128 128" className={s.rings} aria-hidden="true">
      {rings.map((g) => (
        <g key={g.r}>
          <circle cx={64} cy={64} r={g.r} stroke={g.c} strokeOpacity={0.16} />
          <circle cx={64} cy={64} r={g.r} stroke={g.c} pathLength={1} strokeDasharray={`${g.p} 1`} />
        </g>
      ))}
    </svg>
  );
}

// Prévia da folha A4, com os mesmos números do aluno de exemplo (decorativa: o resumo está no aria-label)
function A4() {
  return (
    <div
      className={s.a4}
      role="img"
      aria-label="Prévia do relatório impresso em A4 do aluno de exemplo: pontuação de saúde 86, composição corporal, curva de crescimento, sinais de atenção postural e resultados dos testes"
    >
      <div className={s.a4Head} aria-hidden="true">
        <b>Relatório de saúde</b>
        <span>Sua escola · out. 2026</span>
      </div>
      <div className={s.a4Body} aria-hidden="true">
        <p className={s.a4Who}>
          Aluno de exemplo · {report.student.age} · {report.student.sex} · {report.student.height}
        </p>
        <div className={s.a4Row}>
          <div className={s.a4Score}>
            <b>{report.student.score}</b>
            <span>pontuação de saúde</span>
          </div>
          <ul className={s.a4Bars}>
            {report.bars.map((b) => (
              <li key={b.label}>
                <span>{b.label}</span>
                <i>
                  <em style={{ width: `${b.pct * 100}%` }} />
                </i>
                <b>{b.value}</b>
              </li>
            ))}
          </ul>
        </div>
        <div className={s.a4Row}>
          <div className={s.a4Box}>
            <p>Crescimento</p>
            <svg viewBox="0 0 100 44">
              <path d="M2 40 L30 30 L58 19 L98 6" stroke="#9ec2f2" />
              <path d="M2 42 L30 34 L58 25 L98 13" stroke="#1f6fd8" />
              <circle cx="46" cy="22" r="2.6" fill="#1d1d1f" />
            </svg>
          </div>
          <div className={s.a4Box}>
            <p>Postura</p>
            <span>Ombros · atenção</span>
            <span>Pelve · atenção</span>
          </div>
        </div>
        <div className={s.a4Tests}>
          <span>Equilíbrio 88%</span>
          <span>Reação 412 ms</span>
          <span>Capacidade vital 1.650 mL</span>
          <span>Visão 5,0 | 4,9</span>
        </div>
        <div className={s.a4Foot}>
          <i />
          <span>Sugestões de atividade física e hábitos alimentares · contato da escola</span>
        </div>
      </div>
    </div>
  );
}

export default function Report() {
  return (
    <section id="relatorio" className="section" aria-labelledby="relatorio-title">
      <div className="container-wide center">
        <h2 id="relatorio-title" className="headline" data-reveal>
          O resultado chega à família.
        </h2>
        <p className="lead" data-reveal>
          Na tela da estação, impresso em A4 ou direto no celular. O relatório sai com{" "}
          <strong>o nome e o contato da sua instituição</strong>.
        </p>
      </div>

      <div className={`container-wide ${s.grid}`}>
        <div className={s.photo} data-reveal>
          <Image
            src="/media/family-report.webp"
            alt="Mãe e filho sorrindo à mesa da cozinha enquanto olham o relatório de saúde no celular"
            fill
            sizes="(max-width: 900px) 96vw, 760px"
          />
          <span className="illus">Imagem ilustrativa</span>
        </div>

        <div className={s.phoneCard} data-reveal>
          <div
            className={s.phone}
            role="img"
            aria-label="Relatório de exemplo no celular: aluno de 10 anos, 148 cm; pontuação de saúde 86, peso 44,2 kg, gordura 21,3%, músculo 52,2%, IMC 20,2"
          >
            <div className={s.island} />
            <div className={s.screen} aria-hidden="true">
              <div className={s.appbar}>
                <span className={s.school}>
                  <i />
                  Sua escola
                </span>
                <span className={s.date}>out. 2026</span>
              </div>
              <p className={s.h}>Relatório de saúde</p>
              <p className={s.who}>
                {report.student.age} · {report.student.sex} · {report.student.height}
              </p>
              <div className={s.scoreRow}>
                <Rings />
                <div>
                  <p className={s.score}>{report.student.score}</p>
                  <p className={s.scoreLabel}>pontuação de saúde</p>
                </div>
              </div>
              <ul className={s.bars}>
                {report.bars.map((b) => (
                  <li key={b.label}>
                    <span>{b.label}</span>
                    <b>{b.value}</b>
                    <i>
                      <em style={{ width: `${b.pct * 100}%` }} />
                    </i>
                  </li>
                ))}
              </ul>
              <div className={s.chips}>
                <span>Sugestões de atividade</span>
                <span>Hábitos alimentares</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container-wide">
        <Insights />
      </div>

      <div className={`container-wide ${s.points}`}>
        {report.points.map((p) => (
          <div key={p.k} data-reveal>
            <p className={s.k}>{p.k}</p>
            <p className={s.v}>{p.v}</p>
          </div>
        ))}
      </div>
      <p className={`container-wide ${s.pointsNote}`}>
        Os 62 indicadores cobrem composição corporal, medidas do corpo, postura, equilíbrio, agilidade, capacidade
        pulmonar, visão e a pontuação de saúde.
      </p>
      <div className={`container-wide ${s.after}`}>
        <div className={s.data} data-reveal>
          <h3>Dados das crianças</h3>
          <p>
            O aluno é identificado pelo número de matrícula, e a estação exibe o aviso de coleta de dados antes de cada
            avaliação. As avaliações ficam salvas no próprio equipamento e são sincronizadas com a nuvem quando há
            conexão. Para dados de crianças, a LGPD pede o consentimento de um dos pais ou do responsável legal.
          </p>
          <a className="link" href="#lgpd">
            LGPD nas perguntas frequentes
          </a>
        </div>
        <div className={s.sample} data-reveal>
          <div>
            <h3>Impresso em A4</h3>
            <p>Uma folha por aluno, para a família guardar. Peça o relatório de exemplo completo junto com a cotação.</p>
            <a className="link" href="#cotacao" data-doc="Relatório de exemplo">
              Pedir um relatório de exemplo
            </a>
          </div>
          <A4 />
        </div>
      </div>
      <p className={`container-wide ${s.footnote}`}>
        Valores ilustrativos: peso, gordura, músculo, IMC, altura e idade vêm de um relatório de exemplo (aluno de 10
        anos, 148 cm); as curvas são demonstrativas. A estação faz triagem e avaliação, não diagnóstico.
      </p>
    </section>
  );
}
