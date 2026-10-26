"use client";
import { useEffect, useRef, useState } from "react";
import { quote, REVISAO, site } from "@/lib/content";
import s from "./Quote.module.css";

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

type Status = "idle" | "sending" | "ok" | "fallback";

const LABELS: Record<string, string> = {
  instituicao: "nome da instituição",
  tipo: "tipo de instituição",
  cidade: "cidade",
  uf: "UF",
  nome: "nome do responsável",
  cargo: "cargo",
  email: "e-mail",
  telefone: "telefone",
  consentimento: "consentimento",
  mensagem: "mensagem",
};

export default function Quote() {
  const [status, setStatus] = useState<Status>("idle");
  const [waLink, setWaLink] = useState("");
  const [error, setError] = useState("");
  const result = useRef<HTMLDivElement>(null);
  const send = useRef<HTMLButtonElement>(null);

  // Quando o formulário dá lugar à resposta, leva o foco (e a tela) até ela
  useEffect(() => {
    if (status !== "ok" && status !== "fallback") return;
    const el = result.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    const lenis = window.__lenis;
    if (lenis) lenis.scrollTo(el, { offset: -120, duration: 0.9 });
    else el.scrollIntoView({ block: "center" });
  }, [status]);

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form).entries()) as Record<string, string>;
    setError("");
    setStatus("sending");
    const summary = [
      "Olá! Quero uma cotação da Estação de Saúde DANX.",
      `Instituição: ${data.instituicao} (${data.tipo})`,
      data.cnpj && `CNPJ: ${data.cnpj}`,
      `Cidade: ${data.cidade}/${data.uf}`,
      `Responsável: ${data.nome}, ${data.cargo}`,
      `E-mail: ${data.email}`,
      `Telefone: ${data.telefone}`,
      `Estações: ${data.quantidade || "a definir"}`,
      data.mensagem,
    ]
      .filter(Boolean)
      .join("\n");
    setWaLink(`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(summary)}`);
    try {
      const res = await fetch("/api/cotacao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.status === 422) {
        // Erro de preenchimento: o pedido não foi aceito, então a pessoa corrige ali mesmo
        const body = await res.json().catch(() => ({}));
        const fields: string[] = body.missing ?? body.fields ?? [];
        const names = fields.map((f) => LABELS[f] ?? f).join(", ");
        setError(names ? `Confira: ${names}.` : "Confira os campos destacados e tente de novo.");
        setStatus("idle");
        return;
      }
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
            {quote.leadTbc && !REVISAO ? quote.leadPub : quote.lead}
            {quote.leadTbc && REVISAO && <span className="tbc">Prazo a confirmar</span>}
          </p>
        </div>

        {status === "ok" && (
          <div ref={result} className={s.done} role="status" tabIndex={-1}>
            <h3>Pedido recebido.</h3>
            <p>Obrigado. Nossa equipe vai entrar em contato com o valor, as condições e a proposta formal.</p>
          </div>
        )}
        {status === "fallback" && (
          <div ref={result} className={s.done} role="status" tabIndex={-1}>
            <h3>Quase lá.</h3>
            <p>
              Não conseguimos enviar pelo site agora. Envie o seu pedido pelo WhatsApp, já preenchido com os seus dados:
            </p>
            <div className={s.doneActions}>
              <a className="btn btn-primary" href={waLink} target="_blank" rel="noopener noreferrer">
                Enviar pelo WhatsApp
              </a>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setStatus("idle");
                  requestAnimationFrame(() => send.current?.focus());
                }}
              >
                Tentar de novo pelo site
              </button>
            </div>
          </div>
        )}
        {/* O formulário continua montado na falha de envio, para não perder o que foi digitado */}
        {status !== "ok" && (
          <form className={s.form} onSubmit={submit} hidden={status === "fallback"}>
            <div className={s.row}>
              <label className={s.field}>
                <span>Nome da instituição *</span>
                <input name="instituicao" required maxLength={200} autoComplete="organization" />
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
                <input name="cnpj" autoCapitalize="characters" maxLength={30} placeholder="00.000.000/0000-00" />
              </label>
              <label className={s.field}>
                <span>Cidade *</span>
                <input name="cidade" required maxLength={120} autoComplete="address-level2" />
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
                <input name="nome" required maxLength={160} autoComplete="name" />
              </label>
              <label className={s.field}>
                <span>Cargo</span>
                <input name="cargo" maxLength={120} autoComplete="organization-title" />
              </label>
            </div>
            <div className={s.row3}>
              <label className={s.field}>
                <span>E-mail *</span>
                <input
                  name="email"
                  type="email"
                  required
                  maxLength={200}
                  autoComplete="email"
                  pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                  title="Use um e-mail completo, como nome@escola.com.br"
                />
              </label>
              <label className={s.field}>
                <span>Telefone / WhatsApp *</span>
                <input
                  name="telefone"
                  type="tel"
                  required
                  maxLength={40}
                  autoComplete="tel"
                  placeholder="(00) 00000-0000"
                />
              </label>
              <label className={s.field}>
                <span>Quantidade estimada</span>
                <input name="quantidade" type="number" min={1} max={99999} defaultValue={1} />
              </label>
            </div>
            <label className={s.field}>
              <span>Mensagem</span>
              <textarea
                name="mensagem"
                rows={4}
                maxLength={3000}
                placeholder="Conte um pouco sobre a rede, as escolas ou o programa."
              />
            </label>
            <input className={s.hp} name="hp_x7" tabIndex={-1} autoComplete="off" aria-hidden="true" />
            <label className={s.consent}>
              <input type="checkbox" name="consentimento" value="sim" required />
              <span>
                Concordo com o uso destes dados para o contato comercial da DANX, conforme a{" "}
                <a href="/privacidade" target="_blank" rel="noopener">
                  Política de Privacidade
                </a>
                . *
              </span>
            </label>
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            <div className={s.actions}>
              <button ref={send} className="btn btn-primary" type="submit" disabled={status === "sending"}>
                {status === "sending" ? "Enviando…" : "Solicitar cotação"}
              </button>
              <a className="link" href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
                Falar no WhatsApp
              </a>
              <p>
                Ou ligue: <a href={`tel:+${site.whatsapp}`}>{site.phone}</a>
              </p>
            </div>
            <p className={s.next}>{quote.next}</p>
            <p className={s.required}>* Campos obrigatórios</p>
          </form>
        )}
      </div>
    </section>
  );
}
