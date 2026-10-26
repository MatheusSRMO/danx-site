"use client";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Logo from "./Logo";
import { nav, site } from "@/lib/content";
import s from "./Nav.module.css";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  // Fora da página inicial, as âncoras apontam para a página inicial
  const base = usePathname() === "/" ? "" : "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // O menu do celular fecha com Esc, com um toque fora dele ou ao rolar a página
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      close();
      toggle.current?.focus();
    };
    const onDown = (e: PointerEvent) => !header.current?.contains(e.target as Node) && close();
    const y0 = window.scrollY;
    const onScroll = () => Math.abs(window.scrollY - y0) > 40 && close();
    window.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("scroll", onScroll);
    };
  }, [open]);

  return (
    <header ref={header} className={`${s.nav} ${scrolled || open ? s.scrolled : ""} ${open ? s.open : ""}`}>
      <div className={s.bar}>
        <a href={base ? "/" : "#topo"} className={s.brand} aria-label="DANX, voltar ao início">
          <Logo className={s.logo} />
          <span className={s.product}>Estação de Saúde</span>
        </a>
        <nav className={s.links} aria-label="Principal">
          {nav.map((l) => (
            <a key={l.href} href={base + l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className={`btn btn-primary btn-sm ${s.cta}`} href={`${base}#cotacao`} aria-label="Solicitar cotação">
          <span className={s.long}>Solicitar cotação</span>
          <span className={s.short} aria-hidden="true">
            Cotação
          </span>
        </a>
        {/* No celular, o WhatsApp fica na barra (sem botão flutuante sobre o texto) */}
        <a
          className={s.wa}
          href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent("Olá! Quero saber mais sobre a Estação de Saúde DANX.")}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Fale no WhatsApp (abre em nova aba)"
        >
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
          </svg>
        </a>
        <button
          ref={toggle}
          type="button"
          className={s.toggle}
          aria-expanded={open}
          aria-controls="menu-local"
          onClick={() => setOpen((v) => !v)}
        >
          Menu
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 7l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div id="menu-local" className={s.sheet} hidden={!open}>
        <nav aria-label="Menu">
          {nav.map((l) => (
            <a key={l.href} href={base + l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
