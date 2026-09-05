import { getMerchantContext } from '@/lib/merchant-context'
import { db as prisma } from '@/lib/db'
import { PageHeader } from '@/components/ui/PageHeader'
import { notFound } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const { merchantId } = await getMerchantContext()
  const merchant = await prisma.merchant.findUnique({
    where: { id: merchantId },
    include: { user: true }
  })

  if (!merchant) {
    notFound()
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      <PageHeader title="Settings" subtitle="Manage your merchant account preferences." />
      
      <div className="bg-white border border-slate-200/60 rounded-xl shadow-sm overflow-hidden mt-6">
        <div className="p-6 md:p-8 space-y-8">
          
          <div>
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-1">Store Information</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Your store details as seen by customers.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Store Name</label>
                <input 
                  type="text" 
                  readOnly 
                  value={merchant.businessName} 
                  className="w-full border border-slate-300/80 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-700 shadow-sm focus:outline-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Contact Email</label>
                <input 
                  type="email" 
                  readOnly 
                  value={merchant.user.email} 
                  className="w-full border border-slate-300/80 rounded-lg px-4 py-2.5 bg-slate-50 text-slate-700 shadow-sm focus:outline-none"
                />
              </div>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-200/60">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-1">AI Configuration</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Your autonomous agent settings.</p>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wide">Store Context</label>
                <textarea 
                  readOnly 
                  rows={4}
                  value={'No specific context provided.'} 
                  className="w-full border border-slate-300/80 rounded-lg px-4 py-3 bg-slate-50 text-slate-700 text-sm shadow-sm focus:outline-none resize-none"
                />
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-200/60">
            <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-1">Platform Integration</h3>
            <p className="text-sm text-slate-500 mb-6 font-medium">Payment and webhook connectivity statuses.</p>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between p-5 bg-slate-50 rounded-xl border border-slate-200/80 shadow-sm">
                <div>
                  <h4 className="font-semibold text-slate-900">Razorpay Connected</h4>
                  <p className="text-sm text-slate-500 mt-1 font-medium">Accepting payments via Razorpay Gateway</p>
                </div>
                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-semibold tracking-wide border shadow-sm bg-emerald-50 text-emerald-700 border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-emerald-500"></span>
                  Active
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
