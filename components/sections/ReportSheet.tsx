"use client";
import { useRef, useState } from "react";
import { report, site } from "@/lib/content";
import s from "./Report.module.css";

// Prévia da folha A4, com os mesmos números do aluno de exemplo (decorativa: o resumo está no aria-label)
function A4({ big = false }: { big?: boolean }) {
  return (
    <div
      className={`${s.a4} ${big ? s.a4Big : ""}`}
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
            <svg viewBox="0 0 100 48">
              <path d="M2 34 L30 25 L58 15 L98 4 L98 22 L58 33 L30 41 L2 46 Z" fill="rgba(31,111,216,0.12)" stroke="none" />
              <path d="M2 40 L30 33 L58 24 L98 13" stroke="#1f6fd8" />
              <path d="M2 47.5 H98" stroke="#d6d2ca" strokeWidth="1" />
              <circle cx="46" cy="22" r="2.8" fill="#1d1d1f" stroke="none" />
            </svg>
          </div>
          <div className={s.a4Box}>
            <p>Postura</p>
            <div className={s.a4Posture}>
              <svg viewBox="0 0 40 60">
                <circle cx="20" cy="7" r="4.5" fill="#d1d1d6" stroke="none" />
                <path d="M20 12 V34 M11 17 L29 15 M14 36 L26 34 M14 36 L14 57 M26 34 L26 57 M11 17 L9 32 M29 15 L31 30" stroke="#b9b9bf" strokeWidth="2.4" />
                <path d="M5 17.6 L35 14.4 M8 36.6 L32 33.4" stroke="#b46a00" strokeWidth="1.2" strokeDasharray="2 2" />
              </svg>
              <div>
                <span>Ombros · atenção</span>
                <span>Pelve · atenção</span>
              </div>
            </div>
          </div>
        </div>
        <div className={s.a4Tests}>
          <span>Equilíbrio 88%</span>
          <span>Reação 412 ms</span>
          <span>Capacidade vital 1.650 mL</span>
          <span>Visão 5,0 | 4,9</span>
        </div>
        <div className={s.a4Notes}>
          <p>Sugestões para a família</p>
          <span>Atividade física todos os dias, com brincadeiras e esportes.</span>
          <span>Frutas, verduras e água na rotina da alimentação.</span>
        </div>
        <div className={s.a4Foot}>
          <i />
          <span>Sugestões e contato da escola</span>
        </div>
      </div>
    </div>
  );
}

type Status = "idle" | "sending" | "ok" | "fallback";

/** Cartão do relatório impresso: prévia do A4 que amplia ao clicar e pedido do exemplo completo só com o e-mail. */
export default function ReportSheet() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [wa, setWa] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    setWa(
      `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(
        `Olá! Quero receber o relatório de exemplo da Estação de Saúde DANX. Meu e-mail: ${data.email}`,
      )}`,
    );
    try {
      const res = await fetch("/api/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, pedido: "relatorio-exemplo" }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("ok");
    } catch {
      setStatus("fallback");
    }
  }

  return (
    <div className={s.sample} data-reveal>
      <div>
        <h3>Veja um relatório completo.</h3>
        <p>Uma folha A4 por aluno, para a família guardar. Receba o exemplo completo no seu e-mail.</p>
        {status === "ok" ? (
          <p className={s.sent} role="status">
            Pedido recebido. A equipe da DANX envia o relatório de exemplo para o seu e-mail.
          </p>
        ) : status === "fallback" ? (
          <p className={s.sent} role="status">
            Não conseguimos enviar pelo site agora.{" "}
            <a href={wa} target="_blank" rel="noopener noreferrer">
              Peça pelo WhatsApp
            </a>
            .
          </p>
        ) : (
          <form className={s.mini} onSubmit={submit}>
            <label>
              <span className="sr-only">Seu e-mail</span>
              <input
                name="email"
                type="email"
                required
                maxLength={200}
                autoComplete="email"
                placeholder="Seu e-mail"
                pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
              />
            </label>
            <label className={s.miniConsent}>
              <input type="checkbox" name="consentimento" value="sim" required />
              <span>
                Concordo com o uso do e-mail para este envio, conforme a{" "}
                <a href="/privacidade" target="_blank" rel="noopener">
                  Política de Privacidade
                </a>
                .
              </span>
            </label>
            <button className="btn btn-secondary" type="submit" disabled={status === "sending"}>
              {status === "sending" ? "Enviando…" : "Receber por e-mail"}
            </button>
          </form>
        )}
      </div>
      <button type="button" className={s.zoom} onClick={() => dialog.current?.showModal()} aria-label="Ampliar a prévia do relatório em A4">
        <A4 />
        <span className={s.zoomHint} aria-hidden="true">
          Ampliar a prévia
        </span>
      </button>
      <dialog ref={dialog} className={s.dialog} onClick={(e) => e.target === dialog.current && dialog.current?.close()}>
        <A4 big />
        <form method="dialog">
          <button className="btn btn-primary">Fechar</button>
        </form>
      </dialog>
    </div>
  );
}
