import type { Metadata } from "next"
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

export default async function CatalogoPage() {
  // Busca paralela no servidor — zero loading no cliente
  const [produtos, setores, categorias] = await Promise.all([
    getProdutos({ ativo: true }),
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