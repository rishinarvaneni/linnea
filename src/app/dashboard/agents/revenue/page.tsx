import { PageHeader } from '@/components/ui/PageHeader'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ChatWorkspace } from '@/components/chat/ChatWorkspace'
import { listConversations } from '@/app/actions/chat'

export default async function RevenueAgentWorkspace() {
  const conversations = await listConversations('MERCHANT_REVENUE')

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="px-4 md:px-8 py-6 border-b border-slate-200 bg-white z-10 flex-shrink-0">
        <PageHeader 
          title="Revenue Growth Agent" 
          subtitle="Your autonomous revenue assistant."
        >
          <StatusBadge status="READY" />
        </PageHeader>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Center: Chat Workspace */}
        <ChatWorkspace 
          initialConversations={conversations} 
          agentType="MERCHANT_REVENUE" 
          emptyStateText="I'm your Revenue Growth Agent. How can I help you grow today?"
          suggestions={[
            { label: 'How can I increase revenue today?' },
            { label: 'Show me my biggest revenue opportunities' },
            { label: 'What failed payments should I recover?' },
            { label: 'What can I upsell today?' }
          ]}
        />


      </div>
    </div>
  )
}
