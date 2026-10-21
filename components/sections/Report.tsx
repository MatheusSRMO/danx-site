import Image from "next/image";
import { report } from "@/lib/content";
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
        </div>

        <div className={s.phoneCard} data-reveal>
          <div className={s.phone} role="img" aria-label="Relatório de exemplo no celular: pontuação de saúde 86, peso 44,2 kg, gordura 21,3%, músculo 52,2%, IMC 20,2">
            <div className={s.island} />
            <div className={s.screen} aria-hidden="true">
              <div className={s.appbar}>
                <span className={s.school}>
                  <i />
                  Sua escola
                </span>
                <span className={s.date}>Out 2026</span>
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
                <span>Exercícios recomendados</span>
                <span>Orientação alimentar</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={`container-wide ${s.points}`}>
        {report.points.map((p) => (
          <div key={p.k} data-reveal>
            <p className={s.k}>{p.k}</p>
            <p className={s.v}>{p.v}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
