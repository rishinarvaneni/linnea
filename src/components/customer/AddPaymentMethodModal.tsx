'use client'

import { useState } from 'react'
import { addTestPaymentMethod } from '@/lib/actions/payment-methods'
import { AlertCircle, CreditCard, X } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
}

export function AddPaymentMethodModal({ isOpen, onClose }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSave = async () => {
    setIsSubmitting(true)
    setError(null)
    try {
      const res = await addTestPaymentMethod()
      if (res.success) {
        onClose()
      } else {
        setError('Failed to add payment method.')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-900">Add Test Payment Method</h2>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="flex gap-3 text-amber-800 bg-amber-50 p-4 rounded-lg border border-amber-200">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold mb-1">Sandbox Environment</p>
              <p>This is a sandbox payment method for demonstrating the AI purchase flow. It is not a real reusable card token.</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white p-2 border border-slate-200 rounded-md">
                  <CreditCard className="w-6 h-6 text-slate-700" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Visa</p>
                  <p className="text-sm text-slate-500 font-mono">•••• 4242</p>
                </div>
              </div>
              <div className="text-xs font-semibold px-2 py-1 bg-slate-200 text-slate-700 rounded uppercase">
                Card
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 bg-slate-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            {isSubmitting ? 'Saving...' : 'Save Payment Method'}
          </button>
        </div>
      </div>
    </div>
  )
}
