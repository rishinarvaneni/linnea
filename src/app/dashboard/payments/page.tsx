import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantPayments, formatRupees } from '@/lib/merchant-data'
import { PageHeader } from '@/components/ui/PageHeader'

export default async function PaymentsPage() {
  const { merchantId } = await getMerchantContext()
  const payments = await getMerchantPayments(merchantId)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Payments" />
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 border-b border-slate-200/60 text-slate-500 font-semibold uppercase tracking-wider text-xs">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap">Payment ID</th>
                <th className="px-6 py-4 whitespace-nowrap">Order</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Amount</th>
                <th className="px-6 py-4 whitespace-nowrap">Method</th>
                <th className="px-6 py-4 whitespace-nowrap text-center">Status</th>
                <th className="px-6 py-4 whitespace-nowrap text-right">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 bg-slate-50/50">
                    No payments found.
                  </td>
                </tr>
              ) : (
                payments.map((payment: any) => (
                  <tr key={payment.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="px-6 py-4 font-mono text-slate-900 font-medium group-hover:text-blue-600 transition-colors">{payment.razorpayPaymentId || payment.id.slice(-8)}</td>
                    <td className="px-6 py-4 font-mono text-slate-500 font-medium">{payment.order?.orderNumber || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900 text-right">{formatRupees(payment.amountPaise)}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">{payment.method}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border shadow-sm ${
                        payment.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60' :
                        payment.status === 'PENDING' ? 'bg-amber-50 text-amber-700 border-amber-200/60' :
                        'bg-red-50 text-red-700 border-red-200/60'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${payment.status === 'SUCCESS' ? 'bg-emerald-500' : payment.status === 'PENDING' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></span>
                        {payment.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400 font-medium text-right whitespace-nowrap">
                      {payment.createdAt.toLocaleDateString()}
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
