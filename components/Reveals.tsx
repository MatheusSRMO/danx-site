"use client";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Entrada suave (sobe e aparece) de todo elemento com [data-reveal]. */
export default function Reveals() {
  useEffect(() => {
    if (document.documentElement.classList.contains("reduced")) return;
    const pending = new Set(gsap.utils.toArray<HTMLElement>("[data-reveal]"));

    // Revela tudo o que já está (ou já passou) da faixa visível, inclusive após saltos de âncora.
    let queued = false;
    const check = () => {
      queued = false;
      const limit = window.innerHeight * 0.9;
      const batch: HTMLElement[] = [];
      const passed: HTMLElement[] = [];
      pending.forEach((el) => {
        const r = el.getBoundingClientRect();
        if (r.top < limit) {
          // O que já ficou acima da tela aparece direto, sem entrar na fila do escalonamento
          (r.bottom < 0 ? passed : batch).push(el);
          pending.delete(el);
        }
      });
      if (passed.length) gsap.set(passed, { opacity: 1, y: 0, overwrite: true });
      if (batch.length) gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.07, overwrite: true });
    };
    let settle: number | undefined;
    const onScroll = () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(check);
      }
      // Segunda checagem quando a rolagem assenta (cobre saltos de âncora e layout que ainda estava mudando)
      window.clearTimeout(settle);
      settle = window.setTimeout(check, 250);
    };
    check();
    window.addEventListener("scroll", onScroll, { passive: true });
    // O Lenis também avisa a cada quadro de rolagem (cobre saltos programáticos)
    const offLenis = window.__lenis?.on("scroll", onScroll);
    window.addEventListener("resize", onScroll);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      window.clearTimeout(settle);
      offLenis?.();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", refresh);
    };
  }, []);
  return null;
}
