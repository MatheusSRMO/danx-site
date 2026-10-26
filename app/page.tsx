import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import Hero from "@/components/sections/Hero";
import Manifesto from "@/components/sections/Manifesto";
import ProductStory from "@/components/sections/ProductStory";
import Assessments from "@/components/sections/Assessments";
import Lifestyle from "@/components/sections/Lifestyle";
import Report from "@/components/sections/Report";
import Management from "@/components/sections/Management";
import Audience from "@/components/sections/Audience";
import Specs from "@/components/sections/Specs";
import Pricing from "@/components/sections/Pricing";
import Docs from "@/components/sections/Docs";
import Faq from "@/components/sections/Faq";
import Quote from "@/components/sections/Quote";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="conteudo">
        <Hero />
        <Manifesto />
        <ProductStory />
        <Assessments />
        <Report />
        <Management />
        <Audience />
        <Lifestyle />
        <Specs />
        <Pricing />
        <Docs />
        <Faq />
        <Quote />
      </main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
