import { PageHeader } from '@/components/ui/PageHeader'
import { getStoreContext } from '@/lib/store-context'
import { db as prisma } from '@/lib/db'
import { CopyIcon, CheckCircle2, Info } from 'lucide-react'

export default async function McpSetupPage() {
  const storeContext = await getStoreContext()
  
  const aiBuyerEmail = process.env.MCP_AI_BUYER_EMAIL || 'ai-buyer@example.com'
  const merchantId = storeContext.merchantId

  const sampleProduct = await prisma.product.findFirst({
    where: { merchantId },
    select: {
      id: true,
      name: true,
      description: true,
      pricePaise: true,
      inventory: true,
      category: true,
      active: true,
      imageUrl: true,
    }
  })

  const claudeConfig = {
    "mcpServers": {
      "ai-buyer": {
        "command": "npx",
        "args": [
          "tsx",
          "scripts/mcp-server.ts"
        ],
        "env": {
          "MCP_MERCHANT_ID": merchantId,
          "MCP_AI_BUYER_EMAIL": aiBuyerEmail
        }
      }
    }
  }

  const jsonConfigString = JSON.stringify(claudeConfig, null, 2)

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-8">
      <PageHeader 
        title="AI Buyer Agent Setup" 
        subtitle="Connect external AI assistants (like Claude Desktop) to your store."
      />
      
      <div className="bg-white border border-slate-200/60 p-6 md:p-8 rounded-xl space-y-6 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          Connection Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Store Context</span>
            <p className="font-semibold text-slate-900">{storeContext.businessName || merchantId}</p>
          </div>
          <div className="space-y-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Buyer Identity (Email)</span>
            <p className="font-semibold text-slate-900">{aiBuyerEmail}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 p-6 md:p-8 rounded-xl space-y-6 shadow-sm">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-2">Agent Commerce Interfaces</h3>
        <p className="text-sm font-medium text-slate-500 mb-4">
          Architecture ready for additional agent commerce protocols.
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            <span className="font-semibold text-slate-900">MCP — Active</span>
          </div>
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 block">Future Protocols (Not Implemented)</span>
            <div className="flex flex-wrap gap-2">
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">ACP</span>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">AP2</span>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">x402</span>
              <span className="px-2.5 py-1 rounded bg-slate-100 text-slate-600 text-xs font-medium border border-slate-200">UAP</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-slate-50/50 border border-slate-200/60 p-6 md:p-8 rounded-xl space-y-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-2">Claude Desktop Configuration</h3>
          <p className="text-slate-500 font-medium text-sm">
            To allow Claude to browse your store and create orders, add the following configuration to your Claude Desktop config file. 
            <br className="hidden md:block"/>
            <span className="mt-2 inline-block">Usually located at <code className="bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-mono text-xs">~/Library/Application Support/Claude/claude_desktop_config.json</code> on Mac.</span>
          </p>
        </div>
        
        <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-slate-900">
          <pre className="p-6 overflow-x-auto text-sm font-mono text-slate-300">
            {jsonConfigString}
          </pre>
        </div>
        
        <div className="bg-amber-50 border border-amber-200/60 rounded-xl p-4 text-sm font-medium text-amber-800 shadow-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p>
            <strong className="font-bold">Note:</strong> Ensure you have a valid <code className="bg-amber-100 text-amber-900 px-1 py-0.5 rounded text-xs font-mono">.env</code> file containing your database and API credentials in the project root before restarting Claude Desktop.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 p-6 md:p-8 rounded-xl space-y-6 shadow-sm">
        <div>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900 mb-2">Agent-Readable Catalog</h3>
          <p className="text-slate-500 font-medium text-sm">
            This is how your products appear to external AI assistants via the <code>search_products</code> and <code>get_product</code> tools.
          </p>
        </div>
        
        <div className="relative group rounded-xl overflow-hidden shadow-sm border border-slate-200/60 bg-slate-900">
          <pre className="p-6 overflow-x-auto text-sm font-mono text-slate-300">
            {sampleProduct ? JSON.stringify(sampleProduct, null, 2) : '// No products found in your catalog'}
          </pre>
        </div>
      </div>
      
      <div className="space-y-4 pt-6 border-t border-slate-200/60">
        <h3 className="text-lg font-semibold tracking-tight text-slate-900">How it works</h3>
        <ul className="list-disc list-inside text-sm font-medium text-slate-600 space-y-3">
          <li>The AI Buyer will securely search your product catalog and verify inventory.</li>
          <li>It creates an order marked with an <code className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-xs text-slate-700 font-mono">AI_BUYER</code> origin.</li>
          <li>It generates a Checkout link for you to finalize the transaction securely.</li>
          <li>The AI cannot spoof another merchant or access hidden database fields.</li>
        </ul>
      </div>
    </div>
  )
}
