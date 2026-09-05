import { LucideIcon } from 'lucide-react'

type EmptyStateProps = {
  icon: LucideIcon
  title: string
  description: string
}

export function EmptyState({ icon: Icon, title, description }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-10 text-center border border-slate-200/60 rounded-xl bg-white shadow-sm">
      <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center mb-4 text-slate-400 shadow-sm">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 mb-1">{title}</h3>
      <p className="text-sm text-slate-500 max-w-sm">{description}</p>
    </div>
  )
}
