import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantMetrics, formatRupees } from '@/lib/merchant-data'
import { PageHeader } from '@/components/ui/PageHeader'

export const dynamic = 'force-dynamic'

function MetricCard({ title, value, className = '' }: { title: string, value: string | number, className?: string }) {
  return (
    <div className={`p-6 bg-white border border-slate-200/60 rounded-xl shadow-sm hover:border-slate-300 transition-colors ${className}`}>
      <h3 className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">{title}</h3>
      <p className="text-3xl font-semibold text-slate-900 tracking-tight">{value}</p>
    </div>
  )
}

export default async function ReportsPage() {
  const { merchantId } = await getMerchantContext()
  const metrics = await getMerchantMetrics(merchantId)
  
  const storefrontRevenuePaise = metrics.totalRevenuePaise - metrics.aiBuyerRevenuePaise

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-6">
      <PageHeader title="Reports" subtitle="Revenue breakdown and performance metrics." />
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <MetricCard title="Total Revenue" value={formatRupees(metrics.totalRevenuePaise)} />
        <MetricCard title="AI Buyer Revenue" value={formatRupees(metrics.aiBuyerRevenuePaise)} className="border-blue-200/60 bg-blue-50/30" />
        <MetricCard title="Storefront Revenue" value={formatRupees(storefrontRevenuePaise)} />
        <MetricCard title="Total Orders" value={metrics.successfulOrdersCount} />
      </div>

      <h2 className="text-lg font-semibold tracking-tight text-slate-900 mt-10 mb-4">Payment Status</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Successful Payments" value={metrics.successfulOrdersCount} className="border-emerald-200/60 bg-emerald-50/30" />
        <MetricCard title="Pending Payments" value={metrics.pendingPaymentsCount} className="border-amber-200/60 bg-amber-50/30" />
        <MetricCard title="Failed Payments" value={metrics.failedPaymentsCount} className="border-red-200/60 bg-red-50/30" />
      </div>
    </div>
  )
}
