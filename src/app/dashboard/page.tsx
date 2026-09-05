import { PageHeader } from '@/components/ui/PageHeader'
import { StatCard } from '@/components/ui/StatCard'
import { InsightCard } from '@/components/ui/InsightCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantMetrics, getMerchantRevenueOpportunities, getMerchantAgentActivity, formatRupees } from '@/lib/merchant-data'
import { Activity } from 'lucide-react'

export default async function DashboardPage() {
  const { merchantId } = await getMerchantContext()
  const stats = await getMerchantMetrics(merchantId)
  const opps = await getMerchantRevenueOpportunities(merchantId)
  const activities = await getMerchantAgentActivity(merchantId)

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader title="Revenue Overview" />

      {/* 1. Primary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
        <StatCard title="Revenue generated" value={formatRupees(stats.totalRevenuePaise)} />
        <StatCard title="Recovered revenue" value={formatRupees(stats.recoveredRevenuePaise)} />
        <StatCard title="Orders" value={stats.successfulOrdersCount} />
        <StatCard title="Conversion" value={`${stats.conversionRate}%`} />
      </div>

      {/* 2. AI Contributions */}
      <div className="mb-8 border-t pt-6 border-slate-100">
        <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Contributions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          <StatCard title="AI Buyer Revenue" value={formatRupees(stats.aiBuyerRevenuePaise)} />
          <StatCard title="AI Buyer Orders" value={stats.aiBuyerOrderCount} />
        </div>
      </div>

      {/* 3. Opportunities + Activity — items-start prevents stretching */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_350px] gap-6 items-start">

        {/* LEFT: AI Revenue Opportunities */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">AI Revenue Opportunities</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InsightCard title="Failed payments" value={`${opps.failedPayments} recoverable`} type="failed" href="/dashboard/agents/recovery" />
            <InsightCard title="Abandoned carts" value={`${opps.abandonedCarts} abandoned`} type="abandoned" href="/dashboard/agents/recovery" />
            <InsightCard title="Upsell opportunities" value={`${opps.upsellOpportunities} detected`} type="upsell" href="/dashboard/agents/revenue" />
          </div>
        </section>

        {/* RIGHT: Recent Agent Activity */}
        <section>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Agent Activity</h2>
          {activities.length === 0 ? (
            <EmptyState 
              icon={Activity} 
              title="No agent activity yet." 
              description="Activate your Revenue Growth agent to start recovering lost sales automatically."
            />
          ) : (
            <div className="space-y-3">
              {activities.map((activity: any) => (
                <div key={activity.id} className="p-4 border border-slate-200 rounded-lg bg-white shadow-sm flex items-start gap-3">
                  <div className="mt-0.5 p-1.5 rounded-full bg-blue-50 text-blue-600 shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-900">Revenue Agent Run</p>
                    <p className="text-xs text-slate-500 mt-1 font-mono truncate">{activity.toolName} → {activity.status}</p>
                    <p className="text-xs text-slate-400 mt-1">{activity.createdAt.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  )
}
