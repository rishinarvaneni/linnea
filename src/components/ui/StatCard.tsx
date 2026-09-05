export function StatCard({ 
  title, 
  value, 
  trend 
}: { 
  title: string
  value: string | number
  trend?: { value: string, isPositive: boolean } 
}) {
  return (
    <div className="bg-white border border-slate-200/60 p-6 rounded-xl shadow-sm flex flex-col hover:border-slate-300 transition-colors">
      <span className="text-sm font-semibold text-slate-500 mb-2 uppercase tracking-wider">{title}</span>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-semibold text-slate-900 tracking-tight">{value}</span>
        {trend && (
          <span className={`text-sm font-semibold flex items-center gap-0.5 px-2 py-0.5 rounded-md ${trend.isPositive ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {trend.isPositive ? '↑' : '↓'} {trend.value}
          </span>
        )}
      </div>
    </div>
  )
}
