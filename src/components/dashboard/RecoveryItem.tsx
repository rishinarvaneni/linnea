'use client'

import { useState } from 'react'
import { recoverOpportunity } from '@/lib/actions/recovery'
import { Loader2, ExternalLink, AlertCircle } from 'lucide-react'

type OpportunityProps = {
  id: string
  type: string
  customerName: string
  amountPaise: number
  priorityReason: string
  priorityLevel: string
  priorityScore: number
}

export function RecoveryItem({ opp }: { opp: OpportunityProps }) {
  const [isRecovering, setIsRecovering] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentUrl, setPaymentUrl] = useState<string | null>(null)

  const handleRecover = async () => {
    setIsRecovering(true)
    setError(null)

    try {
      // Type is either FAILED_PAYMENT or ABANDONED_CART
      const res = await recoverOpportunity(opp.id, opp.type as 'FAILED_PAYMENT' | 'ABANDONED_CART')
      
      if (res.success && res.paymentUrl) {
        setPaymentUrl(res.paymentUrl)
      } else {
        setError(res.error || 'Failed to recover')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
    } finally {
      setIsRecovering(false)
    }
  }

  return (
    <div className="p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:bg-slate-50/50 transition-colors">
      <div>
        <div className="flex items-center gap-2">
          <span className="font-medium text-slate-900">{opp.customerName}</span>
          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {opp.type.replace('_', ' ')}
          </span>
        </div>
        <div className="text-sm text-slate-500 mt-1">₹{(opp.amountPaise / 100).toLocaleString('en-IN')}</div>
        <div className="text-xs text-slate-400 mt-1">Reason: {opp.priorityReason}</div>
        
        {error && (
          <div className="mt-2 text-xs font-medium text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-end">
        <span className={`text-xs font-medium px-2 py-1 rounded mb-3 ${opp.priorityLevel === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
          {opp.priorityLevel} Priority ({opp.priorityScore})
        </span>
        
        {paymentUrl ? (
          <a 
            href={paymentUrl} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-100 text-emerald-800 text-sm font-semibold rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1.5 border border-emerald-200"
          >
            Open Link <ExternalLink className="w-3.5 h-3.5" />
          </a>
        ) : (
          <button 
            onClick={handleRecover}
            disabled={isRecovering}
            className="px-4 py-1.5 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm"
          >
            {isRecovering ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Working...
              </>
            ) : (
              'Recover'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
