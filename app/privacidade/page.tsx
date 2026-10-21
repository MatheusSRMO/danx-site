import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a DANX trata os dados pessoais recebidos pelo site e pela Estação de Saúde.",
};

export default function Privacidade() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="section" style={{ paddingTop: 140 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h1 className="headline-2">Política de Privacidade</h1>
          <p className="lead" style={{ marginTop: 20 }}>
            Texto em preparação. <span className="tbc">A confirmar com o jurídico da DANX</span>
          </p>
          <p style={{ marginTop: 28, color: "var(--ink-2)" }}>
            Esta página deve explicar quais dados o formulário de cotação coleta e para quê, por quanto tempo são
            guardados e como solicitar a exclusão. Deve também tratar dos dados de crianças e adolescentes avaliados
            pela estação, inclusive o consentimento dos responsáveis previsto no art. 14 da LGPD.
          </p>
          <h2 id="termos" className="headline-2" style={{ marginTop: 64, fontSize: "2rem" }}>
            Termos de uso
          </h2>
          <p style={{ marginTop: 16, color: "var(--ink-2)" }}>
            Texto em preparação. <span className="tbc">A confirmar</span>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
