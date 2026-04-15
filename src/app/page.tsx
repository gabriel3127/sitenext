import type { Metadata } from "next"
import dynamic from "next/dynamic"
import Navbar from "@/components/Navbar"
import HeroSection from "@/components/sections/HeroSection"
import Footer from "@/components/Footer"
import WhatsAppButton from "@/components/WhatsAppButton"
import MobileBottomNav from "@/components/MobileBottomNav"

// Componentes abaixo do fold — carregam depois do hero
const SocialProof       = dynamic(() => import("@/components/sections/SocialProof"))
const ProductGrid       = dynamic(() => import("@/components/sections/ProductGrid"))
const AboutSection      = dynamic(() => import("@/components/sections/AboutSection"))
const InstagramFeed     = dynamic(() => import("@/components/sections/InstagramFeed"))
const LocationSection   = dynamic(() => import("@/components/sections/LocationSection"))
const ConversionSection = dynamic(() => import("@/components/sections/ConversionSection"))
const FaqSection        = dynamic(() => import("@/components/sections/FaqSection"))

export const metadata: Metadata = {
  title: "PSR Embalagens | Distribuidora de Embalagens em Brasília",
  description:
    "Distribuidora de embalagens para mercados, gastronomia, lavanderias e muito mais. Entrega grátis no DF e entorno. Atendimento rápido no CEASA Brasília.",
  alternates: {
    canonical: "https://www.psrembalagens.com.br/",
  },
  openGraph: {
    title: "PSR Embalagens | Distribuidora de Embalagens em Brasília",
    description:
      "Embalagens para mercados, gastronomia, lavanderias e mais. Entrega grátis no DF.",
    url: "https://www.psrembalagens.com.br/",
    images: [
      {
        url: "https://www.psrembalagens.com.br/og-image.webp",
        width: 1200,
        height: 630,
        alt: "PSR Embalagens",
      },
    ],
  },
}

export default function Home() {
  return (
    <div className="min-h-screen bg-background pb-16 lg:pb-0">
      <Navbar />
      <main>
        <HeroSection />
        <SocialProof />
        <ProductGrid />
        <AboutSection />
        <InstagramFeed />
        <LocationSection />
        <ConversionSection />
        <FaqSection />
      </main>
      <Footer />
      <WhatsAppButton />
      <MobileBottomNav />
    </div>
  )
}