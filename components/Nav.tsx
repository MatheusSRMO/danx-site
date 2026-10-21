"use client";
import { useEffect, useState } from "react";
import Logo from "./Logo";
import { nav } from "@/lib/content";
import s from "./Nav.module.css";

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className={`${s.nav} ${scrolled || open ? s.scrolled : ""} ${open ? s.open : ""}`}>
      <div className={s.bar}>
        <a href="#topo" className={s.brand} aria-label="DANX, voltar ao início">
          <Logo className={s.logo} />
          <span className={s.product}>Estação de Saúde</span>
        </a>
        <nav className={s.links} aria-label="Principal">
          {nav.map((l) => (
            <a key={l.href} href={l.href}>
              {l.label}
            </a>
          ))}
        </nav>
        <a className={`btn btn-primary btn-sm ${s.cta}`} href="#cotacao">
          Solicitar cotação
        </a>
        <button
          className={s.toggle}
          aria-expanded={open}
          aria-controls="menu-local"
          aria-label={open ? "Fechar menu" : "Abrir menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <svg viewBox="0 0 18 18" aria-hidden="true">
            <path d="M3 7l6 6 6-6" />
          </svg>
        </button>
      </div>
      <div id="menu-local" className={s.sheet} hidden={!open}>
        <nav aria-label="Menu">
          {nav.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
