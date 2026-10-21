import type { Metadata, Viewport } from "next";
import "./globals.css";
import { site } from "@/lib/content";
import SmoothScroll from "@/components/SmoothScroll";
import Reveals from "@/components/Reveals";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `${site.productSeo} | Avaliação corporal inteligente para escolas`,
    template: `%s | DANX`,
  },
  description: site.description,
  keywords: [
    "estação de saúde infantil",
    "triagem de saúde escolar",
    "avaliação de saúde infantil",
    "bioimpedância infantil",
    "avaliação postural escolar",
    "Programa Saúde na Escola",
    "composição corporal crianças",
    "DANX",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: site.url,
    siteName: "DANX",
    title: `${site.productSeo}: saúde em alta definição`,
    description: site.description,
    images: [{ url: "/og.jpg", width: 1200, height: 630, alt: "Estação de Saúde DANX" }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${site.productSeo}: saúde em alta definição`,
    description: site.description,
    images: ["/og.jpg"],
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#fbfaf8",
  width: "device-width",
  initialScale: 1,
};

// Sem preço no JSON-LD até a DANX confirmar o valor (adicionar `offers` depois).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      name: "DANX",
      url: site.url,
      telephone: "+55 27 99292-1830",
    },
    {
      "@type": "Product",
      name: site.productSeo,
      brand: { "@type": "Brand", name: "DANX" },
      description: site.description,
      image: `${site.url}/media/station-studio.webp`,
      category: "Equipamento de avaliação corporal",
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          // Marca o documento antes da hidratação para evitar "flash" de conteúdo animado.
          dangerouslySetInnerHTML={{
            __html:
              "document.documentElement.classList.add('js');if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)document.documentElement.classList.add('reduced');",
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        <SmoothScroll />
        {children}
        <Reveals />
      </body>
    </html>
  );
}
