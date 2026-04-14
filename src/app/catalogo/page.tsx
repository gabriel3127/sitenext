import type { Metadata } from "next"
import { Suspense } from 'react'
import { getProdutos, getSetores, getCategorias } from "@/lib/queries"
import CatalogoClient from "./CatalogoClient"

export const metadata: Metadata = {
  title: "Catálogo de Embalagens | PSR Embalagens Brasília",
  description:
    "Explore o catálogo completo de embalagens para gastronomia, mercados, lavanderias e mais. Entrega grátis no DF e entorno.",
  alternates: {
    canonical: "https://www.psrembalagens.com.br/catalogo",
  },
}

// 1. Create a wrapper component to handle the async data fetching
async function CatalogoData() {
  const [produtos, setores, categorias] = await Promise.all([
    getProdutos(),
    getSetores(),
    getCategorias(),
  ])

  return (
    <CatalogoClient
      produtos={produtos}
      setores={setores}
      categorias={categorias}
    />
  )
}

// 2. The main page component
export default function CatalogoPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Nosso Catálogo</h1>
      
      {/* The Suspense boundary MUST wrap the component 
        that calls useSearchParams() (which is inside CatalogoClient).
      */}
      <Suspense fallback={<div>Carregando catálogo...</div>}>
        <CatalogoData />
      </Suspense>
    </main>
  )
}
