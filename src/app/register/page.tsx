import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { register } from '@/app/actions/auth'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default async function RegisterPage(props: {
  searchParams: Promise<{ role?: string }>
}) {
  const session = await getSession()
  if (session) {
    redirect(session.role === 'MERCHANT' ? '/dashboard' : '/shop')
  }

  const searchParams = await props.searchParams
  const roleParam = searchParams.role
  
  if (!roleParam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl bg-transparent">
          <div className="text-center mb-12">
            <h1 className="text-3xl font-medium text-slate-900 tracking-tight mb-3">Welcome to Linnéa</h1>
            <p className="text-lg text-slate-500">What would you like to sign up as?</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Merchant Card */}
            <div className="bg-white p-8 border border-slate-200 flex flex-col items-start hover:border-blue-400 transition-colors shadow-sm">
              <div className="w-12 h-12 bg-blue-50 text-blue-600 flex items-center justify-center mb-6 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-store"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h2"/><path d="M20 12v8a2 2 0 0 1-2 2h-2"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">I'm a Merchant</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">Connect your store, let AI handle discovery, and unlock autonomous revenue recovery and campaign generation.</p>
              <Link 
                href="/register?role=MERCHANT"
                className="mt-auto inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors rounded-lg w-full"
              >
                Create Merchant Account
              </Link>
            </div>

            {/* Customer Card */}
            <div className="bg-white p-8 border border-slate-200 flex flex-col items-start hover:border-emerald-400 transition-colors shadow-sm">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 rounded-xl">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-shopping-bag"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">I'm a Customer</h2>
              <p className="text-slate-500 mb-8 leading-relaxed">Shop with a personal AI assistant. Discover products naturally, ask questions, and checkout securely in seconds.</p>
              <Link 
                href="/register?role=CUSTOMER"
                className="mt-auto inline-flex items-center justify-center px-6 py-2.5 bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors rounded-lg w-full"
              >
                Create Customer Account
              </Link>
            </div>
          </div>
          
          <div className="mt-12 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link href="/login" className="font-medium text-slate-900 hover:underline">
              Log in
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const role = roleParam === 'MERCHANT' ? 'MERCHANT' : 'CUSTOMER'
  const isMerchant = role === 'MERCHANT'

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white border border-slate-300 p-8 relative">
        <div className="absolute top-4 right-4 text-xs font-mono text-slate-500">
          {isMerchant ? 'merchant signup' : 'customer signup'}
        </div>

        <div className="text-center mb-10 mt-4">
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight">
            {isMerchant ? 'Merchant Sign Up' : 'Customer Sign Up'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isMerchant ? 'Set up your AI commerce platform.' : 'Create your AI shopping account.'}
          </p>
        </div>

        <form action={register} className="space-y-5">
          <input type="hidden" name="role" value={role} />

          {isMerchant ? (
            <div>
              <label className="sr-only" htmlFor="businessName">
                Business name
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                required
                placeholder="Business Name"
                className="w-full px-3 py-2 border-b border-slate-300 focus:outline-none focus:border-slate-900 bg-transparent transition-colors text-slate-900 placeholder:text-slate-400"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="sr-only" htmlFor="firstName">
                  First name
                </label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  required
                  placeholder="First Name"
                  className="w-full px-3 py-2 border-b border-slate-300 focus:outline-none focus:border-slate-900 bg-transparent transition-colors text-slate-900 placeholder:text-slate-400"
                />
              </div>
              <div>
                <label className="sr-only" htmlFor="lastName">
                  Last name
                </label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  required
                  placeholder="Last Name"
                  className="w-full px-3 py-2 border-b border-slate-300 focus:outline-none focus:border-slate-900 bg-transparent transition-colors text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </>
          )}
          
          <div>
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              placeholder="Email"
              className="w-full px-3 py-2 border-b border-slate-300 focus:outline-none focus:border-slate-900 bg-transparent transition-colors text-slate-900 placeholder:text-slate-400"
            />
          </div>

          <div>
            <label className="sr-only" htmlFor="password">
              Password
            </label>
            <div className="border-b border-slate-300 focus-within:border-slate-900 transition-colors">
              <PasswordInput 
                id="password" 
                name="password" 
                placeholder="Password" 
              />
            </div>
          </div>

          <div>
            <label className="sr-only" htmlFor="confirmPassword">
              Confirm password
            </label>
            <div className="border-b border-slate-300 focus-within:border-slate-900 transition-colors">
              <PasswordInput 
                id="confirmPassword" 
                name="confirmPassword" 
                placeholder="Confirm Password" 
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Create account
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            href={`/login?role=${role}`}
            className="font-medium text-slate-900 hover:underline"
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
