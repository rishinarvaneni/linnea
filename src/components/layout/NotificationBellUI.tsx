'use client'

import { useState, useRef, useEffect } from 'react'
import { Bell, CheckCircle2, AlertCircle, Info, XCircle } from 'lucide-react'
import type { MerchantNotification } from '@/lib/notifications'

function formatTimeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
  let interval = seconds / 31536000
  if (interval > 1) return Math.floor(interval) + ' years ago'
  interval = seconds / 2592000
  if (interval > 1) return Math.floor(interval) + ' months ago'
  interval = seconds / 86400
  if (interval > 1) return Math.floor(interval) + ' days ago'
  interval = seconds / 3600
  if (interval > 1) return Math.floor(interval) + ' hours ago'
  interval = seconds / 60
  if (interval > 1) return Math.floor(interval) + ' minutes ago'
  if (seconds < 30) return 'Just now'
  return Math.floor(seconds) + ' seconds ago'
}

export function NotificationBellUI({ notifications }: { notifications: MerchantNotification[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  
  const hasUnread = notifications.length > 0 // We'll just assume they are "unread" if they exist since we have no DB state

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-md relative transition-colors ${isOpen ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
      >
        <Bell className="w-4 h-4" />
        {hasUnread && (
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200/60 rounded-xl shadow-lg z-50 overflow-hidden flex flex-col max-h-[85vh]">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h3 className="font-semibold text-slate-900 text-sm">Notifications</h3>
            {notifications.length > 0 && (
              <span className="text-xs text-slate-500 bg-slate-200/50 px-2 py-0.5 rounded-full">{notifications.length} New</span>
            )}
          </div>
          
          <div className="overflow-y-auto flex-1">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No new notifications.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(notification => (
                  <div key={notification.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-3 items-start">
                    <div className="mt-0.5 flex-shrink-0">
                      {notification.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                      {notification.type === 'error' && <XCircle className="w-4 h-4 text-rose-500" />}
                      {notification.type === 'warning' && <AlertCircle className="w-4 h-4 text-amber-500" />}
                      {notification.type === 'info' && <Info className="w-4 h-4 text-blue-500" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-900">{notification.title}</h4>
                      <p className="text-xs text-slate-600 mt-1">{notification.description}</p>
                      <p className="text-[11px] text-slate-400 mt-2">{formatTimeAgo(notification.date)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
