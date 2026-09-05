import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantCustomers, formatRupees } from '@/lib/merchant-data'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function CustomersPage() {
  const { merchantId } = await getMerchantContext()
  const customers = await getMerchantCustomers(merchantId)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Customers" />
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Customer Name</th>
                <th className="px-6 py-4 whitespace-nowrap">Email</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Orders</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Total Spend</th>
                <th className="px-6 py-4 whitespace-nowrap">Latest Order</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Latest Origin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    No customers found.
                  </td>
                </tr>
              ) : (
                customers.map((customer: any) => {
                  const paidOrders = customer.orders.filter((o: any) => o.status === 'PAID')
                  const totalSpendPaise = paidOrders.reduce((sum: number, order: any) => sum + order.totalPaise, 0)
                  const latestOrder = customer.orders.length > 0 ? customer.orders[0] : null
                  
                  return (
                    <tr key={customer.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{customer.name}</td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{customer.email}</td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border border-slate-200/60 text-xs">
                          {paidOrders.length}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900 text-right">{formatRupees(totalSpendPaise)}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 font-medium">
                        {latestOrder?.orderNumber || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {latestOrder ? (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border shadow-sm ${
                            latestOrder.origin === 'AI_BUYER' ? 'bg-blue-50 text-blue-700 border-blue-200/60' : 'bg-slate-50 text-slate-600 border-slate-200/60'
                          }`}>
                            {latestOrder.origin === 'AI_BUYER' ? '🤖 AI Buyer' : 'Storefront'}
                          </span>
                        ) : '-'}
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
