import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantPaymentLinks, formatRupees } from '@/lib/merchant-data'
import { PageHeader } from '@/components/ui/PageHeader'
import { ArrowUpRight } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function PaymentLinksPage() {
  const { merchantId } = await getMerchantContext()
  const paymentLinks = await getMerchantPaymentLinks(merchantId)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Payment Links" subtitle="Manage and track active payment links." />
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Link ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Customer</th>
                <th className="px-6 py-4 whitespace-nowrap">Order</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Amount</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Checkout URL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentLinks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    No payment links found.
                  </td>
                </tr>
              ) : (
                paymentLinks.map((link: any) => {
                  const customerName = link.order?.customer?.name || link.order?.customer?.email || 'Unknown'
                  
                  return (
                    <tr key={link.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4 font-mono text-slate-900 font-medium group-hover:text-blue-600 transition-colors">{link.razorpayLinkId || link.id.slice(-8)}</td>
                      <td className="px-6 py-4 text-slate-600 truncate max-w-[200px] font-medium">{customerName}</td>
                      <td className="px-6 py-4 font-mono text-slate-500 font-medium">{link.order?.orderNumber || '-'}</td>
                      <td className="px-6 py-4 font-semibold text-slate-900 text-right">{link.order?.totalPaise != null ? formatRupees(link.order.totalPaise) : '—'}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border shadow-sm ${
                          link.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                          link.status === 'EXPIRED' ? 'bg-red-50 text-red-700 border-red-200/60' :
                          'bg-amber-50 text-amber-700 border-amber-200/60'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${link.status === 'PAID' ? 'bg-emerald-500' : link.status === 'EXPIRED' ? 'bg-red-500' : 'bg-amber-500 animate-pulse'}`}></span>
                          {link.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {link.url ? (
                          <a href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200/60 hover:border-blue-300 hover:text-blue-700 text-slate-600 font-semibold text-xs rounded-lg shadow-sm transition-all group-hover:bg-blue-50/50">
                            View Link <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
                          </a>
                        ) : '—'}
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
