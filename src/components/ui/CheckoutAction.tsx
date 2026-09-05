'use client'

import { useState } from 'react'
import { Loader2, CreditCard } from 'lucide-react'
import Script from 'next/script'

interface CheckoutData {
  orderId: string
  orderNumber: string
  razorpayOrderId: string
  amountPaise: number
  currency: string
  razorpayKeyId: string
}

export function CheckoutAction({ checkout }: { checkout: CheckoutData }) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  
  const handleCheckout = () => {
    if (!(window as any).Razorpay) {
      alert('Razorpay SDK not loaded')
      return
    }
    
    if (!checkout.razorpayKeyId) {
      alert('Configuration Error: Razorpay credentials are not configured.')
      return
    }
    
    setIsProcessing(true)
    setMessage(null)
    
    const options = {
      key: checkout.razorpayKeyId,
      amount: checkout.amountPaise,
      currency: checkout.currency,
      name: 'Nivarah Demo',
      description: `Order ${checkout.orderNumber}`,
      order_id: checkout.razorpayOrderId,
      handler: function (response: any) {
        setMessage('Payment submitted. Waiting for confirmation...')
        setIsProcessing(false)
      },
      prefill: {
        name: 'Demo Customer',
        email: 'customer@example.com',
      },
      theme: {
        color: '#0f172a'
      },
      modal: {
        ondismiss: function() {
          setIsProcessing(false)
        }
      }
    }
    
    const rzp = new (window as any).Razorpay(options)
    rzp.on('payment.failed', function (response: any) {
      setMessage('Payment failed or was cancelled.')
      setIsProcessing(false)
    })
    rzp.open()
  }

  return (
    <div className="mt-4 p-5 border border-slate-200/60 bg-white rounded-xl shadow-sm flex flex-col items-start gap-4">
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <div className="text-sm text-slate-700 font-medium">
        Order <span className="font-bold text-slate-900">{checkout.orderNumber}</span> is ready for payment. 
        <div className="text-lg font-bold text-slate-900 mt-1">Total: ₹{(checkout.amountPaise / 100).toLocaleString('en-IN')}</div>
      </div>
      
      {message && (
        <div className="text-sm font-semibold text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-200/60 w-full text-center">
          {message}
        </div>
      )}
      
      <button 
        onClick={handleCheckout}
        disabled={isProcessing}
        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-3 px-6 rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
        {isProcessing ? 'Processing...' : 'Complete Payment'}
      </button>
      <div className="text-[10px] text-slate-400 font-bold uppercase tracking-widest w-full text-center">
        Test Mode
      </div>
    </div>
  )
}
