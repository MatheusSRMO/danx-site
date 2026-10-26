"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { gsap, ScrollTrigger } from "@/lib/gsap";

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

export default function SmoothScroll() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let lenis: Lenis | undefined;
    let tick: ((t: number) => void) | undefined;

    if (!reduced) {
      lenis = new Lenis({ lerp: 0.09, smoothWheel: true });
      window.__lenis = lenis;
      lenis.on("scroll", ScrollTrigger.update);
      tick = (t: number) => lenis!.raf(t * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }

    // Âncoras internas com rolagem suave (e foco acessível no destino).
    const onClick = (e: MouseEvent) => {
      // Ctrl/Cmd/Shift-clique e botão do meio seguem o comportamento normal do navegador
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute("href")!;
      if (id.length < 2) return;
      const el = document.getElementById(decodeURIComponent(id.slice(1)));
      if (!el) return;
      e.preventDefault();
      // Pergunta do FAQ: já chega aberta, logo abaixo da barra
      const item = el instanceof HTMLDetailsElement;
      if (item) el.open = true;
      if (lenis) lenis.scrollTo(el, { offset: item ? -96 : 0, duration: 1.6 });
      else el.scrollIntoView();
      if (location.hash !== id) history.pushState(null, "", id);
      if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
      el.focus({ preventScroll: true });
    };
    document.addEventListener("click", onClick);

    return () => {
      document.removeEventListener("click", onClick);
      if (tick) gsap.ticker.remove(tick);
      lenis?.destroy();
      window.__lenis = undefined;
    };
  }, []);
  return null;
}
