'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Sparkles, CreditCard, Landmark, Receipt, ChevronDown } from 'lucide-react'

const topTabs = [
  { label: 'Agent Studio', href: '/dashboard/agents', icon: Sparkles, matchPrefix: '/dashboard/agents' },
  { label: 'Payments',     href: '/dashboard',        icon: CreditCard, matchPrefix: '/dashboard' }
]

export function DashboardTopBar() {
  const pathname = usePathname()

  return (
    <header className="h-12 bg-slate-900 flex items-center px-4 lg:px-6 shrink-0 z-50">
      {/* Brand */}
      <span className="text-sm font-semibold text-white tracking-tight mr-8">Agent Studio</span>

      {/* Tabs */}
      <nav className="hidden md:flex items-center gap-1 h-full">
        {topTabs.map(tab => {
          const isActive = tab.matchPrefix
            ? (tab.label === 'Payments'
                ? pathname === '/dashboard' || (pathname.startsWith('/dashboard/') && !pathname.startsWith('/dashboard/agents') && !pathname.startsWith('/dashboard/reports') && !pathname.startsWith('/dashboard/settings'))
                : pathname.startsWith(tab.matchPrefix))
            : pathname === tab.href

          return (
            <Link
              key={tab.label}
              href={tab.href}
              className={`flex items-center gap-2 px-4 h-full text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-slate-900 rounded-t-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </Link>
          )
        })}
        {/* Removed 'More' button */}
      </nav>
    </header>
  )
}
