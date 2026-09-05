import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, Circle } from 'lucide-react'
import { getCustomerOrder } from '@/lib/customer-orders'
import { formatCurrency } from '@/lib/utils'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function TimelineStep({ title, description, isComplete, isLast = false }: { title: string, description?: string, isComplete: boolean, isLast?: boolean }) {
  return (
    <div className="flex gap-4 relative">
      {!isLast && (
        <div className={`absolute left-[11px] top-6 bottom-[-8px] w-0.5 ${isComplete ? 'bg-emerald-500' : 'bg-slate-200'}`} />
      )}
      <div className="relative z-10 flex-shrink-0 mt-0.5">
        {isComplete ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500 bg-white" />
        ) : (
          <Circle className="w-6 h-6 text-slate-300 bg-white" />
        )}
      </div>
      <div className="pb-8">
        <p className={`font-medium ${isComplete ? 'text-slate-900' : 'text-slate-500'}`}>{title}</p>
        {description && (
          <p className="text-sm text-slate-500 mt-1">{description}</p>
        )}
      </div>
    </div>
  )
}

export default async function OrderDetailsPage({ params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params
  const order = await getCustomerOrder(orderId)

  if (!order) {
    notFound()
  }

  const isPaid = order.status === 'PAID'
  const isFulfilled = order.fulfillmentStatus === 'FULFILLED'
  const primaryPayment = order.payments && order.payments.length > 0 ? order.payments[0] : null

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <Link 
        href="/shop/orders"
        className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-900 mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Orders
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Order #{order.orderNumber}</h1>
          <p className="text-slate-500 mt-1">
            Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
            order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700' :
            order.status === 'PENDING' ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'
          }`}>
            {order.status}
          </span>
          {order.status === 'PAID' && (
            <span className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              order.fulfillmentStatus === 'FULFILLED' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
            }`}>
              {order.fulfillmentStatus}
            </span>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-semibold text-slate-900">Items</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="p-6 flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-slate-900">{item.product.name}</h3>
                    <p className="text-sm text-slate-500 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatCurrency(item.pricePaise * item.quantity)}</p>
                    {item.quantity > 1 && (
                      <p className="text-sm text-slate-500 mt-1">{formatCurrency(item.pricePaise)} each</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-6 bg-slate-50 border-t border-slate-200">
              <div className="flex items-center justify-between font-semibold text-slate-900 text-lg">
                <span>Total</span>
                <span>{formatCurrency(order.totalPaise)}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6">
            <h2 className="font-semibold text-slate-900 mb-6">Status Timeline</h2>
            <div className="ml-2">
              <TimelineStep 
                title="Order placed" 
                isComplete={true} 
              />
              <TimelineStep 
                title="Payment confirmed" 
                isComplete={isPaid} 
                description={isPaid && primaryPayment?.paidAt ? new Date(primaryPayment.paidAt).toLocaleDateString() : 'Pending verification'}
              />
              <TimelineStep 
                title="Fulfillment completed" 
                isComplete={isFulfilled} 
                description={isFulfilled ? 'Your items have been provided' : 'Pending fulfillment'}
                isLast={true}
              />
            </div>
          </div>

          {(primaryPayment || order.status === 'PAID') && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-semibold text-slate-900 mb-4">Payment Details</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span className="font-medium text-slate-900">{primaryPayment?.status || order.status}</span>
                </div>
                {primaryPayment?.method && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Method</span>
                    <span className="font-medium text-slate-900">{primaryPayment.method}</span>
                  </div>
                )}
                {primaryPayment?.razorpayPaymentId && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction ID</span>
                    <span className="font-medium text-slate-900 font-mono text-xs mt-0.5">{primaryPayment.razorpayPaymentId}</span>
                  </div>
                )}
                {primaryPayment?.paidAt && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date</span>
                    <span className="font-medium text-slate-900">{new Date(primaryPayment.paidAt).toLocaleDateString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
