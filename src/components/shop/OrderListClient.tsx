'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '@/lib/utils'

export type OrderSummary = {
  id: string
  orderNumber: string
  createdAt: Date
  totalPaise: number
  status: string
  fulfillmentStatus: string
  _count: { items: number }
}

export function OrderListClient({ orders }: { orders: OrderSummary[] }) {
  const [filter, setFilter] = useState<'ALL' | 'PAID' | 'PENDING' | 'FAILED'>('ALL')

  const filteredOrders = orders.filter(order => {
    if (filter === 'ALL') return true
    return order.status === filter
  })

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-white rounded-2xl border border-slate-200">
        <h3 className="text-lg font-medium text-slate-900 mb-2">No orders yet</h3>
        <p className="text-slate-500 mb-6 text-sm">When you place an order, it will appear here.</p>
        <Link 
          href="/shop"
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 transition-colors"
        >
          Start shopping with AI
        </Link>
      </div>
    )
  }

  const filters = [
    { id: 'ALL', label: 'All' },
    { id: 'PAID', label: 'Paid' },
    { id: 'PENDING', label: 'Pending' },
    { id: 'FAILED', label: 'Failed' },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              filter === f.id
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredOrders.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
            No {filter.toLowerCase()} orders found.
          </div>
        ) : (
          filteredOrders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition-colors">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">
                    Order #{order.orderNumber}
                  </h3>
                  <div className="text-sm text-slate-500 space-x-2">
                    <span>{new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>{order._count.items} item{order._count.items !== 1 ? 's' : ''}</span>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-slate-900 mb-2">
                    {formatCurrency(order.totalPaise)}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                      order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
                      order.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {order.status}
                    </span>
                    {order.status === 'PAID' && (
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium ${
                        order.fulfillmentStatus === 'FULFILLED' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {order.fulfillmentStatus}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100">
                <Link
                  href={`/shop/orders/${order.id}`}
                  className="text-sm font-medium text-slate-900 hover:text-blue-600 transition-colors"
                >
                  View order details &rarr;
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
