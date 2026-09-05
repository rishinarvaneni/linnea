'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home, ArrowLeftRight, CheckCircle, ClipboardCheck,
  BarChart3, Sparkles, Link as LinkIcon, FileText,
  Globe, Package, Users, Settings, ShoppingBag, CreditCard
} from 'lucide-react'

type NavItem = {
  label: string
  href: string
  icon: React.ElementType
  matchPrefix?: string
  badge?: string
}

type NavSection = {
  title?: string
  items: NavItem[]
}

const merchantSections: NavSection[] = [
  {
    items: [
      { label: 'Home',           href: '/dashboard',                  icon: Home },
      { label: 'Transactions',   href: '/dashboard/transactions',     icon: ArrowLeftRight },
      { label: 'Payments',       href: '/dashboard/payments',         icon: CreditCard },
      { label: 'Reports',        href: '/dashboard/reports',          icon: BarChart3 },
      { label: 'Agent Studio',   href: '/dashboard/agents',           icon: Sparkles, matchPrefix: '/dashboard/agents', badge: 'Beta' },
    ]
  },
  {
    title: 'PAYMENT PRODUCTS',
    items: [
      { label: 'Payment Links',  href: '/dashboard/links',            icon: LinkIcon },
      { label: 'Products',       href: '/dashboard/products',         icon: Package },
      { label: 'Customers',      href: '/dashboard/customers',        icon: Users },
    ]
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Settings',       href: '/dashboard/settings',         icon: Settings },
    ]
  },
]

const customerSections: NavSection[] = [
  {
    items: [
      { label: 'Home',        href: '/shop/home',     icon: Home },
      { label: 'AI Shopping', href: '/shop',           icon: Sparkles },
      { label: 'Orders',      href: '/shop/orders',    icon: ShoppingBag, matchPrefix: '/shop/orders' },
    ]
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Settings',    href: '/shop/settings',  icon: Settings, matchPrefix: '/shop/settings' },
    ]
  }
]

export function Sidebar({ role }: { role: 'MERCHANT' | 'CUSTOMER' }) {
  const pathname = usePathname()
  const sections = role === 'MERCHANT' ? merchantSections : customerSections

  return (
    <div className="w-60 flex-shrink-0 border-r border-slate-200 bg-white h-full flex flex-col hidden md:flex">
      <nav className="flex-1 overflow-y-auto py-4">
        {sections.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-6' : ''}>
            {section.title && (
              <div className="px-5 mb-2">
                <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">
                  {section.title}
                </span>
              </div>
            )}
            <div className="space-y-0.5 px-3">
              {section.items.map(item => {
                const isActive = item.matchPrefix
                  ? pathname.startsWith(item.matchPrefix)
                  : pathname === item.href

                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom user pill */}
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-slate-700">
          <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            {role === 'MERCHANT' ? 'M' : 'C'}
          </div>
          <span className="truncate font-semibold text-slate-900">
            {role === 'MERCHANT' ? 'Merchant' : 'Customer'}
          </span>
        </div>
      </div>
    </div>
  )
}
