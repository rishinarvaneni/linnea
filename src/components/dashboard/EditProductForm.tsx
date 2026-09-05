'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, Image as ImageIcon } from 'lucide-react'
import { editProduct } from '@/lib/actions/products'

export function EditProductForm({ product }: { product: any }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [previewUrl, setPreviewUrl] = useState<string | null>(product.imageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file.')
        return
      }
      if (file.size > 5 * 1024 * 1024) {
        setError('Image must be less than 5MB.')
        return
      }
      setError('')
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(product.imageUrl || null)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    const formData = new FormData(e.currentTarget)
    
    try {
      const result = await editProduct(product.id, formData)
      if (result.success) {
        router.push('/dashboard/products')
        router.refresh()
      } else {
        setError(result.error || 'Failed to update product')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mt-6">
      <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-medium rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Product Name *</label>
              <input 
                required
                name="name"
                defaultValue={product.name}
                type="text" 
                placeholder="e.g. Premium Wireless Headphones"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Price (₹) *</label>
                <input 
                  required
                  name="price"
                  defaultValue={product.pricePaise / 100}
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="2999"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm text-slate-900"
                />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-semibold text-slate-700">Stock Inventory *</label>
                <input 
                  required
                  name="stock"
                  defaultValue={product.inventory}
                  type="number" 
                  min="0"
                  placeholder="100"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm text-slate-900"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Category</label>
              <input 
                name="category"
                defaultValue={product.category || ''}
                type="text" 
                placeholder="e.g. Electronics"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm text-slate-900"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Status</label>
              <select
                name="active"
                defaultValue={product.active ? 'true' : 'false'}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm text-slate-900 bg-white"
              >
                <option value="true">Active (Visible in store)</option>
                <option value="false">Inactive (Hidden)</option>
              </select>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Description</label>
              <textarea 
                name="description"
                defaultValue={product.description || ''}
                rows={5}
                placeholder="Product details and specifications..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm text-slate-900 resize-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-slate-700">Product Image</label>
              <div 
                className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer group relative"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="space-y-2 text-center w-full">
                  {previewUrl ? (
                    <div className="relative w-full max-w-[200px] aspect-square mx-auto rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-white">
                      <img src={previewUrl} alt="Preview" className="object-cover w-full h-full" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-xs font-semibold">Change Image</span>
                      </div>
                    </div>
                  ) : (
                    <ImageIcon className="mx-auto h-12 w-12 text-slate-400 group-hover:text-slate-500 transition-colors" />
                  )}
                  <div className="flex text-sm text-slate-600 justify-center mt-4">
                    <span className="relative font-semibold text-blue-600 hover:text-blue-500">
                      Upload a new file
                    </span>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-slate-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
              <input 
                ref={fileInputRef}
                name="image"
                type="file" 
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-slate-100 flex justify-end gap-3 mt-8">
          <button
            type="button"
            onClick={() => router.push('/dashboard/products')}
            className="px-5 py-2.5 text-sm font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
