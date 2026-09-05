'use client'

import { useState } from 'react'
import { ShoppingCart, X, Plus, Minus, Trash2 } from 'lucide-react'
import { updateCartItemAction, removeCartItemAction } from '@/app/actions/cart'
import { createCheckoutAction } from '@/app/actions/checkout'
import { Loader2 } from 'lucide-react'

export function CartDrawer({ cart }: { cart: any }) {
  const [isOpen, setIsOpen] = useState(false)
  const [loadingItems, setLoadingItems] = useState<Record<string, boolean>>({})
  const [isCheckingOut, setIsCheckingOut] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity < 1) {
      await handleRemove(productId)
      return
    }
    setLoadingItems(prev => ({ ...prev, [productId]: true }))
    try {
      const res = await updateCartItemAction(productId, quantity)
      if (res && !res.success) {
        alert(res.error)
      }
    } finally {
      setLoadingItems(prev => ({ ...prev, [productId]: false }))
    }
  }

  const handleRemove = async (productId: string) => {
    setLoadingItems(prev => ({ ...prev, [productId]: true }))
    try {
      await removeCartItemAction(productId)
    } finally {
      setLoadingItems(prev => ({ ...prev, [productId]: false }))
    }
  }

  const handleCheckout = async () => {
    setIsCheckingOut(true)
    setCheckoutError(null)
    
    try {
      const result = await createCheckoutAction()
      if (result.success) {
        window.location.assign(result.paymentUrl)
      } else {
        setCheckoutError(result.error)
        setIsCheckingOut(false)
      }
    } catch (e: any) {
      setCheckoutError('Unable to create checkout. Please try again.')
      setIsCheckingOut(false)
    }
  }

  const itemCount = cart?.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
      >
        <ShoppingCart className="w-6 h-6" />
        {itemCount > 0 && (
          <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full">
            {itemCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm" onClick={() => setIsOpen(false)} />
          <div className="w-full max-w-sm bg-white h-full shadow-2xl relative flex flex-col animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-4 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5" /> Your Cart
              </h2>
              <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {!cart || !cart.items || cart.items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4">
                  <div className="w-16 h-16 bg-slate-50 border border-slate-200/60 rounded-full flex items-center justify-center text-slate-300">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="font-medium text-slate-500">Your cart is empty.</p>
                </div>
              ) : (
                cart.items.map((item: any) => (
                  <div key={item.productId} className={`flex gap-3 border border-slate-200/60 p-4 rounded-xl bg-white shadow-sm transition-opacity ${loadingItems[item.productId] ? 'opacity-50' : ''}`}>
                    <div className="flex-1">
                      <h4 className="font-semibold text-slate-900 text-sm mb-1">{item.name}</h4>
                      <div className="text-slate-900 font-bold text-sm mb-3">
                        ₹{(item.unitPricePaise / 100).toLocaleString('en-IN')}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-0.5">
                          <button 
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={loadingItems[item.productId]}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm text-slate-600 rounded-md transition-all disabled:opacity-50"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-sm font-semibold w-6 text-center text-slate-900">{item.quantity}</span>
                          <button 
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            disabled={loadingItems[item.productId]}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white hover:shadow-sm text-slate-600 rounded-md transition-all disabled:opacity-50"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <button 
                          onClick={() => handleRemove(item.productId)}
                          disabled={loadingItems[item.productId]}
                          className="ml-auto p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors border border-transparent hover:border-rose-100 disabled:opacity-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart && cart.items && cart.items.length > 0 && (
              <div className="p-5 border-t border-slate-200/60 bg-slate-50/80 flex flex-col gap-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-500 font-semibold uppercase tracking-wider text-xs">Subtotal</span>
                  <span className="text-xl font-bold text-slate-900">₹{(cart.totalPaise / 100).toLocaleString('en-IN')}</span>
                </div>
                
                {checkoutError && (
                  <div className="text-sm font-semibold text-rose-600 bg-rose-50 p-3 rounded-lg border border-rose-200/60 text-center shadow-sm">
                    {checkoutError}
                  </div>
                )}
                
                <button 
                  onClick={handleCheckout}
                  disabled={isCheckingOut}
                  className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {isCheckingOut && <Loader2 className="w-5 h-5 animate-spin" />}
                  {isCheckingOut ? 'Creating checkout...' : 'Proceed to Checkout'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
