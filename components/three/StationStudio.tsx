"use client";
import { Environment, Lightformer } from "@react-three/drei";

export type StudioVariant = "site" | "light" | "dark";

/**
 * Luz de estúdio por softboxes (sem HDR externo).
 * - light: imita o estúdio do render oficial em 3/4 (fundo branco atrás e acima, piso à frente mais escuro): o vidro
 *   preto fica grafite de frente e cinza-claro de raspão, como no original.
 * - dark: imita o render oficial da base de perto (fundo preto, luz principal à frente e à esquerda).
 * - site: a luz usada até aqui no site.
 */
export default function StationStudio({ variant = "site" }: { variant?: StudioVariant }) {
  if (variant === "light")
    return (
      <Environment resolution={512} frames={1} environmentIntensity={1.15}>
        <color attach="background" args={["#1c1e21"]} />
        {/* Cúpula clara acima e fundo branco atrás do produto */}
        <Lightformer intensity={0.55} rotation-x={Math.PI / 2} position={[0, 7, 0]} scale={[24, 24, 1]} />
        <Lightformer intensity={2.2} position={[0, 3, -9]} scale={[40, 10, 1]} />
        {/* Parede à frente, acima da câmera: o vidro da torre reflete grafite; o piso à frente fica escuro */}
        <Lightformer intensity={0.6} rotation-y={Math.PI} position={[0, 3.4, 7]} scale={[16, 4, 1]} />
        {/* Faixas laterais que desenham os filetes de luz nos tubos e nas arestas */}
        <Lightformer intensity={3.2} rotation-y={Math.PI / 2} position={[-3.5, 1.4, 2]} scale={[0.8, 8, 1]} />
        <Lightformer intensity={2.4} rotation-y={-Math.PI / 2} position={[3.5, 1.4, 1.5]} scale={[0.8, 8, 1]} />
      </Environment>
    );
  if (variant === "dark")
    return (
      <Environment resolution={512} frames={1} environmentIntensity={1.15}>
        <color attach="background" args={["#000000"]} />
        <Lightformer intensity={4.5} rotation-y={-Math.PI / 4} position={[-4, 1.6, 4]} scale={[3, 5, 1]} />
        <Lightformer intensity={1.2} rotation-x={Math.PI / 2} position={[0, 6, 1]} scale={[6, 4, 1]} />
        <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-4, 1.2, -1]} scale={[0.6, 6, 1]} />
      </Environment>
    );
  return (
    <Environment resolution={512} frames={1} environmentIntensity={1.15}>
      {/* Estúdio de tom médio: o vidro fica grafite e o alumínio mostra a cor */}
      <color attach="background" args={["#3b3f46"]} />
      <Lightformer intensity={2.6} rotation-x={Math.PI / 2} position={[0, 5, 0.5]} scale={[7, 5, 1]} />
      <Lightformer intensity={3.2} rotation-y={Math.PI / 2} position={[-3.5, 1.4, 2]} scale={[0.8, 8, 1]} />
      <Lightformer intensity={1.6} rotation-y={Math.PI / 2} position={[-3.5, 1.4, -1.2]} scale={[0.5, 8, 1]} />
      <Lightformer intensity={2.4} rotation-y={-Math.PI / 2} position={[3.5, 1.4, 1.5]} scale={[0.8, 8, 1]} />
      <Lightformer intensity={0.9} position={[0, 1.4, 6]} scale={[10, 2.5, 1]} />
      <Lightformer intensity={1.4} rotation-x={-Math.PI / 2} position={[0, -3, 0]} scale={[8, 8, 1]} color="#eef0f3" />
    </Environment>
  );
}
