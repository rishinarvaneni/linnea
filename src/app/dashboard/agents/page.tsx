import { PageHeader } from '@/components/ui/PageHeader'
import { AgentCard } from '@/components/ui/AgentCard'

export default function AgentStudioPage() {
  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <PageHeader 
        title="Agent Studio" 
        subtitle="Build and manage intelligent commerce agents."
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <AgentCard 
          title="Revenue Growth Agent"
          description="Recover lost revenue, improve payment conversion and identify opportunities to grow sales automatically."
          status="Ready"
          href="/dashboard/agents/revenue"
        />
        
        <AgentCard 
          title="Revenue Recovery"
          description="View recoverable opportunities, active recoveries, and recovery history."
          status="Ready"
          href="/dashboard/agents/recovery"
        />
        
        <AgentCard 
          title="AI Buyer Agent"
          description="Help customers discover products and complete purchases through conversational AI."
          status="Ready"
          href="/dashboard/agents/mcp"
        />

        <AgentCard 
          title="Campaign Orchestrator"
          description="Turn natural language ideas into data-backed revenue campaigns and targeted messaging."
          status="Ready"
          href="/dashboard/agents/campaigns"
        />
      </div>
    </div>
  )
}
