import { Info, CheckCircle2, AlertTriangle } from 'lucide-react'

// Map AgentAction DB type to UI type
export function ActivityTimeline({ entries }: { entries: any[] }) {
  if (entries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400 gap-3 border border-slate-200/60 border-dashed rounded-xl bg-slate-50/50">
        <Info className="w-6 h-6 opacity-50" />
        <span className="text-sm font-medium">No agent activity yet.</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {entries.map((entry, index) => {
        const isLast = index === entries.length - 1
        const type = entry.status === 'SUCCEEDED' ? 'success' : entry.status === 'FAILED' ? 'warning' : 'info'
        const Icon = type === 'success' ? CheckCircle2 : type === 'warning' ? AlertTriangle : Info
        const color = type === 'success' ? 'text-emerald-500' : type === 'warning' ? 'text-rose-500' : 'text-blue-500'
        
        const title = entry.toolName || null
        const timeString = entry.createdAt ? new Date(entry.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Unknown time'
        
        let description = 'Agent activity unavailable.'
        
        if (entry.toolName) {
          if (entry.status === 'STARTED') {
            description = `Executing ${entry.toolName}...`
          } else if (entry.status === 'SUCCEEDED') {
            description = `Successfully completed ${entry.toolName}.`
          } else if (entry.status === 'FAILED') {
            description = `Failed to execute ${entry.toolName}.`
            // Try to extract a useful error message from outputJson
            if (entry.outputJson) {
              try {
                const parsed = JSON.parse(entry.outputJson)
                if (parsed && parsed.error) {
                  description = parsed.error
                }
              } catch (e) {
                // Ignore JSON parse errors for fallback
              }
            }
          }
        }

        if (entry.toolName === 'startRecovery' && entry.status === 'SUCCEEDED') {
          description = 'Merchant approved recovery. Created Razorpay Test Mode payment link and generated simulated notification.'
        } else if (entry.toolName === 'getRecoverableOpportunities' && entry.status === 'SUCCEEDED') {
          description = 'Detected and scored recoverable opportunities.'
        }

        return (
          <div key={entry.id || index} className="relative flex gap-5 group">
            {!isLast && (
              <div className="absolute left-5 top-10 bottom-[-24px] w-px bg-slate-200/60 group-hover:bg-slate-300 transition-colors" />
            )}
            
            <div className={`relative z-10 w-10 h-10 rounded-xl bg-white border border-slate-200/60 shadow-sm flex items-center justify-center flex-shrink-0 group-hover:border-slate-300 transition-all ${color}`}>
              <Icon className="w-5 h-5" />
            </div>
            
            <div className="flex-1 pb-4">
              <div className="flex justify-between items-start gap-2 mb-1.5">
                {title ? (
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-white border border-slate-200/60 shadow-sm px-2.5 py-1 rounded-md">
                    {title}
                  </span>
                ) : (
                  <div className="flex-1" />
                )}
                <span className="text-xs font-semibold text-slate-400 whitespace-nowrap bg-slate-50 px-2 py-1 rounded-md">{timeString}</span>
              </div>
              <p className="text-sm text-slate-600 font-medium leading-relaxed bg-white border border-slate-100 p-3 rounded-lg shadow-sm">{description}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
