"use client";

export type Tier = "none" | "low" | "high";

let cached: Tier | null = null;

/** Decide quanto WebGL o aparelho aguenta. "none" = sem WebGL ou movimento reduzido. */
export function getTier(): Tier {
  if (cached) return cached;
  if (typeof window === "undefined") return "none";
  // Permite testar cada modo: ?tier=high | low | none
  const forced = new URLSearchParams(window.location.search).get("tier");
  if (forced === "high" || forced === "low" || forced === "none") return (cached = forced);
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return (cached = "none");
  try {
    const c = document.createElement("canvas");
    const gl = c.getContext("webgl2") || c.getContext("webgl");
    if (!gl) return (cached = "none");
  } catch {
    return (cached = "none");
  }
  const nav = navigator as Navigator & { deviceMemory?: number };
  const cores = nav.hardwareConcurrency || 4;
  const mem = nav.deviceMemory ?? 8;
  const small = window.innerWidth < 760;
  cached = cores <= 4 || mem <= 4 || small ? "low" : "high";
  return cached;
}

export const isTouch = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: none)").matches;
