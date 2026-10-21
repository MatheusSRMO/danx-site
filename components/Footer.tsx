import Logo from "./Logo";
import { nav, site } from "@/lib/content";
import s from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={s.footer}>
      <div className="container-wide">
        <ol className={s.notes}>
          <li>
            Estatísticas: Revista de Saúde Pública (USP), 2016 (dor nas costas em estudantes de 11 a 16 anos); OMS /
            The Lancet Child &amp; Adolescent Health, 2019 (atividade física de adolescentes no Brasil).
          </li>
          <li>
            Valores de avaliação exibidos no site são ilustrativos. Peso, gordura, músculo e IMC vêm de um relatório de
            exemplo (aluno de 10 anos, 148 cm).
          </li>
          <li>
            A Estação de Saúde DANX realiza triagem e avaliação. Ela não faz diagnóstico: os resultados apoiam o
            encaminhamento para profissionais de saúde.
          </li>
        </ol>

        <div className={s.main}>
          <div className={s.brand}>
            <Logo className={s.logo} />
            <p>O futuro em foco.</p>
          </div>
          <nav className={s.links} aria-label="Rodapé">
            {nav.map((l) => (
              <a key={l.href} href={l.href}>
                {l.label}
              </a>
            ))}
            <a href="#cotacao">Solicitar cotação</a>
          </nav>
          <div className={s.contact}>
            <a href={`https://wa.me/${site.whatsapp}`} target="_blank" rel="noopener noreferrer">
              {site.phone}
            </a>
            <a href="https://www.danx.com.br">www.danx.com.br</a>
            <span>
              {site.email.value}
              {site.email.tbc && <span className="tbc">A confirmar</span>}
            </span>
          </div>
        </div>

        <div className={s.legal}>
          <p>
            © 2026 DANX. {site.razaoSocial.value}
            {site.razaoSocial.tbc && <span className="tbc">A confirmar</span>} · CNPJ {site.cnpj.value}
            {site.cnpj.tbc && <span className="tbc">A confirmar</span>}
          </p>
          <div>
            <a href="/privacidade">Política de Privacidade</a>
            <a href="/privacidade#termos">Termos de uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
