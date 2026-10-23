import * as THREE from "three";
import { BOLT_PATH, LOGO_PATHS } from "../Logo";

// Proporção do vetor do logotipo (viewBox 1419,3 × 300)
export const GLASS_LOGO_ASPECT = 1419.3228 / 299.9958;

/** Logotipo DANX serigrafado em branco no vidro da torre, gerado em canvas (sem arquivo externo). */
export function glassLogoTexture() {
  const W = 1024;
  const H = Math.round(W / GLASS_LOGO_ASPECT);
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const g = canvas.getContext("2d")!;
  g.scale(W / 1419.3228, H / 299.9958);
  g.fillStyle = "#ffffff";
  for (const d of LOGO_PATHS) g.fill(new Path2D(d));
  g.fill(new Path2D(BOLT_PATH), "evenodd");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
