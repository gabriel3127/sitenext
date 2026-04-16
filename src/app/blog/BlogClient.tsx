"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, ArrowRight, Sparkles,
  Home, ShoppingBag, BookOpen, MessageSquare
 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import type { Post } from "@/lib/types"

interface Props {
  posts: Post[]
}

const CATEGORIA_STYLE: Record<string, { bg: string; dot: string }> = {
  Sustentabilidade: { bg: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500" },
  Dicas:            { bg: "bg-amber-100 text-amber-700",     dot: "bg-amber-500" },
  "Negócios":       { bg: "bg-blue-100 text-blue-700",       dot: "bg-blue-500" },
  default:          { bg: "bg-gray-100 text-gray-600",       dot: "bg-gray-400" },
}

const getCatStyle = (cat?: string | null) =>
  CATEGORIA_STYLE[cat || ""] || CATEGORIA_STYLE.default

const categorias = ["Todos", "Sustentabilidade", "Dicas", "Negócios"]

const formatDate = (iso?: string | null) => {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
}

// ─── Card post normal ─────────────────────────────────────────────────────────
const PostCard = ({ post, index }: { post: Post; index: number }) => {
  const style = getCatStyle(post.categoria)
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:-translate-y-1 hover:shadow-md transition-all duration-300"
    >
      <Link href={`/blog/${post.slug}`}>
        <div className="relative aspect-video overflow-hidden bg-gray-100">
          {post.foto_url ? (
            <Image src={post.foto_url} alt={post.titulo} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 100vw, 33vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">sem foto</div>
          )}
          <span className={`absolute top-3 left-3 flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${style.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {post.categoria?.toUpperCase()}
          </span>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-2">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.created_at)}</span>
            {post.tempo_leitura && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.tempo_leitura}</span>}
          </div>
          <h2 className="font-bold text-gray-900 text-base leading-snug group-hover:text-[#1A50A0] transition-colors">
            {post.titulo}
          </h2>
          <p className="text-sm text-gray-600 mt-2 line-clamp-2">{post.excerpt}</p>
          <span className="inline-flex items-center gap-1 mt-4 text-sm font-semibold text-[#1A50A0] group-hover:gap-2 transition-all">
            Ler mais <ArrowRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </Link>
    </motion.article>
  )
}

// ─── Card destaque ────────────────────────────────────────────────────────────
const FeaturedPost = ({ post }: { post: Post }) => {
  const style = getCatStyle(post.categoria)
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
      className="col-span-full bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-all duration-300"
    >
      <div className="grid md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden bg-gray-100" style={{ maxHeight: "360px" }}>
          {post.foto_url ? (
            <Image src={post.foto_url} alt={post.titulo} fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="50vw" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">sem foto</div>
          )}
          <span className={`absolute top-4 left-4 flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${style.bg}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
            {post.categoria?.toUpperCase()}
          </span>
          <span className="absolute top-4 right-4 flex items-center gap-1 bg-[#F5C200] text-[#0d1f3c] text-xs font-black px-2.5 py-1 rounded-full">
            ★ DESTAQUE
          </span>
        </div>
        <div className="p-8 flex flex-col justify-center">
          <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(post.created_at)}</span>
            {post.tempo_leitura && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{post.tempo_leitura}</span>}
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 leading-tight group-hover:text-[#1A50A0] transition-colors">
            {post.titulo}
          </h2>
          <p className="text-gray-600 mt-3 leading-relaxed">{post.excerpt}</p>
          <div className="mt-6">
            <Link href={`/blog/${post.slug}`}
              className="inline-flex items-center gap-2 bg-[#1A50A0] hover:bg-[#153f80] text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm">
              Ler artigo completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </motion.article>
  )
}

// ═══════════════════════════════════════════════════════════════════════════════
export default function BlogClient({ posts }: Props) {
  const [activeCategoria, setActiveCategoria] = useState("Todos")

  const filtered = activeCategoria === "Todos"
    ? posts
    : posts.filter(p => p.categoria === activeCategoria)

  const featured = filtered.find(p => p.destaque)
  const rest = filtered.filter(p => !p.destaque || p !== featured)

  return (
    <div className="min-h-screen bg-gray-50 pb-16 lg:pb-0">

      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="container flex items-center justify-between h-16">
          <Link href="/">
            <Image src="/images/psr-logo.svg" alt="PSR Embalagens" width={100} height={36} className="h-10 w-auto" />
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-600">
            <Link href="/" className="hover:text-[#1A50A0] transition-colors">Home</Link>
            <Link href="/depoimentos" className="hover:text-[#1A50A0] transition-colors">Depoimentos</Link>
            <Link href="/#sobre" className="hover:text-[#1A50A0] transition-colors">Sobre</Link>
            <Link href="/#contato" className="hover:text-[#1A50A0] transition-colors">Contato</Link>
          </nav>
          <Link href="/catalogo"
            className="flex items-center gap-2 bg-[#1A50A0] hover:bg-[#153f80] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
            Visite nosso Catálogo <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="relative bg-[#0d1f3c] overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `linear-gradient(rgba(245,194,0,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,194,0,0.3) 1px, transparent 1px)`,
            backgroundSize: "48px 48px"
          }} />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-[#1A50A0]/30 to-transparent" />
        <div className="container relative py-16 md:py-24">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="max-w-2xl">
            <span className="inline-flex items-center gap-2 bg-[#F5C200]/20 text-[#F5C200] text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full mb-6">
              <Sparkles className="w-3 h-3" /> Insights &amp; Inovação
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-tight">
              Blog PSR<br /><span className="text-[#F5C200]">Embalagens</span>
            </h1>
            <p className="mt-4 text-gray-300 text-lg max-w-lg leading-relaxed">
              Explorando o futuro da logística e sustentabilidade através de embalagens inteligentes.
            </p>
          </motion.div>
        </div>
      </section>

      <main>
        <div className="container py-12">
          {/* Filtros */}
          <div className="flex flex-wrap gap-2 mb-10 justify-center">
            {categorias.map((cat) => (
              <button key={cat} onClick={() => setActiveCategoria(cat)}
                className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeCategoria === cat
                    ? "bg-[#1A50A0] text-white shadow-sm"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-[#1A50A0] hover:text-[#1A50A0]"
                }`}>
                {cat}
              </button>
            ))}
          </div>

          {filtered.length === 0 ? (
            <p className="text-center text-gray-400 py-16">Nenhum post encontrado.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured && <FeaturedPost post={featured} />}
              {rest.map((post, i) => <PostCard key={post.id} post={post} index={i} />)}
            </div>
          )}

          {/* Footer inline */}
          <footer className="border-t border-gray-200 mt-20 py-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
              <span>© {new Date().getFullYear()} PSR Embalagens. Todos os direitos reservados.</span>
              <div className="flex items-center gap-5">
                <Link href="/" className="hover:text-[#1A50A0] transition-colors">Home</Link>
                <Link href="/catalogo" className="hover:text-[#1A50A0] transition-colors">Catálogo</Link>
                <Link href="/#contato" className="hover:text-[#1A50A0] transition-colors">Contato</Link>
              </div>
            </div>
          </footer>
        </div>
      </main>

      {/* Navbar mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 flex items-center lg:hidden">
        {[
          { label: "Início",      href: "/",            icon: Home },
          { label: "Catálogo",    href: "/catalogo",    icon: ShoppingBag },
          { label: "Blog",        href: "/blog",        icon: BookOpen },
          { label: "Depoimentos", href: "/depoimentos", icon: MessageSquare },
        ].map(({ label, href, icon: Icon }) => (
          <Link key={href} href={href}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
              href === "/catalogo" ? "text-[#1A50A0]" : "text-gray-400 hover:text-gray-600"
            }`}>
            <Icon className="w-5 h-5" />
            <span className={`text-[10px] ${href === "/catalogo" ? "font-bold" : "font-medium"}`}>{label}</span>
          </Link>
        ))}
      </nav>  
    </div>
  )
}
