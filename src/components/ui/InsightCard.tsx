import { AlertCircle, ArrowUpRight, ShoppingCart } from 'lucide-react'
import Link from 'next/link'

type InsightCardProps = {
  title: string
  value: string | number
  type: 'failed' | 'abandoned' | 'upsell'
  href?: string
}

export function InsightCard({ title, value, type, href }: InsightCardProps) {
  const Icon = type === 'failed' ? AlertCircle : type === 'abandoned' ? ShoppingCart : ArrowUpRight
  const iconColor = type === 'failed' ? 'text-rose-500 bg-rose-50' : type === 'abandoned' ? 'text-amber-500 bg-amber-50' : 'text-emerald-500 bg-emerald-50'

  const content = (
    <div className="bg-white border border-slate-200/60 p-5 rounded-xl shadow-sm flex items-center gap-4 hover:border-blue-200 hover:shadow transition-all cursor-pointer group">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center border border-white/50 shadow-sm shrink-0 ${iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h4 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h4>
        <p className="text-sm text-slate-500 font-medium">{value}</p>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{content}</Link>
  }

  return content
}
