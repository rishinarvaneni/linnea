import Link from 'next/link'
import { getSession } from '@/lib/session'
import { redirect } from 'next/navigation'
import { LandingPage } from '@/components/landing/LandingPage'

export default async function Home() {
  const session = await getSession()
  
  if (session) {
    if (session.role === 'MERCHANT') {
      redirect('/dashboard')
    } else {
      redirect('/shop')
    }
  }

  return <LandingPage />
}
