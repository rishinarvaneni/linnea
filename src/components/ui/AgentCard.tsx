import Link from 'next/link'
import { Sparkles, ArrowRight } from 'lucide-react'

type AgentCardProps = {
  title: string
  description: string
  status: 'Ready' | 'Inactive'
  href: string
}

export function AgentCard({ title, description, status, href }: AgentCardProps) {
  const isReady = status === 'Ready'

  return (
    <div className="group flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:border-slate-300 transition-all duration-300 overflow-hidden">
      <div className="p-6 flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700 group-hover:bg-slate-900 group-hover:text-white transition-colors duration-300">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isReady ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
            {status}
          </div>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed">
          {description}
        </p>
      </div>
      <div className="p-4 border-t border-slate-100 bg-slate-50">
        <Link 
          href={href}
          className="flex items-center justify-center gap-2 w-full py-2 bg-white border border-slate-200 text-slate-700 text-sm font-medium rounded-lg hover:bg-slate-900 hover:text-white hover:border-slate-900 transition-all duration-200"
        >
          Open Agent
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  )
}
