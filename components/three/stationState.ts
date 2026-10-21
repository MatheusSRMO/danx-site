// Estado mutável de uma cena da estação: escrito pela rolagem/GSAP e lido a cada frame.
export type StationState = {
  rotY: number;
  rotSmooth: number;
  explode: number;
  explodeSmooth: number;
  screen: number;
  camDist: number;
  camY: number;
  camX: number;
  /** Altura extra da câmera acima do alvo (olhar levemente de cima, como no render oficial). */
  camElev: number;
  /** Campo de visão vertical da câmera (graus). */
  fov: number;
  pointerX: number;
  lift: number;
  drag: number;
  /** Brilho dos eletrodos (0 a 1), usado no capítulo de bioimpedância. */
  glow: number;
  glowSmooth: number;
  /** Ondas do sensor ultrassônico (0 a 1), no capítulo de altura. */
  ultra: number;
  ultraSmooth: number;
  /** Deslocamento do enquadramento, em fração da tela (para abrir espaço ao texto). */
  viewX: number;
  viewY: number;
};

export function createStationState(init: Partial<StationState> = {}): StationState {
  return {
    rotY: -0.55,
    rotSmooth: -1.9,
    explode: 0,
    explodeSmooth: 0,
    screen: 0,
    camDist: 7.4,
    camY: 1.08,
    camX: 0,
    camElev: 0.12,
    fov: 20,
    pointerX: 0,
    lift: 0,
    drag: 0,
    glow: 0,
    glowSmooth: 0,
    ultra: 0,
    ultraSmooth: 0,
    viewX: 0,
    viewY: 0,
    ...init,
  };
}
