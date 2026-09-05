'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ProductCard, ProductView } from '@/components/ui/ProductCard'
import { Search, Mic, Sparkles, Filter, ChevronDown, Check } from 'lucide-react'

export function StorefrontClient({ products }: { products: ProductView[] }) {
  const router = useRouter()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [aiQuery, setAiQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedAvailability, setSelectedAvailability] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'RECOMMENDED' | 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'NEWEST' | 'AVAILABILITY'>('RECOMMENDED')

  // Derived Categories
  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean) as string[])
    return Array.from(cats)
  }, [products])

  // Filtering and Sorting
  const filteredProducts = useMemo(() => {
    let result = [...products]

    // 1. Text Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.category && p.category.toLowerCase().includes(q))
      )
    }

    // 2. Category Filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory)
    }

    // 3. Availability Filter
    if (selectedAvailability === 'IN_STOCK') {
      result = result.filter(p => p.inventory > 0)
    } else if (selectedAvailability === 'OUT_OF_STOCK') {
      result = result.filter(p => p.inventory === 0)
    }

    // 4. Sort
    result.sort((a, b) => {
      if (sortBy === 'PRICE_LOW_HIGH') return a.pricePaise - b.pricePaise
      if (sortBy === 'PRICE_HIGH_LOW') return b.pricePaise - a.pricePaise
      if (sortBy === 'AVAILABILITY') return b.inventory - a.inventory
      if (sortBy === 'NEWEST') return b.id.localeCompare(a.id) // Fallback using CUID which is roughly time-based
      // RECOMMENDED: Sort by availability first, then arbitrary ID to make it deterministic
      if (sortBy === 'RECOMMENDED') {
        if (a.inventory > 0 && b.inventory === 0) return -1
        if (b.inventory > 0 && a.inventory === 0) return 1
        return a.id.localeCompare(b.id)
      }
      return 0
    })

    return result
  }, [products, searchQuery, selectedCategory, selectedAvailability, sortBy])

  // AI Recommendation (Deterministic fallback: 4 available products)
  const aiRecommendations = useMemo(() => {
    return [...products]
      .filter(p => p.inventory > 0)
      .slice(0, 4)
  }, [products])

  const handleAiSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (aiQuery.trim()) {
      router.push(`/shop?q=${encodeURIComponent(aiQuery)}`)
    }
  }

  const handleVoiceShop = () => {
    router.push('/shop?voice=true')
  }

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* Hero Section */}
      <div className="bg-slate-900 text-white px-6 py-16 md:py-24 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Sparkles className="w-64 h-64" />
        </div>
        
        <div className="max-w-4xl mx-auto relative z-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <span>AI-Powered Discovery</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
            Shop smarter with AI
          </h1>
          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Tell us what you're looking for and let your AI shopping assistant find it.
          </p>
          
          <form onSubmit={handleAiSearch} className="max-w-2xl mx-auto flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Sparkles className="w-5 h-5 text-slate-400" />
              </div>
              <input
                type="text"
                placeholder="Ask the AI what you're looking for..."
                className="w-full pl-12 pr-4 py-4 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-xl font-medium"
                value={aiQuery}
                onChange={(e) => setAiQuery(e.target.value)}
              />
            </div>
            <button
              type="submit"
              className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-indigo-900/20"
            >
              Ask AI
            </button>
            <button
              type="button"
              onClick={handleVoiceShop}
              className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2 border border-white/10"
            >
              <Mic className="w-5 h-5" />
              <span className="hidden md:inline">Voice</span>
            </button>
          </form>

          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm text-slate-400">
            <span>Try:</span>
            <button type="button" onClick={() => router.push('/shop?q=Find+home+decor+under+₹5,000')} className="hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">"Find home decor under ₹5,000"</button>
            <span>•</span>
            <button type="button" onClick={() => router.push('/shop?q=Find+headphones')} className="hover:text-white transition-colors underline decoration-slate-600 underline-offset-4">"Find headphones"</button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto w-full px-6 py-12 flex flex-col gap-16">
        
        {/* AI Recommendations */}
        {aiRecommendations.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">Picked for you by AI</h2>
              <span className="text-xs font-bold px-2.5 py-1 bg-slate-100 text-slate-500 rounded-md ml-2 border border-slate-200 uppercase tracking-wider">Basic Match</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiRecommendations.map(p => (
                <ProductCard key={`ai-${p.id}`} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* Catalog */}
        <section>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">All Products</h2>
              <p className="text-slate-500">Explore our entire catalog.</p>
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search products..." 
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select 
                className="py-2 pl-3 pr-8 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22none%22%20stroke%3D%22%2364748b%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E')] bg-[length:16px] bg-[right_8px_center] bg-no-repeat"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
              >
                <option value="RECOMMENDED">Recommended</option>
                <option value="NEWEST">Newest</option>
                <option value="PRICE_LOW_HIGH">Price: Low to High</option>
                <option value="PRICE_HIGH_LOW">Price: High to Low</option>
                <option value="AVAILABILITY">Availability</option>
              </select>
            </div>
          </div>

          {/* Categories & Filters */}
          <div className="flex flex-wrap gap-2 mb-8 border-b border-slate-100 pb-6">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedCategory === null 
                ? 'bg-slate-900 text-white border-slate-900' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              All Categories
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                  selectedCategory === cat 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}

            <div className="w-px h-6 bg-slate-200 self-center mx-2 hidden sm:block"></div>

            <button
              onClick={() => setSelectedAvailability(prev => prev === 'IN_STOCK' ? null : 'IN_STOCK')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedAvailability === 'IN_STOCK'
                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
              }`}
            >
              In Stock Only
            </button>
          </div>

          {/* Product Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500">Try adjusting your filters or search query.</p>
              <button 
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory(null)
                  setSelectedAvailability(null)
                }}
                className="mt-6 px-4 py-2 text-sm font-medium text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Clear all filters
              </button>
            </div>
          )}

        </section>
      </div>
    </div>
  )
}
