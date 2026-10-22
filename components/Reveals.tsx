"use client";
import { useEffect } from "react";
import { gsap, ScrollTrigger } from "@/lib/gsap";

/** Entrada suave (sobe e aparece) de todo elemento com [data-reveal]. */
export default function Reveals() {
  useEffect(() => {
    // Desliga a rede de segurança do CSS: daqui em diante quem revela é este componente
    document.documentElement.classList.add("reveals-on");
    if (document.documentElement.classList.contains("reduced")) return;
    const pending = new Set<HTMLElement>();
    const done = new WeakSet<HTMLElement>();
    const collect = (root: Element | Document) => {
      if (root instanceof HTMLElement && root.matches("[data-reveal]") && !done.has(root)) pending.add(root);
      root.querySelectorAll<HTMLElement>("[data-reveal]").forEach((el) => !done.has(el) && pending.add(el));
    };
    collect(document);

    // Revela tudo o que já está (ou já passou) da faixa visível, inclusive após saltos de âncora.
    let queued = false;
    const check = () => {
      queued = false;
      const limit = window.innerHeight * 0.9;
      const batch: HTMLElement[] = [];
      const passed: HTMLElement[] = [];
      pending.forEach((el) => {
        if (!el.isConnected) return void pending.delete(el);
        const r = el.getBoundingClientRect();
        if (r.top < limit) {
          // O que já ficou acima da tela aparece direto, sem entrar na fila do escalonamento
          (r.bottom < 0 ? passed : batch).push(el);
          pending.delete(el);
          done.add(el);
        }
      });
      if (passed.length) gsap.set(passed, { opacity: 1, y: 0, overwrite: true });
      if (batch.length)
        gsap.to(batch, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out", stagger: 0.07, overwrite: true });
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

    // Elementos que entram depois (ex.: a versão estática de uma seção escolhida após medir o aparelho)
    const mo = new MutationObserver((records) => {
      let added = false;
      records.forEach((r) => r.addedNodes.forEach((n) => n instanceof Element && (collect(n), (added = true))));
      if (added) onScroll();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    // Quem navega pelo teclado não espera a animação: o bloco com foco aparece na hora
    const onFocus = (e: FocusEvent) => {
      const el = (e.target as Element | null)?.closest<HTMLElement>("[data-reveal]");
      if (!el || !pending.has(el)) return;
      pending.delete(el);
      done.add(el);
      gsap.set(el, { opacity: 1, y: 0, overwrite: true });
    };
    document.addEventListener("focusin", onFocus);

    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh);
    return () => {
      window.clearTimeout(settle);
      offLenis?.();
      mo.disconnect();
      document.removeEventListener("focusin", onFocus);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("load", refresh);
    };
  }, []);
  return null;
}
