import type { NextConfig } from "next";

// STATIC_EXPORT=1 gera uma versão estática (pasta out/) para pré-visualização.
// Em produção (Vercel), o build normal mantém a rota /api/cotacao e a otimização de imagens.
const isExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(isExport ? { output: "export", trailingSlash: true } : {}),
  images: {
    unoptimized: isExport,
    formats: ["image/avif", "image/webp"],
  },
  transpilePackages: ["three"],
};

export default nextConfig;
