import { NextResponse } from "next/server";

// Recebe o pedido de cotação (ou só do relatório de exemplo, com e-mail e consentimento).
// Para entregar por e-mail/CRM, defina QUOTE_WEBHOOK_URL (ex.: Zapier, Make, n8n ou um endpoint próprio):
// o JSON do pedido é repassado para essa URL.
const REQUIRED = ["instituicao", "tipo", "nome", "consentimento"];
// Só estes campos seguem adiante, com tamanho máximo de cada um
const FIELDS: Record<string, number> = {
  instituicao: 200,
  tipo: 80,
  cnpj: 30,
  cidade: 120,
  uf: 2,
  nome: 160,
  cargo: 120,
  email: 200,
  telefone: 40,
  quantidade: 6,
  mensagem: 3000,
  documentos: 200,
  pedido: 40,
  consentimento: 10,
};
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ ok: false, error: "Pedido inválido" }, { status: 400 });
  }
  const raw = body as Record<string, unknown>;
  if (raw.hp_x7) return NextResponse.json({ ok: true }); // armadilha anti-spam

  const data: Record<string, string> = {};
  const tooLong: string[] = [];
  for (const [k, max] of Object.entries(FIELDS)) {
    const v = typeof raw[k] === "string" || typeof raw[k] === "number" ? String(raw[k]).trim() : "";
    if (v.length > max) tooLong.push(k);
    if (v) data[k] = v;
  }
  // Pedido do relatório de exemplo: basta o e-mail e o consentimento
  const sample = data.pedido === "relatorio-exemplo";
  const missing = sample ? ["email", "consentimento"].filter((k) => !data[k]) : REQUIRED.filter((k) => !data[k]);
  // Basta um meio de contato: e-mail ou telefone
  if (!sample && !data.email && !data.telefone) missing.push("contato");
  if (missing.length) return NextResponse.json({ ok: false, missing }, { status: 422 });
  if (tooLong.length)
    return NextResponse.json({ ok: false, error: "Campo longo demais", fields: tooLong }, { status: 422 });
  if (data.email && !EMAIL.test(data.email))
    return NextResponse.json({ ok: false, error: "E-mail inválido", fields: ["email"] }, { status: 422 });
  if (!["sim", "on", "true"].includes(data.consentimento.toLowerCase())) {
    return NextResponse.json(
      { ok: false, error: "Consentimento obrigatório", fields: ["consentimento"] },
      { status: 422 },
    );
  }

  const payload = { ...data, recebidoEm: new Date().toISOString(), origem: "site" };
  const hook = process.env.QUOTE_WEBHOOK_URL;
  if (hook) {
    try {
      const r = await fetch(hook, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok) throw new Error(`webhook ${r.status}`);
    } catch (err) {
      console.error("[cotacao] falha ao encaminhar", err);
      return NextResponse.json({ ok: false, error: "Falha ao encaminhar" }, { status: 502 });
    }
  } else if (process.env.NODE_ENV === "production") {
    // Sem destino configurado, o pedido se perderia: o site oferece o WhatsApp (resposta 503)
    console.error("[cotacao] QUOTE_WEBHOOK_URL não definida; pedido não encaminhado");
    return NextResponse.json({ ok: false, error: "Envio pelo site indisponível" }, { status: 503 });
  } else {
    console.info("[cotacao] (desenvolvimento)", JSON.stringify(payload));
  }
  return NextResponse.json({ ok: true });
}
