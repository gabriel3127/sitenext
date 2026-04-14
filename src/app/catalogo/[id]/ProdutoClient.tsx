"use client"

import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  ShoppingBag, Plus, Minus, ChevronRight, ChevronLeft,
  Check, Trash2, ArrowRight, X, ZoomIn, Send
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { ProdutoComRelacoes } from "@/lib/types"

const CART_KEY = "psr_cart"

interface CartItem {
  id: number | string
  nome: string
  foto_url: string | null
  qty: number
}

interface Props {
  produto: ProdutoComRelacoes
  todosProdutos: ProdutoComRelacoes[]
}

const getCart = (): CartItem[] => {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(CART_KEY) || "[]") } catch { return [] }
}
const saveCart = (cart: CartItem[]) => localStorage.setItem(CART_KEY, JSON.stringify(cart))

// ─── Lightbox ─────────────────────────────────────────────────────────────────
const Lightbox = ({ images, startIndex, onClose }: { images: string[]; startIndex: number; onClose: () => void }) => {
  const [current, setCurrent] = useState(startIndex)
  const prev = () => setCurrent(i => (i - 1 + images.length) % images.length)
  const next = () => setCurrent(i => (i + 1) % images.length)
  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4" onClick={onClose}>
        <button onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-colors">
          <X className="w-6 h-6" />
        </button>
        <motion.img key={current} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }} src={images[current]} alt=""
          className="max-h-[85vh] max-w-[90vw] object-contain rounded-lg shadow-2xl"
          onClick={e => e.stopPropagation()} />
        {images.length > 1 && (
          <>
            <button onClick={e => { e.stopPropagation(); prev() }}
              className="absolute left-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 text-2xl">‹</button>
            <button onClick={e => { e.stopPropagation(); next() }}
              className="absolute right-4 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 text-2xl">›</button>
            <div className="absolute bottom-4 flex gap-2">
              {images.map((_, i) => (
                <button key={i} onClick={e => { e.stopPropagation(); setCurrent(i) }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`} />
              ))}
            </div>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  )
}

// ─── Parser de variações ──────────────────────────────────────────────────────
interface GrupoVariacao {
  label: string
  valores: string[]
  desativados?: string[]
  fotos?: Record<string, number>
}

interface ParsedVariacoes {
  grupos: GrupoVariacao[]
  combinacoes: string[][] | null
}

const parseVariacoes = (raw: any): ParsedVariacoes => {
  if (!raw) return { grupos: [], combinacoes: null }
  const data = typeof raw === "string" ? JSON.parse(raw) : raw
  if (Array.isArray(data)) return { grupos: data, combinacoes: null }
  return { grupos: data.grupos || [], combinacoes: data.combinacoes ?? null }
}

// ─── Hook de combinações ──────────────────────────────────────────────────────
const useCombinacoes = (grupos: GrupoVariacao[], combinacoes: string[][] | null) => {
  const comboSet = useMemo(() => {
    if (combinacoes === null) return null
    return new Set(combinacoes.map(c => c.join("|||")))
  }, [combinacoes])

  const isValueAvailable = (grupoLabel: string, valor: string, selecoes: Record<string, string>) => {
    if (comboSet === null) return true
    const testSel = { ...selecoes, [grupoLabel]: valor }
    const check = (gIdx: number, partial: string[]): boolean => {
      if (gIdx === grupos.length) return comboSet.has(partial.join("|||"))
      const g = grupos[gIdx]
      const fixed = testSel[g.label]
      const candidates = fixed ? [fixed] : g.valores
      return candidates.some(v => check(gIdx + 1, [...partial, v]))
    }
    return check(0, [])
  }

  return { isValueAvailable }
}

// ─── Seletores de variação ────────────────────────────────────────────────────
interface SeletoresProps {
  grupos: GrupoVariacao[]
  combinacoes: string[][] | null
  selecoes: Record<string, string>
  onSelect: (label: string, val: string) => void
}

const Seletores = ({ grupos, combinacoes, selecoes, onSelect }: SeletoresProps) => {
  const { isValueAvailable } = useCombinacoes(grupos, combinacoes)
  return (
    <div className="mt-6 space-y-5">
      <p className="text-sm font-bold text-gray-900 uppercase tracking-wide">Selecione as variações desejadas</p>
      {grupos.map(g => (
        <div key={g.label}>
          <p className="text-xs font-bold text-[#1A50A0] mb-2">{g.label}</p>
          <div className="grid grid-cols-3 gap-1.5">
            {g.valores.map(val => {
              const desativado = (g.desativados || []).includes(val)
              const available = !desativado && isValueAvailable(g.label, val, selecoes)
              const selected = selecoes[g.label] === val
              return (
                <button key={val} onClick={() => available && onSelect(g.label, val)} disabled={!available}
                  className={`w-full px-2 py-2 rounded-lg border text-xs font-medium transition-all text-center ${
                    selected ? "bg-[#1A50A0] text-white border-[#1A50A0]"
                    : available ? "border-gray-200 bg-white text-gray-900 hover:border-[#1A50A0]/50"
                    : "border-gray-100 bg-gray-50 text-gray-300 line-through cursor-not-allowed"
                  }`}>
                  {val}
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Card produto relacionado ─────────────────────────────────────────────────
const RelatedCard = ({ product }: { product: ProdutoComRelacoes }) => (
  <Link href={`/catalogo/${product.id}`}
    className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-md hover:-translate-y-1 transition-all duration-300">
    <div className="aspect-square overflow-hidden bg-gray-50 relative">
      {product.foto_url ? (
        <Image src={product.foto_url} alt={product.nome} fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 768px) 50vw, 25vw" />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-gray-300">
          <ShoppingBag className="w-8 h-8" />
        </div>
      )}
    </div>
    <div className="p-3">
      {product.categorias && (
        <span className="text-xs font-semibold text-[#1A50A0] uppercase tracking-wide">{product.categorias.nome}</span>
      )}
      <h3 className="font-semibold text-gray-900 text-sm mt-0.5 leading-snug line-clamp-2 group-hover:text-[#1A50A0] transition-colors">
        {product.nome}
      </h3>
    </div>
  </Link>
)

// ═══════════════════════════════════════════════════════════════════════════════
export default function ProdutoClient({ produto, todosProdutos }: Props) {
  const [activeImg, setActiveImg] = useState(0)
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const [added, setAdded] = useState(false)
  const [selecao, setSelecao] = useState<Record<string, string>>({})
  const [qty, setQty] = useState(1)
  const [cartCount, setCartCount] = useState(0)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartItem[]>([])

  useEffect(() => {
    const c = getCart()
    setCartItems(c)
    setCartCount(c.reduce((s, i) => s + i.qty, 0))
    window.scrollTo(0, 0)
  }, [produto.id])

  const refreshCart = () => {
    const c = getCart()
    setCartItems(c)
    setCartCount(c.reduce((s, i) => s + i.qty, 0))
  }

  const removeFromCart = (itemId: number | string) => {
    const next = getCart().filter(i => i.id !== itemId)
    saveCart(next); refreshCart()
  }

  const updateCartQty = (itemId: number | string, delta: number) => {
    const next = getCart()
      .map(i => i.id === itemId ? { ...i, qty: Math.max(0, i.qty + delta) } : i)
      .filter(i => i.qty > 0)
    saveCart(next); refreshCart()
  }

  const sendWhatsApp = () => {
    const linhas = cartItems.map(item =>
      `▸ *${item.nome}*\n   Quantidade: ${item.qty} unidade${item.qty > 1 ? "s" : ""}`
    )
    const msg = [
      "🛒 *SOLICITAÇÃO DE ORÇAMENTO*",
      "*PSR Embalagens* — Catálogo Online",
      "",
      "━━━━━━━━━━━━━━━━",
      "📦 *PRODUTOS SELECIONADOS*",
      "",
      linhas.join("\n\n"),
      "",
      "━━━━━━━━━━━━━━━━",
      "📍 Pedido feito pelo catálogo online",
      "🌐 psrembalagens.com.br",
    ].join("\n")
    window.open(`https://wa.me/5561993177107?text=${encodeURIComponent(msg)}`, "_blank")
  }

  // ── Derivações ────────────────────────────────────────────────────────────
  const imagens = useMemo(() =>
    (produto.fotos?.length ? produto.fotos : [produto.foto_url]).filter(Boolean) as string[]
  , [produto])

  const { grupos, combinacoes } = useMemo(() => parseVariacoes(produto.variacoes), [produto])

  const fotoIdxDaSelecao = useMemo(() => {
    const todosSelected = grupos.filter(g => g.valores.length > 0).every(g => selecao[g.label])
    if (!todosSelected) return null
    for (let i = grupos.length - 1; i >= 0; i--) {
      const g = grupos[i]
      const val = selecao[g.label]
      if (val && g.fotos && g.fotos[val] !== undefined) return g.fotos[val]
    }
    return null
  }, [grupos, selecao])

  const imgExibida = fotoIdxDaSelecao !== null ? fotoIdxDaSelecao : activeImg
  const todosGruposSelecionados = grupos.length === 0 || grupos.every(g => selecao[g.label])
  const temVariacoes = grupos.length > 0
  const podeAdicionar = !temVariacoes || todosGruposSelecionados

  const handleSelect = (label: string, val: string) => {
    setSelecao(prev => ({ ...prev, [label]: prev[label] === val ? "" : val }))
  }

  const handleAddToCart = () => {
    if (!produto || !podeAdicionar) return
    const cart = getCart()
    if (temVariacoes) {
      const descricaoCombo = grupos.map(g => `${g.label}: ${selecao[g.label]}`).join(" / ")
      const nomeCompleto = `${produto.nome} — ${descricaoCombo}`
      const itemKey = `${produto.id}_${JSON.stringify(selecao)}`
      const fotoCarrinho = fotoIdxDaSelecao !== null && imagens[fotoIdxDaSelecao]
        ? imagens[fotoIdxDaSelecao] : produto.foto_url
      const existing = cart.find(i => i.id === itemKey)
      saveCart(existing
        ? cart.map(i => i.id === itemKey ? { ...i, qty: i.qty + qty } : i)
        : [...cart, { id: itemKey, nome: nomeCompleto, foto_url: fotoCarrinho, qty }])
    } else {
      const existing = cart.find(i => i.id === produto.id)
      saveCart(existing
        ? cart.map(i => i.id === produto.id ? { ...i, qty: i.qty + qty } : i)
        : [...cart, { id: produto.id, nome: produto.nome, foto_url: produto.foto_url, qty }])
    }
    refreshCart()
    setAdded(true)
    setSelecao({})
    setQty(1)
    setTimeout(() => setAdded(false), 2500)
  }

  // ── Produtos relacionados ─────────────────────────────────────────────────
  const setorSlugs = produto.produto_setores?.map(ps => ps.setores?.slug).filter(Boolean) || []
  const relacionados = todosProdutos
    .filter(p => p.id !== produto.id && p.produto_setores?.some(ps => setorSlugs.includes(ps.setores?.slug)))
    .slice(0, 4)
  const setorNome = produto.produto_setores?.[0]?.setores?.nome

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">

      {/* Toast */}
      <AnimatePresence>
        {added && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="fixed bottom-[72px] lg:bottom-8 left-4 right-4 lg:left-1/2 lg:right-auto lg:-translate-x-1/2 lg:w-auto z-50 flex items-center gap-3 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl"
          >
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-medium whitespace-nowrap">Produto adicionado ao carrinho!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b shadow-sm">
        <div className="container grid grid-cols-3 items-center h-14">
          <Link href="/catalogo"
            className="flex items-center justify-center w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div className="flex justify-center">
            <Image src="/images/psr-logo.svg" alt="PSR Embalagens" width={80} height={32} className="h-8 w-auto" />
          </div>
          <div className="flex justify-end">
            <button onClick={() => { refreshCart(); setCartOpen(true) }}
              className="relative flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <div className="relative">
                <ShoppingBag className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-[#1A50A0] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </div>
              <span className="hidden sm:inline">Carrinho</span>
            </button>
          </div>
        </div>
      </header>

      <div className="container py-8 max-w-5xl">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-gray-400 mb-8">
          <Link href="/" className="hover:text-gray-700 transition-colors">Início</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <Link href="/catalogo" className="hover:text-gray-700 transition-colors">Catálogo</Link>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium">{produto.nome}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">

          {/* ── Galeria ── */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>

            {/* Desktop */}
            <div className="hidden md:flex gap-3">
              {imagens.length > 1 && (
                <div className="flex flex-col gap-2 w-16 flex-shrink-0">
                  {imagens.map((img, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 relative ${
                        imgExibida === i ? "border-[#1A50A0] shadow-sm" : "border-transparent hover:border-gray-200"
                      }`}>
                      <Image src={img} alt="" fill className="object-cover" sizes="64px" />
                    </button>
                  ))}
                </div>
              )}
              <div className="flex-1 rounded-2xl overflow-hidden bg-white border shadow-sm relative group cursor-zoom-in aspect-square"
                onClick={() => imagens.length > 0 && setLightboxOpen(true)}>
                {imagens[imgExibida] ? (
                  <Image src={imagens[imgExibida]} alt={produto.nome} fill className="object-cover" sizes="50vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">sem foto</div>
                )}
                {imagens.length > 0 && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow">
                      <ZoomIn className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile */}
            <div className="md:hidden">
              <div className="rounded-2xl overflow-hidden bg-white border shadow-sm relative group cursor-zoom-in w-full aspect-square"
                onClick={() => imagens.length > 0 && setLightboxOpen(true)}>
                {imagens[imgExibida] ? (
                  <Image src={imagens[imgExibida]} alt={produto.nome} fill className="object-cover" sizes="100vw" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">sem foto</div>
                )}
                {imagens.length > 0 && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow">
                      <ZoomIn className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                )}
              </div>
              {imagens.length > 1 && (
                <div className="flex justify-center gap-1.5 mt-3">
                  {imagens.map((_, i) => (
                    <button key={i} onClick={() => setActiveImg(i)}
                      className={`rounded-full transition-all ${
                        imgExibida === i ? "w-2.5 h-2.5 bg-[#1A50A0]" : "w-2 h-2 bg-gray-300 hover:bg-gray-400"
                      }`} />
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Detalhes ── */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}
            className="flex flex-col">
            {produto.categorias && (
              <span className="inline-block self-start px-3 py-1 rounded-full bg-[#1A50A0]/10 text-[#1A50A0] text-xs font-bold uppercase tracking-wide mb-3">
                {produto.categorias.nome}
              </span>
            )}
            <h1 className="text-3xl font-black text-gray-900 leading-tight">{produto.nome}</h1>
            <p className="mt-3 text-gray-500 leading-relaxed">{produto.descricao}</p>

            {temVariacoes && (
              <Seletores grupos={grupos} combinacoes={combinacoes} selecoes={selecao} onSelect={handleSelect} />
            )}

            {produto.obs && (
              <div className="mt-5 bg-gray-100 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500 leading-relaxed">
                  <span className="font-semibold text-gray-700">Obs:</span> {produto.obs}
                </p>
              </div>
            )}

            {temVariacoes && todosGruposSelecionados && (
              <div className="mt-4 bg-[#1A50A0]/5 border border-[#1A50A0]/20 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-[#1A50A0] mb-1">Selecionado:</p>
                <ul className="space-y-0.5">
                  {grupos.map(g => selecao[g.label] && (
                    <li key={g.label} className="text-xs text-gray-700">— {g.label}: {selecao[g.label]}</li>
                  ))}
                </ul>
              </div>
            )}

            {podeAdicionar && (
              <div className="mt-4 flex items-center gap-3">
                <span className="text-sm font-medium text-gray-700">Quantidade:</span>
                <div className="flex items-center gap-2 border border-gray-200 rounded-xl overflow-hidden">
                  <button onClick={() => setQty(q => Math.max(1, q - 1))}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600">
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-gray-900">{qty}</span>
                  <button onClick={() => setQty(q => q + 1)}
                    className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-600">
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            <div className="mt-6">
              <button onClick={handleAddToCart} disabled={!podeAdicionar}
                className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-white transition-all disabled:opacity-60 ${
                  added ? "bg-green-600" : "bg-[#1A50A0] hover:bg-[#153F80]"
                }`}>
                {added ? (
                  <><Check className="w-4 h-4" /> Adicionado à lista!</>
                ) : !podeAdicionar ? (
                  <><ShoppingBag className="w-4 h-4" /> Selecione as variações</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Adicionar à lista{qty > 1 ? ` (${qty})` : ""}</>
                )}
              </button>
              <p className="mt-2 text-xs text-gray-400 text-center">Finalize seu pedido pelo carrinho no catálogo</p>
            </div>
          </motion.div>
        </div>

        {/* Produtos relacionados */}
        {relacionados.length > 0 && (
          <section className="mt-16 border-t pt-12">
            <div className="flex items-end justify-between mb-6">
              <div>
                <h2 className="text-xl font-black text-gray-900">Produtos Relacionados</h2>
                <p className="text-sm text-gray-400 mt-1">
                  Complete o seu estoque
                  {setorNome && <span className="text-[#1A50A0] font-medium"> · {setorNome}</span>}
                </p>
              </div>
              <Link href="/catalogo" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-[#1A50A0] hover:gap-2 transition-all">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relacionados.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}>
                  <RelatedCard product={p} />
                </motion.div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Carrinho drawer */}
      <AnimatePresence>
        {cartOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setCartOpen(false)} className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 250 }}
              className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md bg-white border-l shadow-xl flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <h2 className="font-bold text-lg text-gray-900">
                  Sua Lista ({cartItems.reduce((s, i) => s + i.qty, 0)})
                </h2>
                <button onClick={() => setCartOpen(false)} className="p-2 text-gray-400 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {cartItems.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400">Lista vazia. Adicione produtos.</p>
                  </div>
                ) : cartItems.map(item => (
                  <div key={String(item.id)} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    {item.foto_url ? (
                      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                        <Image src={item.foto_url} alt={item.nome} fill className="object-cover" sizes="56px" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 text-sm leading-snug line-clamp-2">{item.nome}</p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button onClick={() => removeFromCart(item.id)}
                        className="w-7 h-7 rounded-full hover:bg-red-50 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => updateCartQty(item.id, -1)}
                        className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="text-sm font-bold w-5 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)}
                        className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {cartItems.length > 0 && (
                <div className="p-4 border-t space-y-2">
                  <button onClick={sendWhatsApp}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[#1A50A0] hover:bg-[#153F80] text-white font-semibold transition-colors">
                    <Send className="w-4 h-4" /> Enviar lista pelo WhatsApp
                  </button>
                  <Link href="/catalogo"
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors">
                    Continuar comprando
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {lightboxOpen && <Lightbox images={imagens} startIndex={imgExibida} onClose={() => setLightboxOpen(false)} />}

      {/* Navbar mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t flex items-center lg:hidden">
        {[
          { label: "Início", href: "/", icon: "🏠" },
          { label: "Catálogo", href: "/catalogo", icon: "🛍️" },
          { label: "Blog", href: "/blog", icon: "📖" },
          { label: "Depoimentos", href: "/depoimentos", icon: "💬" },
        ].map(({ label, href, icon }) => (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
              href === "/catalogo" ? "text-[#1A50A0]" : "text-gray-400 hover:text-gray-700"
            }`}>
            <span className="text-lg">{icon}</span>
            <span className={`text-[10px] ${href === "/catalogo" ? "font-bold" : "font-medium"}`}>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}