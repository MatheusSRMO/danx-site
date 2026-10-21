import { NextResponse } from "next/server";

// Recebe o pedido de cotação.
// Para entregar por e-mail/CRM, defina QUOTE_WEBHOOK_URL (ex.: Zapier, Make, n8n ou um endpoint próprio):
// o JSON do pedido é repassado para essa URL.
const REQUIRED = ["instituicao", "tipo", "cidade", "uf", "nome", "cargo", "email", "telefone", "consentimento"];

export async function POST(req: Request) {
  let data: Record<string, string>;
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido" }, { status: 400 });
  }
  if (data.empresa_site) return NextResponse.json({ ok: true }); // armadilha anti-spam
  const missing = REQUIRED.filter((k) => !String(data[k] ?? "").trim());
  if (missing.length) return NextResponse.json({ ok: false, missing }, { status: 422 });
  if (!/^\S+@\S+\.\S+$/.test(data.email)) return NextResponse.json({ ok: false, error: "E-mail inválido" }, { status: 422 });

  const payload = { ...data, recebidoEm: new Date().toISOString(), origem: "site" };
  const hook = process.env.QUOTE_WEBHOOK_URL;
  if (hook) {
    const r = await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!r.ok) return NextResponse.json({ ok: false, error: "Falha ao encaminhar" }, { status: 502 });
  } else {
    console.info("[cotacao]", JSON.stringify(payload));
  }
  return NextResponse.json({ ok: true });
}
