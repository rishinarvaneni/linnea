import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantOrders, formatRupees } from '@/lib/merchant-data'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

export default async function TransactionsPage() {
  const { merchantId } = await getMerchantContext()
  const orders = await getMerchantOrders(merchantId)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Transactions" subtitle="Recent orders and their transaction status." />
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Transaction / Order</th>
                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Amount</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Origin</th>
                <th className="px-6 py-4 whitespace-nowrap">Payment Method</th>
                <th className="px-6 py-4 whitespace-nowrap">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    No transactions found.
                  </td>
                </tr>
              ) : (
                orders.map((order: any) => {
                  const payment = order.payments?.[0]
                  const customerName = order.customer?.name || order.customer?.email || 'Guest'
                  
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-mono text-slate-900 font-medium group-hover:text-blue-600 transition-colors">{order.orderNumber}</td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-[200px] font-medium">{customerName}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 text-right">{formatRupees(order.totalPaise)}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex px-2 py-1 rounded-md text-xs font-semibold tracking-wide border ${order.origin === 'AI_BUYER' ? 'bg-blue-50 text-blue-700 border-blue-200/60' : 'bg-slate-50 text-slate-600 border-slate-200/60'}`}>
                          {order.origin === 'AI_BUYER' ? 'AI Shopping' : 'Storefront'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 font-medium">{payment?.method || '-'}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border shadow-sm ${
                          order.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                          order.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                          'bg-red-50 text-red-700 border-red-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${order.status === 'PAID' ? 'bg-emerald-500' : order.status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400 font-medium text-right whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
