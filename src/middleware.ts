import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSession } from '@/lib/session'

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  const isPublicPath = path === '/' || path.startsWith('/login') || path.startsWith('/register') || path.startsWith('/api/')
  
  if (isPublicPath) {
    return NextResponse.next()
  }

  const session = await getSession()

  if (!session) {
    return NextResponse.redirect(new URL('/login?role=CUSTOMER', request.url))
  }

  // Role-based protection
  const isMerchantPath = path.startsWith('/dashboard')
  const isCustomerPath = path.startsWith('/shop')

  if (isMerchantPath && session.role !== 'MERCHANT') {
    return NextResponse.redirect(new URL('/shop', request.url))
  }

  if (isCustomerPath && session.role !== 'CUSTOMER') {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
