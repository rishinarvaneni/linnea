'use client'

import Link from 'next/link'
import {
  Zap, Bot, Sparkles, ShoppingBag, BarChart3,
  CheckCircle2, ArrowRight, Store, ArrowUpRight,
  TrendingUp, RefreshCw, MessageSquare, Leaf
} from 'lucide-react'

function TopNav() {
  return (
    <header className="sticky top-0 z-50 bg-[#0a0f1c] border-b border-slate-800">
      <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4 lg:px-8">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight hidden sm:inline">Linnéa</span>
        </Link>

        <nav className="hidden md:flex items-center h-full">
          {[
            { name: 'AI Buyer', href: '#ai-buyer' },
            { name: 'Revenue Agent', href: '#revenue-agent' },
            { name: 'Campaigns', href: '#campaigns' },
            { name: 'How it Works', href: '#how-it-works' },
          ].map((item, i) => (
            <Link
              key={item.name}
              href={item.href}
              className="relative h-full flex items-center px-6 text-sm font-medium text-slate-300 hover:text-white transition-colors group"
            >
              {item.name}
              {/* Glowing active/hover indicator */}
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-[20px] bg-blue-500/30 blur-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none rounded-t-full" />
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Log in
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            Sign up
          </Link>
        </div>
      </div>
    </header>
  )
}

function HeroSection() {
  return (
    <section className="bg-white py-20 md:py-28 overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 lg:px-8 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" /> AI-Native Commerce
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-slate-900 leading-tight tracking-tight max-w-4xl mx-auto">
          Let AI sell for you.
        </h1>
        <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
          Connect your store to AI buyers, automate revenue recovery, and give customers a faster way to discover and purchase.
        </p>
        
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-sm flex items-center justify-center gap-2"
          >
            Get Started <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/login?role=CUSTOMER"
            className="w-full sm:w-auto px-8 py-3.5 text-base font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            Shop with AI
          </Link>
        </div>
      </div>
    </section>
  )
}

// Custom UI mockups for the feature sections to look premium and authentic
function AIBuyerVis() {
  return (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
        <div className="flex gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4 text-blue-600" />
          </div>
          <div className="bg-slate-100 rounded-2xl rounded-tl-none px-4 py-2.5 text-sm text-slate-700">
            I'm looking for noise-canceling headphones under ₹5,000.
          </div>
        </div>
        <div className="flex gap-3 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="bg-blue-600 text-white rounded-2xl rounded-tr-none px-4 py-2.5 text-sm">
            Found 3 options! The Sony WH-CH720N are currently in stock and on sale for ₹4,990. Would you like to buy them?
          </div>
        </div>
        <div className="flex justify-end pr-11 mt-1">
          <div className="bg-white border border-slate-200 shadow-sm rounded-lg p-2 flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-100 rounded flex items-center justify-center">🎧</div>
             <div>
               <div className="text-xs font-medium text-slate-900">Sony WH-CH720N</div>
               <div className="text-xs text-slate-500">₹4,990 • In Stock</div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function RevenueAgentVis() {
  return (
    <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-red-500">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">Payment Failed</div>
              <div className="text-xs text-slate-500">₹12,400 • 2 mins ago</div>
            </div>
          </div>
          <div className="text-xs font-semibold text-slate-400">DETECTED</div>
        </div>
        
        <div className="flex justify-center py-1">
          <div className="w-0.5 h-6 bg-blue-200"></div>
        </div>

        <div className="bg-white border border-blue-200 ring-1 ring-blue-50 rounded-xl p-4 shadow-sm flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-blue-50/50"></div>
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="text-sm font-medium text-slate-900">AI Recovery Initiated</div>
              <div className="text-xs text-blue-600 font-medium">Sending WhatsApp link...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CheckoutVis() {
  return (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-xs bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-slate-900 px-6 py-5 text-center relative overflow-hidden">
          <div className="absolute inset-0 opacity-20">
             <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500 rounded-full blur-3xl"></div>
          </div>
          <div className="relative z-10 text-white/70 text-xs font-medium uppercase tracking-wider mb-1">Total Amount</div>
          <div className="relative z-10 text-white text-3xl font-bold">₹2,999</div>
        </div>
        <div className="p-6 space-y-4">
          <div className="h-10 border border-slate-200 rounded-lg flex items-center px-3 gap-2">
            <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
            <div className="h-2 w-24 bg-slate-200 rounded"></div>
          </div>
          <div className="h-10 border border-slate-200 rounded-lg flex items-center px-3 gap-2">
            <div className="w-6 h-4 bg-slate-200 rounded-sm"></div>
            <div className="h-2 w-20 bg-slate-200 rounded"></div>
          </div>
          <div className="pt-2">
            <div className="w-full h-11 bg-blue-600 rounded-lg flex items-center justify-center text-white font-medium shadow-[0_0_15px_rgba(37,99,235,0.3)]">
              Pay Securely
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function CampaignVis() {
  return (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm relative">
        <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-blue-100 -translate-y-1/2 -z-0"></div>
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <div className="w-8 h-8 mx-auto bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center mb-2">
              <BarChart3 className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-bold text-slate-900 uppercase">Segment</div>
            <div className="text-[10px] text-slate-500">Cart Abandons</div>
          </div>
          <div className="bg-white border border-blue-200 ring-1 ring-blue-50 rounded-xl p-4 shadow-sm text-center transform -translate-y-2">
            <div className="w-8 h-8 mx-auto bg-blue-600 text-white rounded-lg flex items-center justify-center mb-2">
              <Bot className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-bold text-slate-900 uppercase">AI Crafting</div>
            <div className="text-[10px] text-blue-600 font-medium">Generating...</div>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <div className="w-8 h-8 mx-auto bg-green-50 text-green-600 rounded-lg flex items-center justify-center mb-2">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div className="text-[10px] font-bold text-slate-900 uppercase">Deliver</div>
            <div className="text-[10px] text-slate-500">WhatsApp</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FeatureSection({ id, label, title, description, badge, visualization: Visualization, icon: Icon, reversed = false }: {
  id: string, label: string, title: string, description: string, badge?: string, visualization?: React.ElementType, icon: any, reversed?: boolean
}) {
  return (
    <section id={id} className="py-20 md:py-28 border-t border-slate-100 bg-white">
      <div className={`max-w-6xl mx-auto px-4 lg:px-8 flex flex-col ${reversed ? 'md:flex-row-reverse' : 'md:flex-row'} items-center gap-12 md:gap-20`}>
        <div className="flex-1 flex flex-col gap-6">
          <div className="inline-flex items-center gap-2 text-blue-600 font-semibold tracking-wide text-sm">
            <Icon className="w-5 h-5" /> {label}
          </div>
          
          <div className="space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 leading-tight tracking-tight">
              {title}
            </h2>
            
            {badge && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-sm font-medium border border-blue-100 w-fit">
                <Sparkles className="w-3.5 h-3.5" />
                {badge}
              </div>
            )}
          </div>
          
          <p className="text-lg text-slate-500 leading-relaxed">
            {description}
          </p>
        </div>
        <div className="flex-1 w-full bg-slate-50 border border-slate-200 rounded-2xl aspect-[4/3] flex items-center justify-center overflow-hidden relative shadow-sm">
          {Visualization ? (
            <Visualization />
          ) : (
            <div className="text-center space-y-3 opacity-60">
              <Icon className="w-16 h-16 mx-auto text-slate-400" />
              <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{label} Visualization</p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    { num: "1", title: "Discover", desc: "AI understands the customer's request naturally." },
    { num: "2", title: "Recommend", desc: "Real catalog + inventory + pricing integration." },
    { num: "3", title: "Transact", desc: "Authoritative order creation & Razorpay checkout." },
    { num: "4", title: "Confirm", desc: "Webhook strictly confirms payment success." },
    { num: "5", title: "Grow", desc: "Revenue Agent finds recovery & upsell opportunities." },
  ]
  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">How It Works</h2>
          <p className="mt-4 text-lg text-slate-500">The lifecycle of an AI-native transaction.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 relative">
          <div className="hidden md:block absolute top-6 left-10 right-10 h-0.5 bg-slate-200 -z-0"></div>
          {steps.map((step, i) => (
            <div key={i} className="relative z-10 flex flex-col items-center text-center bg-slate-50 md:bg-transparent">
              <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-lg mb-6 ring-8 ring-slate-50">
                {step.num}
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed px-2">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function DualSideSection() {
  return (
    <section className="py-20 md:py-28 bg-slate-900 text-white">
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Built for both sides of AI commerce.</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-slate-800 border border-slate-700 p-8 md:p-12 rounded-3xl flex flex-col h-full">
            <Store className="w-10 h-10 text-blue-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">For Merchants</h3>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /><span className="text-slate-300">Revenue Agent & Recovery</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /><span className="text-slate-300">Agent-readable catalog via MCP</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /><span className="text-slate-300">Campaign Orchestrator</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" /><span className="text-slate-300">Upsell & Cross-sell insights</span></li>
            </ul>
            <Link href="/register?role=MERCHANT" className="inline-flex items-center gap-2 font-medium text-blue-400 hover:text-blue-300 transition-colors">
              Create Merchant Account <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-slate-800 border border-slate-700 p-8 md:p-12 rounded-3xl flex flex-col h-full">
            <ShoppingBag className="w-10 h-10 text-emerald-400 mb-6" />
            <h3 className="text-2xl font-bold mb-4">For Customers</h3>
            <ul className="space-y-4 mb-8 flex-1">
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /><span className="text-slate-300">AI Shopping Agent</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /><span className="text-slate-300">Voice shopping</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /><span className="text-slate-300">Integrated Cart & Checkout</span></li>
              <li className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" /><span className="text-slate-300">Authoritative Order History</span></li>
            </ul>
            <Link href="/register?role=CUSTOMER" className="inline-flex items-center gap-2 font-medium text-emerald-400 hover:text-emerald-300 transition-colors">
              Create Customer Account <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 py-12">
      <div className="max-w-6xl mx-auto px-4 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 rounded bg-slate-900 flex items-center justify-center">
            <Leaf className="w-3 h-3 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900 tracking-tight">Linnéa</span>
        </div>
        <div className="text-sm text-slate-500 font-medium">
          © 2026 Linnéa. All rights reserved.
        </div>
        <div className="flex items-center gap-6 text-sm font-medium text-slate-600">
          <Link href="/login?role=MERCHANT" className="hover:text-slate-900">Merchant Login</Link>
          <Link href="/login?role=CUSTOMER" className="hover:text-slate-900">Customer Login</Link>
        </div>
      </div>
    </footer>
  )
}

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <TopNav />
      <main>
        <HeroSection />
        
        <FeatureSection
          id="ai-buyer"
          label="AI Buyer"
          title="Your store, discoverable by AI."
          description="External AI agents can discover your products, negotiate, and transact seamlessly through our secure Model Context Protocol (MCP) server integration."
          badge="Free access during beta"
          visualization={AIBuyerVis}
          icon={Bot}
        />
        
        <FeatureSection
          id="revenue-agent"
          label="Revenue Agent"
          title="Turn transactions into revenue opportunities."
          description="Our autonomous Revenue Agent detects failed payments, abandoned carts, and data-backed upsell or cross-sell opportunities, working 24/7 to boost your bottom line."
          badge="Free access during beta"
          visualization={RevenueAgentVis}
          icon={TrendingUp}
          reversed
        />

        <FeatureSection
          id="agentic-checkout"
          label="Agentic Checkout"
          title="From discovery to payment."
          description="A flawless flow from AI search directly to an authoritative cart, backed by secure Razorpay checkout and instantaneous webhook-confirmed payment reconciliation."
          badge="Free access during beta"
          visualization={CheckoutVis}
          icon={ShoppingBag}
        />

        <FeatureSection
          id="campaigns"
          label="Campaign Orchestrator"
          title="Turn customer behavior into campaigns."
          description="Generate intelligent, data-backed campaign plans directly from real customer insights and product inventory."
          badge="Free access during beta"
          visualization={CampaignVis}
          icon={MessageSquare}
          reversed
        />

        <HowItWorks />
        <DualSideSection />
      </main>
      <Footer />
    </div>
  )
}
