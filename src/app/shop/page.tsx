import { ChatWorkspace } from '@/components/chat/ChatWorkspace'
import { ProductCard } from '@/components/ui/ProductCard'
import { Sparkles } from 'lucide-react'
import { listConversations } from '@/app/actions/chat'
import { fetchCustomerCart } from '@/app/actions/cart'
import { CartDrawer } from '@/components/ui/CartDrawer'

export default async function ShopPage({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
  const conversations = await listConversations('CUSTOMER_SHOPPING')
  const cart = await fetchCustomerCart()
  const initialQuery = typeof searchParams.q === 'string' ? searchParams.q : undefined
  const startVoice = searchParams.voice === 'true'

  return (
    <div className="flex h-full bg-white">
      {/* Main Center: AI Shopping Interface */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header Area */}
        <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-900">AI Shopping Agent</h1>
            </div>
          </div>
          <div>
            <CartDrawer cart={cart} />
          </div>
        </div>
        
        {/* Chat / Content Area */}
        <div className="flex-1 relative flex overflow-hidden">
          {/* Chat Interface */}
          <ChatWorkspace 
            initialConversations={conversations} 
            agentType="CUSTOMER_SHOPPING" 
            emptyStateText="Tell me what you're looking for and I'll help you shop."
            initialQuery={initialQuery}
            startVoice={startVoice}
            suggestions={[
              { label: 'Find headphones' },
              { label: 'Find something under ₹5,000' },
              { label: 'Find a gift' },
              { label: 'Shop by voice', isVoice: true }
            ]}
          />

          {/* Removed Mock Right Panel since the AI Agent will render ProductCards inside the chat stream */}
        </div>

      </div>
    </div>
  )
}
