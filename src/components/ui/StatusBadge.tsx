export type StatusType = 'READY' | 'INACTIVE' | 'PROCESSING' | 'SUCCESS' | 'PAID' | 'PENDING' | 'FAILED' | 'FULFILLED' | 'CANCELLED'

type StatusBadgeProps = {
  status: StatusType | string
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = status.toUpperCase()
  let bg = 'bg-slate-50'
  let text = 'text-slate-600'
  let dot = 'bg-slate-400'
  let border = 'border-slate-200/60'
  let animate = false

  if (s === 'SUCCESS' || s === 'PAID' || s === 'FULFILLED' || s === 'READY') {
    bg = 'bg-emerald-50'
    text = 'text-emerald-700'
    dot = 'bg-emerald-500'
    border = 'border-emerald-200/60'
    animate = s === 'READY'
  } else if (s === 'PENDING' || s === 'PROCESSING') {
    bg = 'bg-amber-50'
    text = 'text-amber-700'
    dot = 'bg-amber-500'
    border = 'border-amber-200/60'
    animate = true
  } else if (s === 'FAILED' || s === 'CANCELLED') {
    bg = 'bg-red-50'
    text = 'text-red-700'
    dot = 'bg-red-500'
    border = 'border-red-200/60'
  }
  
  return (
    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold tracking-wide border shadow-sm ${bg} ${text} ${border}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${animate ? 'animate-pulse' : ''}`}></span>
      {s}
    </div>
  )
}
