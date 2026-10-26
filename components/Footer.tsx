import Logo from "./Logo";
import { nav, REVISAO, site } from "@/lib/content";
import s from "./Footer.module.css";

/** `base` prefixa as âncoras quando o rodapé aparece fora da página inicial. */
export default function Footer({ base = "", notes = true }: { base?: string; notes?: boolean }) {
  return (
    <footer className={s.footer}>
      <div className="container-wide">
        {notes && (
          <ol className={s.notes}>
            <li>
              Estatísticas: Noll et al., Revista de Saúde Pública (USP), 2016 (dor nas costas em estudantes de 11 a 16
              anos de Teutônia, RS); OMS / The Lancet Child &amp; Adolescent Health, 2019 (atividade física de
              adolescentes no Brasil).
            </li>
            <li>
              Valores de avaliação exibidos no site são ilustrativos. Peso, gordura, músculo e IMC vêm de um relatório
              de exemplo (aluno de 10 anos, 148 cm).
            </li>
            <li>
              A Estação de Saúde DANX realiza triagem e avaliação. Ela não faz diagnóstico: os resultados apoiam o
              encaminhamento para profissionais de saúde.
            </li>
          </ol>
        )}

        <div className={s.main}>
          <div className={s.brand}>
            <Logo className={s.logo} />
            <p>O futuro em foco.</p>
          </div>
          <nav className={s.links} aria-label="Rodapé">
            {nav.map((l) => (
              <a key={l.href} href={base + l.href}>
                {l.label}
              </a>
            ))}
            <a href={`${base}#cotacao`}>Solicitar cotação</a>
          </nav>
          <div className={s.contact}>
            <a
              href={`https://wa.me/${site.whatsapp}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${site.phone} (abre em nova aba)`}
            >
              WhatsApp {site.phone}
            </a>
            <a href="https://www.danx.com.br">www.danx.com.br</a>
            {(REVISAO || !site.email.tbc) && (
              <span>
                {site.email.value}
                {site.email.tbc && <span className="tbc">A confirmar</span>}
              </span>
            )}
          </div>
        </div>

        <div className={s.legal}>
          {REVISAO || !(site.razaoSocial.tbc || site.cnpj.tbc) ? (
            <p>
              © 2026 DANX. {site.razaoSocial.value}
              {site.razaoSocial.tbc && <span className="tbc">A confirmar</span>} · CNPJ {site.cnpj.value}
              {site.cnpj.tbc && <span className="tbc">A confirmar</span>}
            </p>
          ) : (
            <p>© 2026 DANX.</p>
          )}
          <div>
            <a href="/privacidade">Política de Privacidade</a>
            <a href="/privacidade#termos">Termos de uso</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
