// Fontes das telas da estação (desenhadas em canvas).
// next/font/google baixa e hospeda as fontes junto com o site; o canvas só enxerga uma fonte depois que ela é carregada
// (document.fonts.load), por isso loadScreenFonts() precisa ser esperada antes de desenhar.
import { Outfit, Quantico, Roboto, Unbounded } from "next/font/google";

// Texto corrido, rótulos e valores (a interface original usa uma grotesca neutra, estilo Roboto)
const roboto = Roboto({ subsets: ["latin"], weight: ["300", "400", "500", "700"], display: "swap", preload: false });
// Títulos da barra superior e dígitos finos do teclado (geométrica, traço médio)
const outfit = Outfit({ subsets: ["latin"], display: "swap", preload: false });
// Números grandes: itálica larga e pesada como a do original
const unbounded = Unbounded({ subsets: ["latin"], display: "swap", preload: false });
// Letreiros técnicos em itálico (emblema, título do aviso, "concluída")
const quantico = Quantico({ subsets: ["latin"], weight: ["700"], style: ["italic"], display: "swap", preload: false });

export const FAM = {
  text: roboto.style.fontFamily,
  title: outfit.style.fontFamily,
  num: unbounded.style.fontFamily,
  tech: quantico.style.fontFamily,
};

const FALLBACK = {
  text: "Roboto, system-ui, sans-serif",
  title: "system-ui, sans-serif",
  num: "system-ui, sans-serif",
  tech: "system-ui, sans-serif",
};

let loaded = false;
let loading: Promise<void> | null = null;

/** true depois que todas as fontes foram carregadas (os caches de desenho só valem a partir daí). */
export function fontsReady() {
  return loaded;
}

/** Carrega as fontes das telas. Se alguma falhar, as telas usam uma fonte do sistema no lugar. */
export function loadFonts(): Promise<void> {
  if (loaded) return Promise.resolve();
  if (loading) return loading;
  if (typeof document === "undefined" || !document.fonts) {
    loaded = true;
    return Promise.resolve();
  }
  const specs = [
    `300 40px ${FAM.text}`,
    `400 40px ${FAM.text}`,
    `500 40px ${FAM.text}`,
    `700 40px ${FAM.text}`,
    `300 40px ${FAM.title}`,
    `400 40px ${FAM.title}`,
    `500 40px ${FAM.title}`,
    `800 40px ${FAM.num}`,
    `italic 700 40px ${FAM.tech}`,
  ];
  const sample = "AaÇçÃãÉéÚú0123456789 %:.,";
  loading = Promise.all(specs.map((s) => document.fonts.load(s, sample).catch(() => [])))
    .then(() => undefined)
    .catch(() => undefined)
    .then(() => {
      loaded = true;
      loading = null;
    });
  return loading;
}

/** Família a usar: a fonte hospedada quando carregou, senão um substituto do sistema. */
export function fam(k: keyof typeof FAM): string {
  return loaded ? FAM[k] : FALLBACK[k];
}
