import { Sidebar } from '@/components/layout/Sidebar'
import { DashboardTopBar } from '@/components/layout/DashboardTopBar'
import { TopNav } from '@/components/layout/TopNav'
import { getMerchantContext } from '@/lib/merchant-context'
import { getMerchantNotifications } from '@/lib/notifications'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { merchantId } = await getMerchantContext()
  const notifications = merchantId ? await getMerchantNotifications(merchantId) : []

  return (
    <div className="flex flex-col h-screen overflow-hidden font-sans">
      {/* Dark top bar */}
      <DashboardTopBar />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar role="MERCHANT" />
        
        {/* Content area */}
        <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50">
          <TopNav notifications={notifications} />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
