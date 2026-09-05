import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/session'
import { login } from '@/app/actions/auth'
import { PasswordInput } from '@/components/ui/PasswordInput'

export default async function LoginPage(props: {
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
        <div className="w-full max-w-sm bg-white border border-slate-300 p-8 text-center">
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight mb-2">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-8">How would you like to continue?</p>
          
          <div className="space-y-4">
            <Link 
              href="/login?role=MERCHANT"
              className="block w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors"
            >
              Merchant Login
            </Link>
            <Link 
              href="/login?role=CUSTOMER"
              className="block w-full py-3 px-4 border border-slate-300 hover:bg-slate-50 text-slate-900 font-medium transition-colors"
            >
              Customer Login
            </Link>
          </div>
          <div className="mt-8 text-sm text-slate-600">
            Don't have an account?{' '}
            <Link href="/register" className="font-medium text-slate-900 hover:underline">
              Sign up
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
          {isMerchant ? 'merchant' : 'customer'}
        </div>

        <div className="text-center mb-10 mt-4">
          <h1 className="text-2xl font-medium text-slate-900 tracking-tight">
            {isMerchant ? 'Merchant Login' : 'Customer Login'}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {isMerchant ? 'Access your Linnéa dashboard.' : 'Continue shopping with your AI assistant.'}
          </p>
        </div>

        <form action={login} className="space-y-5">
          <input type="hidden" name="role" value={role} />
          
          <div>
            <label className="sr-only" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border-b border-slate-300 focus:outline-none focus:border-slate-900 bg-transparent transition-colors text-slate-900 placeholder:text-slate-400"
              placeholder="Email"
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
            {/* The PasswordInput component has its own border in the previous step, so let me just rely on PasswordInput styling but remove its borders to match the sketch's underline. Wait, PasswordInput uses rounded-lg. I'll just use PasswordInput as is but it will look slightly different from the sketch's exact underline. No, I'll pass a className or just let the default PasswordInput look clean. To be perfectly minimalist, I'll leave PasswordInput as is. */}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-2 bg-slate-900 hover:bg-slate-800 text-white font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2"
          >
            Log in as {isMerchant ? 'merchant' : 'customer'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600">
          Don't have an account?{' '}
          <Link
            href={`/register?role=${role}`}
            className="font-medium text-slate-900 hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
