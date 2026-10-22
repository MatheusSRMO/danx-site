import type { Metadata } from "next";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="conteudo" className="section" style={{ paddingTop: 160, minHeight: "70svh" }}>
        <div className="container center">
          <p className="eyebrow">Erro 404</p>
          <h1 className="headline-2" style={{ marginTop: 12 }}>
            Esta página não existe.
          </h1>
          <p className="lead" style={{ marginTop: 18 }}>
            O endereço pode ter mudado. Volte para a página da Estação de Saúde DANX.
          </p>
          <div className="ctas" style={{ marginTop: 32 }}>
            <a className="btn btn-primary" href="/">
              Ir para a página inicial
            </a>
            <a className="link" href="/#cotacao">
              Solicitar cotação
            </a>
          </div>
        </div>
      </main>
      <Footer base="/" notes={false} />
    </>
  );
}
