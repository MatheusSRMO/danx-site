"use client";
import { useEffect, useState } from "react";
import { site } from "@/lib/content";
import s from "./WhatsAppButton.module.css";

const TEXT = "Olá! Quero saber mais sobre a Estação de Saúde DANX para a minha escola ou rede.";

/**
 * Atalho fixo para o WhatsApp no celular. Aparece quando a pessoa volta a rolar para cima (enquanto lê, descendo, não
 * cobre o texto) e some no topo, na história 3D, no formulário de cotação e no rodapé.
 */
export default function WhatsAppButton() {
  const [inZone, setInZone] = useState(true);
  const [down, setDown] = useState(true);
  const hidden = inZone || down;
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 12) return;
      setDown(y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const targets = ["topo", "tecnologia", "cotacao"]
      .map((id) => document.getElementById(id))
      .concat(document.querySelector("footer"))
      .filter(
      (el): el is HTMLElement => !!el,
    );
    const seen = new Set<Element>();
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) seen.add(e.target);
        else seen.delete(e.target);
      }
      setInZone(seen.size > 0);
    });
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <a
      className={`${s.fab} ${hidden ? s.hidden : ""}`}
      href={`https://wa.me/${site.whatsapp}?text=${encodeURIComponent(TEXT)}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale no WhatsApp (abre em nova aba)"
      aria-hidden={hidden || undefined}
      tabIndex={hidden ? -1 : undefined}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 4v-4h0A1.5 1.5 0 0 1 4 14.5z" />
      </svg>
      WhatsApp
    </a>
  );
}
