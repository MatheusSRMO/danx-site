import Image from "next/image";
import { report } from "@/lib/content";
import Insights from "./Insights";
import ReportSheet from "./ReportSheet";
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

export default function Report() {
  return (
    <section id="relatorio" className="section" aria-labelledby="relatorio-title">
      <div className="container-wide">
        <div className={s.head}>
          <h2 id="relatorio-title" className="headline" data-reveal>
            O resultado chega à família.
          </h2>
          <p className="lead" data-reveal>
            Na tela da estação, impresso em A4 ou direto no celular. O relatório sai com{" "}
            <strong>o nome e o contato da sua instituição</strong>.
          </p>
        </div>
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
            Identificação só pelo número de matrícula, e o consentimento dos responsáveis é combinado com a escola.
          </p>
          <a className="link" href="#lgpd">
            Resposta completa sobre LGPD
          </a>
        </div>
        <ReportSheet />
      </div>
      <p className={`container-wide ${s.footnote}`}>
        Valores ilustrativos: peso, gordura, músculo, IMC, altura e idade vêm de um relatório de exemplo (aluno de 10
        anos, 148 cm); as curvas são demonstrativas. A estação faz triagem e avaliação, não diagnóstico.
      </p>
    </section>
  );
}
