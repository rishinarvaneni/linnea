'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

export function PasswordInput({
  id,
  name,
  placeholder = "••••••••",
  required = true
}: {
  id: string
  name: string
  placeholder?: string
  required?: boolean
}) {
  const [show, setShow] = useState(false)

  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        id={id}
        name={name}
        required={required}
        className="w-full px-3 py-2 bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none pr-10 border-b border-slate-300 focus:border-slate-900 transition-colors"
        placeholder={placeholder}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  )
}
