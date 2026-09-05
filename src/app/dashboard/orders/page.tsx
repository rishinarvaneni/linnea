import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantOrders, formatRupees } from '@/lib/merchant-data'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function OrdersPage() {
  const { merchantId } = await getMerchantContext()
  const orders = await getMerchantOrders(merchantId)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Orders" />
      
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-medium">
              <tr>
                <th className="px-6 py-4">Order Number</th>
                <th className="px-6 py-4">Customer</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Origin</th>
                <th className="px-6 py-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                    No orders found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => (
                  <tr key={order.id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-mono text-slate-900">{order.orderNumber}</td>
                    <td className="px-6 py-4">{order.customer?.name || 'Unknown'}</td>
                    <td className="px-6 py-4 font-medium">{formatRupees(order.totalPaise)}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                        order.status === 'PENDING' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.origin === 'AI_BUYER' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {order.origin === 'AI_BUYER' ? '🤖 AI Buyer' : 'Storefront'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {order.createdAt.toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
