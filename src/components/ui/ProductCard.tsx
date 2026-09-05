'use client'

import { useState } from 'react'
import { Star, ShoppingCart, Loader2 } from 'lucide-react'
import { addToCartAction } from '@/app/actions/cart'

export interface ProductView {
  id: string
  name: string
  description?: string | null
  pricePaise: number
  inventory: number
  category?: string | null
  imageUrl?: string // Optional for demo
}

export function ProductCard({ product }: { product: ProductView }) {
  const [isAdding, setIsAdding] = useState(false)
  const priceINR = product.pricePaise / 100

  const handleAdd = async () => {
    setIsAdding(true)
    try {
      const res = await addToCartAction(product.id, 1)
      if (res && !res.success) {
        alert(res.error)
      }
    } finally {
      setIsAdding(false)
    }
  }

  return (
    <div className="bg-white border border-slate-200/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-slate-300 transition-all group flex flex-col h-full">
      <div className="aspect-square bg-slate-50 relative border-b border-slate-100 overflow-hidden">
        <img 
          src={product.imageUrl || `https://placehold.co/600x600/f8fafc/94a3b8?text=${encodeURIComponent(product.name)}`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="font-semibold text-slate-900 leading-tight">{product.name}</h3>
          <span className="font-bold text-slate-900 text-sm whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md border border-slate-200/60">
            ₹{priceINR.toLocaleString('en-IN')}
          </span>
        </div>
        <p className="text-sm text-slate-500 mb-3 line-clamp-2 flex-1">{product.description}</p>
        
        <div className="flex items-center justify-between mb-4">
          <span className={`text-xs font-semibold px-2 py-1 rounded-md border ${product.inventory > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' : 'bg-slate-50 text-slate-500 border-slate-200/60'}`}>
            {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
          </span>
        </div>
        
        <div className="flex gap-2 mt-auto">
          <button className="flex-1 bg-white border border-slate-200/60 text-slate-700 text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-50 hover:border-slate-300 transition-all">
            View
          </button>
          <button 
            onClick={handleAdd}
            disabled={isAdding || product.inventory === 0}
            className="flex-[2] bg-slate-900 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-slate-800 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:hover:bg-slate-900 shadow-sm"
          >
            {isAdding ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
            {isAdding ? 'Adding...' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </div>
  )
}
