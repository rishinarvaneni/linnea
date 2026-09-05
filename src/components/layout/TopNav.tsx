'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Search, LogOut, X, Home, Sparkles, ShoppingBag, Settings, Link as LinkIcon, Package, Users, ArrowLeftRight, CreditCard, BarChart3 } from 'lucide-react'
import { logout } from '@/app/actions/auth'
import { NotificationBellUI } from './NotificationBellUI'
import type { MerchantNotification } from '@/lib/notifications'

export function TopNav({ notifications = [] }: { notifications?: MerchantNotification[] }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const isShop = pathname.startsWith('/shop')
  const isDashboard = pathname.startsWith('/dashboard')

  const customerNav = [
    { label: 'Home', href: '/shop/home', icon: Home },
    { label: 'AI Shopping', href: '/shop', icon: Sparkles },
    { label: 'Orders', href: '/shop/orders', icon: ShoppingBag },
    { label: 'Settings', href: '/shop/settings', icon: Settings },
  ]

  const merchantNav = [
    { label: 'Home', href: '/dashboard', icon: Home },
    { label: 'Transactions', href: '/dashboard/transactions', icon: ArrowLeftRight },
    { label: 'Payments', href: '/dashboard/payments', icon: CreditCard },
    { label: 'Reports', href: '/dashboard/reports', icon: BarChart3 },
    { label: 'Agent Studio', href: '/dashboard/agents', icon: Sparkles },
    { label: 'Payment Links', href: '/dashboard/links', icon: LinkIcon },
    { label: 'Products', href: '/dashboard/products', icon: Package },
    { label: 'Customers', href: '/dashboard/customers', icon: Users },
    { label: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  const navItems = isShop ? customerNav : (isDashboard ? merchantNav : [])

  return (
    <>
      <header className="h-14 border-b border-slate-200/60 bg-white flex items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden p-2 text-slate-500 hover:bg-slate-100 rounded-md transition-colors"
            title="Open Menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="hidden md:flex relative w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search transactions, products..." 
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <NotificationBellUI notifications={notifications} />
          
          <div className="h-5 w-px bg-slate-200 mx-1"></div>
          
          <form action={logout}>
            <button type="submit" className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-lg text-sm font-medium transition-colors">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </form>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div 
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-white h-full flex flex-col z-10 shadow-xl">
            <div className="h-14 border-b border-slate-200 px-4 flex items-center justify-between">
              <span className="font-semibold text-slate-900">Navigation</span>
              <button 
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map(item => {
                const isActive = pathname === item.href || (item.href !== '/shop' && item.href !== '/dashboard' && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </nav>
            <div className="p-4 border-t border-slate-100">
              <form action={logout}>
                <button 
                  type="submit" 
                  className="w-full flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span>Logout</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
