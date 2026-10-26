import type { Metadata } from "next";
import Nav from "@/components/Nav";
import { REVISAO } from "@/lib/content";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Política de Privacidade",
  description: "Como a DANX trata os dados pessoais recebidos pelo site e pela Estação de Saúde.",
  alternates: { canonical: "/privacidade" },
  openGraph: { url: "/privacidade" },
};

export default function Privacidade() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="section" style={{ paddingTop: 140 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <h1 className="headline-2">Política de Privacidade</h1>
          <p className="lead" style={{ marginTop: 20 }}>
            Texto em revisão.{REVISAO && <span className="tbc">A confirmar</span>}
          </p>
          <p style={{ marginTop: 28, color: "var(--ink-2)" }}>
            A política de privacidade da DANX está em revisão e será publicada em breve. Ela vai explicar como tratamos
            os dados enviados pelo formulário de cotação e os dados das avaliações feitas pela estação, conforme a Lei
            Geral de Proteção de Dados (LGPD).
          </p>
          <h2 id="termos" className="headline-2" style={{ marginTop: 64, fontSize: "2rem" }}>
            Termos de uso
          </h2>
          <p style={{ marginTop: 16, color: "var(--ink-2)" }}>
            Texto em revisão.{REVISAO && <span className="tbc">A confirmar</span>}
          </p>
        </div>
      </main>
      <Footer base="/" notes={false} />
    </>
  );
}
