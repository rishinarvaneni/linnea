import { getSession } from '@/lib/session'
import { db as prisma } from '@/lib/db'
import { PageHeader } from '@/components/ui/PageHeader'
import { getRecoverableOpportunities } from '@/lib/recovery/opportunities'
import { redirect } from 'next/navigation'
import { RecoveryItem } from '@/components/dashboard/RecoveryItem'

export default async function RecoveryDashboardPage() {
  const session = await getSession()
  if (!session?.userId) redirect('/shop/home')
  
  const user = await prisma.user.findUnique({ where: { id: session.userId } })
  if (!user) redirect('/shop/home')
  const merchant = await prisma.merchant.findUnique({ where: { userId: user.id } })

  if (!merchant) {
    redirect('/shop/home')
  }

  const merchantId = merchant.id

  // 1. Get Opportunities
  const opportunities = await getRecoverableOpportunities(merchantId)
  
  // 2. Get Recovery History
  const history = await prisma.recoveryAttempt.findMany({
    where: { merchantId },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
    take: 20
  })

  // 3. Calculate Metrics
  const recoverableRevenuePaise = opportunities.reduce((sum, opp) => sum + opp.amountPaise, 0)
  
  let recoveredRevenuePaise = 0
  let activeRecoveriesCount = 0
  let successfulRecoveriesCount = 0
  
  for (const attempt of history) {
    if (attempt.status === 'PAYMENT_SUCCESS') {
      successfulRecoveriesCount++
      recoveredRevenuePaise += attempt.amountPaise
    } else if (['PENDING', 'LINK_CREATED', 'MESSAGE_SENT', 'CUSTOMER_CLICKED'].includes(attempt.status)) {
      activeRecoveriesCount++
    }
  }

  const totalCompleted = history.filter(a => ['PAYMENT_SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED'].includes(a.status)).length
  const recoveryRate = totalCompleted > 0 ? Math.round((successfulRecoveriesCount / totalCompleted) * 100) : 0

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <PageHeader 
        title="Revenue Recovery" 
        subtitle="Detect and recover lost revenue from abandoned carts and failed payments."
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="Recoverable Revenue" value={`₹${(recoverableRevenuePaise / 100).toLocaleString('en-IN')}`} />
        <MetricCard label="Recovered Revenue" value={`₹${(recoveredRevenuePaise / 100).toLocaleString('en-IN')}`} className="text-emerald-600" />
        <MetricCard label="Active Recoveries" value={activeRecoveriesCount.toString()} />
        <MetricCard label="Successful Recoveries" value={successfulRecoveriesCount.toString()} />
        <MetricCard label="Recovery Rate" value={`${recoveryRate}%`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Opportunities List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">High Priority Opportunities</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {opportunities.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No recoverable opportunities found.</div>
            ) : (
              opportunities.map(opp => (
                <RecoveryItem key={opp.id} opp={opp} />
              ))
            )}
          </div>
        </div>

        {/* Recent Recoveries */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
            <h2 className="text-lg font-semibold text-slate-800">Recent Recovery Attempts</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {history.length === 0 ? (
              <div className="p-6 text-center text-slate-500">No recovery attempts yet.</div>
            ) : (
              history.map(attempt => (
                <div key={attempt.id} className="p-6 flex justify-between items-center">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{attempt.customer.name}</span>
                      <span className="text-sm text-slate-500">₹{(attempt.amountPaise / 100).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(attempt.createdAt).toLocaleDateString()} &middot; {attempt.reason.replace('_', ' ')}
                    </div>
                  </div>
                  <div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      attempt.status === 'PAYMENT_SUCCESS' ? 'bg-emerald-100 text-emerald-700' :
                      attempt.status === 'FAILED' || attempt.status === 'EXPIRED' ? 'bg-red-100 text-red-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {attempt.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCard({ label, value, className = '' }: { label: string, value: string | number, className?: string }) {
  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="text-sm font-medium text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold text-slate-900 ${className}`}>{value}</div>
    </div>
  )
}
