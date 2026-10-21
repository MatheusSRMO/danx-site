"use client";
import { useState } from "react";
import { quote, site } from "@/lib/content";
import s from "./Quote.module.css";

const UFS = ["AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO"];

type Status = "idle" | "sending" | "ok" | "fallback";

export default function Quote() {
  const [status, setStatus] = useState<Status>("idle");
  const [waLink, setWaLink] = useState("");

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setStatus("sending");
    const summary =
      `Olá! Quero uma cotação da Estação de Saúde DANX.\n` +
      `Instituição: ${data.instituicao} (${data.tipo})\nCidade: ${data.cidade}/${data.uf}\n` +
      `Responsável: ${data.nome}, ${data.cargo}\nUnidades: ${data.quantidade}\n${data.mensagem ?? ""}`;
    setWaLink(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(summary)}`);
    try {
      const res = await fetch("/api/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("ok");
      form.reset();
    } catch {
      // Sem servidor (ex.: versão estática de pré-visualização): segue pelo WhatsApp.
      setStatus("fallback");
    }
  }

  return (
    <section id="cotacao" className="section" aria-labelledby="cotacao-title">
      <div className="container">
        <div className={s.head}>
          <h2 id="cotacao-title" className="headline-2" data-reveal>
            {quote.title}
          </h2>
          <p className="lead" data-reveal>
            {quote.lead}
            {quote.leadTbc && <span className="tbc">Prazo a confirmar</span>}
          </p>
        </div>

        {status === "ok" ? (
          <div className={s.done} role="status">
            <h3>Pedido recebido.</h3>
            <p>Obrigado. Nossa equipe vai entrar em contato com o valor, as condições e a proposta formal.</p>
          </div>
        ) : status === "fallback" ? (
          <div className={s.done} role="status">
            <h3>Quase lá.</h3>
            <p>Não conseguimos enviar pelo site agora. Envie o seu pedido pelo WhatsApp, já preenchido com os seus dados:</p>
            <a className="btn btn-primary" href={waLink} target="_blank" rel="noopener noreferrer">
              Enviar pelo WhatsApp
            </a>
          </div>
        ) : (
          <form className={s.form} onSubmit={submit} noValidate={false}>
            <div className={s.row}>
              <label className={s.field}>
                <span>Nome da instituição *</span>
                <input name="instituicao" required autoComplete="organization" />
              </label>
              <label className={s.field}>
                <span>Tipo de instituição *</span>
                <select name="tipo" required defaultValue="">
                  <option value="" disabled>
                    Selecione
                  </option>
                  {quote.types.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className={s.row3}>
              <label className={s.field}>
                <span>CNPJ</span>
                <input name="cnpj" inputMode="numeric" placeholder="00.000.000/0000-00" />
              </label>
              <label className={s.field}>
                <span>Cidade *</span>
                <input name="cidade" required autoComplete="address-level2" />
              </label>
              <label className={s.field}>
                <span>UF *</span>
                <select name="uf" required defaultValue="">
                  <option value="" disabled>
                    UF
                  </option>
                  {UFS.map((u) => (
                    <option key={u}>{u}</option>
                  ))}
                </select>
              </label>
            </div>
            <div className={s.row}>
              <label className={s.field}>
                <span>Nome do responsável *</span>
                <input name="nome" required autoComplete="name" />
              </label>
              <label className={s.field}>
                <span>Cargo *</span>
                <input name="cargo" required autoComplete="organization-title" />
              </label>
            </div>
            <div className={s.row3}>
              <label className={s.field}>
                <span>E-mail *</span>
                <input name="email" type="email" required autoComplete="email" />
              </label>
              <label className={s.field}>
                <span>Telefone / WhatsApp *</span>
                <input name="telefone" type="tel" required autoComplete="tel" placeholder="(00) 00000-0000" />
              </label>
              <label className={s.field}>
                <span>Unidades</span>
                <input name="quantidade" type="number" min={1} defaultValue={1} />
              </label>
            </div>
            <label className={s.field}>
              <span>Mensagem</span>
              <textarea name="mensagem" rows={4} placeholder="Conte um pouco sobre a rede, as escolas ou o programa." />
            </label>
            <input className={s.hp} name="empresa_site" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className={s.consent}>
              <input type="checkbox" name="consentimento" value="sim" required />
              <span>
                Concordo com o uso destes dados para o contato comercial da DANX, conforme a{" "}
                <a href="/privacidade">Política de Privacidade</a>. *
              </span>
            </label>
            <div className={s.actions}>
              <button className="btn btn-primary" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Enviando…" : "Solicitar cotação"}
              </button>
              <p>
                Ou ligue: <a href={`tel:+${site.whatsapp}`}>{site.phone}</a>
              </p>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
